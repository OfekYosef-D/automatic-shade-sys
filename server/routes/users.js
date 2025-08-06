const express = require('express');
const router = express.Router();
const connection = require('../db'); 

// GET all users
router.get('/', (req, res) => {
    console.log('GET /api/users');
    
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        console.log('Returning users:', results.length, results);
        res.json(results);
    });
}); 

// POST new user
router.post('/', (req, res) => {
    console.log('POST /api/users - Body:', req.body);
    
    const { name, email, role } = req.body;

    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }

    connection.query(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        [name, email, role || 'user'],
        (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(500).send('DB error');
                return;
            }
            console.log('Insert result:', result);
            res.status(201).json({ 
                id: result.insertId, 
                name, 
                email, 
                role: role || 'user' 
            });
        }
    );
});

// DELETE user
router.delete('/:id', (req, res) => {
    const userId = req.params.id;
    
    connection.query(
        'DELETE FROM users WHERE id = ?',
        [userId],
        (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                res.status(500).send('DB error');
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).send('User not found');
                return;
            }
            res.send('User deleted');
        }
    );
});

module.exports = router;