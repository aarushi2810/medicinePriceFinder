const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cron         = require('node-cron');
const { execFile } = require('child_process');
require('dotenv').config();

const app = express();

// Security + middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/ai', require('./routes/ai'));

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimit);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/medicines', require('./routes/medicines'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});



// Every night at 2am — snapshot today's prices into price_history
cron.schedule('0 2 * * *', async () => {
  try {
    await db.query(`
      INSERT INTO price_history (medicine_id, pharmacy_id, price, recorded_on)
      SELECT medicine_id, pharmacy_id, price, CURRENT_DATE
      FROM prices
      ON CONFLICT DO NOTHING
    `);
    console.log('Price history snapshot saved:', new Date().toISOString());
  } catch (err) {
    console.error('Snapshot failed:', err.message);
  }
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('[Cron] Price refresh scheduled — runs daily at 2am');
});
