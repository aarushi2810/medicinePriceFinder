const express = require('express');
const router  = express.Router();

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

function buildQuery(lat, lng, radius) {
  return `
    [out:json][timeout:10];
    (
      node["amenity"="pharmacy"](around:${radius * 1000},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius * 1000},${lat},${lng});
      node["shop"="chemist"](around:${radius * 1000},${lat},${lng});
    );
    out center tags;
  `;
}

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), ms);

  return fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'MedPriceFinder/1.0 (medicine-price-finder)',
    },
  })
    .then(res => {
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .catch(err => {
      clearTimeout(timeoutId);
      throw err;
    });
}

router.get('/overpass', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const query = buildQuery(lat, lng, radius);
  const url   = (endpoint) => `${endpoint}?data=${encodeURIComponent(query)}`;

  // Fire all mirrors in parallel — return as soon as ONE succeeds
  const attempts = ENDPOINTS.map(endpoint =>
    fetchWithTimeout(url(endpoint), 7000)
      .then(data => ({ endpoint, data }))
      .catch(err => {
        console.error(`Overpass mirror failed: ${endpoint} → ${err.message}`);
        throw err; // re-throw so Promise.any sees it as rejected
      })
  );

  let result;
  try {
    result = await Promise.any(attempts);
  } catch (aggregateErr) {
    console.error('All Overpass mirrors failed:', aggregateErr.errors?.map(e => e.message));
    return res.status(503).json({
      error: 'Pharmacy data temporarily unavailable',
      pharmacies: [],
    });
  }

  console.log(`Overpass success via: ${result.endpoint}`);

  const pharmacies = (result.data.elements || [])
    .map(el => {
      const tags = el.tags || {};
      return {
        id:      el.id,
        name:    tags.name || tags.operator || tags.brand || 'Medical Store',
        lat:     el.lat ?? el.center?.lat,
        lng:     el.lon ?? el.center?.lon,
        phone:   tags.phone || tags['contact:phone'] || '',
        opening: tags.opening_hours || '',
      };
    })
    .filter(p => p.lat && p.lng);

  res.json({ pharmacies, count: pharmacies.length, source: result.endpoint });
});

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // rounded to 2 decimals
}

// ─── GET /api/pharmacies/by-pincode ──────────────────────────────────────────
router.get('/by-pincode', async (req, res) => {
  const { pincode, radius = 10 } = req.query;

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ error: 'A valid 6-digit Indian pincode is required' });
  }

  try {
    // Step 1: Geocode pincode via Nominatim
    const nominatimUrl =
      `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;

    const geoResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MedPriceFinder/1.0 (medicine-price-finder)',
      },
    });

    if (!geoResponse.ok) {
      throw new Error(`Nominatim HTTP ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    if (!geoData.length) {
      return res.status(404).json({
        error: `Could not geocode pincode ${pincode}`,
        pharmacies: [],
      });
    }

    const lat = parseFloat(geoData[0].lat);
    const lng = parseFloat(geoData[0].lon);

    // Step 2: Query Overpass for pharmacies near the geocoded location
    const query = buildQuery(lat, lng, radius);
    const url   = (endpoint) => `${endpoint}?data=${encodeURIComponent(query)}`;

    const attempts = ENDPOINTS.map(endpoint =>
      fetchWithTimeout(url(endpoint), 7000)
        .then(data => ({ endpoint, data }))
        .catch(err => {
          console.error(`Overpass mirror failed: ${endpoint} → ${err.message}`);
          throw err;
        })
    );

    let result;
    try {
      result = await Promise.any(attempts);
    } catch (aggregateErr) {
      console.error('All Overpass mirrors failed:', aggregateErr.errors?.map(e => e.message));
      return res.status(503).json({
        error: 'Pharmacy data temporarily unavailable',
        pharmacies: [],
        pincode,
        center: { lat, lng },
      });
    }

    // Step 3: Extract pharmacies with expanded OSM tags
    const pharmacies = (result.data.elements || [])
      .map(el => {
        const tags = el.tags || {};
        const pLat = el.lat ?? el.center?.lat;
        const pLng = el.lon ?? el.center?.lon;

        // Build address from addr:* tags
        const addrParts = [
          tags['addr:street'],
          tags['addr:city'],
          tags['addr:postcode'],
        ].filter(Boolean);

        return {
          id:          el.id,
          name:        tags.name || tags.operator || tags.brand || 'Medical Store',
          lat:         pLat,
          lng:         pLng,
          phone:       tags.phone || tags['contact:phone'] || '',
          opening:     tags.opening_hours || '',
          address:     addrParts.join(', ') || '',
          website:     tags.website || '',
          brand:       tags.brand || '',
          distance_km: pLat && pLng ? haversine(lat, lng, pLat, pLng) : null,
        };
      })
      .filter(p => p.lat && p.lng)
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    res.json({
      pharmacies,
      count:   pharmacies.length,
      pincode,
      center:  { lat, lng },
    });

  } catch (err) {
    console.error('By-pincode error:', err.message);
    res.status(500).json({ error: 'Pincode pharmacy search failed', message: err.message });
  }
});

module.exports = router;