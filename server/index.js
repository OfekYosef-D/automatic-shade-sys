const express = require('express');
const cors = require('cors');
const { requireAuth } = require('@clerk/express');
const app = express();

app.use(express.json());
app.use(cors());

const usersRouter = require('./routes/users');

app.use('/api/users', usersRouter);


app.get('/', (req, res) => {
    res.send('hello from express');
});


app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});