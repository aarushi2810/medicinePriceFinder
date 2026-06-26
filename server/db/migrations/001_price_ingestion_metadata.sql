ALTER TABLE prices
ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE prices
ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) NOT NULL DEFAULT 'Seed';

ALTER TABLE prices
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP;

ALTER TABLE prices
DROP CONSTRAINT IF EXISTS prices_data_source_check;

ALTER TABLE prices
ADD CONSTRAINT prices_data_source_check
CHECK (data_source IN ('NPPA', 'API', 'Partner', 'Seed', 'Manual'));

UPDATE prices
SET data_source = 'Seed'
WHERE data_source IS NULL;

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
