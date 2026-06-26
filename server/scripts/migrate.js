#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrationsDir = path.join(__dirname, '../db/migrations');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

async function listMigrationFiles() {
  const entries = await fs.readdir(migrationsDir);
  return entries
    .filter(name => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map(row => row.filename));
}

async function applyMigration(client, filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = await fs.readFile(filePath, 'utf8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`Applied migration: ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    err.message = `Migration ${filename} failed: ${err.message}`;
    throw err;
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureMigrationTable(client);
    const files = await listMigrationFiles();
    const applied = await getAppliedMigrations(client);
    const pending = files.filter(file => !applied.has(file));

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const filename of pending) {
      await applyMigration(client, filename);
    }

    console.log(`Done. Applied ${pending.length} migration${pending.length === 1 ? '' : 's'}.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
