process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  acquireLock,
  didPriceChange,
  runScrapers,
  upsertPrice,
} = require('./runAll');
const { DAILY_2AM_IST, startScraperCron } = require('./cron');

function createFakeDb(handler) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      return handler(sql, params, calls);
    },
  };
}

function createLogger() {
  return {
    logs: [],
    errors: [],
    log(message) {
      this.logs.push(message);
    },
    error(message) {
      this.errors.push(message);
    },
  };
}

test('didPriceChange detects unchanged and changed rows', () => {
  assert.equal(didPriceChange(
    { price: '10.00', mrp: '12.00', in_stock: true, source_url: 'mock://a' },
    { price: 10, mrp: 12, inStock: true, url: 'mock://a' }
  ), false);

  assert.equal(didPriceChange(
    { price: '10.00', mrp: '12.00', in_stock: true, source_url: 'mock://a' },
    { price: 11, mrp: 12, inStock: true, url: 'mock://a' }
  ), true);
});

test('upsertPrice skips unchanged prices', async () => {
  const db = createFakeDb(sql => {
    if (sql.includes('FROM pharmacies')) return { rows: [{ id: 7 }] };
    if (sql.includes('FROM prices')) {
      return { rows: [{ price: '10.00', mrp: '12.00', in_stock: true, source_url: 'mock://same' }] };
    }
    if (sql.includes('UPDATE prices')) return { rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  });

  const result = await upsertPrice({
    medicine: { id: 1 },
    pharmacy: '1mg',
    price: 10,
    mrp: 12,
    inStock: true,
    url: 'mock://same',
  }, db);

  assert.equal(result.updated, false);
  assert.equal(db.calls.some(call => call.sql.includes('INSERT INTO price_history')), false);
});

test('upsertPrice updates changed prices and writes price_history', async () => {
  const db = createFakeDb(sql => {
    if (sql.includes('FROM pharmacies')) return { rows: [{ id: 7 }] };
    if (sql.includes('FROM prices')) {
      return { rows: [{ price: '10.00', mrp: '12.00', in_stock: true, source_url: 'mock://old' }] };
    }
    if (sql.includes('INSERT INTO prices')) return { rows: [] };
    if (sql.includes('INSERT INTO price_history')) return { rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  });

  const result = await upsertPrice({
    medicine: { id: 1 },
    pharmacy: '1mg',
    price: 11,
    mrp: 12,
    inStock: true,
    url: 'mock://new',
  }, db);

  assert.equal(result.updated, true);
  assert.equal(db.calls.some(call => call.sql.includes('INSERT INTO prices')), true);
  assert.equal(db.calls.some(call => call.sql.includes('INSERT INTO price_history')), true);
});

test('runScrapers skips duplicate jobs when advisory lock is held', async () => {
  let providerCalled = false;
  const db = createFakeDb(sql => {
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{ locked: false }] };
    throw new Error(`unexpected query: ${sql}`);
  });

  const summary = await runScrapers({
    db,
    logger: createLogger(),
    providers: [{ name: 'Test', run: async () => { providerCalled = true; } }],
  });

  assert.equal(summary.skipped, true);
  assert.equal(providerCalled, false);
});

test('runScrapers continues when one provider fails', async () => {
  const db = createFakeDb(sql => {
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{ locked: true }] };
    if (sql.includes('pg_advisory_unlock')) return { rows: [{ pg_advisory_unlock: true }] };
    if (sql.includes('INSERT INTO scraper_provider_status')) return { rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  });

  const summary = await runScrapers({
    db,
    logger: createLogger(),
    medicines: [{ id: 1, brand_name: 'Crocin' }],
    providers: [
      {
        name: 'Failing',
        run: async () => { throw new Error('provider down'); },
        getErrorLog: () => [],
      },
      {
        name: 'Passing',
        run: async () => [],
        getErrorLog: () => [],
      },
    ],
  });

  assert.equal(summary.skipped, false);
  assert.equal(summary.providers.length, 2);
  assert.equal(summary.providers[0].status, 'failed');
  assert.equal(summary.providers[1].status, 'success');
});

test('runScrapers marks unconfigured providers without scraping', async () => {
  let providerCalled = false;
  const db = createFakeDb(sql => {
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{ locked: true }] };
    if (sql.includes('pg_advisory_unlock')) return { rows: [{ pg_advisory_unlock: true }] };
    if (sql.includes('INSERT INTO scraper_provider_status')) return { rows: [] };
    throw new Error(`unexpected query: ${sql}`);
  });

  const summary = await runScrapers({
    db,
    logger: createLogger(),
    medicines: [{ id: 1, brand_name: 'Crocin' }],
    providers: [{
      name: 'Unconfigured',
      isConfigured: () => false,
      run: async () => { providerCalled = true; return []; },
      getErrorLog: () => [],
    }],
  });

  assert.equal(summary.providers[0].status, 'not_configured');
  assert.equal(providerCalled, false);
});

test('runScrapers never executes schema DDL', async () => {
  const db = createFakeDb(sql => {
    if (/\b(ALTER|CREATE|DROP)\b/i.test(sql)) {
      throw new Error(`DDL is not allowed in scraper runtime: ${sql}`);
    }
    if (sql.includes('pg_try_advisory_lock')) return { rows: [{ locked: true }] };
    if (sql.includes('pg_advisory_unlock')) return { rows: [{ pg_advisory_unlock: true }] };
    if (sql.includes('INSERT INTO scraper_provider_status')) return { rows: [] };
    return { rows: [] };
  });

  await runScrapers({
    db,
    logger: createLogger(),
    medicines: [],
    providers: [{
      name: 'Noop',
      isConfigured: () => true,
      run: async () => [],
      getErrorLog: () => [],
    }],
  });
});

test('acquireLock reads PostgreSQL advisory lock result', async () => {
  const db = createFakeDb(() => ({ rows: [{ locked: true }] }));
  assert.equal(await acquireLock(db, 123), true);
});

test('cron schedules daily at 2 AM Asia/Kolkata', () => {
  const task = startScraperCron({ logger: createLogger() });
  assert.equal(DAILY_2AM_IST, '0 2 * * *');
  assert.equal(typeof task.stop, 'function');
  task.stop();
});
