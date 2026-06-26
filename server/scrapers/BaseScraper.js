// Base provider for compliant pharmacy price ingestion.
//
// The project intentionally does not scrape pharmacy websites. Concrete
// providers either call a configured official/partner API or return explicit
// opt-in mock data for local development and tests.

const USER_AGENTS = [
  'MedPriceBot/1.0 (+https://medicine-price-finder.vercel.app)',
];

class BaseScraper {
  constructor(name, baseUrl, options = {}) {
    if (new.target === BaseScraper) {
      throw new Error('BaseScraper is abstract; extend it in a provider.');
    }

    this.name = name;
    this.baseUrl = baseUrl;
    this.officialApiBaseUrl = options.officialApiBaseUrl || null;
    this.apiKey = options.apiKey || null;
    this.dataSource = options.dataSource || (this.officialApiBaseUrl ? 'API' : 'Seed');
    this.enableMock = Boolean(options.enableMock);
    this.mockCatalog = options.mockCatalog || {};
    this.rateLimit = options.rateLimit || 500;
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 10000;

    this._lastRequest = 0;
    this._errorLog = [];
  }

  async searchMedicine(query) {
    if (this.officialApiBaseUrl) {
      return this.searchOfficialApi(query);
    }
    if (this.enableMock) {
      return this.searchMockCatalog(query);
    }
    return [];
  }

  async getMedicinePrice(medicineId) {
    if (this.officialApiBaseUrl) {
      return this.getOfficialPrice(medicineId);
    }
    if (this.enableMock) {
      return this.getMockPrice(medicineId);
    }
    return null;
  }

  async run(medicines) {
    const results = [];

    for (const med of medicines) {
      const started = Date.now();
      const label = med.brand_name || med.name;

      try {
        const searchResults = await this.searchMedicine(label);
        if (!searchResults.length) {
          this._log(`${label} skipped: no compliant source result`);
          continue;
        }

        const priceData = await this.getMedicinePrice(searchResults[0].id);
        if (!priceData || priceData.price == null || priceData.mrp == null) {
          this._log(`${label} skipped: no price returned`);
          continue;
        }

        const updatedAt = priceData.updated_at || new Date().toISOString();
        results.push({
          medicine: med,
          pharmacy: this.name,
          price: Number(priceData.price),
          mrp: Number(priceData.mrp),
          availability: priceData.availability || (priceData.inStock ? 'in_stock' : 'out_of_stock'),
          inStock: priceData.inStock ?? priceData.availability !== 'out_of_stock',
          updated_at: updatedAt,
          data_source: priceData.data_source || this.dataSource,
          last_verified_at: updatedAt,
          url: priceData.url || searchResults[0].url || this.baseUrl,
        });

        this._log(`${label} completed in ${Date.now() - started}ms`);
      } catch (err) {
        this._logError(label, err);
        this._log(`${label} failed in ${Date.now() - started}ms: ${err.message}`);
      }
    }

    return results;
  }

  isConfigured() {
    return Boolean(this.officialApiBaseUrl || this.enableMock);
  }

  async searchOfficialApi(query) {
    const url = new URL('/medicines/search', this.officialApiBaseUrl);
    url.searchParams.set('q', query);
    const data = await this.fetchJson(url.toString());

    return (data.results || data.medicines || []).map(item => ({
      id: item.id || item.sku || item.slug,
      name: item.name || item.brand_name,
      url: item.url,
    })).filter(item => item.id);
  }

  async getOfficialPrice(medicineId) {
    const url = new URL(`/medicines/${encodeURIComponent(medicineId)}/price`, this.officialApiBaseUrl);
    const data = await this.fetchJson(url.toString());
    return this.normalizeOfficialPrice(data);
  }

  normalizeOfficialPrice(data) {
    const payload = data.price ? data : data.data || data;
    return {
      price: payload.price,
      mrp: payload.mrp,
      availability: payload.availability,
      inStock: payload.in_stock ?? payload.inStock,
      updated_at: payload.updated_at || payload.updatedAt,
      data_source: payload.data_source || payload.dataSource || this.dataSource,
      url: payload.url,
    };
  }

  searchMockCatalog(query) {
    const normalized = this._normalizeName(query);
    const item = this.mockCatalog[normalized];
    if (!item) return [];
    return [{ id: normalized, name: query, url: item.url }];
  }

  getMockPrice(medicineId) {
    const item = this.mockCatalog[medicineId];
    if (!item) return null;
    return {
      price: item.price,
      mrp: item.mrp,
      availability: item.availability || 'in_stock',
      inStock: item.inStock ?? true,
      updated_at: item.updated_at || new Date().toISOString(),
      data_source: item.data_source || 'Seed',
      url: item.url,
    };
  }

  async fetchJson(url) {
    const data = await this.fetchPage(url);
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  async fetchPage(url) {
    const elapsed = Date.now() - this._lastRequest;
    if (elapsed < this.rateLimit) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimit - elapsed));
    }

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this._lastRequest = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': USER_AGENTS[0],
            'Accept': 'application/json',
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
          },
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from ${url}`);
        }

        const contentType = response.headers.get('content-type') || '';
        return contentType.includes('application/json') ? response.json() : response.text();
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    this._logError(url, lastError);
    throw lastError;
  }

  _normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  _log(message) {
    console.log(`[${this.name}] ${message}`);
  }

  _logError(target, error) {
    this._errorLog.push({
      target,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  getErrorLog() {
    return this._errorLog;
  }
}

module.exports = BaseScraper;
