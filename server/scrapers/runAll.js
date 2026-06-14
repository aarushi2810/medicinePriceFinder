#!/usr/bin/env node
// ─── runAll.js ───────────────────────────────────────────────────────────────
// Orchestrator: reads medicines from DB, runs each scraper, upserts results.
// Usage: node scrapers/runAll.js
// ─────────────────────────────────────────────────────────────────────────────

const db = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const PharmEasyScraper    = require('./PharmEasyScraper');
const OneMilligramScraper = require('./OneMilligramScraper');
const NetmedsScraper      = require('./NetmedsScraper');

// ── Map scraper name → pharmacy name in DB ──────────────────────────────────
const SCRAPER_PHARMACY_MAP = {
  'PharmEasy': 'PharmEasy',
  '1mg':       '1mg',
  'Netmeds':   'Netmeds',
};

async function getOrCreatePharmacy(name) {
  const r = await db.query(`SELECT id FROM pharmacies WHERE name = $1`, [name]);
  if (r.rows.length) return r.rows[0].id;
  const i = await db.query(
    `INSERT INTO pharmacies (name, type) VALUES ($1, 'online') RETURNING id`, [name]
  );
  return i.rows[0].id;
}

async function upsertPrice(medicineId, pharmacyId, price, mrp) {
  await db.query(`
    INSERT INTO prices (medicine_id, pharmacy_id, price, mrp, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (medicine_id, pharmacy_id)
    DO UPDATE SET price = EXCLUDED.price, mrp = EXCLUDED.mrp, updated_at = NOW()
  `, [medicineId, pharmacyId, price, mrp]);

  await db.query(`
    INSERT INTO price_history (medicine_id, pharmacy_id, price, recorded_on)
    VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT DO NOTHING
  `, [medicineId, pharmacyId, price]);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Medicine Price Scraper — Run All');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: Load medicines from DB
  const medResult = await db.query(`
    SELECT m.id, m.brand_name, m.dosage, m.form, s.salt_name
    FROM medicines m
    JOIN salts s ON m.salt_id = s.id
    WHERE m.brand_name NOT LIKE '(%'
      AND m.brand_name != 'NPPA Standard'
    ORDER BY m.brand_name ASC
  `);

  const medicines = medResult.rows;
  console.log(`Loaded ${medicines.length} medicines from database.\n`);

  if (medicines.length === 0) {
    console.log('No medicines in DB. Run seed scripts first.');
    process.exit(0);
  }

  // Step 2: Initialize scrapers
  const scrapers = [
    new PharmEasyScraper(),
    new OneMilligramScraper(),
    new NetmedsScraper(),
  ];

  // Step 3: Run each scraper
  const summary = {};

  for (const scraper of scrapers) {
    const pharmacyName = SCRAPER_PHARMACY_MAP[scraper.name] || scraper.name;
    console.log(`\n───────────────────────────────────────────────────────────────`);
    console.log(`  Running: ${scraper.name}`);
    console.log(`───────────────────────────────────────────────────────────────`);

    try {
      const results = await scraper.run(medicines);

      // Upsert results into DB
      let upserted = 0;
      for (const result of results) {
        if (result.price != null && result.medicine.id) {
          const pharmacyId = await getOrCreatePharmacy(pharmacyName);
          await upsertPrice(
            result.medicine.id,
            pharmacyId,
            result.price,
            result.mrp || result.price
          );
          upserted++;
        }
      }

      summary[scraper.name] = {
        scraped:  results.length,
        upserted,
        errors:   scraper.getErrorLog().length,
      };
    } catch (err) {
      console.error(`[${scraper.name}] Fatal error: ${err.message}`);
      summary[scraper.name] = { scraped: 0, upserted: 0, errors: 1, fatal: err.message };
    }
  }

  // Step 4: Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════════');

  for (const [name, stats] of Object.entries(summary)) {
    console.log(`  ${name.padEnd(15)} — scraped: ${stats.scraped}, upserted: ${stats.upserted}, errors: ${stats.errors}`);
    if (stats.fatal) console.log(`    └─ FATAL: ${stats.fatal}`);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch(err => {
  console.error('Orchestrator failed:', err.message);
  process.exit(1);
});
