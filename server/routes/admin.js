const express = require('express');
const router = express.Router();
const { getScraperStatus } = require('../scrapers/runAll');

router.get('/scraper-status', async (req, res) => {
  try {
    const providers = await getScraperStatus();
    res.json({ providers });
  } catch (err) {
    console.error('Scraper status error:', err.message);
    res.status(500).json({ error: 'Scraper status failed', message: err.message });
  }
});

module.exports = router;
