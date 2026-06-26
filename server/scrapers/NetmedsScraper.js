const BaseScraper = require('./BaseScraper');

const MOCK_CATALOG = {
  crocin: { price: 30.00, mrp: 32.00, url: 'mock://netmeds/crocin' },
  dolo: { price: 25.00, mrp: 28.00, url: 'mock://netmeds/dolo' },
  calpol: { price: 27.00, mrp: 30.00, url: 'mock://netmeds/calpol' },
};

class NetmedsScraper extends BaseScraper {
  constructor(options = {}) {
    const officialApiBaseUrl = options.officialApiBaseUrl || process.env.NETMEDS_API_BASE_URL;
    const enableMock = options.enableMock ?? process.env.ENABLE_MOCK_PRICE_PROVIDERS === 'true';
    super('Netmeds', 'https://www.netmeds.com', {
      officialApiBaseUrl,
      apiKey: options.apiKey || process.env.NETMEDS_API_KEY,
      dataSource: options.dataSource || process.env.NETMEDS_DATA_SOURCE || (officialApiBaseUrl ? 'API' : 'Seed'),
      enableMock,
      mockCatalog: options.mockCatalog || MOCK_CATALOG,
      ...options,
    });
  }
}

module.exports = NetmedsScraper;
