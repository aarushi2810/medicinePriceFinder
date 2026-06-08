import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons (known React issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASE = import.meta.env.VITE_API_URL;

export default function NearbyMap({ medicineName }) {
  const [coords,    setCoords]    = useState(null);
  const [pincode,   setPincode]   = useState('');
  const [pharmacies,setPharmacies]= useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const fetchNearby = async (lat, lng) => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/medicines/nearby?lat=${lat}&lng=${lng}&radius=5`);
      const data = await res.json();
      setPharmacies(data.pharmacies || []);
    } catch {
      setError('Could not load nearby pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const useGPS = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        fetchNearby(lat, lng);
      },
      () => setError('Location access denied. Try pincode instead.')
    );
  };

  const usePincode = async () => {
    if (pincode.length !== 6) return;
    setLoading(true);
    try {
      // Nominatim — free OpenStreetMap geocoding
      const url  = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
      const res  = await fetch(url, { headers: { 'User-Agent': 'MedPrice/1.0' } });
      const data = await res.json();

      if (!data.length) { setError('Pincode not found'); return; }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setCoords({ lat, lng });
      fetchNearby(lat, lng);
    } catch {
      setError('Geocoding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        📍 Find nearby pharmacies
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={useGPS} style={btnStyle('#1D9E75')}>
          Use my location
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={pincode}
            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter pincode"
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 14, width: 130,
            }}
          />
          <button onClick={usePincode} disabled={pincode.length !== 6}
            style={btnStyle(pincode.length === 6 ? '#534AB7' : '#ccc')}>
            Search
          </button>
        </div>
      </div>

      {error   && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
      {loading && <p style={{ color: '#888',    fontSize: 13 }}>Finding pharmacies...</p>}

      {coords && (
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={14}
          style={{ height: 320, borderRadius: 10, border: '1px solid #eee' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />

          {/* User location — blue marker */}
          <Marker position={[coords.lat, coords.lng]}>
            <Popup>📍 Your location</Popup>
          </Marker>

          {/* Pharmacy markers */}
          {pharmacies.map((ph, i) => (
            <Marker key={ph.id} position={[ph.lat, ph.lng]}>
              <Popup>
                <strong>{ph.name}</strong><br />
                {ph.address}<br />
                <span style={{ fontSize: 12, color: '#666' }}>
                  {parseFloat(ph.distance_km).toFixed(1)} km away
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {coords && pharmacies.length === 0 && !loading && (
        <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
          No local pharmacies found within 5km. Try increasing the radius.
        </p>
      )}
    </div>
  );
}

const btnStyle = (bg) => ({
  padding: '8px 16px', borderRadius: 8,
  background: bg, color: '#fff',
  border: 'none', cursor: 'pointer', fontSize: 14,
});