#!/usr/bin/env node

const path = require('path');
const db = require('../db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PharmEasyScraper = require('./PharmEasyScraper');
const OneMilligramScraper = require('./OneMilligramScraper');
const NetmedsScraper = require('./NetmedsScraper');

const LOCK_KEY = 42424201;

const SCRAPER_PHARMACY_MAP = {
  PharmEasy: 'PharmEasy',
  '1mg': '1mg',
  Netmeds: 'Netmeds',
};

function createProviders() {
  return [
    new PharmEasyScraper(),
    new OneMilligramScraper(),
    new NetmedsScraper(),
  ];
}

async function acquireLock(client = db, lockKey = LOCK_KEY) {
  const result = await client.query('SELECT pg_try_advisory_lock($1) AS locked', [lockKey]);
  return Boolean(result.rows[0]?.locked);
}

async function releaseLock(client = db, lockKey = LOCK_KEY) {
  await client.query('SELECT pg_advisory_unlock($1)', [lockKey]);
}

async function getMedicines(client = db) {
  const result = await client.query(`
    SELECT m.id, m.brand_name, m.dosage, m.form, s.salt_name
    FROM medicines m
    JOIN salts s ON m.salt_id = s.id
    WHERE m.brand_name NOT LIKE '(%'
      AND m.brand_name != 'NPPA Standard'
    ORDER BY m.brand_name ASC
  `);
  return result.rows;
}

async function getOrCreatePharmacy(name, client = db) {
  const existing = await client.query('SELECT id FROM pharmacies WHERE name = $1', [name]);
  if (existing.rows.length) return existing.rows[0].id;

  const inserted = await client.query(
    `INSERT INTO pharmacies (name, type, address)
     VALUES ($1, 'online', 'Official provider API')
     RETURNING id`,
    [name]
  );
  return inserted.rows[0].id;
}

function toNumber(value) {
  return Number.parseFloat(value);
}

function didPriceChange(existing, next) {
  if (!existing) return true;
  return (
    toNumber(existing.price) !== toNumber(next.price) ||
    toNumber(existing.mrp) !== toNumber(next.mrp) ||
    Boolean(existing.in_stock) !== Boolean(next.inStock)
  );
}

async function upsertPrice(result, client = db) {
  const pharmacyName = SCRAPER_PHARMACY_MAP[result.pharmacy] || result.pharmacy;
  const pharmacyId = await getOrCreatePharmacy(pharmacyName, client);
  const existing = await client.query(
    `SELECT price, mrp, in_stock, source_url, data_source, last_verified_at
     FROM prices
     WHERE medicine_id = $1 AND pharmacy_id = $2`,
    [result.medicine.id, pharmacyId]
  );

  const normalized = {
    price: toNumber(result.price),
    mrp: toNumber(result.mrp),
    inStock: Boolean(result.inStock),
    dataSource: result.data_source || result.dataSource || 'API',
    lastVerifiedAt: result.last_verified_at || result.updated_at || new Date().toISOString(),
    url: result.url || null,
  };

  if (!didPriceChange(existing.rows[0], normalized)) {
    await client.query(`
      UPDATE prices
      SET
        data_source = $3,
        last_verified_at = COALESCE($4::timestamp, NOW()),
        source_url = $5
      WHERE medicine_id = $1
        AND pharmacy_id = $2
        AND (
          data_source IS DISTINCT FROM $3 OR
          last_verified_at IS DISTINCT FROM COALESCE($4::timestamp, NOW()) OR
          source_url IS DISTINCT FROM $5
        )
    `, [
      result.medicine.id,
      pharmacyId,
      normalized.dataSource,
      normalized.lastVerifiedAt,
      normalized.url,
    ]);
    return { updated: false, pharmacyId };
  }

  await client.query(`
    INSERT INTO prices (
      medicine_id,
      pharmacy_id,
      price,
      mrp,
      in_stock,
      updated_at,
      source_url,
      data_source,
      last_verified_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, COALESCE($8::timestamp, NOW()))
    ON CONFLICT (medicine_id, pharmacy_id)
    DO UPDATE SET
      price = EXCLUDED.price,
      mrp = EXCLUDED.mrp,
      in_stock = EXCLUDED.in_stock,
      source_url = EXCLUDED.source_url,
      data_source = EXCLUDED.data_source,
      last_verified_at = EXCLUDED.last_verified_at,
      updated_at = NOW()
  `, [
    result.medicine.id,
    pharmacyId,
    normalized.price,
    normalized.mrp,
    normalized.inStock,
    normalized.url,
    normalized.dataSource,
    normalized.lastVerifiedAt,
  ]);

  await client.query(`
    INSERT INTO price_history (medicine_id, pharmacy_id, price, recorded_on)
    VALUES ($1, $2, $3, CURRENT_DATE)
    ON CONFLICT (medicine_id, pharmacy_id, recorded_on)
    DO UPDATE SET price = EXCLUDED.price
    WHERE price_history.price IS DISTINCT FROM EXCLUDED.price
  `, [result.medicine.id, pharmacyId, normalized.price]);

  return { updated: true, pharmacyId };
}

async function updateProviderStatus(providerName, status, stats, client = db) {
  await client.query(`
    INSERT INTO scraper_provider_status (
      provider_name,
      status,
      last_successful_scrape,
      last_failed_scrape,
      last_error,
      last_run,
      medicines_processed,
      prices_updated,
      errors,
      updated_at
    )
    VALUES (
      $1, $2,
      CASE WHEN $2::varchar(30) = 'success' THEN NOW() ELSE NULL END,
      CASE WHEN $2::varchar(30) = 'failed' THEN NOW() ELSE NULL END,
      $3,
      NOW(),
      $4,
      $5,
      $6,
      NOW()
    )
    ON CONFLICT (provider_name)
    DO UPDATE SET
      status = EXCLUDED.status,
      last_successful_scrape = CASE
        WHEN EXCLUDED.status = 'success' THEN NOW()
        ELSE scraper_provider_status.last_successful_scrape
      END,
      last_failed_scrape = CASE
        WHEN EXCLUDED.status = 'failed' THEN NOW()
        ELSE scraper_provider_status.last_failed_scrape
      END,
      last_error = EXCLUDED.last_error,
      last_run = NOW(),
      medicines_processed = EXCLUDED.medicines_processed,
      prices_updated = EXCLUDED.prices_updated,
      errors = EXCLUDED.errors,
      updated_at = NOW()
  `, [
    providerName,
    status,
    stats.lastError || null,
    stats.medicinesProcessed || 0,
    stats.pricesUpdated || 0,
    stats.errors || 0,
  ]);
}

async function runProvider(provider, medicines, client = db, logger = console) {
  const started = Date.now();
  const stats = {
    name: provider.name,
    status: 'success',
    medicinesProcessed: medicines.length,
    pricesUpdated: 0,
    errors: 0,
    durationMs: 0,
    lastError: null,
  };

  if (typeof provider.isConfigured === 'function' && !provider.isConfigured()) {
    stats.status = 'not_configured';
    stats.medicinesProcessed = 0;
    stats.lastError = 'No official API configured; mock provider disabled.';
    stats.durationMs = Date.now() - started;
    await updateProviderStatus(provider.name, stats.status, stats, client);
    logger.log(`[${provider.name}] not configured; no website scraping attempted`);
    return stats;
  }

  try {
    const results = await provider.run(medicines);

    for (const result of results) {
      try {
        if (result.price == null || result.mrp == null || !result.medicine?.id) continue;
        const upsert = await upsertPrice(result, client);
        if (upsert.updated) stats.pricesUpdated += 1;
      } catch (err) {
        stats.errors += 1;
        stats.lastError = err.message;
        logger.error(`[${provider.name}] ${result.medicine?.brand_name || 'unknown'} failed: ${err.message}`);
      }
    }

    stats.errors += provider.getErrorLog().length;
    if (stats.errors > 0 && !stats.lastError) {
      stats.lastError = provider.getErrorLog()[0]?.error || null;
    }
  } catch (err) {
    stats.status = 'failed';
    stats.errors += 1;
    stats.lastError = err.message;
    logger.error(`[${provider.name}] provider failed: ${err.message}`);
  }

  stats.durationMs = Date.now() - started;
  await updateProviderStatus(provider.name, stats.status, stats, client);
  logger.log(`[${provider.name}] medicines=${stats.medicinesProcessed} updated=${stats.pricesUpdated} errors=${stats.errors} duration=${stats.durationMs}ms`);
  return stats;
}

async function runScrapers(options = {}) {
  const client = options.db || db;
  const logger = options.logger || console;
  const providers = options.providers || createProviders();

  const locked = await acquireLock(client, options.lockKey || LOCK_KEY);
  if (!locked) {
    logger.log('[scrapers] skipped: another ingestion job is already running');
    return { skipped: true, providers: [] };
  }

  try {
    const medicines = options.medicines || await getMedicines(client);
    const providerStats = [];

    for (const provider of providers) {
      const stats = await runProvider(provider, medicines, client, logger);
      providerStats.push(stats);
    }

    return { skipped: false, providers: providerStats };
  } finally {
    await releaseLock(client, options.lockKey || LOCK_KEY);
  }
}

async function getScraperStatus(client = db) {
  const result = await client.query(`
    SELECT
      provider_name AS name,
      status,
      last_run AS "lastRun",
      medicines_processed AS "medicinesProcessed",
      prices_updated AS "pricesUpdated",
      errors
    FROM scraper_provider_status
    ORDER BY provider_name
  `);
  return result.rows;
}

if (require.main === module) {
  runScrapers()
    .then(summary => {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Scraper run failed:', err);
      process.exit(1);
    });
}

module.exports = {
  LOCK_KEY,
  acquireLock,
  releaseLock,
  createProviders,
  didPriceChange,
  getScraperStatus,
  runProvider,
  runScrapers,
  upsertPrice,
  updateProviderStatus,
};
