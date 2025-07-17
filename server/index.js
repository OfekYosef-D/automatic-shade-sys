const express = require('express');
const app = express();

const usersRouter = require('./routes/users');

app.use('/api/users', usersRouter);


app.get('/', (req, res) => {
    res.send('hello from express');
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});