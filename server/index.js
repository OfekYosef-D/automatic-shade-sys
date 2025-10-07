require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { startScheduler, getSchedulerStatus, updateSchedulerSettings } = require('./scheduler');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json());

// CORS whitelist from env or fallback
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Basic rate limits for sensitive routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const mediumLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false });

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const alertsRouter = require('./routes/alerts');
const shadesRouter = require('./routes/shades');
const mapsRouter = require('./routes/maps');
const schedulesRouter = require('./routes/schedules');

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', strictLimiter, usersRouter);
app.use('/api/dashboard', mediumLimiter, dashboardRouter);
app.use('/api/alerts', mediumLimiter, alertsRouter);
app.use('/api/shades', mediumLimiter, shadesRouter);
app.use('/api/schedules', mediumLimiter, schedulesRouter);
app.use('/api/maps', mediumLimiter, mapsRouter);

// Scheduler status endpoint (admin only)
const { authenticateToken, requireRole } = require('./middleware/auth');
app.get('/api/scheduler/status', authenticateToken, requireRole('admin'), (req, res) => {
  res.json(getSchedulerStatus());
});

// Update scheduler settings (admin only)
app.patch('/api/scheduler/settings', authenticateToken, requireRole('admin'), (req, res) => {
  const { intervalMinutes, overrideWindowMinutes, paused } = req.body || {};
  // Basic validation
  if (intervalMinutes !== undefined && (!Number.isInteger(intervalMinutes) || intervalMinutes <= 0)) {
    return res.status(400).json({ error: 'intervalMinutes must be a positive integer' });
  }
  if (overrideWindowMinutes !== undefined && (!Number.isInteger(overrideWindowMinutes) || overrideWindowMinutes < 0)) {
    return res.status(400).json({ error: 'overrideWindowMinutes must be a non-negative integer' });
  }
  if (paused !== undefined && typeof paused !== 'boolean') {
    return res.status(400).json({ error: 'paused must be a boolean' });
  }
  const settings = updateSchedulerSettings({ intervalMinutes, overrideWindowMinutes, paused });
  return res.json({ ok: true, settings });
});

app.get('/', (req, res) => {
    res.send('hello from express');
});

// Centralized error handling for clear client messages
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large', limitMB: 10 });
    }
    return res.status(400).json({ error: 'Upload error', code: err.code });
  }
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
  next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ Server running on port ${PORT}`);
  }
  // Start the automatic scheduler
  startScheduler();
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Automatic schedule execution enabled');
  }
});