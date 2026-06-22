<<<<<<< HEAD
# MedPrice 💊
### Smart Medicine Price Comparison for India

> Find the cheapest medicine near you — real prices from 1mg, Netmeds & PharmEasy, NPPA ceiling prices verified.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-medicine--price--finder.vercel.app-brightgreen)](https://medicine-price-finder.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
=======
# MedPrice — Indian Medicine Price & Generic Alternative Finder

MedPrice is a modern medicine price comparison and generic alternative discovery platform built for the Indian healthcare market. It helps patients compare retail drug prices across major online pharmacies, check them against government-mandated price ceilings (DPCO/NPPA), locate nearby physical pharmacies, and find cheaper generic equivalents.

**Live Demo:** [medicine-price-finder.vercel.app](https://medicine-price-finder.vercel.app)  
**Backend API:** Deployed on Railway  
>>>>>>> 5d8f2c4 (removed emojis from ui)

---

## 💡 The Problem

<<<<<<< HEAD
Medicine prices in India vary **30–50% across pharmacy chains** for identical drugs and dosages. A patient buying Calpol 500mg at Netmeds may pay ₹27 while PharmEasy charges ₹24.90 — and both may be charging above the government-regulated NPPA ceiling price of ₹23. No transparent comparison tool existed for consumers to find the cheapest nearby source before purchasing.

---

## What MedPrice Does

MedPrice aggregates medicine pricing data from multiple pharmacy sources, cross-references it against NPPA government ceiling prices, suggests cheaper generic alternatives, and shows nearby pharmacies — all from a single search.
=======
Prescription medicine prices in India vary by 30–150% across pharmacy chains for the *exact same drug and dosage*, with no easy way for patients to compare. Meanwhile, the National Pharmaceutical Pricing Authority (NPPA) publishes legal price ceilings for hundreds of essential drugs — but this data is locked away in unreadable government PDFs/spreadsheets that patients never see.

**MedPrice unlocks this data** by presenting it in a searchable, comparable, and patient-friendly interface.
>>>>>>> 5d8f2c4 (removed emojis from ui)

---

## ✨ Key Features

<<<<<<< HEAD
### 🔍 Smart Medicine Search
Search by brand name, generic/salt name, or active ingredient. Results are ranked by relevance — exact brand matches first, then salt-name matches, with tablets and capsules prioritized over injections and syrups for consumer-intent queries.
=======
1. **Smart Medicine Search & Auto-Ranking**
   - Search by brand name (e.g., *Calpol*) or active ingredient (e.g., *Paracetamol*).
   - Smart ranking prioritizing single-ingredient exact matches at the top, pushing combination drugs (containing multiple active ingredients) to the bottom.

2. **Clean Display & UI badges**
   - Long, ugly parenthetical dosage compositions from raw government data are automatically stripped and title-cased.
   - Clean, lightweight dropdown cards containing only essential information (Name, Clean Salt + Dosage, Price, Availability).
   - Match relevance badges indicating if a result is a `✓ Exact ingredient match` or `Contains [Matched Ingredient]` (e.g., searching *Paracetamol* labels *Flexon* with `Contains Paracetamol` so users understand the connection).

3. **Brand-to-Generic Savings Analyzer**
   - Prominent, high-fidelity **Savings Banner** detailing percentage savings, the cheapest generic brand alternative, and monthly/yearly cost projections.
   - **Generic Alternatives Comparison Card** displaying a side-by-side pricing matrix of all therapeutically equivalent brands with exact rupee savings.

4. **NPPA Regulation Check**
   - Automatically cross-checks retail prices against the legal NPPA maximum retail price (MRP).
   - Flags illegal overcharging ("NPPA breaches") in real-time.

5. **Advanced Nearby Pharmacy Locator**
   - Pincode-first search UX with GPS fallback.
   - Proxies OpenStreetMap Overpass API and Nominatim geocoding on the server.
   - Returns a Leaflet map along with a detailed card list showing pharmacy name, address details, distance in kilometers, opening hours, phone number, and direct Google Maps navigation buttons.

6. **Prescription OCR Scanner**
   - Scan prescription photos using Gemini Vision API to automatically extract medicine names and dosages and search for them instantly.
>>>>>>> 5d8f2c4 (removed emojis from ui)

```
"Crocin" → Crocin 500mg (Paracetamol) · from ₹27.80 · 5 pharmacies
"pa"     → Paracetamol 500mg brands first, not injections or unrelated drugs
```

<<<<<<< HEAD
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

### 📍 Nearby Pharmacy Finder
Real pharmacy locations from **OpenStreetMap** via Overpass API — no Google Maps API key required. Supports:
- GPS auto-detect
- 6-digit pincode search (geocoded via Nominatim)
- Radius selector: 5km / 10km / 20km
- "Get directions" deeplink to Google Maps from each marker popup

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│  Search → Price List → Generic Alt → Map → WhatsApp │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│                  Express.js Backend                  │
│  /medicines/search   → ranked, fuzzy-fallback query  │
│  /medicines/:id/compare → price + NPPA check        │
│  /medicines/:id/generics → salt+form matched alts   │
│  /ai/ocr             → Gemini prescription OCR      │
│  /ai/explain         → price variance explanation   │
│  /location/pharmacies → Overpass API proxy          │
│  /location/geocode   → Nominatim proxy              │
└──────────┬────────────────────┬─────────────────────┘
           │                    │
┌──────────▼──────┐   ┌─────────▼───────┐
│   PostgreSQL    │   │   Gemini 2.5    │
│  + pg_trgm      │   │   Vision API    │
│  extension      │   └─────────────────┘
│                 │
│  medicines      │  → 370+ medicines
│  salts          │  → salt-to-medicine mapping
│  pharmacies     │  → 4 sources (1mg, Netmeds,
│  prices         │    PharmEasy, Apollo)
│  price_history  │  → daily snapshots at 2am
│  watchlist      │  → future price alerts
└─────────────────┘
```

### Key Design Decisions

**Why PostgreSQL over NoSQL?** Price data is relational by nature — medicines map to salts, prices join to pharmacies, NPPA data joins to salts. ACID guarantees matter when surfacing government-regulated price data. `pg_trgm` extension adds fuzzy text search with no additional service.

**Why a monolith over microservices?** At this scale (370 medicines, 4 pharmacy sources), microservices would add network latency, distributed tracing overhead, and deployment complexity with no benefit. The architecture is structured so each concern (search, compare, generics, AI, location) is modular within the Express router — extractable to microservices when traffic justifies it.

**Why OpenStreetMap over Google Maps?** No API key, no billing surprises, no per-request cost. OSM Overpass returns real Indian pharmacy locations with name, phone, opening hours, and coordinates — sufficient for the use case. Directions deeplink to Google Maps works without the Maps API.

**Append-only price history:** `price_history` is never updated, only inserted. Each daily cron snapshot adds new rows. This gives a full price trend history at zero extra cost, enables future "price drop alerts," and means no UPDATE conflicts under concurrent scraping.

---

## Database Schema

```sql
salts          (id, salt_name, nppa_ceiling_price)
medicines      (id, salt_id→salts, brand_name, dosage, form)
pharmacies     (id, name, type)          -- 'online' | 'local'
prices         (id, medicine_id, pharmacy_id, price, mrp, in_stock, updated_at)
price_history  (id, medicine_id, pharmacy_id, price, recorded_on)  -- append-only
watchlist      (id, user_id, medicine_id, target_price)            -- future
```

Indexes:
- `medicines.brand_name` — `gin_trgm_ops` for fuzzy search
- `salts.salt_name` — `gin_trgm_ops` for fuzzy search  
- `prices(medicine_id)` — for O(1) price lookup per medicine

---

## Performance & Scalability

| Metric | Value |
|--------|-------|
| Search query time | ~12ms (with pg_trgm index) |
| Price compare query | ~8ms (indexed join) |
| Fuzzy search fallback | ~25ms (trigram similarity scan) |
| Overpass pharmacy fetch | ~4–7s (external API, parallel mirrors) |
| Express rate limit | 100 req / 15 min per IP |
| AI route rate limit | 10 req / min (cost control) |

**How this scales:**
- PostgreSQL read replicas → handle 10× read traffic with zero code change (95% of requests are reads)
- Redis caching layer → already stubbed via `cacheMiddleware`, TTL configurable per route
- Overpass queries → proxied through backend, parallel mirror fallback, 7s timeout
- AI costs → rate-limited to 10 req/min; fallback explanation generated locally if Gemini fails

---

## Platform Statistics

- **370+** medicines in database
- **900+** NPPA government ceiling prices
- **500+** pharmacy price records
- **4** pharmacy sources (1mg, Netmeds, PharmEasy, Apollo)
- **Up to 46%** savings identified through generic alternatives
- **30–50%** typical price variation across pharmacy chains

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Gemini API key (for OCR and price explanation)

### Installation
=======
## 🛠️ Technology Stack

* **Frontend**: React (Vite), React Router v7, Leaflet (Maps), CSS-in-JS.
* **Backend**: Node.js, Express, PostgreSQL, In-memory Node Cache (5-min TTL).
* **AI & External APIs**: Google Gemini API (OCR + AI Price Explainer), OpenStreetMap Overpass API (mirroring across 3 endpoints with parallel requests & timeouts), Nominatim Geocoding.
* **Deployment**: Frontend on Vercel, Backend & Database on Railway.

---

## 📊 Live Database Statistics
* **Tracked Medicines**: 730+
* **Govt. Ceiling Prices (DPCO regulated)**: 970+
* **Medicines with Active Pharmacy Comparison**: 160+
* **Seeded Pharmacy Price Points**: 560+

---

## ⚙️ Local Development Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL (v14+)
* A free Gemini API key from [Google AI Studio](https://aistudio.google.com)
>>>>>>> 5d8f2c4 (removed emojis from ui)

### 1. Database Setup
Create a local PostgreSQL database:
```bash
<<<<<<< HEAD
# Clone repository
git clone https://github.com/aarushi2810/medicinePriceFinder.git
cd medicinePriceFinder

# Backend
cd server
npm install
cp .env.example .env   # fill in your credentials
npm run dev            # starts on :8000

# Frontend (new terminal)
cd client
npm install
npm run dev            # starts on :5173
```

### Environment Variables

```env
# server/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medicine_finder
DB_USER=postgres
DB_PASSWORD=your_password

GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
PORT=8000
```

```env
# client/.env
VITE_API_URL=http://localhost:8000
```

### Database Setup

```bash
# From server directory
psql -U postgres -d medicine_finder -f db/schema.sql
psql -U postgres -d medicine_finder -f db/seed.sql

# Enable fuzzy search (required for OCR mis-read fallback)
psql -U postgres -d medicine_finder -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
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
6. Find nearby pharmacy via GPS or pincode
        ↓
7. Get directions + Share via WhatsApp
```

---

## Roadmap

- [ ] Price trend charts (7-day / 30-day history)
- [ ] Price drop email alerts via watchlist
- [ ] Availability-aware pharmacy search
- [ ] Personalized recommendations based on search history
- [ ] Mobile app (React Native)
- [ ] Live scraping pipeline for 1mg / PharmEasy / Netmeds prices

---

## Project Structure

```
medicinePriceFinder/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NearbyMap.jsx          # Leaflet + OSM pharmacy finder
│   │   │   ├── PrescriptionOCR.jsx    # Gemini Vision OCR upload
│   │   │   └── ExplainPrice.jsx       # AI price explanation
│   │   ├── pages/
│   │   │   ├── Search.jsx             # Homepage + search + OCR
│   │   │   └── Results.jsx            # Price compare + generics + map
│   │   ├── utils/
│   │   │   └── medicineNames.js       # Clean NPPA brand name extraction
│   │   └── api/
│   │       └── index.js               # Axios API client
│   └── package.json
│
└── server/
    ├── routes/
    │   ├── medicines.js               # Search, compare, generics, stats
    │   ├── ai.js                      # OCR + price explanation (Gemini)
    │   └── location.js                # Overpass + Nominatim proxy
    ├── middleware/
    │   └── cache.js                   # Response caching layer
    ├── db/
    │   ├── pool.js                    # pg connection pool
    │   ├── schema.sql                 # Table definitions + indexes
    │   └── seed.sql                   # NPPA data seed
    └── index.js                       # Express app, cron, middleware
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
=======
createdb medicine_finder
```

### 2. Backend Server Setup
1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in:
   ```env
   DATABASE_URL=postgresql://localhost:5432/medicine_finder
   PORT=8000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Initialize schema and seed the database:
   ```bash
   psql -d medicine_finder -f db/schema.sql
   node scripts/loadNppaData.js
   node scripts/addBatch38.js
   node scripts/quickSeed.js
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Client Setup
1. Open a new terminal tab, navigate to the client folder, and install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🚀 Deployment Guide

### Backend & Database (Railway)
1. Deploy a hosted PostgreSQL instance on Railway.
2. Connect your GitHub repository and link the `server` directory as your web service root.
3. Configure the variables:
   * `PORT`: `8000`
   * `GEMINI_API_KEY`: `your_key`
   * `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (automatic link)
4. Run `db/schema.sql` against the production database.
5. Populate the production database by temporarily pointing your local `DATABASE_URL` to Railway's external link and running the seed scripts.
6. Generate a public domain link on Railway (e.g. `https://medicine-price-finder-production.up.railway.app`).

### Frontend (Vercel)
1. Import your GitHub repository in Vercel.
2. Set the root directory to `client`.
3. Add the environment variable:
   * `VITE_API_URL`: `https://your-railway-backend-domain.up.railway.app`
4. Deploy the project. Vercel will build the React assets and launch the app.
>>>>>>> 5d8f2c4 (removed emojis from ui)
