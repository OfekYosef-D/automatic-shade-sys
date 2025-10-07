require('dotenv').config();
const mysql = require('mysql2');

// Use a pooled connection to avoid "connection is in closed state" errors and handle bursts safely
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shade_system_test',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Optional: lightweight health check
pool.getConnection((err, conn) => {
    if (err) {
        console.error('MySQL pool connection error:', err);
        return;
    }
    if (conn) conn.release();
});

module.exports = pool;
