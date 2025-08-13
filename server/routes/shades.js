const express = require('express');
const router = express.Router();
const connection = require('../db');

// GET all areas grouped by building
router.get('/areas', (req, res) => {
    console.log('GET /api/shades/areas');
    
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
        
        console.log('Returning areas grouped by building:', Object.keys(buildings).length);
        res.json(buildings);
    });
});

// GET shades for a specific area
router.get('/areas/:areaId/shades', (req, res) => {
    const areaId = req.params.areaId;
    console.log(`GET /api/shades/areas/${areaId}/shades`);
    
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
        
        console.log(`Returning ${results.length} shades for area ${areaId}`);
        res.json(results);
    });
});

// GET all shades with area information
router.get('/shades', (req, res) => {
    console.log('GET /api/shades/shades');
    
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
        
        console.log(`Returning ${results.length} shades`);
        res.json(results);
    });
});

// POST create new shade device
router.post('/shades', (req, res) => {
    const { area_id, description, type, current_position, target_position, installed_by_user_id } = req.body;
    
    console.log('POST /api/shades/shades', { area_id, description, type, current_position, target_position, installed_by_user_id });
    
    const query = `
        INSERT INTO shades (area_id, description, type, current_position, target_position, status, installed_by_user_id)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
    `;
    
    connection.query(query, [area_id, description, type, current_position, target_position, installed_by_user_id], (err, result) => {
        if (err) {
            console.error('Error creating shade:', err);
            res.status(500).send('Error creating shade');
            return;
        }
        
        // Log the activity
        const logQuery = `
            INSERT INTO activity_log (type, description, time_description, user_id)
            VALUES ('device', ?, 'Just now', ?)
        `;
        
        const logDescription = `New shade device installed: ${description} (${type}) in area ${area_id}`;
        
        connection.query(logQuery, [logDescription, installed_by_user_id], (err) => {
            if (err) {
                console.error('Error logging activity:', err);
            }
            
            console.log(`Shade device created with ID ${result.insertId}`);
            res.json({ success: true, shade_id: result.insertId });
        });
    });
});

// POST manual override for a shade
router.post('/shades/:shadeId/override', (req, res) => {
    const shadeId = req.params.shadeId;
    const { override_type, position, reason, user_id } = req.body;
    
    console.log(`POST /api/shades/shades/${shadeId}/override`, { override_type, position, reason, user_id });
    
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
                
                connection.query(logQuery, [logDescription, user_id], (err) => {
                    if (err) {
                        console.error('Error logging activity:', err);
                    }
                    
                    console.log(`Override created for shade ${shadeId}`);
                    res.json({ success: true, override_id: result.insertId });
                });
            });
        });
    });
});

// GET schedules for a specific shade
router.get('/shades/:shadeId/schedules', (req, res) => {
    const shadeId = req.params.shadeId;
    console.log(`GET /api/shades/shades/${shadeId}/schedules`);
    
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
        
        console.log(`Returning ${results.length} schedules for shade ${shadeId}`);
        res.json(results);
    });
});

// POST new schedule
router.post('/schedules', (req, res) => {
    const { shade_id, name, day_of_week, start_time, end_time, target_position, created_by_user_id } = req.body;
    
    console.log('POST /api/shades/schedules', { shade_id, name, day_of_week, start_time, end_time, target_position });
    
    const query = `
        INSERT INTO schedules (shade_id, name, day_of_week, start_time, end_time, target_position, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    connection.query(query, [shade_id, name, day_of_week, start_time, end_time, target_position, created_by_user_id], (err, result) => {
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
        
        connection.query(logQuery, [logDescription, created_by_user_id], (err) => {
            if (err) {
                console.error('Error logging activity:', err);
            }
            
            console.log(`Schedule created with ID ${result.insertId}`);
            res.json({ success: true, schedule_id: result.insertId });
        });
    });
});

// DELETE schedule
router.delete('/schedules/:scheduleId', (req, res) => {
    const scheduleId = req.params.scheduleId;
    console.log(`DELETE /api/shades/schedules/${scheduleId}`);
    
    const query = `DELETE FROM schedules WHERE id = ?`;
    
    connection.query(query, [scheduleId], (err, result) => {
        if (err) {
            console.error('Error deleting schedule:', err);
            res.status(500).send('Error deleting schedule');
            return;
        }
        
        console.log(`Schedule ${scheduleId} deleted`);
        res.json({ success: true });
    });
});

// GET current manual overrides
router.get('/overrides', (req, res) => {
    console.log('GET /api/shades/overrides');
    
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
        
        console.log(`Returning ${results.length} active overrides`);
        res.json(results);
    });
});

module.exports = router;
