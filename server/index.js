require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});