CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS salts (
  id                 SERIAL PRIMARY KEY,
  salt_name          VARCHAR(200) NOT NULL UNIQUE,
  nppa_ceiling_price NUMERIC(10,2),
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicines (
  id          SERIAL PRIMARY KEY,
  brand_name  VARCHAR(200) NOT NULL,
  dosage      VARCHAR(100) NOT NULL DEFAULT '',
  form        VARCHAR(50)  NOT NULL DEFAULT 'tablet',
  salt_id     INTEGER NOT NULL REFERENCES salts(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  type       VARCHAR(20)  NOT NULL CHECK (type IN ('online', 'local')),
  lat        NUMERIC(9,6),
  lng        NUMERIC(9,6),
  address    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prices (
  id               SERIAL PRIMARY KEY,
  medicine_id      INTEGER NOT NULL REFERENCES medicines(id)  ON DELETE CASCADE,
  pharmacy_id      INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  price            NUMERIC(10,2) NOT NULL,
  mrp              NUMERIC(10,2) NOT NULL,
  in_stock         BOOLEAN DEFAULT true,
  updated_at       TIMESTAMP DEFAULT NOW(),
  source_url       TEXT,
  data_source      VARCHAR(20) NOT NULL DEFAULT 'Seed'
    CHECK (data_source IN ('NPPA', 'API', 'Partner', 'Seed', 'Manual')),
  last_verified_at TIMESTAMP,
  UNIQUE(medicine_id, pharmacy_id)
);

CREATE TABLE IF NOT EXISTS price_history (
  id           SERIAL PRIMARY KEY,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id)  ON DELETE CASCADE,
  pharmacy_id  INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  price        NUMERIC(10,2) NOT NULL,
  recorded_on  DATE DEFAULT CURRENT_DATE,
  UNIQUE(medicine_id, pharmacy_id, recorded_on)
);

CREATE TABLE IF NOT EXISTS watchlist (
  id           SERIAL PRIMARY KEY,
  user_email   VARCHAR(200) NOT NULL,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  target_price NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email, medicine_id)
);

CREATE TABLE IF NOT EXISTS scraper_provider_status (
  provider_name VARCHAR(100) PRIMARY KEY,
  status VARCHAR(30) NOT NULL DEFAULT 'never_run',
  last_successful_scrape TIMESTAMP,
  last_failed_scrape TIMESTAMP,
  last_error TEXT,
  last_run TIMESTAMP,
  medicines_processed INTEGER NOT NULL DEFAULT 0,
  prices_updated INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_brand ON medicines USING btree (LOWER(brand_name));
CREATE INDEX IF NOT EXISTS idx_salts_name ON salts USING btree (LOWER(salt_name));
CREATE INDEX IF NOT EXISTS idx_prices_medicine ON prices(medicine_id);
CREATE INDEX IF NOT EXISTS idx_history_medicine ON price_history(medicine_id, recorded_on DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_email ON watchlist(user_email);
CREATE INDEX IF NOT EXISTS idx_medicines_brand_trgm ON medicines USING gin (brand_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_salts_name_trgm ON salts USING gin (salt_name gin_trgm_ops);
