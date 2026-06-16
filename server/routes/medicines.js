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
          WHEN LOWER(MIN(m.brand_name)) = LOWER($1) OR LOWER(s.salt_name) = LOWER($1) THEN 0
          WHEN LOWER(MIN(m.brand_name)) LIKE LOWER($2) OR LOWER(s.salt_name) LIKE LOWER($2) THEN 1
          ELSE 2
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
      nppa_breach: (nppaCeiling && p.pharmacy_name !== 'NPPA Standard')
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
    const target = await db.query(
      `SELECT m.salt_id, m.form, m.dosage, s.salt_name
       FROM medicines m
       JOIN salts s ON m.salt_id = s.id
       WHERE m.id = $1`, [id]
    );
    if (!target.rows.length) return res.json({ generics: [], fromCache: false });

    const { salt_id, form, dosage, salt_name } = target.rows[0];
    const targetStrength = parseFloat((dosage || '').match(/[\d.]+/)?.[0]);

    // Pass 1: same salt_id, any form (not just exact form match)
    let result = await db.query(`
      SELECT
        m.id, m.brand_name, m.dosage, m.form,
        MIN(p.price) AS lowest_price,
        COUNT(p.id)  AS available_at
      FROM medicines m
      LEFT JOIN prices p ON p.medicine_id = m.id
      LEFT JOIN pharmacies ph ON p.pharmacy_id = ph.id
      WHERE
        m.salt_id = $1
        AND m.id   != $2
        AND m.brand_name NOT LIKE '(%'
        AND m.brand_name != 'NPPA Standard'
        AND (ph.name IS NULL OR ph.name != 'NPPA Standard')
      GROUP BY m.id, m.brand_name, m.dosage, m.form
      ORDER BY
        CASE WHEN m.form = $3 THEN 0 ELSE 1 END,
        lowest_price ASC NULLS LAST
      LIMIT 25
    `, [salt_id, id, form]);

    // Pass 2: if few results, also try matching on base ingredient name
    if (result.rows.length < 5 && salt_name) {
      const baseIngredient = salt_name.trim().split(/[\s+(]/)[0];
      if (baseIngredient && baseIngredient.length >= 3) {
        const moreResults = await db.query(`
          SELECT
            m.id, m.brand_name, m.dosage, m.form,
            MIN(p.price) AS lowest_price,
            COUNT(p.id)  AS available_at
          FROM medicines m
          JOIN salts s ON m.salt_id = s.id
          LEFT JOIN prices p ON p.medicine_id = m.id
          LEFT JOIN pharmacies ph ON p.pharmacy_id = ph.id
          WHERE
            LOWER(s.salt_name) LIKE LOWER($1)
            AND m.id != $2
            AND m.brand_name NOT LIKE '(%'
            AND m.brand_name != 'NPPA Standard'
            AND (ph.name IS NULL OR ph.name != 'NPPA Standard')
          GROUP BY m.id, m.brand_name, m.dosage, m.form
          ORDER BY
            CASE WHEN m.form = $3 THEN 0 ELSE 1 END,
            lowest_price ASC NULLS LAST
          LIMIT 25
        `, [`${baseIngredient}%`, id, form]);

        // Merge, avoiding duplicates
        const existingIds = new Set(result.rows.map(r => r.id));
        for (const row of moreResults.rows) {
          if (!existingIds.has(row.id)) {
            result.rows.push(row);
            existingIds.add(row.id);
          }
        }
      }
    }

    // Looser strength filter — allow up to 50% difference (was 20%)
    const filtered = result.rows.filter(r => {
      if (!targetStrength) return true;
      const rowStrength = parseFloat((r.dosage || '').match(/[\d.]+/)?.[0]);
      if (!rowStrength) return true;
      const diff = Math.abs(rowStrength - targetStrength) / targetStrength;
      return diff < 0.5;
    });

    const data = { generics: filtered, fromCache: false };
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