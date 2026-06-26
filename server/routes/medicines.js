const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { cacheMiddleware } = require('../middleware/cache');
const {
  getGenericAlternatives,
  getMedicineComparison,
} = require('../services/medicineCompareService');

router.get('/search', cacheMiddleware('search'), async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const start = Date.now();
    const exact    = q.trim();
    const prefix   = `${exact}%`;
    const contains = `%${exact}%`;

    const result = await db.query(`
      SELECT
        MIN(m.id)         AS id,
        s.id              AS salt_id,
        s.salt_name,
        MIN(m.brand_name) AS brand_name,
        MIN(m.dosage)     AS dosage,
        MIN(m.form)       AS form,
        s.nppa_ceiling_price,
        MIN(p.price)         AS lowest_price,
        COUNT(DISTINCT m.id) AS formulation_count,
        COUNT(p.id)          AS pharmacy_count
      FROM medicines m
      JOIN salts s ON m.salt_id = s.id
      LEFT JOIN prices p ON p.medicine_id = m.id
      WHERE
        (
          LOWER(m.brand_name) LIKE LOWER($3) OR
          LOWER(s.salt_name)  LIKE LOWER($3)
        )
        AND m.brand_name NOT LIKE '(%'
        AND LENGTH(m.brand_name) > 2
        AND LENGTH(TRIM(s.salt_name)) >= 3
        AND m.brand_name !~ '^[0-9]+$'
        AND m.brand_name !~ '^[^a-zA-Z0-9]+$'
      GROUP BY s.id, s.salt_name, s.nppa_ceiling_price
      ORDER BY
        CASE
          -- If searching for a combination query, treat all matches equally
          WHEN LOWER($1) LIKE '%+%' THEN
            CASE
              WHEN LOWER(MIN(m.brand_name)) = LOWER($1) OR LOWER(s.salt_name) = LOWER($1) THEN 0
              WHEN LOWER(MIN(m.brand_name)) LIKE LOWER($2) OR LOWER(s.salt_name) LIKE LOWER($2) THEN 1
              ELSE 2
            END
          -- Otherwise, penalize combination drugs (containing '+') by ranking them lower
          ELSE
            CASE
              -- Priority 1: Brand name or Salt name starts with query and is single-ingredient (no '+')
              WHEN (LOWER(MIN(m.brand_name)) LIKE LOWER($2) AND MIN(m.brand_name) NOT LIKE '%+%')
                OR (LOWER(s.salt_name) LIKE LOWER($2) AND s.salt_name NOT LIKE '%+%') THEN 0
              
              -- Priority 2: Brand/Salt contains query and is single-ingredient (no '+')
              WHEN (LOWER(MIN(m.brand_name)) LIKE LOWER($3) AND MIN(m.brand_name) NOT LIKE '%+%')
                OR (LOWER(s.salt_name) LIKE LOWER($3) AND s.salt_name NOT LIKE '%+%') THEN 1
              
              -- Priority 3: Combination drugs containing query (contains '+')
              ELSE 2
            END
        END,
        CASE WHEN COUNT(p.id) > 1 THEN 0 ELSE 1 END,
        similarity(LOWER(s.salt_name), LOWER($1)) DESC,
        s.salt_name ASC
      LIMIT 20
    `, [exact, prefix, contains]);

    const queryMs = Date.now() - start;

    const data = {
      results:   result.rows,
      count:     result.rows.length,
      query:     q,
      queryMs,
      fromCache: false,
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
    const comparison = await getMedicineComparison(id);
    if (!comparison) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const data = {
      ...comparison,
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
    const data = { generics: await getGenericAlternatives(id), fromCache: false };
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
        (SELECT COUNT(*) FROM medicines)                                  AS total_medicines,
        (SELECT COUNT(*) FROM salts WHERE nppa_ceiling_price IS NOT NULL) AS ceiling_prices,
        (SELECT COUNT(DISTINCT medicine_id) FROM prices
          WHERE pharmacy_id != (SELECT id FROM pharmacies WHERE name='NPPA Standard' LIMIT 1)
        ) AS medicines_with_live_prices,
        (SELECT COUNT(*) FROM prices
          WHERE pharmacy_id != (SELECT id FROM pharmacies WHERE name='NPPA Standard' LIMIT 1)
        ) AS total_live_prices
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Stats failed' });
  }
});

// ─── GET /api/medicines/nearby (legacy DB-based, kept for fallback) ──────────
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const result = await db.query(`
      SELECT
        id, name, address, lat, lng,
        ROUND((6371 * acos(
          cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        ))::numeric, 2) AS distance_km
      FROM pharmacies
      WHERE type = 'local' AND lat IS NOT NULL AND lng IS NOT NULL
        AND (6371 * acos(
          cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )) < $3
      ORDER BY distance_km ASC
      LIMIT 20
    `, [parseFloat(lat), parseFloat(lng), parseFloat(radius)]);

    res.json({ pharmacies: result.rows });
  } catch (err) {
    console.error('Nearby error:', err.message);
    res.status(500).json({ error: 'Nearby search failed' });
  }
});

module.exports = router;
