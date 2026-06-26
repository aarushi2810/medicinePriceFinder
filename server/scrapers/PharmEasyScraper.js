const BaseScraper = require('./BaseScraper');

const MOCK_CATALOG = {
  crocin: { price: 27.80, mrp: 32.00, url: 'mock://pharmeasy/crocin' },
  dolo: { price: 22.80, mrp: 28.00, url: 'mock://pharmeasy/dolo' },
  calpol: { price: 24.90, mrp: 30.00, url: 'mock://pharmeasy/calpol' },
};

class PharmEasyScraper extends BaseScraper {
  constructor(options = {}) {
    const officialApiBaseUrl = options.officialApiBaseUrl || process.env.PHARMEASY_API_BASE_URL;
    const enableMock = options.enableMock ?? process.env.ENABLE_MOCK_PRICE_PROVIDERS === 'true';
    super('PharmEasy', 'https://pharmeasy.in', {
      officialApiBaseUrl,
      apiKey: options.apiKey || process.env.PHARMEASY_API_KEY,
      dataSource: options.dataSource || process.env.PHARMEASY_DATA_SOURCE || (officialApiBaseUrl ? 'API' : 'Seed'),
      enableMock,
      mockCatalog: options.mockCatalog || MOCK_CATALOG,
      ...options,
    });
  }
}

module.exports = PharmEasyScraper;
