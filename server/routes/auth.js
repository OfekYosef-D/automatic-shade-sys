const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../db');

// JWT Secret (in production, use env variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email
        const query = 'SELECT * FROM users WHERE email = ?';
        connection.query(query, [email], async (err, users) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = users[0];

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Generate JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Return user info and token (don't send password_hash)
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me - Get current user from token
router.get('/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch fresh user data from DB
        const query = 'SELECT id, name, email, role FROM users WHERE id = ?';
        connection.query(query, [decoded.id], (err, users) => {
            if (err || users.length === 0) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            
            res.json({ user: users[0] });
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;

