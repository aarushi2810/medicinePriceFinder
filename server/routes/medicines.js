const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { cacheMiddleware } = require('../middleware/cache');


router.get('/search', cacheMiddleware('search'), async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const start = Date.now();

    const result = await db.query(`
      SELECT
        m.id,
        m.brand_name,
        m.dosage,
        m.form,
        s.salt_name,
        s.nppa_ceiling_price,
        MIN(p.price) AS lowest_price,
        COUNT(p.id)  AS pharmacy_count
      FROM medicines m
      JOIN salts     s ON m.salt_id     = s.id
      LEFT JOIN prices p ON p.medicine_id = m.id
      WHERE
        LOWER(m.brand_name) LIKE LOWER($1) OR
        LOWER(s.salt_name)  LIKE LOWER($1)
      GROUP BY m.id, m.brand_name, m.dosage, m.form, s.salt_name, s.nppa_ceiling_price
      ORDER BY m.brand_name ASC
      LIMIT 20
    `, [`%${q.trim()}%`]);

    const queryMs = Date.now() - start;

    const data = {
      results:    result.rows,
      count:      result.rows.length,
      query:      q,
      queryMs,    
      fromCache:  false,
    };

    if (res.setCache) res.setCache(data);
    res.json(data);

  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});








router.get('/:id/compare', cacheMiddleware('compare'), async (req, res) => {
    const { id } = req.params;
  
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid medicine ID' });
    }
  
    try {
      // Medicine + salt details
      const medResult = await db.query(`
        SELECT m.id, m.brand_name, m.dosage, m.form, s.salt_name, s.nppa_ceiling_price
        FROM medicines m
        JOIN salts s ON m.salt_id = s.id
        WHERE m.id = $1
      `, [id]);
  
      if (medResult.rows.length === 0) {
        return res.status(404).json({ error: 'Medicine not found' });
      }
  
      const medicine = medResult.rows[0];
      const nppaCeiling = parseFloat(medicine.nppa_ceiling_price) || null;
  
      // Prices sorted cheapest first
      const priceResult = await db.query(`
        SELECT
          ph.id    AS pharmacy_id,
          ph.name  AS pharmacy_name,
          ph.type  AS pharmacy_type,
          p.price,
          p.mrp,
          p.in_stock,
          p.updated_at,
          ROUND(((p.mrp - p.price) / NULLIF(p.mrp, 0)) * 100) AS discount_pct
        FROM prices p
        JOIN pharmacies ph ON p.pharmacy_id = ph.id
        WHERE p.medicine_id = $1
        ORDER BY p.price ASC
      `, [id]);
  
      const prices = priceResult.rows;
  
      if (prices.length === 0) {
        return res.json({ medicine, prices: [], summary: null, fromCache: false });
      }
  
      // Compute derived fields in JS — avoids SQL division by zero
      const cheapestPrice = parseFloat(prices[0].price);
      const mostExpPrice  = parseFloat(prices[prices.length - 1].price);
  
      const enriched = prices.map((p, i) => ({
        ...p,
        price:          parseFloat(p.price),
        mrp:            parseFloat(p.mrp),
        discount_pct:   parseInt(p.discount_pct) || 0,
        vs_cheapest_pct: i === 0
          ? 0
          : Math.round(((parseFloat(p.price) - cheapestPrice) / cheapestPrice) * 100),
        nppa_breach: nppaCeiling
          ? parseFloat(p.price) > nppaCeiling
          : false,
      }));
  
      const data = {
        medicine,
        prices:  enriched,
        summary: {
          cheapest_price:    cheapestPrice,
          most_expensive:    mostExpPrice,
          max_savings:       (mostExpPrice - cheapestPrice).toFixed(2),
          pharmacy_count:    prices.length,
          nppa_breach_count: enriched.filter(p => p.nppa_breach).length,
          nppa_ceiling:      nppaCeiling,
        },
        fromCache: false,
      };
  
      if (res.setCache) res.setCache(data);
      res.json(data);
  
    } catch (err) {
      console.error('Compare error:', err.message);
      res.status(500).json({ error: 'Compare failed' });
    }
  });



router.get('/:id/generics', cacheMiddleware('generics'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT
        m.id,
        m.brand_name,
        m.dosage,
        m.form,
        MIN(p.price) AS lowest_price,
        COUNT(p.id)  AS available_at
      FROM medicines m
      LEFT JOIN prices p ON p.medicine_id = m.id
      WHERE
        m.salt_id = (SELECT salt_id FROM medicines WHERE id = $1)
        AND m.id != $1
      GROUP BY m.id, m.brand_name, m.dosage, m.form
      ORDER BY lowest_price ASC NULLS LAST
    `, [id]);

    const data = { generics: result.rows, fromCache: false };
    if (res.setCache) res.setCache(data);
    res.json(data);

  } catch (err) {
    console.error('Generics error:', err.message);
    res.status(500).json({ error: 'Generics lookup failed' });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM medicines)                              AS total_medicines,
        (SELECT COUNT(*) FROM salts WHERE nppa_ceiling_price IS NOT NULL) AS ceiling_prices,
        (SELECT COUNT(*) FROM prices WHERE pharmacy_id != (
          SELECT id FROM pharmacies WHERE name = 'NPPA Standard' LIMIT 1
        ))                                                           AS real_prices,
        (SELECT COUNT(DISTINCT pharmacy_id) FROM prices)             AS pharmacy_count
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});



// GET /api/pharmacies/nearby?lat=30.33&lng=76.38&radius=5
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  try {
    const result = await db.query(`
      SELECT
        ph.id,
        ph.name,
        ph.address,
        ph.lat,
        ph.lng,
        (6371 * acos(
          cos(radians($1)) * cos(radians(ph.lat)) *
          cos(radians(ph.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(ph.lat))
        )) AS distance_km
      FROM pharmacies ph
      WHERE
        ph.type = 'local'
        AND ph.lat IS NOT NULL
        AND ph.lng IS NOT NULL
      HAVING distance_km < $3
      ORDER BY distance_km ASC
      LIMIT 20
    `, [lat, lng, radius]);

    res.json({ pharmacies: result.rows });
  } catch (err) {
    console.error('Nearby error:', err.message);
    res.status(500).json({ error: 'Nearby search failed' });
  }
});


module.exports = router;