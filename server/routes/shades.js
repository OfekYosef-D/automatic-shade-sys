const express = require('express');
const router = express.Router();
const connection = require('../db');
const { authenticateToken, requireRole, checkAreaAccess } = require('../middleware/auth');

// Helpers
function sanitizeString(input, { maxLength = 255 } = {}) {
    if (input === undefined || input === null) return null;
    let v = String(input);
    v = v.trim().replace(/[\u0000-\u001F\u007F]/g, '');
    v = v.replace(/<[^>]*>/g, '');
    if (v.length > maxLength) v = v.slice(0, maxLength);
    return v;
}

// GET all areas grouped by building
router.get('/areas', (req, res) => {
    const query = `
        SELECT 
            building_number,
            floor,
            room,
            room_number,
            description,
            id as area_id
        FROM areas 
        ORDER BY building_number, floor, room
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching areas:', err);
            res.status(500).send('Error fetching areas');
            return;
        }
        
        // Group by building
        const buildings = {};
        results.forEach(area => {
            if (!buildings[area.building_number]) {
                buildings[area.building_number] = {
                    building_number: area.building_number,
                    floors: {}
                };
            }
            
            if (!buildings[area.building_number].floors[area.floor]) {
                buildings[area.building_number].floors[area.floor] = [];
            }
            
            buildings[area.building_number].floors[area.floor].push({
                id: area.area_id,
                room: area.room,
                room_number: area.room_number,
                description: area.description
            });
        });
        
        res.json(buildings);
    });
});

// GET shades for a specific area
router.get('/areas/:areaId/shades', (req, res) => {
    const areaId = req.params.areaId;
    const query = `
        SELECT 
            s.*,
            a.building_number,
            a.floor,
            a.room,
            a.room_number,
            a.description as area_description
        FROM shades s
        JOIN areas a ON s.area_id = a.id
        WHERE s.area_id = ?
        ORDER BY s.description
    `;
    
    connection.query(query, [areaId], (err, results) => {
        if (err) {
            console.error('Error fetching shades:', err);
            res.status(500).send('Error fetching shades');
            return;
        }
        
        res.json(results);
    });
});

// GET all shades with area information
router.get('/shades', (req, res) => {
    const query = `
        SELECT 
            s.*,
            a.building_number,
            a.floor,
            a.room,
            a.room_number,
            a.description as area_description
        FROM shades s
        JOIN areas a ON s.area_id = a.id
        ORDER BY a.building_number, a.floor, s.description
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching shades:', err);
            res.status(500).send('Error fetching shades');
            return;
        }
        
        res.json(results);
    });
});

// POST create new shade device (admin/maintenance only)
router.post('/shades', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
    const area_id = Number(req.body.area_id);
    const description = sanitizeString(req.body.description, { maxLength: 100 });
    const type = sanitizeString(req.body.type, { maxLength: 20 });
    const current_position = Math.max(0, Math.min(100, Number(req.body.current_position || 0)));
    const target_position = Math.max(0, Math.min(100, Number(req.body.target_position || 0)));
    const installed_by_user_id = req.user.id; // Use authenticated user from JWT
    const x = req.body.x === null || req.body.x === undefined ? null : Math.trunc(Number(req.body.x));
    const y = req.body.y === null || req.body.y === undefined ? null : Math.trunc(Number(req.body.y));
    
    const query = `
        INSERT INTO shades (area_id, description, type, current_position, target_position, status, installed_by_user_id, x, y)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `;
    
    connection.query(query, [area_id, description, type, current_position, target_position, installed_by_user_id, x || null, y || null], (err, result) => {
        if (err) {
            console.error('Error creating shade:', err);
            res.status(500).send('Error creating shade');
            return;
        }
        
        // Log the activity
        const logQuery = `
            INSERT INTO activity_log (type, description, time_description, user_id)
            VALUES ('installation', ?, 'Just now', ?)
        `;
        
        const logDescription = `New shade device installed: ${description} (${type}) in area ${area_id}`;
        
        connection.query(logQuery, [logDescription, req.user.id], (err) => {
            if (err) {
                console.error('Error logging activity:', err);
            }
            
            res.json({ success: true, shade_id: result.insertId });
        });
    });
});

// PUT update shade fields (description, type, positions, coordinates)
// All authenticated users can update (planner can change positions)
router.put('/shades/:shadeId', authenticateToken, (req, res) => {
    const shadeId = req.params.shadeId;
    const description = sanitizeString(req.body.description, { maxLength: 100 });
    const type = sanitizeString(req.body.type, { maxLength: 20 });
    const current_position = req.body.current_position === undefined ? null : Math.max(0, Math.min(100, Number(req.body.current_position)));
    const target_position = req.body.target_position === undefined ? null : Math.max(0, Math.min(100, Number(req.body.target_position)));
    const x = req.body.x === undefined ? null : Math.trunc(Number(req.body.x));
    const y = req.body.y === undefined ? null : Math.trunc(Number(req.body.y));
    const status = sanitizeString(req.body.status, { maxLength: 30 });

    const query = `
        UPDATE shades
        SET 
            description = COALESCE(?, description),
            type = COALESCE(?, type),
            current_position = COALESCE(?, current_position),
            target_position = COALESCE(?, target_position),
            x = COALESCE(?, x),
            y = COALESCE(?, y),
            status = COALESCE(?, status)
        WHERE id = ?
    `;

    connection.query(
        query,
        [
            description ?? null,
            type ?? null,
            current_position ?? null,
            target_position ?? null,
            x ?? null,
            y ?? null,
            status ?? null,
            shadeId
        ],
        (err) => {
            if (err) {
                console.error('Error updating shade:', err);
                res.status(500).send('Error updating shade');
                return;
            }
            res.json({ success: true });
        }
    );
});

// POST manual override for a shade (all authenticated users, planners need area assignment)
router.post('/shades/:shadeId/override', 
    authenticateToken, 
    checkAreaAccess((req) => {
        // Need to get area_id from shade
        // This will be checked in the route itself
        return null; // Signal to skip check here, do it in route
    }),
    (req, res) => {
    const shadeId = req.params.shadeId;
    const { override_type, position, reason } = req.body;
    const user_id = req.user.id; // Use authenticated user from JWT
    
    // First, check area access for planners
    if (req.user.role === 'planner') {
        const checkQuery = `
            SELECT s.area_id 
            FROM shades s 
            LEFT JOIN area_assignments aa ON s.area_id = aa.area_id AND aa.user_id = ?
            WHERE s.id = ?
        `;
        connection.query(checkQuery, [req.user.id, shadeId], (err, results) => {
            if (err || results.length === 0 || !results[0].area_id) {
                return res.status(403).json({ 
                    error: 'Access denied: You are not assigned to control this device',
                    requiredRole: 'admin or maintenance or assigned planner'
                });
            }
            
            // Check if planner has assignment
            const areaCheckQuery = 'SELECT 1 FROM area_assignments WHERE user_id = ? AND area_id = ?';
            connection.query(areaCheckQuery, [req.user.id, results[0].area_id], (err2, assigned) => {
                if (err2 || assigned.length === 0) {
                    return res.status(403).json({ 
                        error: 'Access denied: You are not assigned to this area',
                        requiredRole: 'admin or maintenance or assigned planner'
                    });
                }
                
                // Proceed with override logic
                processOverride();
            });
        });
    } else {
        // Admin/Maintenance can proceed directly
        processOverride();
    }
    
    function processOverride() {
    
    // First, end any existing override for this shade
    const endOverrideQuery = `
        UPDATE manual_overrides 
        SET ended_at = CURRENT_TIMESTAMP 
        WHERE shade_id = ? AND ended_at IS NULL
    `;
    
    connection.query(endOverrideQuery, [shadeId], (err) => {
        if (err) {
            console.error('Error ending existing override:', err);
            res.status(500).send('Error ending existing override');
            return;
        }
        
        // Create new override
        const createOverrideQuery = `
            INSERT INTO manual_overrides (shade_id, user_id, override_type, position, reason)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        connection.query(createOverrideQuery, [shadeId, user_id, override_type, position, reason], (err, result) => {
            if (err) {
                console.error('Error creating override:', err);
                res.status(500).send('Error creating override');
                return;
            }
            
            // Update shade position
            const updateShadeQuery = `
                UPDATE shades 
                SET current_position = ?, target_position = ?
                WHERE id = ?
            `;
            
            connection.query(updateShadeQuery, [position, position, shadeId], (err) => {
                if (err) {
                    console.error('Error updating shade position:', err);
                    res.status(500).send('Error updating shade position');
                    return;
                }
                
                // Log the activity
                const logQuery = `
                    INSERT INTO activity_log (type, description, time_description, user_id)
                    VALUES ('override', ?, 'Just now', ?)
                `;
                
                const logDescription = `Manual override: ${override_type} shade ${shadeId} to position ${position}`;
                
                connection.query(logQuery, [logDescription, req.user.id], (err) => {
                    if (err) {
                        console.error('Error logging activity:', err);
                    }
                    
                    res.json({ success: true, override_id: result.insertId });
                });
            });
        });
    });
    } // End processOverride
});

// DELETE shade device
router.delete('/shades/:shadeId', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
    const shadeId = req.params.shadeId;
    
    // First, get the shade info for logging
    const getShadeQuery = `
        SELECT s.description, s.type, a.id as area_id
        FROM shades s
        JOIN areas a ON s.area_id = a.id
        WHERE s.id = ?
    `;
    
    connection.query(getShadeQuery, [shadeId], (err, results) => {
        if (err) {
            console.error('Error fetching shade info:', err);
            res.status(500).send('Error fetching shade info');
            return;
        }
        
        if (results.length === 0) {
            res.status(404).send('Shade not found');
            return;
        }
        
        const shadeInfo = results[0];
        
        // Delete related records first (manual overrides, schedules)
        const deleteOverridesQuery = `DELETE FROM manual_overrides WHERE shade_id = ?`;
        const deleteSchedulesQuery = `DELETE FROM schedules WHERE shade_id = ?`;
        
        connection.query(deleteOverridesQuery, [shadeId], (err) => {
            if (err) {
                console.error('Error deleting overrides:', err);
                res.status(500).send('Error deleting overrides');
                return;
            }
            
            connection.query(deleteSchedulesQuery, [shadeId], (err) => {
                if (err) {
                    console.error('Error deleting schedules:', err);
                    res.status(500).send('Error deleting schedules');
                    return;
                }
                
                // Finally delete the shade
                const deleteShadeQuery = `DELETE FROM shades WHERE id = ?`;
                
                connection.query(deleteShadeQuery, [shadeId], (err, result) => {
                    if (err) {
                        console.error('Error deleting shade:', err);
                        res.status(500).send('Error deleting shade');
                        return;
                    }
                    
                    // Log the activity
                    const logQuery = `
                        INSERT INTO activity_log (type, description, time_description, user_id)
                        VALUES ('maintenance', ?, 'Just now', ?)
                    `;
                    
                    const logDescription = `Shade device deleted: ${shadeInfo.description} (${shadeInfo.type}) from area ${shadeInfo.area_id}`;
                    
                    connection.query(logQuery, [logDescription, req.user.id], (err) => {
                        if (err) {
                            console.error('Error logging activity:', err);
                        }
                        
                        res.json({ success: true });
                    });
                });
            });
        });
    });
});

// GET schedules for a specific shade
router.get('/shades/:shadeId/schedules', (req, res) => {
    const shadeId = req.params.shadeId;
    const query = `
        SELECT 
            s.*,
            u.name as created_by_name
        FROM schedules s
        LEFT JOIN users u ON s.created_by_user_id = u.id
        WHERE s.shade_id = ?
        ORDER BY s.day_of_week, s.start_time
    `;
    
    connection.query(query, [shadeId], (err, results) => {
        if (err) {
            console.error('Error fetching schedules:', err);
            res.status(500).send('Error fetching schedules');
            return;
        }
        
        res.json(results);
    });
});

// POST new schedule (all authenticated users can create schedules)
router.post('/schedules', authenticateToken, (req, res) => {
    const { shade_id, name, day_of_week, start_time, target_position } = req.body;
    const created_by_user_id = req.user.id; // Use authenticated user from JWT
    
    const query = `
        INSERT INTO schedules (shade_id, name, day_of_week, start_time, target_position, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    connection.query(query, [shade_id, name, day_of_week, start_time, target_position, created_by_user_id], (err, result) => {
        if (err) {
            console.error('Error creating schedule:', err);
            res.status(500).send('Error creating schedule');
            return;
        }
        
        // Log the activity
        const logQuery = `
            INSERT INTO activity_log (type, description, time_description, user_id)
            VALUES ('schedule', ?, 'Just now', ?)
        `;
        
        const logDescription = `New schedule created: ${name} for shade ${shade_id}`;
        
        connection.query(logQuery, [logDescription, req.user.id], (err) => {
            if (err) {
                console.error('Error logging activity:', err);
            }
            
            res.json({ success: true, schedule_id: result.insertId });
        });
    });
});

// DELETE schedule (all authenticated users)
router.delete('/schedules/:scheduleId', authenticateToken, (req, res) => {
    const scheduleId = req.params.scheduleId;
    
    const query = `DELETE FROM schedules WHERE id = ?`;
    
    connection.query(query, [scheduleId], (err, result) => {
        if (err) {
            console.error('Error deleting schedule:', err);
            res.status(500).send('Error deleting schedule');
            return;
        }
        
        res.json({ success: true });
    });
});

// GET current manual overrides
router.get('/overrides', (req, res) => {
    const query = `
        SELECT 
            mo.*,
            s.description as shade_description,
            a.building_number,
            a.floor,
            a.room,
            u.name as user_name
        FROM manual_overrides mo
        JOIN shades s ON mo.shade_id = s.id
        JOIN areas a ON s.area_id = a.id
        LEFT JOIN users u ON mo.user_id = u.id
        WHERE mo.ended_at IS NULL
        ORDER BY mo.created_at DESC
    `;
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching overrides:', err);
            res.status(500).send('Error fetching overrides');
            return;
        }
        
        res.json(results);
    });
});

module.exports = router;
