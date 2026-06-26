const BaseScraper = require('./BaseScraper');

const MOCK_CATALOG = {
  crocin: { price: 28.50, mrp: 32.00, url: 'mock://1mg/crocin' },
  dolo: { price: 23.50, mrp: 28.00, url: 'mock://1mg/dolo' },
  calpol: { price: 25.50, mrp: 30.00, url: 'mock://1mg/calpol' },
};

class OneMilligramScraper extends BaseScraper {
  constructor(options = {}) {
    const officialApiBaseUrl = options.officialApiBaseUrl || process.env.ONE_MG_API_BASE_URL;
    const enableMock = options.enableMock ?? process.env.ENABLE_MOCK_PRICE_PROVIDERS === 'true';
    super('1mg', 'https://www.1mg.com', {
      officialApiBaseUrl,
      apiKey: options.apiKey || process.env.ONE_MG_API_KEY,
      dataSource: options.dataSource || process.env.ONE_MG_DATA_SOURCE || (officialApiBaseUrl ? 'API' : 'Seed'),
      enableMock,
      mockCatalog: options.mockCatalog || MOCK_CATALOG,
      ...options,
    });
  }
}

module.exports = OneMilligramScraper;
