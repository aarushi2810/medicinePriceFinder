const express = require('express');
const router = express.Router();
const { generateSavingsReport } = require('../services/reportService');

router.post('/', async (req, res) => {
  const { medicines } = req.body || {};

  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ error: 'medicines must be a non-empty array' });
  }

  try {
    const report = await generateSavingsReport(medicines);
    res.json(report);
  } catch (err) {
    console.error('Report generation error:', err.message);
    res.status(500).json({ error: 'Report generation failed', message: err.message });
  }
});

module.exports = router;
