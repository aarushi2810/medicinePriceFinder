import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons — bundled via Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl:     markerIcon,
  shadowUrl:   markerShadow,
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  className:   'pharmacy-marker',
});

function haversine(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 999;
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) *
               Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyMap() {
  const [coords,     setCoords]     = useState(null);
  const [pincode,    setPincode]    = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [radius,     setRadius]     = useState(10);

  const mapContainerRef = useRef(null); // the <div> element
  const mapRef          = useRef(null); // the Leaflet map instance
  const markersRef      = useRef([]);   // currently rendered markers

  // ── Initialize the map once, when coords first become available ──────────
  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    if (!mapRef.current) {
      // First time — create the map
      mapRef.current = L.map(mapContainerRef.current).setView(
        [coords.lat, coords.lng], 14
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // User location marker
      L.marker([coords.lat, coords.lng])
        .addTo(mapRef.current)
        .bindPopup('<strong>📍 Your location</strong>');
    } else {
      // Map already exists — just recenter
      mapRef.current.setView([coords.lat, coords.lng], 14);
    }
  }, [coords]);

  // ── Update pharmacy markers whenever the list changes ─────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];

    // Add new markers
    pharmacies.forEach(ph => {
      const distanceText = ph.distance < 1
        ? `${Math.round(ph.distance * 1000)}m away`
        : `${ph.distance.toFixed(1)}km away`;

      const popupHtml = `
        <strong>${ph.name}</strong><br/>
        ${distanceText}
        ${ph.opening ? `<br/><small>🕐 ${ph.opening}</small>` : ''}
        ${ph.phone   ? `<br/><small>📞 ${ph.phone}</small>` : ''}
      `;

      const marker = L.marker([ph.lat, ph.lng], { icon: greenIcon })
        .addTo(mapRef.current)
        .bindPopup(popupHtml);

      markersRef.current.push(marker);
    });
  }, [pharmacies]);

  // ── Cleanup map on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Fetch pharmacies from backend (Overpass proxy) ─────────────────────────
  const fetchOverpassPharmacies = async (lat, lng, radiusKm) => {
    setError('');
    setLoading(true);
    setPharmacies([]);

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pharmacies/overpass?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        setError('Pharmacy service unavailable right now. Try again shortly.');
        return;
      }

      const data = await res.json();
      const results = (data.pharmacies || [])
        .map(ph => ({ ...ph, distance: haversine(lat, lng, ph.lat, ph.lng) }))
        .sort((a, b) => a.distance - b.distance);

      setPharmacies(results);

      if (results.length === 0) {
        setError(`No pharmacies found within ${radiusKm}km. Try a larger radius.`);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Try again.');
      } else {
        setError('Could not load pharmacies. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGPS = () => {
    setError('');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        fetchOverpassPharmacies(lat, lng, radius);
      },
      () => {
        setLoading(false);
        setError('Location access denied. Try entering your pincode instead.');
      }
    );
  };

  const handlePincode = async () => {
    if (pincode.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10000);

      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`,
        { headers: { 'User-Agent': 'MedPrice/1.0' }, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!data.length) {
        setError('Pincode not found. Try a nearby pincode.');
        setLoading(false);
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setCoords({ lat, lng });
      fetchOverpassPharmacies(lat, lng, radius);

    } catch {
      setError('Geocoding failed. Check your connection.');
      setLoading(false);
    }
  };

  const handleRadiusChange = (r) => {
    setRadius(r);
    if (coords) fetchOverpassPharmacies(coords.lat, coords.lng, r);
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        📍 Pharmacies near you
      </h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
        Real locations from OpenStreetMap · Free · No API key required
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <button onClick={handleGPS} disabled={loading} style={buttonStyle('#1D9E75', loading)}>
          {loading ? '⏳ Searching...' : '📍 Use my GPS'}
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={pincode}
            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handlePincode()}
            placeholder="Enter pincode"
            maxLength={6}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, width: 130 }}
          />
          <button
            onClick={handlePincode}
            disabled={pincode.length !== 6 || loading}
            style={buttonStyle(pincode.length === 6 ? '#534AB7' : '#ccc')}
          >
            Search
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#666' }}>Radius:</span>
        {[5, 10, 20].map(r => (
          <button
            key={r}
            onClick={() => handleRadiusChange(r)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border:     `1px solid ${radius === r ? '#1D9E75' : '#ddd'}`,
              background: radius === r ? '#E1F5EE' : '#fff',
              color:      radius === r ? '#085041' : '#666',
            }}
          >
            {r}km
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 8 }}>{error}</p>}

      {/* Map container — always rendered, but empty until coords exist */}
      <div
        ref={mapContainerRef}
        style={{
          height: 320,
          borderRadius: 10,
          border: '1px solid #eee',
          display: coords ? 'block' : 'none',
          background: '#f5f5f5',
        }}
      />

      {pharmacies.length > 0 && (
        <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
          {pharmacies.length} pharmacies found within {radius}km
        </p>
      )}
    </div>
  );
}

function buttonStyle(bg, disabled = false) {
  return {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: bg, color: '#fff',
    cursor: disabled ? 'wait' : 'pointer',
    fontSize: 14, opacity: disabled ? 0.7 : 1,
  };
}