#CREATE DATABASE shade_system_test;
USE shade_system_test;

DROP TABLE IF EXISTS manual_overrides;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS shades;
DROP TABLE IF EXISTS area_assignments;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100),
  password_hash VARCHAR(255),
  role ENUM('admin', 'maintenance', 'planner') DEFAULT 'planner'
);

CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_number INT,
  floor VARCHAR(50),
  room VARCHAR(100),
  room_number VARCHAR(50),
  location_note VARCHAR(100),
  description TEXT,
  map_name VARCHAR(255),
  map_description TEXT,
  map_file_path VARCHAR(500),
  map_file_type VARCHAR(50),
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS area_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  area_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (user_id, area_id)
);

CREATE TABLE IF NOT EXISTS shades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_id INT,
  description VARCHAR(100),
  type ENUM('umbrella','pergola','blinds','curtains','shutters') DEFAULT 'blinds',
  current_position INT DEFAULT 0, -- 0 = closed, 100 = fully open
  target_position INT DEFAULT 0,
  status ENUM('active', 'under_maintenance', 'inactive') DEFAULT 'active',
  x INT, -- Position on map (percentage)
  y INT, -- Position on map (percentage)
  installed_by_user_id INT,
  FOREIGN KEY (area_id) REFERENCES areas(id),
  FOREIGN KEY (installed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shade_id INT,
  name VARCHAR(100),
  day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday','daily') DEFAULT 'daily',
  start_time TIME,
  target_position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_executed_date DATE NULL,
  FOREIGN KEY (shade_id) REFERENCES shades(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description TEXT NOT NULL,
  location VARCHAR(200) NOT NULL,
  priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
  status ENUM('active', 'resolved', 'acknowledged') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  created_by_user_id INT,
  assigned_to_user_id INT NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('reboot', 'override', 'alert', 'update', 'check', 'maintenance', 'installation', 'schedule', 'map_upload') DEFAULT 'update',
  description TEXT NOT NULL,
  time_description VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  user_id INT PRIMARY KEY,
  token VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manual_overrides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shade_id INT,
  user_id INT,
  override_type ENUM('open', 'close', 'partial') DEFAULT 'open',
  position INT DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (shade_id) REFERENCES shades(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert users (password for all: "password123")
-- Hashed with bcrypt, cost factor 10
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Green', 'alice@campus.edu', '$2b$10$Jw7rWUkbCNnpm9YfdgKg0OlhBBFtRHX5fbOxAewDt0S86cSlPRnu6', 'admin'),
('Bob Shade', 'bob@campus.edu', '$2b$10$Jw7rWUkbCNnpm9YfdgKg0OlhBBFtRHX5fbOxAewDt0S86cSlPRnu6', 'maintenance'),
('Dana Planner', 'dana@campus.edu', '$2b$10$Jw7rWUkbCNnpm9YfdgKg0OlhBBFtRHX5fbOxAewDt0S86cSlPRnu6', 'planner'),
('Gal Levy', 'levigal50@gmail.com', '$2b$10$Jw7rWUkbCNnpm9YfdgKg0OlhBBFtRHX5fbOxAewDt0S86cSlPRnu6', 'admin');

-- Area assignments will be added when areas are created
-- For demo: After creating areas, run: INSERT INTO area_assignments (user_id, area_id) VALUES (3, 1), (3, 2);
-- This assigns Dana (planner) to areas 1 and 2

-- Insert building and room data (areas are now empty for user control)
-- Users will add their own areas with maps

-- Insert sample shades for key areas (will be updated when users add areas)
-- INSERT INTO shades (area_id, description, type, current_position, target_position, installed_by_user_id) VALUES
-- (1, 'Sample Shade', 'blinds', 50, 50, 2);

-- Insert sample schedules (will be updated when users add shades)
-- INSERT INTO schedules (shade_id, name, day_of_week, start_time, target_position, created_by_user_id) VALUES
-- (1, 'Sample Schedule', 'daily', '07:00:00', 25, 3);

-- Insert sample alerts
INSERT INTO alerts (description, location, priority, created_by_user_id) VALUES
('System initialized', 'System', 'Low', 1);

-- Insert sample activity log
INSERT INTO activity_log (type, description, time_description, user_id) VALUES
('update', 'System initialized with map support', 'Just now', 1);

-- Insert sample manual overrides (will be updated when users add shades)
-- INSERT INTO manual_overrides (shade_id, user_id, override_type, position, reason) VALUES
-- (1, 2, 'partial', 80, 'Sample override');

SELECT * FROM users;
SELECT * FROM areas ORDER BY building_number, floor;
SELECT * FROM shades;
SELECT * FROM schedules;
SELECT * FROM alerts;
SELECT * FROM manual_overrides;


