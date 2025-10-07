const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const connection = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, emailRegex, strongPasswordRegex } = require('../middleware/validate');

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

// Public (to admin and maintenance) helper route must be defined BEFORE the strict admin-only gate
// GET maintenance users (id, name) for assignment dropdowns
router.get('/maintenance', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
    connection.query(
        'SELECT id, name FROM users WHERE role = \"maintenance\" ORDER BY name',
        [],
        (err, results) => {
            if (err) {
                console.error('Error fetching maintenance users:', err);
                return res.status(500).json({ error: 'Error fetching users' });
            }
            return res.json(results);
        }
    );
});

// All remaining routes in this file require admin privileges
router.use(authenticateToken, requireRole('admin'));

// GET all users
router.get('/', (req, res) => {
    const roleFilter = req.query.role || null;
    
    let query = 'SELECT id, name, email, role FROM users';
    const params = [];
    
    if (roleFilter) {
        query += ' WHERE role = ?';
        params.push(roleFilter);
    }
    // Sort by role priority (admin, maintenance, planner), then by name
    query += " ORDER BY FIELD(role, 'admin','maintenance','planner'), name";
    
    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        res.json(results);
    });
}); 

// POST new user (admin only)
router.post('/', validate([
    { path: 'name', required: true, maxLength: 50 },
    { path: 'email', required: true, regex: emailRegex },
    { path: 'role', required: true, enumValues: ['admin','maintenance','planner'] },
  ]), async (req, res) => {
    const name = sanitizeString(req.body.name, { maxLength: 50 });
    const email = sanitizeString(req.body.email, { maxLength: 100 });
    const role = sanitizeString(req.body.role, { maxLength: 20 }) || 'planner';
    const password = sanitizeString(req.body.password, { maxLength: 200 });

    // Password policy (if provided): min 8, at least one letter and number
    if (password && !strongPasswordRegex.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters and include letters and numbers' });
    }

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    const validRoles = ['admin','maintenance','planner'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        connection.query(
            passwordHash
                ? 'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)'
                : 'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
            passwordHash ? [name, email, role, passwordHash] : [name, email, role],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    console.error('Error inserting user:', err);
                    return res.status(500).json({ error: 'DB error' });
                }
                // Audit log: user created
                connection.query(
                    `INSERT INTO activity_log (type, description, time_description, user_id) VALUES ('update', ?, 'Just now', ?)` ,
                    [
                        `User created: ${name} <${email}> (role: ${role || 'user'})`,
                        req.user.id
                    ],
                    () => {}
                );
                return res.status(201).json({ 
                    id: result.insertId, 
                    name, 
                    email, 
                    role: role || 'planner' 
                });
            }
        );
    } catch (e) {
        console.error('Error creating user:', e);
        return res.status(500).json({ error: 'Server error' });
    }
});

// PUT update user (name, email, role, optional password)
router.put('/:id', validate([
    { path: 'name', required: true, maxLength: 50 },
    { path: 'email', required: true, regex: emailRegex },
    { path: 'role', required: true, enumValues: ['admin','maintenance','planner'] },
  ]), async (req, res) => {
    const userId = req.params.id;
    const name = sanitizeString(req.body.name, { maxLength: 50 });
    const email = sanitizeString(req.body.email, { maxLength: 100 });
    const role = sanitizeString(req.body.role, { maxLength: 20 });
    const password = sanitizeString(req.body.password, { maxLength: 200 });

    // Prevent self-demotion from admin to non-admin
    if (Number(userId) === Number(req.user.id) && role && role !== 'admin') {
        return res.status(400).json({ error: 'You cannot change your own role from admin' });
    }

    if (!name || !email || !role) {
        return res.status(400).json({ error: 'Name, email and role are required' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    const validRoles = ['admin','maintenance','planner'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (password && !strongPasswordRegex.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters and include letters and numbers' });
    }

    try {
        let sql = 'UPDATE users SET name = ?, email = ?, role = ?';
        const params = [name, email, role, userId];
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            sql = 'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?';
            params.splice(3, 0, passwordHash); // insert passwordHash before userId
        } else {
            sql = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
        }

        connection.query(sql, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                console.error('Error updating user:', err);
                return res.status(500).json({ error: 'DB error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Audit log: user updated (do not log passwords)
            connection.query(
                `INSERT INTO activity_log (type, description, time_description, user_id) VALUES ('update', ?, 'Just now', ?)` ,
                [
                    `User updated: ${name} <${email}> (role: ${role})`,
                    req.user.id
                ],
                () => {}
            );
            return res.json({ id: Number(userId), name, email, role });
        });
    } catch (e) {
        console.error('Error updating user:', e);
        return res.status(500).json({ error: 'Server error' });
    }
});

// DELETE user
router.delete('/:id', (req, res) => {
    const userId = req.params.id;

    // Prevent self-delete for safety
    if (Number(userId) === Number(req.user.id)) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Fetch target user for audit, then delete
    connection.query('SELECT id, name, email, role FROM users WHERE id = ?', [userId], (selErr, rows) => {
        if (selErr) {
            console.error('Error fetching user before delete:', selErr);
            return res.status(500).json({ error: 'DB error' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const target = rows[0];
        connection.query(
            'DELETE FROM users WHERE id = ?',
            [userId],
            (err, result) => {
                if (err) {
                    console.error('Error deleting user:', err);
                    return res.status(500).json({ error: 'DB error' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                // Audit log: user deleted
                connection.query(
                    `INSERT INTO activity_log (type, description, time_description, user_id) VALUES ('update', ?, 'Just now', ?)` ,
                    [
                        `User deleted: ${target.name} <${target.email}> (role: ${target.role})`,
                        req.user.id
                    ],
                    () => {}
                );
                return res.json({ success: true });
            }
        );
    });
});

module.exports = router;