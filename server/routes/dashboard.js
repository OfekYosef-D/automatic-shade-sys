const express = require('express');
const router = express.Router();
const connection = require('../db');

// GET dashboard metrics (calculated from real data)
router.get('/metrics', (req, res) => {
    const query = `
        SELECT 
            'Active Shades' as title,
            (SELECT COUNT(*) FROM shades WHERE status = 'active') as value,
            'gray' as color,
            'Shield' as icon
        UNION ALL
        SELECT 
            'Active Alerts' as title,
            (SELECT COUNT(*) FROM alerts WHERE status IN ('active', 'acknowledged')) as value,
            'red' as color,
            'AlertTriangle' as icon
        UNION ALL
        SELECT 
            'Manual Overrides' as title,
            (SELECT COUNT(*) FROM manual_overrides WHERE ended_at IS NULL) as value,
            'gray' as color,
            'Settings' as icon
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching metrics:', err);
            res.status(500).send('Error fetching metrics');
            return;
        }
        res.json(results);
    });
});

// GET active alerts (includes both active and acknowledged)
router.get('/alerts', (req, res) => {
    const query = `
        SELECT 
            a.*, 
            u1.name as created_by_name,
            u2.name as assigned_to_name,
            u2.role as assigned_to_role
        FROM alerts a
        LEFT JOIN users u1 ON a.created_by_user_id = u1.id
        LEFT JOIN users u2 ON a.assigned_to_user_id = u2.id
        WHERE a.status IN ('active', 'acknowledged')
        ORDER BY 
            FIELD(a.status, 'active', 'acknowledged'),
            a.priority DESC, 
            a.created_at DESC
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching alerts:', err);
            res.status(500).send('Error fetching alerts');
            return;
        }
        res.json(results);
    });
});

// GET activity log with filters
router.get('/activities', (req, res) => {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10;
    const typeFilter = req.query.type || null;
    const userFilter = req.query.user_id ? Number(req.query.user_id) : null;
    
    let whereClause = '';
    const params = [];
    
    if (typeFilter) {
        whereClause = 'WHERE al.type = ?';
        params.push(typeFilter);
    }
    
    if (userFilter) {
        whereClause = whereClause ? `${whereClause} AND al.user_id = ?` : 'WHERE al.user_id = ?';
        params.push(userFilter);
    }
    
    const query = `
        SELECT al.*, u.name as user_name, u.role as user_role
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT ?
    `;
    
    params.push(limit);
    
    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching activities:', err);
            res.status(500).send('Error fetching activities');
            return;
        }
        res.json(results);
    });
});

module.exports = router;
