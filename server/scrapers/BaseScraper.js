// ─── BaseScraper.js ──────────────────────────────────────────────────────────
// Abstract base class for pharmacy scrapers.
// Includes: rate limiting, retry with backoff, user-agent rotation, error logging
// ─────────────────────────────────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

class BaseScraper {
  /**
   * @param {string} name       – Scraper display name (e.g. 'PharmEasy')
   * @param {string} baseUrl    – Base URL of the pharmacy site
   * @param {object} options
   * @param {number} options.rateLimit    – Min ms between requests (default 2000)
   * @param {number} options.maxRetries   – Max retries per request  (default 3)
   * @param {number} options.timeout      – Request timeout in ms    (default 10000)
   */
  constructor(name, baseUrl, options = {}) {
    if (new.target === BaseScraper) {
      throw new Error('BaseScraper is abstract — extend it in a subclass.');
    }

    this.name       = name;
    this.baseUrl    = baseUrl;
    this.rateLimit  = options.rateLimit  || 2000;
    this.maxRetries = options.maxRetries || 3;
    this.timeout    = options.timeout    || 10000;

    this._lastRequest = 0;
    this._errorLog    = [];
  }

  // ── Rate-limited fetch with retry + exponential backoff ──────────────────
  async fetchPage(url) {
    // Enforce rate limit
    const elapsed = Date.now() - this._lastRequest;
    if (elapsed < this.rateLimit) {
      await new Promise(r => setTimeout(r, this.rateLimit - elapsed));
    }

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this._lastRequest = Date.now();

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': this._randomUserAgent(),
            'Accept':     'text/html,application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from ${url}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
        return await response.text();

      } catch (err) {
        lastError = err;
        this._log(`Attempt ${attempt}/${this.maxRetries} failed for ${url}: ${err.message}`);

        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 500 + Math.random() * 500;
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    this._logError(url, lastError);
    throw lastError;
  }

  // ── Abstract methods — subclasses MUST override these ────────────────────

  /**
   * Search for a medicine by name on the pharmacy site.
   * @param {string} query
   * @returns {Promise<Array>} list of search results
   */
  async searchMedicine(query) {
    throw new Error(`${this.name}: searchMedicine() not implemented`);
  }

  /**
   * Get the price of a specific medicine.
   * @param {string} medicineId – site-specific ID
   * @returns {Promise<object>} { price, mrp, inStock }
   */
  async getMedicinePrice(medicineId) {
    throw new Error(`${this.name}: getMedicinePrice() not implemented`);
  }

  // ── Orchestrator — run scraping for a list of medicines ──────────────────
  async run(medicines) {
    console.log(`\n[${this.name}] Starting scrape for ${medicines.length} medicines...`);
    const results = [];

    for (const med of medicines) {
      try {
        const searchResults = await this.searchMedicine(med.brand_name || med.name);
        if (searchResults && searchResults.length > 0) {
          const priceData = await this.getMedicinePrice(searchResults[0].id);
          results.push({
            medicine:    med,
            pharmacy:    this.name,
            ...priceData,
            scrapedAt:   new Date().toISOString(),
          });
          console.log(`  ✓ ${med.brand_name || med.name}: ₹${priceData.price}`);
        } else {
          console.log(`  ⚠ ${med.brand_name || med.name}: not found`);
        }
      } catch (err) {
        console.error(`  ✗ ${med.brand_name || med.name}: ${err.message}`);
      }
    }

    console.log(`[${this.name}] Done. ${results.length}/${medicines.length} prices scraped.`);
    if (this._errorLog.length) {
      console.log(`[${this.name}] ${this._errorLog.length} errors logged.`);
    }
    return results;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  _randomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  _log(msg) {
    console.log(`[${this.name}] ${msg}`);
  }

  _logError(url, error) {
    this._errorLog.push({
      url,
      error:     error.message,
      timestamp: new Date().toISOString(),
    });
  }

  getErrorLog() {
    return this._errorLog;
  }
}

module.exports = BaseScraper;
