# Pharmacy Price Ingestion

MedPrice does not scrape 1mg, PharmEasy, or Netmeds public websites. Public
website scraping can violate Terms of Service or robots.txt, and undocumented
consumer endpoints are not treated as production data sources.

Each provider extends `BaseScraper` and supports two compliant modes:

- Official/partner API mode: configure `<PROVIDER>_API_BASE_URL` and
  `<PROVIDER>_API_KEY`. The provider calls documented partner endpoints.
- Mock mode: set `ENABLE_MOCK_PRICE_PROVIDERS=true` for local development or
  tests. Mock URLs use `mock://` and must not be presented as live pharmacy
  data in production.

Production TODOs:

- Add official partner API credentials for each pharmacy source.
- Confirm response schemas and update `normalizeOfficialPrice` if partner
  payloads differ.
- Keep `RUN_SCRAPER_CRON=true` enabled only for one worker process, or rely on
  the PostgreSQL advisory lock in `runAll.js`.
