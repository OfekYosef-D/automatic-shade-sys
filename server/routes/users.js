const express = require('express');
const router = express.Router();
const connection = require('../db'); 

// Helpers
function sanitizeString(input, { maxLength = 255 } = {}) {
    if (input === undefined || input === null) return null;
    let v = String(input);
    v = v.trim().replace(/[\u0000-\u001F\u007F]/g, '');
    v = v.replace(/<[^>]*>/g, '');
    if (v.length > maxLength) v = v.slice(0, maxLength);
    return v;
}

function isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

// GET all users
router.get('/', (req, res) => {
    const roleFilter = req.query.role || null;
    
    let query = 'SELECT id, name, email, role FROM users';
    const params = [];
    
    if (roleFilter) {
        query += ' WHERE role = ?';
        params.push(roleFilter);
    }
    
    query += ' ORDER BY name';
    
    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        res.json(results);
    });
}); 

// POST new user
router.post('/', (req, res) => {
    const name = sanitizeString(req.body.name, { maxLength: 50 });
    const email = sanitizeString(req.body.email, { maxLength: 100 });
    const role = sanitizeString(req.body.role, { maxLength: 20 }) || 'user';

    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }
    if (!isValidEmail(email)) {
        return res.status(400).send('Invalid email');
    }
    const validRoles = ['admin','maintenance','planner','user'];
    if (!validRoles.includes(role)) {
        return res.status(400).send('Invalid role');
    }

    connection.query(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        [name, email, role],
        (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(500).send('DB error');
                return;
            }
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