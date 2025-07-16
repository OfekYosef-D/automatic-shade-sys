const express = require('express');
const mysql = require('mysql2');

const app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'gal789',
    database: 'shade_system_test'
})

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
})

app.get('/', (req, res) => {
    res.send('Hello from Express!');
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

app.get('/api/users', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        res.json(results);
    })
})


// database 3306 , server 3000 , 