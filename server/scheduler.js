const db = require('./db');

let schedulerInterval = null;

// Runtime-configurable settings with safe defaults
const schedulerSettings = {
  intervalMinutes: 2,
  overrideWindowMinutes: 30,
  paused: false,
};

/**
 * Check and execute active schedules
 * Runs every minute to check if any schedules should be executed
 */
const executeActiveSchedules = async () => {
  if (schedulerSettings.paused) {
    return; // do nothing while paused
  }
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "15:35" format
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // "monday"
  const currentDate = now.toISOString().split('T')[0]; // "2025-10-04" format
  
  // Find schedules that should execute NOW (at start time only, once per day)
  // Phase 2: Check for recent manual overrides before execution
  const query = `
    SELECT 
      s.id as schedule_id,
      s.shade_id,
      s.name as schedule_name,
      s.target_position,
      s.created_by_user_id,
      s.start_time,
      s.last_executed_date,
      sh.description as device_name,
      sh.current_position,
      sh.status as device_status,
      sh.area_id,
      (SELECT MAX(created_at) FROM manual_overrides WHERE shade_id = sh.id) as last_manual_override
    FROM schedules s
    JOIN shades sh ON s.shade_id = sh.id
    WHERE s.is_active = TRUE
    AND (s.day_of_week = ? OR s.day_of_week = 'daily')
    AND s.start_time = ?
    AND (s.last_executed_date IS NULL OR s.last_executed_date != ?)
    AND sh.status = 'active'
  `;

  db.query(query, [currentDay, currentTime, currentDate], (err, schedules) => {
    if (err) {
      console.error('Error fetching active schedules:', err);
      return;
    }

    if (schedules.length === 0) {
      return; // No schedules to execute
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Scheduler] Found ${schedules.length} schedule(s) to execute at ${currentTime}`);
    }

    // Execute each schedule
    schedules.forEach(schedule => {
      // Phase 2: Check for manual override in configured window
      const overrideWindowMinutes = Number(schedulerSettings.overrideWindowMinutes) || 30;
      const now = new Date();
      const overrideThreshold = new Date(now.getTime() - overrideWindowMinutes * 60000);
      
      if (schedule.last_manual_override) {
        const lastOverride = new Date(schedule.last_manual_override);
        
        // If manual override within last 30 minutes, skip execution
        if (lastOverride >= overrideThreshold) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Scheduler] ⊘ Skipped "${schedule.schedule_name}" - Manual override detected (${Math.round((now - lastOverride) / 60000)} min ago)`);
          }
          
          // Mark as executed so it doesn't try again today
          db.query(
            `UPDATE schedules SET last_executed_date = ? WHERE id = ?`,
            [currentDate, schedule.schedule_id]
          );
          
          // Log the skip
          db.query(
            `INSERT INTO activity_log (type, description, time_description, user_id)
             VALUES ('schedule', ?, 'Just now', ?)`,
            [`Schedule "${schedule.schedule_name}" skipped: Manual override detected`, schedule.created_by_user_id]
          );
          
          return; // Skip this schedule
        }
      }
      
      // No recent override - proceed with execution
      const updateQuery = `
        UPDATE shades 
        SET current_position = ?, target_position = ?
        WHERE id = ?
      `;

      db.query(
        updateQuery,
        [schedule.target_position, schedule.target_position, schedule.shade_id],
        (updateErr) => {
          if (updateErr) {
            console.error(`Error updating shade ${schedule.shade_id}:`, updateErr);
            return;
          }

          // Mark schedule as executed today
          const markExecutedQuery = `
            UPDATE schedules 
            SET last_executed_date = ?
            WHERE id = ?
          `;

          db.query(markExecutedQuery, [currentDate, schedule.schedule_id], (markErr) => {
            if (markErr) {
              console.error('Error marking schedule as executed:', markErr);
            }
          });

          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Scheduler] ✓ Executed "${schedule.schedule_name}" - ${schedule.device_name} → ${schedule.target_position}%`);
          }

          // Log the activity
          const logQuery = `
            INSERT INTO activity_log (type, description, time_description, user_id)
            VALUES ('schedule', ?, 'Just now', ?)
          `;

          const logDescription = `Schedule "${schedule.schedule_name}" executed: ${schedule.device_name} → ${schedule.target_position}%`;

          db.query(logQuery, [logDescription, schedule.created_by_user_id], (logErr) => {
            if (logErr) {
              console.error('Error logging schedule execution:', logErr);
            }
          });
        }
      );
    });
  });
};

/**
 * Start the scheduler
 * Configurable interval (default: 2 minutes for professional balance)
 */
const startScheduler = (intervalMinutes = schedulerSettings.intervalMinutes) => {
  if (schedulerInterval) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Scheduler] Already running');
    }
    return;
  }

  schedulerSettings.intervalMinutes = intervalMinutes;
  const intervalMs = schedulerSettings.intervalMinutes * 60 * 1000;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Scheduler] Started - checking schedules every ${schedulerSettings.intervalMinutes} minute(s)`);
  }
  
  // Run immediately on start
  executeActiveSchedules();
  
  // Then run every N minutes
  schedulerInterval = setInterval(() => {
    executeActiveSchedules();
  }, intervalMs);
};

/**
 * Stop the scheduler
 */
const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Scheduler] Stopped');
    }
  }
};

/**
 * Get scheduler status
 */
const getSchedulerStatus = () => {
  return {
    running: schedulerInterval !== null,
    lastCheck: new Date().toISOString(),
    settings: { ...schedulerSettings },
  };
};

// Update settings at runtime. Optionally restart interval timer if interval changed
const updateSchedulerSettings = ({ intervalMinutes, overrideWindowMinutes, paused }) => {
  let needsRestart = false;
  if (typeof intervalMinutes === 'number' && intervalMinutes > 0 && intervalMinutes !== schedulerSettings.intervalMinutes) {
    schedulerSettings.intervalMinutes = intervalMinutes;
    needsRestart = true;
  }
  if (typeof overrideWindowMinutes === 'number' && overrideWindowMinutes >= 0) {
    schedulerSettings.overrideWindowMinutes = overrideWindowMinutes;
  }
  if (typeof paused === 'boolean') {
    schedulerSettings.paused = paused;
  }
  if (needsRestart) {
    // restart interval with new cadence
    stopScheduler();
    startScheduler(schedulerSettings.intervalMinutes);
  }
  return { ...schedulerSettings };
};

module.exports = {
  startScheduler,
  stopScheduler,
  executeActiveSchedules,
  getSchedulerStatus,
  updateSchedulerSettings,
};

