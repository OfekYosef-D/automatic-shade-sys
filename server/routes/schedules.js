const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getSchedulerStatus, executeActiveSchedules } = require('../scheduler');

// Sanitize string inputs
function sanitizeString(input, { maxLength = 200 } = {}) {
  if (!input) return null;
  return String(input).slice(0, maxLength).trim();
}

// Get schedules for a specific shade (authenticated users only)
router.get('/shade/:shadeId', authenticateToken, (req, res) => {
  const { shadeId } = req.params;
  
  db.query(
    `SELECT * FROM schedules WHERE shade_id = ? ORDER BY created_at DESC`,
    [shadeId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      res.json(results);
    }
  );
});

// Create a new schedule (Admin/Maintenance only)
router.post('/', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
  const {
    shade_id,
    name,
    day_of_week,
    start_time,
    target_position,
    is_active
  } = req.body;

  // Validate inputs
  const sanitizedName = sanitizeString(name, { maxLength: 100 });
  if (!sanitizedName || !sanitizedName.trim()) {
    return res.status(400).json({ error: 'Schedule name is required' });
  }

  if (!shade_id || isNaN(parseInt(shade_id))) {
    return res.status(400).json({ error: 'Valid shade ID is required' });
  }

  if (!start_time) {
    return res.status(400).json({ error: 'Start time is required' });
  }

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'daily'];
  if (!validDays.includes(day_of_week)) {
    return res.status(400).json({ error: 'Invalid day of week' });
  }

  const position = parseInt(target_position);
  if (isNaN(position) || position < 0 || position > 100) {
    return res.status(400).json({ error: 'Target position must be between 0 and 100' });
  }

  const created_by_user_id = req.user.id; // Use authenticated user ID

  db.query(
    `INSERT INTO schedules (shade_id, name, day_of_week, start_time, target_position, is_active, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [shade_id, sanitizedName, day_of_week, start_time, position, is_active ?? true, created_by_user_id],
    (err, result) => {
      if (err) {
        console.error('Database error creating schedule:', err);
        return res.status(500).json({ error: 'Failed to create schedule' });
      }

      // Log activity
      db.query(
        `INSERT INTO activity_log (type, description, time_description, user_id)
         VALUES ('schedule', ?, 'Just now', ?)`,
        [`Schedule created: ${sanitizedName}`, req.user.id],
        (logErr) => {
          if (logErr) console.error('Error logging activity:', logErr);
        }
      );

      res.status(201).json({ id: result.insertId, message: 'Schedule created successfully' });
    }
  );
});

// Delete a schedule (Admin/Maintenance only)
router.delete('/:scheduleId', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
  const { scheduleId } = req.params;
  
  if (!scheduleId || isNaN(parseInt(scheduleId))) {
    return res.status(400).json({ error: 'Valid schedule ID is required' });
  }

  // First get schedule info for logging
  db.query(
    `SELECT s.name, s.shade_id FROM schedules s WHERE s.id = ?`,
    [scheduleId],
    (err, schedules) => {
      if (err) {
        console.error('Error fetching schedule:', err);
        return res.status(500).json({ error: 'Failed to delete schedule' });
      }

      if (schedules.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const scheduleName = schedules[0].name;

      // Delete the schedule
      db.query(
        `DELETE FROM schedules WHERE id = ?`,
        [scheduleId],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error('Error deleting schedule:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete schedule' });
          }

          // Log activity
          db.query(
            `INSERT INTO activity_log (type, description, time_description, user_id)
             VALUES ('schedule', ?, 'Just now', ?)`,
            [`Schedule deleted: ${scheduleName}`, req.user.id],
            (logErr) => {
              if (logErr) console.error('Error logging activity:', logErr);
            }
          );

          res.json({ message: 'Schedule deleted successfully' });
        }
      );
    }
  );
});

// Toggle schedule active/inactive (Admin/Maintenance only)
router.patch('/:scheduleId/toggle', authenticateToken, requireRole('admin', 'maintenance'), (req, res) => {
  const { scheduleId } = req.params;
  
  if (!scheduleId || isNaN(parseInt(scheduleId))) {
    return res.status(400).json({ error: 'Valid schedule ID is required' });
  }

  // Get current schedule status
  db.query(
    `SELECT id, name, is_active FROM schedules WHERE id = ?`,
    [scheduleId],
    (err, schedules) => {
      if (err) {
        console.error('Error fetching schedule:', err);
        return res.status(500).json({ error: 'Failed to toggle schedule' });
      }

      if (schedules.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const newStatus = !schedules[0].is_active;

      // Toggle the status
      db.query(
        `UPDATE schedules SET is_active = ? WHERE id = ?`,
        [newStatus, scheduleId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating schedule:', updateErr);
            return res.status(500).json({ error: 'Failed to toggle schedule' });
          }

          // Log activity
          const action = newStatus ? 'enabled' : 'disabled';
          db.query(
            `INSERT INTO activity_log (type, description, time_description, user_id)
             VALUES ('schedule', ?, 'Just now', ?)`,
            [`Schedule ${action}: ${schedules[0].name}`, req.user.id],
            (logErr) => {
              if (logErr) console.error('Error logging activity:', logErr);
            }
          );

          res.json({ 
            message: `Schedule ${action} successfully`,
            is_active: newStatus
          });
        }
      );
    }
  );
});

// Get scheduler status (Admin only)
router.get('/status', authenticateToken, requireRole('admin'), (req, res) => {
  const status = getSchedulerStatus();
  res.json(status);
});

// Manually trigger schedule execution (Admin only - for testing)
router.post('/execute-now', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await executeActiveSchedules();
    res.json({ message: 'Schedules checked and executed', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error executing schedules:', error);
    res.status(500).json({ error: 'Failed to execute schedules' });
  }
});

module.exports = router;