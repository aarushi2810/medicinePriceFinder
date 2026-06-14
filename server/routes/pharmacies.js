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

  return fetch(url, { signal: controller.signal })
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

module.exports = router;