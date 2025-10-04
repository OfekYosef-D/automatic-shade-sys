const express = require('express');
const router = express.Router();
const connection = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helpers
function sanitizeString(input, { maxLength = 2000 } = {}) {
    if (input === undefined || input === null) return null;
    let v = String(input);
    v = v.trim().replace(/[\u0000-\u001F\u007F]/g, '');
    v = v.replace(/<[^>]*>/g, '');
    if (v.length > maxLength) v = v.slice(0, maxLength);
    return v;
}

// POST - Create a new alert
router.post('/', authenticateToken, (req, res) => {
    const description = sanitizeString(req.body.description, { maxLength: 2000 });
    const location = sanitizeString(req.body.location, { maxLength: 200 });
    const priority = sanitizeString(req.body.priority, { maxLength: 10 });
    const status = sanitizeString(req.body.status, { maxLength: 20 }) || 'active';
    const created_by_user_id = req.user.id; // Use authenticated user from JWT
    
    // Validate required fields
    if (!description || !location || !priority) {
        return res.status(400).json({ error: 'Description, location, and priority are required' });
    }
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority. Must be one of: Low, Medium, High' });
    }
    const validStatuses = ['active', 'resolved', 'acknowledged'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: active, resolved, acknowledged' });
    }
    
    const query = `
        INSERT INTO alerts (description, location, priority, status, created_by_user_id, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [description, location, priority, status, created_by_user_id];
    
    connection.query(query, values, (err, result) => {
        if (err) {
            console.error('Error creating alert:', err);
            res.status(500).json({ error: 'Error creating alert' });
            return;
        }
        
        res.status(201).json({ 
            message: 'Alert created successfully',
            alertId: result.insertId 
        });
    });
});

// GET - Get all alerts (for future use)
router.get('/', (req, res) => {
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
        res.json(results);
    });
});

// PATCH - Assign alert to user (auto-acknowledges)
router.patch('/:alertId/assign', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
    const alertId = req.params.alertId;
    const assignedToUserId = req.body.assigned_to_user_id ? Number(req.body.assigned_to_user_id) : null;
    
    // When assigning, auto-acknowledge (assignment = taking ownership)
    const newStatus = assignedToUserId ? 'acknowledged' : 'active';
    const updateQuery = 'UPDATE alerts SET assigned_to_user_id = ?, status = ? WHERE id = ?';
    
    connection.query(updateQuery, [assignedToUserId, newStatus, alertId], (err, result) => {
        if (err) {
            console.error('Error assigning alert:', err);
            return res.status(500).json({ error: 'Error assigning alert' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        // Log the assignment
        if (assignedToUserId) {
            const logQuery = `
                INSERT INTO activity_log (type, description, time_description, user_id)
                VALUES ('alert', ?, 'Just now', ?)
            `;
            connection.query(logQuery, [`Alert ${alertId} assigned and acknowledged`, req.user.id], () => {});
        }
        
        res.json({ 
            message: 'Alert assigned successfully', 
            alertId, 
            assigned_to_user_id: assignedToUserId,
            status: newStatus
        });
    });
});

// PATCH - Update alert status
router.patch('/:alertId/status', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
    const alertId = req.params.alertId;
    const status = sanitizeString(req.body.status, { maxLength: 20 });
    const resolution_notes = sanitizeString(req.body.resolution_notes, { maxLength: 500 });
    
    // Validate status
    const validStatuses = ['active', 'resolved', 'acknowledged'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: active, resolved, acknowledged' });
    }
    
    const updateQuery = `
        UPDATE alerts 
        SET status = ?, 
            resolved_at = ${status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'NULL'}
        WHERE id = ?
    `;
    
    connection.query(updateQuery, [status, alertId], (err, result) => {
        if (err) {
            console.error('Error updating alert status:', err);
            res.status(500).json({ error: 'Error updating alert status' });
            return;
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        // Log the activity
        const logQuery = `
            INSERT INTO activity_log (type, description, time_description, user_id)
            VALUES ('alert', ?, 'Just now', ?)
        `;
        
        const statusText = status === 'resolved' ? 'resolved' : 
                          status === 'acknowledged' ? 'acknowledged' : 'reactivated';
        const logDescription = `Alert ${alertId} ${statusText}${resolution_notes ? ` - ${resolution_notes}` : ''}`;
        
        connection.query(logQuery, [logDescription, req.user.id], (err) => {
            if (err) {
                console.error('Error logging activity:', err);
            }
            
            res.json({ 
                message: 'Alert status updated successfully',
                alertId: alertId,
                status: status
            });
        });
    });
});

// DELETE - Delete an alert
router.delete('/:alertId', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
    const alertId = req.params.alertId;
    
    // First, get the alert info for logging
    const getAlertQuery = `
        SELECT description, location, priority
        FROM alerts
        WHERE id = ?
    `;
    
    connection.query(getAlertQuery, [alertId], (err, results) => {
        if (err) {
            console.error('Error fetching alert info:', err);
            res.status(500).json({ error: 'Error fetching alert info' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Alert not found' });
            return;
        }
        
        const alertInfo = results[0];
        
        // Delete the alert
        const deleteQuery = `DELETE FROM alerts WHERE id = ?`;
        
        connection.query(deleteQuery, [alertId], (err, result) => {
            if (err) {
                console.error('Error deleting alert:', err);
                res.status(500).json({ error: 'Error deleting alert' });
                return;
            }
            
            // Log the activity
            const logQuery = `
                INSERT INTO activity_log (type, description, time_description, user_id)
                VALUES ('alert', ?, 'Just now', ?)
            `;
            
            const logDescription = `Alert deleted: ${alertInfo.description} (${alertInfo.priority}) from ${alertInfo.location}`;
            
            connection.query(logQuery, [logDescription, req.user.id], (err) => {
                if (err) {
                    console.error('Error logging activity:', err);
                }
                
                res.json({ 
                    message: 'Alert deleted successfully',
                    alertId: alertId
                });
            });
        });
    });
});

module.exports = router;
