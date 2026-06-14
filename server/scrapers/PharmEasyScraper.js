// ─── PharmEasyScraper.js ─────────────────────────────────────────────────────
// Scraper stub for PharmEasy — requires ToS compliance before implementation
// ─────────────────────────────────────────────────────────────────────────────

const BaseScraper = require('./BaseScraper');

class PharmEasyScraper extends BaseScraper {
  constructor(options = {}) {
    super('PharmEasy', 'https://pharmeasy.in', options);
  }

  async searchMedicine(query) {
    console.log(`[${this.name}] searchMedicine('${query}') — Not implemented, requires ToS compliance`);
    return [];

    // ── Example of what this WOULD look like ─────────────────────────────
    // const url = `${this.baseUrl}/api/search/search?query=${encodeURIComponent(query)}`;
    // const data = await this.fetchPage(url);
    // return (data.data?.products || []).map(p => ({
    //   id:    p.slug,
    //   name:  p.name,
    //   price: p.salePriceDecimal,
    //   mrp:   p.maximumRetailPrice,
    // }));
  }

  async getMedicinePrice(medicineId) {
    console.log(`[${this.name}] getMedicinePrice('${medicineId}') — Not implemented, requires ToS compliance`);
    return { price: null, mrp: null, inStock: false };

    // ── Example of what this WOULD look like ─────────────────────────────
    // const url = `${this.baseUrl}/api/otc/${medicineId}`;
    // const data = await this.fetchPage(url);
    // const product = data.data;
    // return {
    //   price:   product.salePriceDecimal,
    //   mrp:     product.maximumRetailPrice,
    //   inStock: product.isInStock,
    // };
  }
}

module.exports = PharmEasyScraper;
