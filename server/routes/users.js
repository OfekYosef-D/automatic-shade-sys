const express = require('express');
const { requireAuth } = require('@clerk/express');
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

router.post('/sync', (req, res) => {
    const { userId } = req.auth; 
    const { name, email } = req.body; 

    connection.query(
        'INSERT IGNORE INTO users (clerk_id, name, email) VALUES (?, ?, ?)',
        [userId, name, email],
        (err) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(500).send('DB error');
                return;
            }
            res.send('User synced');
        }
    );
});

module.exports = router;