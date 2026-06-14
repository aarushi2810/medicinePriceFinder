// ─── OneMilligramScraper.js ──────────────────────────────────────────────────
// Scraper stub for 1mg (Tata 1mg) — requires ToS compliance before implementation
// ─────────────────────────────────────────────────────────────────────────────

const BaseScraper = require('./BaseScraper');

class OneMilligramScraper extends BaseScraper {
  constructor(options = {}) {
    super('1mg', 'https://www.1mg.com', options);
  }

  async searchMedicine(query) {
    console.log(`[${this.name}] searchMedicine('${query}') — Not implemented, requires ToS compliance`);
    return [];

    // ── Example of what this WOULD look like ─────────────────────────────
    // const url = `${this.baseUrl}/pwa-api/api/v4/search/autocomplete?name=${encodeURIComponent(query)}`;
    // const data = await this.fetchPage(url);
    // return (data.data?.results || []).map(r => ({
    //   id:    r.slug,
    //   name:  r.name,
    //   price: r.price,
    //   mrp:   r.mrp,
    // }));
  }

  async getMedicinePrice(medicineId) {
    console.log(`[${this.name}] getMedicinePrice('${medicineId}') — Not implemented, requires ToS compliance`);
    return { price: null, mrp: null, inStock: false };

    // ── Example of what this WOULD look like ─────────────────────────────
    // const url = `${this.baseUrl}/pwa-api/api/v4/productpage/details/${medicineId}`;
    // const data = await this.fetchPage(url);
    // const product = data.data;
    // return {
    //   price:   product.price,
    //   mrp:     product.mrp,
    //   inStock: product.available,
    // };
  }
}

module.exports = OneMilligramScraper;
