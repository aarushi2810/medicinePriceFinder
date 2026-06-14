// ─── NetmedsScraper.js ───────────────────────────────────────────────────────
// Scraper stub for Netmeds — requires ToS compliance before implementation
// ─────────────────────────────────────────────────────────────────────────────

const BaseScraper = require('./BaseScraper');

class NetmedsScraper extends BaseScraper {
  constructor(options = {}) {
    super('Netmeds', 'https://www.netmeds.com', options);
  }

  async searchMedicine(query) {
    console.log(`[${this.name}] searchMedicine('${query}') — Not implemented, requires ToS compliance`);
    return [];

    // ── Example of what this WOULD look like ─────────────────────────────
    // const url = `${this.baseUrl}/catalogsearch/result?q=${encodeURIComponent(query)}`;
    // const html = await this.fetchPage(url);
    // // Parse HTML for product cards — would use cheerio or similar
    // // return products.map(p => ({
    // //   id:    p.productId,
    // //   name:  p.productName,
    // //   price: p.finalPrice,
    // //   mrp:   p.mrp,
    // // }));
    // return [];
  }

  async getMedicinePrice(medicineId) {
    console.log(`[${this.name}] getMedicinePrice('${medicineId}') — Not implemented, requires ToS compliance`);
    return { price: null, mrp: null, inStock: false };

    // ── Example of what this WOULD look like ─────────────────────────────
    // const url = `${this.baseUrl}/api/v1/product/${medicineId}`;
    // const data = await this.fetchPage(url);
    // return {
    //   price:   data.final_price,
    //   mrp:     data.mrp,
    //   inStock: data.is_available,
    // };
  }
}

module.exports = NetmedsScraper;
