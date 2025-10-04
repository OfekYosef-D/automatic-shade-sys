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
        SELECT a.*, u.name as created_by_name
        FROM alerts a
        LEFT JOIN users u ON a.created_by_user_id = u.id
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

// GET activity log
router.get('/activities', (req, res) => {
    const query = `
        SELECT al.*, u.name as user_name
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 5
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching activities:', err);
            res.status(500).send('Error fetching activities');
            return;
        }
        res.json(results);
    });
});

module.exports = router;
