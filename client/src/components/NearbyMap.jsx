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

function distanceBadgeColor(distKm) {
  if (distKm < 1) return { bg: '#E1F5EE', color: '#065f46' };
  if (distKm <= 5) return { bg: '#e0f2fe', color: '#0369a1' };
  return { bg: '#f3f4f6', color: '#6b7280' };
}

function formatDistance(distKm) {
  if (distKm < 1) return `${Math.round(distKm * 1000)}m`;
  return `${distKm.toFixed(1)}km`;
}

export default function NearbyMap({ medicineName }) {
  const [coords,      setCoords]      = useState(null);
  const [pincode,     setPincode]     = useState('');
  const [pharmacies,  setPharmacies]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [radius,      setRadius]      = useState(10);
  const [searchedPin, setSearchedPin] = useState('');

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

  const fetchByPincode = async (pin, radiusKm) => {
    setError('');
    setLoading(true);
    setPharmacies([]);
    setSearchedPin(pin);

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pharmacies/by-pincode?pincode=${pin}&radius=${radiusKm}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Fallback to client-side geocoding if server endpoint doesn't exist
        await fallbackPincodeSearch(pin, radiusKm);
        return;
      }

      const data = await res.json();

      const center = data.center || {};
      if (center.lat && center.lng) {
        setCoords({ lat: center.lat, lng: center.lng });
      }

      const results = (data.pharmacies || [])
        .map(ph => ({
          ...ph,
          distance: center.lat ? haversine(center.lat, center.lng, ph.lat, ph.lng) : ph.distance || 999,
        }))
        .sort((a, b) => a.distance - b.distance);

      setPharmacies(results);

      if (results.length === 0) {
        setError(`No pharmacies found within ${radiusKm}km of pincode ${pin}.`);
      }

    } catch {
      // Fallback to client-side geocoding
      await fallbackPincodeSearch(pin, radiusKm);
    } finally {
      setLoading(false);
    }
  };

  const fallbackPincodeSearch = async (pin, radiusKm) => {
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10000);

      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&limit=1`,
        { headers: { 'User-Agent': 'MedPrice/1.0' }, signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!data.length) {
        setError('Pincode not found. Try a nearby pincode.');
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setCoords({ lat, lng });
      await fetchOverpassPharmacies(lat, lng, radiusKm);

    } catch {
      setError('Geocoding failed. Check your connection.');
    }
  };

  const handleGPS = () => {
    setError('');
    setLoading(true);
    setSearchedPin('');
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

  const handlePincode = () => {
    if (pincode.length !== 6) return;
    fetchByPincode(pincode, radius);
  };

  const handleRadiusChange = (r) => {
    setRadius(r);
    if (searchedPin) {
      fetchByPincode(searchedPin, r);
    } else if (coords) {
      fetchOverpassPharmacies(coords.lat, coords.lng, r);
    }
  };

  const handleIncreaseRadius = () => {
    const newRadius = Math.min(radius + 10, 50);
    handleRadiusChange(newRadius);
  };

  const nearbyPincodes = searchedPin ? [
    String(parseInt(searchedPin) - 1).padStart(6, '0'),
    String(parseInt(searchedPin) + 1).padStart(6, '0'),
  ] : [];

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        📍 {medicineName
          ? `Pharmacies near you that may stock ${medicineName}`
          : 'Pharmacies near you'}
      </h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
        Real locations from OpenStreetMap · Free · No API key required
      </p>

      {/* Pincode input — PRIMARY action */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 12,
        alignItems: 'stretch',
      }}>
        <input
          value={pincode}
          onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handlePincode()}
          placeholder="Enter your 6-digit pincode"
          maxLength={6}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 10,
            border: '1.5px solid #ddd', fontSize: 16,
            fontWeight: 500, color: '#111',
            maxWidth: 260,
          }}
        />
        <button
          onClick={handlePincode}
          disabled={pincode.length !== 6 || loading}
          style={{
            ...buttonStyle(pincode.length === 6 ? '#1D9E75' : '#ccc', loading),
            padding: '12px 24px', fontSize: 15, fontWeight: 600,
            borderRadius: 10,
          }}
        >
          {loading ? '⏳ Searching...' : '🔍 Find Pharmacies'}
        </button>
      </div>

      {/* GPS as secondary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button
          onClick={handleGPS}
          disabled={loading}
          style={{
            ...buttonStyle('transparent', loading),
            color: '#1D9E75', border: '1px solid #1D9E75',
            padding: '6px 14px', fontSize: 13,
          }}
        >
          📍 Or use my GPS location
        </button>

        {/* Radius selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#888' }}>Radius:</span>
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
      </div>

<<<<<<< HEAD
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
=======
      {/* Error with enhanced empty state */}
      {error && (
        <div style={{
          padding: '16px 18px', background: '#fff9f9',
          border: '1px solid #fde8e8', borderRadius: 10,
          marginBottom: 12,
        }}>
          <p style={{ color: '#E24B4A', fontSize: 13, margin: '0 0 8px', fontWeight: 500 }}>
            {error}
          </p>
          {pharmacies.length === 0 && coords && (
            <div style={{ fontSize: 12, color: '#888' }}>
              <p style={{ margin: '0 0 6px' }}>💡 Suggestions:</p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>
                  <button
                    onClick={handleIncreaseRadius}
                    style={{
                      background: 'none', border: 'none', color: '#1D9E75',
                      cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline',
                    }}
                  >
                    Increase radius to {Math.min(radius + 10, 50)}km
                  </button>
                </li>
                {nearbyPincodes.length > 0 && (
                  <li>
                    Try nearby pincodes:{' '}
                    {nearbyPincodes.map((p, i) => (
                      <span key={p}>
                        <button
                          onClick={() => { setPincode(p); fetchByPincode(p, radius); }}
                          style={{
                            background: 'none', border: 'none', color: '#1D9E75',
                            cursor: 'pointer', padding: 0, fontSize: 12, textDecoration: 'underline',
                          }}
                        >
                          {p}
                        </button>
                        {i < nearbyPincodes.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary line */}
      {pharmacies.length > 0 && (
        <div style={{
          fontSize: 13, color: '#065f46', fontWeight: 500,
          marginBottom: 10, padding: '6px 12px',
          background: '#E1F5EE', borderRadius: 8,
          display: 'inline-block',
        }}>
          Found {pharmacies.length} pharmacies within {radius}km
          {searchedPin ? ` of pincode ${searchedPin}` : ''}
        </div>
      )}

      {/* Map */}
      {coords && (
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={14}
          style={{ height: 320, borderRadius: 10, border: '1px solid #eee', marginBottom: 16 }}
        >
          <RecenterMap lat={coords.lat} lng={coords.lng} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />

          <Marker position={[coords.lat, coords.lng]}>
            <Popup><strong>📍 Your location</strong></Popup>
          </Marker>

          {pharmacies.map(ph => (
            <Marker key={ph.id} position={[ph.lat, ph.lng]} icon={greenIcon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ fontSize: 13 }}>{ph.name}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {formatDistance(ph.distance)} away
                  </span>
                  {ph.address && (
                    <>
                      <br />
                      <small style={{ color: '#888' }}>{ph.address}</small>
                    </>
                  )}
                  {ph.opening && <><br /><small>🕐 {ph.opening}</small></>}
                  <br />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${ph.lat},${ph.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500 }}
                  >
                    📍 Get Directions →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Pharmacy list below map */}
      {pharmacies.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          border: '1px solid #eee', borderRadius: 12,
          overflow: 'hidden',
        }}>
          {pharmacies.map((ph, i) => {
            const distColors = distanceBadgeColor(ph.distance);
            return (
              <div
                key={ph.id}
                style={{
                  padding: '14px 18px',
                  background: '#fff',
                  borderBottom: i < pharmacies.length - 1 ? '1px solid #f3f3f3' : 'none',
                  transition: 'background 0.1s',
                  cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left: name + details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>
                        {ph.name}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '2px 10px', borderRadius: 20,
                        background: distColors.bg, color: distColors.color,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {formatDistance(ph.distance)}
                      </span>
                    </div>
                    {ph.address && (
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>
                        📍 {ph.address}
                      </div>
                    )}
                    {ph.opening && (
                      <div style={{ fontSize: 12, color: '#888' }}>
                        🕐 {ph.opening}
                      </div>
                    )}
                  </div>

                  {/* Right: action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12, marginTop: 2 }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${ph.lat},${ph.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '5px 12px', borderRadius: 20,
                        background: '#E1F5EE', color: '#065f46',
                        fontSize: 12, fontWeight: 500,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                        border: '1px solid #d4edda',
                      }}
                    >
                      📍 Directions
                    </a>
                    {ph.phone && (
                      <a
                        href={`tel:${ph.phone}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', borderRadius: 20,
                          background: '#f0f7ff', color: '#0369a1',
                          fontSize: 12, fontWeight: 500,
                          textDecoration: 'none', whiteSpace: 'nowrap',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        📞 Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
>>>>>>> d21353d (Improve search, medicine parsing, savings insights and pharmacy integration)
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