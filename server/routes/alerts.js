const express = require('express');
const router = express.Router();
const connection = require('../db');

// POST - Create a new alert
router.post('/', (req, res) => {
    console.log('POST /api/alerts', req.body);
    
    const { description, location, priority, status, created_by_user_id } = req.body;
    
    // Validate required fields
    if (!description || !location || !priority) {
        return res.status(400).json({ error: 'Description, location, and priority are required' });
    }
    
    const query = `
        INSERT INTO alerts (description, location, priority, status, created_by_user_id, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [description, location, priority, status || 'active', created_by_user_id || 1];
    
    connection.query(query, values, (err, result) => {
        if (err) {
            console.error('Error creating alert:', err);
            res.status(500).json({ error: 'Error creating alert' });
            return;
        }
        
        console.log('Alert created successfully:', result);
        res.status(201).json({ 
            message: 'Alert created successfully',
            alertId: result.insertId 
        });
    });
});

// GET - Get all alerts (for future use)
router.get('/', (req, res) => {
    console.log('GET /api/alerts');
    
    const query = `
        SELECT a.*, u.name as created_by_name
        FROM alerts a
        LEFT JOIN users u ON a.created_by_user_id = u.id
        ORDER BY a.created_at DESC
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching alerts:', err);
            res.status(500).json({ error: 'Error fetching alerts' });
            return;
        }
        console.log('Returning alerts:', results.length, results);
        res.json(results);
    });
});

module.exports = router;
