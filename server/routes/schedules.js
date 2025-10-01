const express = require('express');
const router = express.Router();
const db = require('../db');

// Get schedules for a specific shade
router.get('/shade/:shadeId', (req, res) => {
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

// Create a new schedule
router.post('/', (req, res) => {
  const {
    shade_id,
    name,
    day_of_week,
    start_time,
    end_time,
    target_position,
    is_active,
    created_by_user_id
  } = req.body;

  db.query(
    `INSERT INTO schedules (shade_id, name, day_of_week, start_time, end_time, target_position, is_active, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [shade_id, name, day_of_week, start_time, end_time, target_position, is_active ?? true, created_by_user_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      res.status(201).json({ id: result.insertId });
    }
  );
});

// Delete a schedule
router.delete('/:scheduleId', (req, res) => {
  const { scheduleId } = req.params;
  
  db.query(
    `DELETE FROM schedules WHERE id = ?`,
    [scheduleId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      res.json({ message: 'Schedule deleted successfully' });
    }
  );
});

module.exports = router;