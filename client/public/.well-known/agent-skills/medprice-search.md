# medprice-search.md

This skill enables AI agents to search for medicines, compare prices across Indian pharmacies, and find cheaper generic alternatives.

## How to use MedPrice APIs

AI agents can interact with MedPrice via standard REST endpoints.

### 1. Search Medicines
Search by brand name, generic/salt name, or active ingredient.

- Request: `GET /api/medicines/search?q={query}`
- Response: JSON array of matching medicines with brand details, salt names, and dosage forms.

### 2. Compare Prices
Retrieve side-by-side pharmacy pricing and check for NPPA ceiling breaches.

- Request: `GET /api/medicines/{id}/compare`
- Response: Comparative price data from online pharmacies, stock details, and legal NPPA MRP ceiling verification.

### 3. Get Generic Alternatives
Find cheaper alternative brands containing the identical active ingredient composition.

- Request: `GET /api/medicines/{id}/generics`
- Response: List of equivalent generics, including price per unit and potential savings percentage.
