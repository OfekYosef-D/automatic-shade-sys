const express = require('express');
const router = express.Router();
const connection = require('../db'); 

router.get('/', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        res.json(results);
    });
}); 

module.exports = router;