const NodeCache = require('node-cache');

// Cache with 5 minute TTL (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cacheMiddleware = (keyPrefix) => (req, res, next) => {
  const key = `${keyPrefix}_${JSON.stringify(req.query)}${req.params.id || ''}`;
  const cached = cache.get(key);

  if (cached) {
    return res.json({ ...cached, fromCache: true });
  }

  // Attach set function so route can save to cache
  res.setCache = (data) => cache.set(key, data);
  next();
};

module.exports = { cache, cacheMiddleware };