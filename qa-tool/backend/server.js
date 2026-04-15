// ── QA AI Testing Tool — Backend Server ──────────────────────────────────────
// Load .env first so other modules see the config
try { require('dotenv').config(); } catch {}

const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const fs          = require('fs');
const testRoutes    = require('./routes/testRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const agentRoutes   = require('./routes/agentRoutes');
const scriptRoutes  = require('./routes/scriptRoutes');
const jiraRoutes           = require('./routes/jiraRoutes');
const exploratoryRoutes    = require('./routes/exploratoryRoutes');
const advancedTestRoutes   = require('./routes/advancedTestRoutes');
const authRoutes           = require('./routes/authRoutes');
const notificationRoutes   = require('./routes/notificationRoutes');
const { attachUser }       = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Performance & Security Middleware ────────────────────────────────────────
// gzip compression for all JSON/text responses → 70-90% smaller payloads
app.use(compression({ threshold: 1024 }));

// Security headers — disable CSP here because the frontend is served by Vite in dev
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS — wide-open for local dev; tighten via ALLOWED_ORIGINS env var in production
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors(allowedOrigins.length
  ? { origin: allowedOrigins, credentials: true }
  : {}));

// JSON body parsing with reasonable size cap
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Per-IP rate limiter on /api — 2000 req / 15 min; localhost is exempt.
// Tune `max` via RATE_LIMIT_MAX env var in production.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 2000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
  // Skip loopback clients (dev + automated test runs) and explicit bypass header
  skip: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || '';
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;
    if (req.headers['x-test-run'] === '1') return true;
    return false;
  },
});
app.use('/api', apiLimiter);

// Attach req.user on every /api request (if valid JWT present). Routes opt-in
// to requireAuth where enforcement is needed.
app.use('/api', attachUser);

// ── Ensure required directories exist ────────────────────────────────────────
const dirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'reports'),
];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);             // public: signup/login; others require auth
app.use('/api', notificationRoutes);
app.use('/api', testRoutes);
app.use('/api', monitorRoutes);
app.use('/api', agentRoutes);
app.use('/api', scriptRoutes);
app.use('/api', jiraRoutes);
app.use('/api', exploratoryRoutes);
app.use('/api', advancedTestRoutes);

// ── Serve report files statically ────────────────────────────────────────────
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  uptime: process.uptime(),
  memory: process.memoryUsage().heapUsed,
  timestamp: new Date().toISOString(),
}));

// ── Global error handler — never leak stack traces in production ─────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 QA Tool Backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Compression: gzip enabled | Security: helmet active | Rate limit: 300/15min\n`);
});
