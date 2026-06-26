# MedPrice 💊
### Smart Medicine Price Comparison for India

> Find the cheapest medicine near you — real prices from 1mg, Netmeds & PharmEasy, NPPA ceiling prices verified.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-medicine--price--finder.vercel.app-brightgreen)](https://medicine-price-finder.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 💡 The Problem

Medicine prices in India vary **30–50% across pharmacy chains** for identical drugs and dosages. A patient buying Calpol 500mg at Netmeds may pay ₹27 while PharmEasy charges ₹24.90 — and both may be charging above the government-regulated NPPA ceiling price of ₹23. No transparent comparison tool existed for consumers to find the cheapest nearby source before purchasing.

---

## What MedPrice Does

MedPrice aggregates medicine pricing data from multiple pharmacy sources, cross-references it against NPPA government ceiling prices, suggests cheaper generic alternatives, shows nearby pharmacies, generates savings reports, and supports prescription scanning — all from a single search.

---

## ✨ Key Features

### 🔍 Smart Medicine Search
Search by brand name, generic/salt name, or active ingredient. Results are ranked by relevance — exact brand matches first, then salt-name matches, with tablets and capsules prioritized over injections and syrups for consumer-intent queries.

```
"Crocin" → Crocin 500mg (Paracetamol) · from ₹27.80 · 5 pharmacies
"pa"     → Paracetamol 500mg brands first, not injections or unrelated drugs
```

### 💰 Multi-Pharmacy Price Comparison
Side-by-side prices from 1mg, Netmeds, PharmEasy, and Apollo. Results sorted cheapest first with:
- Savings % vs MRP
- "₹X more than cheapest" indicator on each non-cheapest option
- Stale price warnings when data is older than 6 hours
- Out-of-stock items pushed to bottom regardless of sort mode

### 🏛️ NPPA Government Price Verification
Integrated with NPPA (National Pharmaceutical Pricing Authority) dataset covering **900+ ceiling prices**. For each medicine:
- Government-set maximum retail price shown as reference
- Overpricing alert when any pharmacy exceeds the ceiling
- Count of pharmacies in violation (e.g. "3/3 pharmacies above NPPA ceiling")
- Direct link to report at nppaindia.nic.in

### 💡 Generic Alternative Recommendations
Matches medicines by **salt composition and dosage form** to find cheaper equivalents. Dosage form filtering prevents clinically inappropriate suggestions (a Paracetamol injection is not shown as an alternative to a tablet).

| Medicine | Price | Savings |
|----------|-------|---------|
| Augmentin 625mg | ₹160 | — |
| Mox 500mg | ₹86 | ₹74 (46%) |

### 📸 AI Prescription Scanner
Upload a prescription photo — Gemini Vision extracts medicine names and auto-searches each one. Handles handwritten prescriptions, multi-medicine prescriptions, and common OCR misreads (e.g. "Belledonna" → suggests "Belladonna"). Results shown as tappable chips for quick sequential searching.

### 📊 Medicine Savings Report
Generate a prescription-level savings report across pharmacies:
- Multiple medicines supported per report
- Total cost calculated per pharmacy
- Cheapest pharmacy identified overall
- Generic savings shown per medicine
- NPPA compliance included
- PDF download with formatted tables

### 📍 Nearby Pharmacy Finder
Real pharmacy locations from **OpenStreetMap** via Overpass API — no Google Maps API key required. Supports:
- GPS auto-detect
- 6-digit pincode search (geocoded via Nominatim)
- Radius selector: 5km / 10km / 20km
- "Get directions" deeplink to Google Maps from each marker popup

### 🤖 Automated Scraper Pipeline
Price data is kept up-to-date via a scraper pipeline supporting:
- PharmEasy, 1mg, and Netmeds scrapers
- PostgreSQL advisory lock to prevent concurrent runs
- Provider status tracking (`scraper_provider_status` table)
- Configurable daily cron job (2:00 AM IST)
- Price history snapshots for future trend analysis

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│  Search → Price List → Generic Alt → Map → Report   │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│                  Express.js Backend                  │
│  /medicines/search   → ranked, fuzzy-fallback query  │
│  /medicines/:id/compare → price + NPPA check        │
│  /medicines/:id/generics → salt+form matched alts   │
│  /report             → savings report generation    │
│  /admin/scraper-status → provider health            │
│  /ai/ocr             → Gemini prescription OCR      │
│  /ai/explain         → price variance explanation   │
└──────────┬────────────────────┬─────────────────────┘
           │                    │
┌──────────▼──────┐   ┌─────────▼───────┐
│   PostgreSQL    │   │   Gemini 2.5    │
│  + pg_trgm      │   │   Vision API    │
│  extension      │   └─────────────────┘
│                 │
│  medicines      │  → 730+ medicines
│  salts          │  → salt-to-medicine mapping
│  pharmacies     │  → 4+ sources
│  prices         │  → live price data
│  price_history  │  → daily snapshots
│  watchlist      │  → future price alerts
│  scraper_       │  → provider health
│  provider_status│
│  schema_        │  → migration tracking
│  migrations     │
└─────────────────┘
```

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite), React Router v7, Leaflet (Maps), Lucide Icons, CSS
* **Backend**: Node.js, Express 5, PostgreSQL, In-memory Node Cache (5-min TTL)
* **AI & External APIs**: Google Gemini API (OCR + AI Price Explainer), OpenStreetMap Overpass API, Nominatim Geocoding
* **Scraping**: Playwright, Puppeteer with stealth plugins
* **Deployment**: Frontend on Vercel, Backend & Database on Render

---

## Database Schema

```sql
salts                   (id, salt_name, nppa_ceiling_price)
medicines               (id, salt_id→salts, brand_name, dosage, form)
pharmacies              (id, name, type, lat, lng, address)
prices                  (id, medicine_id, pharmacy_id, price, mrp, in_stock, updated_at,
                         source_url, data_source, last_verified_at)
price_history           (id, medicine_id, pharmacy_id, price, recorded_on)  -- append-only
watchlist               (id, user_email, medicine_id, target_price)
scraper_provider_status (provider_name PK, status, last_run, medicines_processed, ...)
schema_migrations       (filename PK, applied_at)
```

Indexes:
- `medicines.brand_name` — `gin_trgm_ops` for fuzzy search
- `salts.salt_name` — `gin_trgm_ops` for fuzzy search
- `prices(medicine_id)` — for O(1) price lookup per medicine

---

## 📊 Platform Statistics

- **730+** medicines in database
- **970+** NPPA government ceiling prices
- **560+** pharmacy price records
- **4+** pharmacy sources (1mg, Netmeds, PharmEasy, Apollo)
- **Up to 46%** savings identified through generic alternatives

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Gemini API key (for OCR and price explanation)

### 1. Database Setup
```bash
createdb medicine_finder
```

### 2. Backend Server Setup
```bash
cd server
npm install
cp .env.example .env   # fill in your credentials
```

Open `.env` and configure:
```env
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medicine_finder
DB_USER=postgres
DB_PASSWORD=your_password
GEMINI_API_KEY=your_gemini_api_key
```

Initialize the database and start:
```bash
npm run migrate         # run database migrations (runs automatically on startup too)
npm run seed            # seed NPPA data and pharmacy prices
npm run scrape          # run the scraper pipeline
npm start               # starts on :8000
```

### 3. Frontend Client Setup
```bash
cd client
npm install
cp .env.example .env
```

Open `.env` and set:
```env
VITE_API_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev             # starts on :5173
```

---

## 🚀 Deployment Guide

### Backend & Database (Render)
1. Provision a PostgreSQL Database on Render.
2. Deploy a web service on Render, linking your GitHub repository and setting the **Root Directory** to `server`.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Configure environment variables in Render:
   * `PORT`: `8000`
   * `DATABASE_URL`: `your_render_postgresql_connection_string`
   * `GEMINI_API_KEY`: `your_gemini_api_key`
   * `RUN_SCRAPER_CRON`: `true` (optional, for scheduled runs)
5. Save and deploy. Database migrations run automatically on server start.
6. Seed the production database using Render Shell or locally via connection string (e.g. `DATABASE_URL=... npm run seed`).

### Frontend (Vercel)
1. Import your GitHub repository in Vercel.
2. Set the **Root Directory** to `client`.
3. Configure the environment variable:
   * `VITE_API_URL`: `https://medicinepricefinder.onrender.com`
4. Deploy the project. The build configuration in [vercel.json](file:///Users/aarushi/Desktop/medicine-price-finder/vercel.json) will automatically handle route rewrites to `index.html` to support React Router SPA paths (e.g., `/report`).

---

## Project Structure

```
medicine-price-finder/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx       # React error boundary
│   │   │   ├── PrescriptionOCR.jsx     # Gemini Vision OCR upload
│   │   │   ├── ExplainPrice.jsx        # AI price explanation
│   │   │   ├── GenericSavingsCard.jsx   # Generic alternatives card
│   │   │   ├── SavingsBanner.jsx        # Savings display banner
│   │   │   └── report/
│   │   │       ├── DownloadReportButton.jsx
│   │   │       ├── MedicineSavingsTable.jsx
│   │   │       ├── NPPASection.jsx
│   │   │       ├── PharmacyComparison.jsx
│   │   │       ├── SavingsChart.jsx
│   │   │       └── SavingsSummary.jsx
│   │   ├── pages/
│   │   │   ├── Search.jsx              # Homepage + search + OCR
│   │   │   ├── Results.jsx             # Price compare + generics + map
│   │   │   └── Report.jsx              # Savings report page
│   │   ├── utils/
│   │   │   └── reportPdf.js            # Client-side PDF generation
│   │   └── api/
│   │       └── index.js                # API client
│   ├── vercel.json                     # Vercel routing configs (client root)
│   └── package.json
│
├── vercel.json                         # Vercel routing configs (monorepo root)
└── server/
    ├── routes/
    │   ├── medicines.js                # Search, compare, generics, stats
    │   ├── pharmacies.js               # Nearby pharmacy search
    │   ├── ai.js                       # OCR + price explanation (Gemini)
    │   ├── admin.js                    # Scraper status admin endpoint
    │   └── report.js                   # Savings report generation
    ├── services/
    │   ├── medicineCompareService.js    # Comparison + generic logic
    │   ├── reportService.js            # Multi-medicine savings report
    │   └── reportService.test.js       # Report unit tests
    ├── scrapers/
    │   ├── BaseScraper.js              # Shared scraper base class
    │   ├── PharmEasyScraper.js         # PharmEasy provider
    │   ├── OneMilligramScraper.js      # 1mg provider
    │   ├── NetmedsScraper.js           # Netmeds provider
    │   ├── runAll.js                   # Orchestrator + DB upsert
    │   ├── runAll.test.js              # Scraper unit tests
    │   └── cron.js                     # Daily cron scheduler
    ├── scripts/
    │   ├── migrate.js                  # Database migration runner
    │   ├── quickSeed.js                # Pharmacy price seeding
    │   └── loadNppaData.js             # NPPA ceiling price loader
    ├── middleware/
    │   └── cache.js                    # Response caching layer
    ├── db/
    │   ├── index.js                    # pg connection pool
    │   ├── schema.sql                  # Reference schema
    │   ├── seed.sql                    # NPPA data seed
    │   └── migrations/
    │       ├── 000_initial_schema.sql
    │       └── 001_price_ingestion_metadata.sql
    └── index.js                        # Express app entry point
```

---

## User Flow

```
1. Search medicine (brand / generic / salt name)
        ↓
2. View price comparison across pharmacies
        ↓
3. Check NPPA ceiling — see if any pharmacy is overcharging
        ↓
4. Discover generic alternatives (same salt, lower price)
        ↓
5. Calculate savings vs current choice
        ↓
6. Generate savings report across prescription
        ↓
7. Download PDF report
        ↓
8. Find nearby pharmacy via GPS or pincode
```

---

## License

MIT — see [LICENSE](LICENSE)

---

## Author

**Aarushi Garg**
Built to improve healthcare affordability through transparent medicine pricing and intelligent generic recommendations.

[![GitHub](https://img.shields.io/badge/GitHub-aarushi2810-black?logo=github)](https://github.com/aarushi2810)

---

*MedPrice is an independent project. Medicine prices and NPPA data are for informational purposes. Always consult a licensed pharmacist or physician before making medication decisions.*
