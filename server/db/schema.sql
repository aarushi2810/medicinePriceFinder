

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS watchlist     CASCADE;
DROP TABLE IF EXISTS prices        CASCADE;
DROP TABLE IF EXISTS medicines     CASCADE;
DROP TABLE IF EXISTS pharmacies    CASCADE;
DROP TABLE IF EXISTS salts         CASCADE;

CREATE TABLE salts (
  id                 SERIAL PRIMARY KEY,
  salt_name          VARCHAR(200) NOT NULL UNIQUE,
  nppa_ceiling_price NUMERIC(10,2),
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medicines (
  id          SERIAL PRIMARY KEY,
  brand_name  VARCHAR(200) NOT NULL,
  dosage      VARCHAR(100) NOT NULL DEFAULT '',
  form        VARCHAR(50)  NOT NULL DEFAULT 'tablet',
  salt_id     INTEGER NOT NULL REFERENCES salts(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pharmacies (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL UNIQUE,
  type      VARCHAR(20)  NOT NULL CHECK (type IN ('online', 'local')),
  lat       NUMERIC(9,6),
  lng       NUMERIC(9,6),
  address   TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prices (
  id           SERIAL PRIMARY KEY,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id)  ON DELETE CASCADE,
  pharmacy_id  INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  price        NUMERIC(10,2) NOT NULL,
  mrp          NUMERIC(10,2) NOT NULL,
  in_stock     BOOLEAN   DEFAULT true,
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(medicine_id, pharmacy_id)
);

CREATE TABLE price_history (
  id           SERIAL PRIMARY KEY,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id)  ON DELETE CASCADE,
  pharmacy_id  INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  price        NUMERIC(10,2) NOT NULL,
  recorded_on  DATE DEFAULT CURRENT_DATE,
  UNIQUE(medicine_id, pharmacy_id, recorded_on)
);

CREATE TABLE watchlist (
  id           SERIAL PRIMARY KEY,
  user_email   VARCHAR(200) NOT NULL,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  target_price NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email, medicine_id)
);

-- Standard indexes
CREATE INDEX idx_medicines_brand   ON medicines USING btree (LOWER(brand_name));
CREATE INDEX idx_salts_name        ON salts     USING btree (LOWER(salt_name));
CREATE INDEX idx_prices_medicine   ON prices(medicine_id);
CREATE INDEX idx_history_medicine  ON price_history(medicine_id, recorded_on DESC);
CREATE INDEX idx_watchlist_email   ON watchlist(user_email);

-- Trigram indexes for fuzzy search
CREATE INDEX idx_medicines_brand_trgm ON medicines USING gin (brand_name gin_trgm_ops);
CREATE INDEX idx_salts_name_trgm      ON salts     USING gin (salt_name  gin_trgm_ops);