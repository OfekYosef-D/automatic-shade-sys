require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shade_system_test',
    port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        console.error('Connection config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        return;
    }
    console.log('Connected to MySQL database!');    
});

module.exports = connection;
