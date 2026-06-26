const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { runMigrations } = require('./scripts/migrate');


const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://medicine-price-finder.vercel.app',
    /\.vercel\.app$/,
  ],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// General rate limit: 100 requests per 15 min per IP
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
app.use('/api/medicines',  require('./routes/medicines'));
app.use('/api/pharmacies', require('./routes/pharmacies'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/report',     require('./routes/report'));

if (process.env.RUN_SCRAPER_CRON === 'true') {
  const { startScraperCron } = require('./scrapers/cron');
  startScraperCron();
}
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    console.log('Running database migrations...');
    await runMigrations();
    console.log('Database migrations completed successfully.');
  } catch (err) {
    console.error('Database migration failed on startup:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();
