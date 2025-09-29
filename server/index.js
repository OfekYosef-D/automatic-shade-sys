require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
}));

const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');
const alertsRouter = require('./routes/alerts');
const shadesRouter = require('./routes/shades');
const mapsRouter = require('./routes/maps');

app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/shades', shadesRouter);
app.use('/api/maps', mapsRouter);

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
app.listen(PORT);