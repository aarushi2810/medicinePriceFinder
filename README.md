# MedPrice — Medicine Price Comparison Platform

Compare medicine prices against official government rates, find generic alternatives, and locate nearby pharmacies — built for the Indian healthcare market.

**Live demo:** [medicine-price-finder.vercel.app](https://medicine-price-finder.vercel.app)
**Backend API:** Deployed on Render

---

## The Problem

Prescription medicine prices in India vary by 30–50% across pharmacy chains for the *exact same drug and dosage*, with no easy way for patients to compare. Meanwhile, the National Pharmaceutical Pricing Authority (NPPA) publishes legal price ceilings for hundreds of drugs — but this data is locked away in unreadable government spreadsheets that almost no patient ever sees.

**MedPrice surfaces this data** in a searchable, comparable, patient-friendly interface.

---

## Features

- **Search by brand or salt name** — type "Crocin" or "Paracetamol", get the same result
- **Price comparison** — see prices across pharmacies, sorted cheapest first, with savings %
- **NPPA breach detection** — flags when a pharmacy charges *above* the government-mandated ceiling price
- **Generic alternative finder** — discover cheaper medicines with the same active ingredient and dosage strength
- **Prescription OCR** — photograph a prescription, Gemini Vision extracts medicine names and dosages automatically
- **AI price explainer** — "Why is this price what it is?" generates a plain-English explanation comparing the price to NPPA ceiling and market average
- **Nearby pharmacy locator** — GPS or pincode-based search using free OpenStreetMap data, with adjustable radius (5/10/20km)
- **Sortable results** — sort by price or discount percentage
- **Live stats** — medicine count, NPPA ceiling prices tracked, and multi-pharmacy coverage pulled directly from the database

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Leaflet + React-Leaflet (maps)
- Vanilla CSS-in-JS (no framework dependency)

**Backend**
- Node.js + Express
- PostgreSQL
- In-memory caching (node-cache, 5-minute TTL)
- Helmet (security headers) + express-rate-limit

**AI / External Services**
- Google Gemini API (prescription OCR + price explanations)
- OpenStreetMap Overpass API (pharmacy locations — free, no API key)
- Nominatim (pincode geocoding — free)

**Deployment**
- Frontend: Vercel
- Backend + DB: Railway

---

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   React UI   │ ───▶ │   Express API     │ ───▶ │  PostgreSQL  │
│  (Vercel)    │      │   (Railway)       │      │  (Railway)   │
└─────────────┘      └──────────────────┘      └──────────────┘
                              │
                              ├──▶ Gemini API (OCR, explanations)
                              └──▶ Overpass API (pharmacy locations, proxied)
```

### Database schema

Six normalized tables:

- `salts` — active ingredients + NPPA ceiling prices
- `medicines` — branded drugs, linked to a salt
- `pharmacies` — online (1mg, Netmeds, PharmEasy) and local
- `prices` — current price per medicine per pharmacy
- `price_history` — daily snapshots for trend tracking
- `watchlist` — user price-drop alerts (schema ready, alerts not yet active)

Indexed on `LOWER(brand_name)` and `LOWER(salt_name)` for fast search.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medicines/search?q=` | Search medicines by brand or salt name |
| GET | `/api/medicines/:id/compare` | Price comparison across pharmacies + NPPA breach flags |
| GET | `/api/medicines/:id/generics` | Generic alternatives with matching salt + dosage |
| GET | `/api/medicines/stats` | Live database statistics |
| GET | `/api/pharmacies/overpass?lat=&lng=&radius=` | Nearby pharmacies (proxied Overpass) |
| POST | `/api/ai/ocr` | Prescription image → extracted medicine list (Gemini) |
| POST | `/api/ai/explain` | Plain-English price explanation (Gemini) |

General routes: 100 requests / 15 min per IP. AI routes: 10 requests / min per IP.

---

## Data Sources

| Source | What it provides | Coverage |
|---|---|---|
| **NPPA government CSVs** | Medicine names, salt compositions, ceiling prices | 840+ medicines, 855 ceiling prices |
| **Manually verified prices** | Real 1mg/Netmeds/PharmEasy prices for common medicines | 50+ medicines with multi-pharmacy comparison |
| **OpenStreetMap** | Pharmacy locations | Varies by region, free & unlimited |

**On data honesty:** the NPPA dataset gives authoritative *regulatory* pricing for ~840 medicines, but it is not the same as live retail inventory. For ~50 of the most commonly prescribed medicines, real multi-pharmacy prices have been manually verified and seeded. The UI clearly distinguishes "Reference price (NPPA)" from "Live comparison available."

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A free Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### Backend

```bash
cd server
npm install
cp .env.example .env
# fill in DATABASE_URL and GEMINI_API_KEY in .env

# Create database
createdb medicine_finder

# Run schema + seed data
psql -d medicine_finder -f db/schema.sql
node scripts/loadNppaData.js
node scripts/quickSeed.js

# Start server
node index.js
```

### Frontend

```bash
cd client
npm install
cp .env.example .env
# set VITE_API_URL=http://localhost:8000

npm run dev
```

Visit `http://localhost:5173`.

---

## Engineering Highlights

- **Caching**: in-memory cache reduces repeated database queries for identical searches within a 5-minute window
- **NPPA breach detection**: joins live pharmacy prices against government ceiling prices in a single query, flagging illegal overcharging in real time
- **Resilient external API calls**: Overpass requests run in parallel across 3 mirror endpoints with `Promise.any` and per-request timeouts — returns as soon as any mirror responds instead of failing on slow/down mirrors
- **AI fallback design**: prescription OCR and price explanations fail gracefully — core search functionality never depends on AI availability
- **Search deduplication**: results are grouped by active ingredient (salt) rather than individual manufacturer SKUs, collapsing dozens of near-duplicate NPPA entries into one clean result per drug

---

## Known Limitations & Roadmap

- Only ~50 medicines currently have verified multi-pharmacy live pricing; the rest show NPPA reference price only
- Search uses `LIKE` matching — no fuzzy search, typo correction, or synonyms yet (planned: PostgreSQL `pg_trgm`)
- Caching is in-process — moving to Redis would enable horizontal scaling
- Watchlist/price-drop email alerts have a schema but no active cron job yet
- No automated tests yet

---

## License

MIT
