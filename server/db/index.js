const { Pool } = require('pg');
require('dotenv').config();

console.log('DATABASE_URL =', process.env.DATABASE_URL?.slice(0, 50));

console.log('DB_HOST =', process.env.DB_HOST);

console.log('DB_NAME =', process.env.DB_NAME);

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

if (process.env.NODE_ENV !== 'test') {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('DB connection failed:', err.message);
      process.exit(1);
    }

    console.log('PostgreSQL connected');
    release();
  });
}

module.exports = pool;
