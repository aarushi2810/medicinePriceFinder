const express = require('express');
const router  = express.Router();

router.get('/overpass', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius * 1000},${lat},${lng});
      way["amenity"="pharmacy"](around:${radius * 1000},${lat},${lng});
      node["shop"="chemist"](around:${radius * 1000},${lat},${lng});
    );
    out center tags;
  `;

  const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let data = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(
        `${endpoint}?data=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        data = await response.json();
        break;
      }
    } catch {
      continue; // try next endpoint
    }
  }

  if (!data) {
    return res.status(503).json({
      error: 'Pharmacy data temporarily unavailable',
      pharmacies: [],
    });
  }

  const pharmacies = (data.elements || [])
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

  res.json({ pharmacies, count: pharmacies.length });
});

module.exports = router;