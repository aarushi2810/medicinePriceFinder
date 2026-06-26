const db = require('../db');

function getFreshnessStatus(lastVerifiedAt) {
  if (!lastVerifiedAt) return 'Unknown';

  const verifiedAt = new Date(lastVerifiedAt);
  if (Number.isNaN(verifiedAt.getTime())) return 'Unknown';

  const ageMs = Date.now() - verifiedAt.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  if (ageMs < oneDay) return 'Fresh';
  if (ageMs < sevenDays) return 'Recent';
  return 'Stale';
}

/**
 * @param {number|string} id
 * @param {{ db?: import('pg').Pool }} options
 * @returns {Promise<{medicine: object, prices: object[], summary: object|null}>}
 */
async function getMedicineComparison(id, options = {}) {
  const client = options.db || db;
  const medResult = await client.query(`
    SELECT m.id, m.brand_name, m.dosage, m.form, s.salt_name, s.nppa_ceiling_price
    FROM medicines m
    JOIN salts s ON m.salt_id = s.id
    WHERE m.id = $1
  `, [id]);

  if (medResult.rows.length === 0) {
    return null;
  }

  const medicine = medResult.rows[0];
  const nppaCeiling = parseFloat(medicine.nppa_ceiling_price) || null;

  const priceResult = await client.query(`
    SELECT
      ph.id    AS pharmacy_id,
      ph.name  AS pharmacy_name,
      ph.type  AS pharmacy_type,
      p.price,
      p.mrp,
      p.in_stock,
      p.updated_at,
      p.data_source,
      p.last_verified_at,
      p.source_url,
      ROUND(((p.mrp - p.price) / NULLIF(p.mrp, 0)) * 100) AS discount_pct
    FROM prices p
    JOIN pharmacies ph ON p.pharmacy_id = ph.id
    WHERE p.medicine_id = $1
    ORDER BY p.price ASC
  `, [id]);

  const prices = priceResult.rows;

  if (prices.length === 0) {
    return { medicine, prices: [], summary: null };
  }

  const cheapestPrice = parseFloat(prices[0].price);
  const mostExpPrice = parseFloat(prices[prices.length - 1].price);

  const enriched = prices.map((p, i) => ({
    ...p,
    price: parseFloat(p.price),
    mrp: parseFloat(p.mrp),
    discount_pct: parseInt(p.discount_pct) || 0,
    data_source: p.data_source || 'Seed',
    source_label: p.data_source === 'Seed' ? 'Seed Data' : (p.data_source || 'Unknown'),
    last_verified_at: p.last_verified_at,
    source_url: p.source_url,
    freshness_status: getFreshnessStatus(p.last_verified_at),
    vs_cheapest_pct: i === 0
      ? 0
      : Math.round(((parseFloat(p.price) - cheapestPrice) / cheapestPrice) * 100),
    nppa_breach: (nppaCeiling && p.pharmacy_name !== 'NPPA Standard')
      ? parseFloat(p.price) > nppaCeiling
      : false,
  }));

  return {
    medicine,
    prices: enriched,
    summary: {
      cheapest_price: cheapestPrice,
      most_expensive: mostExpPrice,
      max_savings: (mostExpPrice - cheapestPrice).toFixed(2),
      pharmacy_count: prices.length,
      nppa_breach_count: enriched.filter(p => p.nppa_breach).length,
      nppa_ceiling: nppaCeiling,
    },
  };
}

/**
 * @param {number|string} id
 * @param {{ db?: import('pg').Pool }} options
 * @returns {Promise<object[]>}
 */
async function getGenericAlternatives(id, options = {}) {
  const client = options.db || db;
  const target = await client.query(
    `SELECT m.salt_id, m.form, m.dosage, s.salt_name
     FROM medicines m
     JOIN salts s ON m.salt_id = s.id
     WHERE m.id = $1`, [id]
  );
  if (!target.rows.length) return [];

  const { salt_id, form, dosage, salt_name } = target.rows[0];
  const targetStrength = parseFloat((dosage || '').match(/[\d.]+/)?.[0]);

  let result = await client.query(`
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

  if (result.rows.length < 5 && salt_name) {
    const baseIngredient = salt_name.trim().split(/[\s+(]/)[0];
    if (baseIngredient && baseIngredient.length >= 3) {
      const moreResults = await client.query(`
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

      const existingIds = new Set(result.rows.map(r => r.id));
      for (const row of moreResults.rows) {
        if (!existingIds.has(row.id)) {
          result.rows.push(row);
          existingIds.add(row.id);
        }
      }
    }
  }

  return result.rows.filter(r => {
    if (!targetStrength) return true;
    const rowStrength = parseFloat((r.dosage || '').match(/[\d.]+/)?.[0]);
    if (!rowStrength) return true;
    const diff = Math.abs(rowStrength - targetStrength) / targetStrength;
    return diff < 0.5;
  });
}

module.exports = {
  getFreshnessStatus,
  getGenericAlternatives,
  getMedicineComparison,
};
