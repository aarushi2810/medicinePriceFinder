const db = require('../db');
const {
  getGenericAlternatives,
  getMedicineComparison,
} = require('./medicineCompareService');

const DEFAULT_PHARMACIES = ['1mg', 'Netmeds', 'Apollo Pharmacy', 'PharmEasy'];

function money(value) {
  return Number.parseFloat(Number(value || 0).toFixed(2));
}

function getManufacturer(brandName) {
  const match = String(brandName || '').match(/\(([^)]+)\)$/);
  return match ? match[1] : null;
}

/**
 * Resolve a free-text medicine name to the best DB medicine row.
 *
 * @param {string|number|object} item
 * @param {{ db?: import('pg').Pool }} options
 * @returns {Promise<object|null>}
 */
async function resolveMedicine(item, options = {}) {
  const client = options.db || db;
  if (typeof item === 'object' && item?.id) {
    const exactById = await client.query(`
      SELECT m.id, m.brand_name, m.dosage, m.form, s.salt_name
      FROM medicines m
      JOIN salts s ON m.salt_id = s.id
      WHERE m.id = $1
    `, [item.id]);
    return exactById.rows[0] || null;
  }

  const query = String(typeof item === 'object' ? item.name : item || '').trim();
  if (!query) return null;

  const result = await client.query(`
    SELECT m.id, m.brand_name, m.dosage, m.form, s.salt_name
    FROM medicines m
    JOIN salts s ON m.salt_id = s.id
    LEFT JOIN prices p ON p.medicine_id = m.id
    WHERE
      LOWER(m.brand_name) LIKE LOWER($2)
      OR LOWER(s.salt_name) LIKE LOWER($2)
      OR similarity(LOWER(m.brand_name), LOWER($1)) > 0.2
    GROUP BY m.id, m.brand_name, m.dosage, m.form, s.salt_name
    ORDER BY
      CASE WHEN LOWER(m.brand_name) = LOWER($1) THEN 0 ELSE 1 END,
      CASE WHEN LOWER(m.brand_name) LIKE LOWER($3) THEN 0 ELSE 1 END,
      COUNT(p.id) DESC,
      similarity(LOWER(m.brand_name), LOWER($1)) DESC
    LIMIT 1
  `, [query, `%${query}%`, `${query}%`]);

  return result.rows[0] || null;
}

function buildPharmacyTotals(reportMedicines, pharmacies = DEFAULT_PHARMACIES) {
  return pharmacies.map(name => {
    const available = [];
    const unavailable = [];

    for (const item of reportMedicines) {
      const price = item.prices.find(p => p.pharmacy_name === name && p.in_stock);
      if (price) {
        available.push({ medicineId: item.medicine.id, price: price.price });
      } else {
        unavailable.push(item.medicine.id);
      }
    }

    return {
      name,
      total: money(available.reduce((sum, row) => sum + row.price, 0)),
      availableCount: available.length,
      unavailableCount: unavailable.length,
      unavailableMedicineIds: unavailable,
      complete: unavailable.length === 0,
    };
  });
}

function buildMedicineRows(comparisons, genericsById) {
  return comparisons.map(comparison => {
    const { medicine, prices, summary } = comparison;
    const selected = prices[0] || null;
    const mostExpensive = prices[prices.length - 1] || null;
    const generics = genericsById.get(Number(medicine.id)) || [];
    const cheapestGeneric = generics
      .filter(g => g.lowest_price != null)
      .sort((a, b) => Number(a.lowest_price) - Number(b.lowest_price))[0] || null;
    const genericPrice = cheapestGeneric ? Number(cheapestGeneric.lowest_price) : null;
    const selectedPrice = selected ? Number(selected.price) : null;
    const nppaCeiling = summary?.nppa_ceiling ? Number(summary.nppa_ceiling) : null;
    const nppaDifference = selectedPrice != null && nppaCeiling != null
      ? money(selectedPrice - nppaCeiling)
      : null;

    return {
      medicine,
      salt: medicine.salt_name,
      strength: medicine.dosage,
      manufacturer: getManufacturer(medicine.brand_name),
      prices,
      nppaCeiling,
      selectedPharmacy: selected?.pharmacy_name || null,
      selectedPrice,
      currentPrice: mostExpensive ? Number(mostExpensive.price) : selectedPrice,
      cheapestPrice: selectedPrice,
      perMedicineSavings: mostExpensive && selected ? money(Number(mostExpensive.price) - Number(selected.price)) : 0,
      generic: cheapestGeneric,
      genericPrice,
      genericSavings: genericPrice != null && selectedPrice != null
        ? Math.max(0, money(selectedPrice - genericPrice))
        : 0,
      nppaStatus: nppaDifference == null
        ? 'Unknown'
        : nppaDifference > 0 ? 'Above ceiling' : 'Within ceiling',
      nppaDifference,
    };
  });
}

/**
 * Build a complete savings report for a list of medicine names or IDs.
 *
 * @param {Array<string|number|object>} inputMedicines
 * @param {{ db?: import('pg').Pool }} options
 */
async function generateSavingsReport(inputMedicines, options = {}) {
  const client = options.db || db;
  const inputs = Array.isArray(inputMedicines) ? inputMedicines : [];
  const resolved = [];
  const unresolved = [];

  for (const input of inputs) {
    const medicine = await resolveMedicine(input, { db: client });
    if (medicine) resolved.push(medicine);
    else unresolved.push(input);
  }

  const comparisons = [];
  const genericsById = new Map();

  for (const med of resolved) {
    const comparison = await getMedicineComparison(med.id, { db: client });
    if (!comparison) continue;
    comparisons.push(comparison);
    genericsById.set(Number(med.id), await getGenericAlternatives(med.id, { db: client }));
  }

  const medicines = buildMedicineRows(comparisons, genericsById);
  const pharmacies = buildPharmacyTotals(medicines);
  const completePharmacies = pharmacies.filter(p => p.complete);
  const cheapestOverallPharmacy = (completePharmacies.length ? completePharmacies : pharmacies)
    .filter(p => p.availableCount > 0)
    .sort((a, b) => a.total - b.total || b.availableCount - a.availableCount)[0] || null;

  const currentTotal = money(medicines.reduce((sum, item) => sum + Number(item.currentPrice || 0), 0));
  const cheapestTotal = money(medicines.reduce((sum, item) => sum + Number(item.cheapestPrice || 0), 0));
  const totalSavings = money(Math.max(0, currentTotal - cheapestTotal));
  const genericSavings = money(medicines.reduce((sum, item) => sum + Number(item.genericSavings || 0), 0));
  const nppaViolations = medicines.filter(item => item.nppaStatus === 'Above ceiling');

  const summary = {
    medicineCount: medicines.length,
    unresolvedCount: unresolved.length,
    currentTotal,
    cheapestTotal,
    totalSavings,
    savingsPercentage: currentTotal > 0 ? money((totalSavings / currentTotal) * 100) : 0,
    genericSavings,
    nppaViolationCount: nppaViolations.length,
    cheapestOverallPharmacy: cheapestOverallPharmacy?.name || null,
    generatedAt: new Date().toISOString(),
  };

  return {
    summary,
    pharmacies: pharmacies.map(p => ({
      ...p,
      winner: cheapestOverallPharmacy?.name === p.name,
    })),
    medicines,
    genericSavings,
    totalSavings,
    unresolved,
    reportData: {
      generatedAt: summary.generatedAt,
      inputMedicines: inputs,
      resolvedMedicines: resolved,
      nppaViolations,
    },
  };
}

module.exports = {
  DEFAULT_PHARMACIES,
  buildMedicineRows,
  buildPharmacyTotals,
  generateSavingsReport,
  resolveMedicine,
};
