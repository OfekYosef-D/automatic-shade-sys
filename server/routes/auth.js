const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const connection = require('../db');
const nodemailer = require('nodemailer');

// JWT Secret (in production, use env variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

const { validate, emailRegex, strongPasswordRegex } = require('../middleware/validate');

// POST /api/auth/login
router.post('/login', validate([
  { path: 'email', required: true, regex: emailRegex },
  { path: 'password', required: true }
]), async (req, res) => {
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
 
// Password reset: request and perform
// POST /api/auth/forgot - request reset, email a token (console log in dev)
router.post('/forgot', validate([
  { path: 'email', required: true, regex: emailRegex }
]), (req, res) => {
    const email = String(req.body.email || '').trim();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    connection.query('SELECT id, email FROM users WHERE email = ?', [email], (err, users) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (users.length === 0) {
            // Do not reveal existence
            return res.json({ ok: true });
        }

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

        const upsert = `
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)
        `;
        connection.query(upsert, [user.id, token, expiresAt], async (upErr) => {
            if (upErr) return res.status(500).json({ error: 'Server error' });
            const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${token}`;
            try {
                if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST,
                        port: Number(process.env.SMTP_PORT || 587),
                        secure: Boolean(process.env.SMTP_SECURE === 'true'),
                        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                    });
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || 'no-reply@autoshade.local',
                        to: user.email,
                        subject: 'Reset your password',
                        text: `Reset your password: ${resetUrl}`,
                        html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
                    });
                } else {
                    console.log(`[Password Reset] Send to ${user.email}: ${resetUrl}`);
                }
            } catch (mailErr) {
                console.error('Email send error:', mailErr);
            }
            return res.json({ ok: true });
        });
    });
});

// POST /api/auth/reset - perform reset with token
router.post('/reset', validate([
  { path: 'token', required: true },
  { path: 'password', required: true, regex: strongPasswordRegex }
]), async (req, res) => {
    const token = String(req.body.token || '').trim();
    const newPassword = String(req.body.password || '').trim();

    if (!token || !newPassword) return res.status(400).json({ error: 'Token and password are required' });
    const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!strong.test(newPassword)) return res.status(400).json({ error: 'Password must be at least 8 characters and include letters and numbers' });

    const q = `
        SELECT pr.user_id, pr.expires_at FROM password_resets pr WHERE pr.token = ?
    `;
    connection.query(q, [token], async (err, rows) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!rows || rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
        const rec = rows[0];
        if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired token' });

        const hash = await bcrypt.hash(newPassword, 10);
        connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, rec.user_id], (uerr) => {
            if (uerr) return res.status(500).json({ error: 'Server error' });
            // Invalidate token
            connection.query('DELETE FROM password_resets WHERE token = ?', [token], () => {});
            return res.json({ ok: true });
        });
    });
});

