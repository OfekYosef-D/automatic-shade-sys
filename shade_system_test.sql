#CREATE DATABASE shade_system_test;
USE shade_system_test;

DROP TABLE IF EXISTS manual_overrides;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS shades;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100),
  role ENUM('admin', 'maintenance', 'planner') DEFAULT 'planner'
);

CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_number INT,
  room VARCHAR(50),
  location_note VARCHAR(100), -- 'Near Building 5 Cafeteria Patio'
  description TEXT,
  created_by_user_id INT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_id INT,
  description VARCHAR(100),
  type ENUM('umbrella','pergola','blinds') DEFAULT 'blinds',
  x INT,
  y INT,
  installed_by_user_id INT,
  status ENUM('active', 'under_maintenance', 'inactive') DEFAULT 'active',
  FOREIGN KEY (area_id) REFERENCES areas(id),
  FOREIGN KEY (installed_by_user_id) REFERENCES users(id)
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
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('reboot', 'override', 'alert', 'update', 'check', 'maintenance', 'installation') DEFAULT 'update',
  description TEXT NOT NULL,
  time_description VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS manual_overrides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shade_id INT,
  user_id INT,
  override_type ENUM('open', 'close', 'partial') DEFAULT 'open',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (shade_id) REFERENCES shades(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);




INSERT INTO users (name, email, role) VALUES
('Alice Green', 'alice@campus.edu', 'admin'),
('Bob Shade', 'bob@campus.edu', 'maintenance'),
('Dana Planner', 'dana@campus.edu', 'planner');

INSERT INTO areas (building_number, room, location_note, description, created_by_user_id) VALUES
(5, 'Cafeteria', 'Near outdoor seating', 'Sunny area outside the cafeteria', 3),
(2, 'Library Entrance', 'Left side of main doors', 'Students gather here often', 3),
(7, 'Gym', 'By basketball court', 'Spectator seating exposed to sun', 2);

INSERT INTO shades (area_id, description, type, x, y, installed_by_user_id) VALUES
(1, 'Large Campus Umbrella', 'umbrella', 10, 15, 2),
(2, 'Retractable Blinds', 'blinds', 5, 10, 2),
(3, 'Wooden Pergola Over Seating', 'pergola', 8, 12, 1);

INSERT INTO alerts (description, location, priority, created_by_user_id) VALUES
('Shade 12 in Room 203 is stuck', 'Building A, Room 203', 'High', 2),
('Sensor malfunction in Room 101', 'Building B, Room 101', 'Medium', 2),
('Unexpected shade movement', 'Building C, Room 305', 'Low', 1);


-- Insert sample activity log
INSERT INTO activity_log (type, description, time_description, user_id) VALUES
('reboot', 'System rebooted successfully', '2 hours ago', 1),
('override', 'Manual override in Room 203', '4 hours ago', 2),
('alert', 'Alert triggered in Room 101', '6 hours ago', 2),
('update', 'System updated shade positions', '8 hours ago', 1),
('check', 'System check completed', '10 hours ago', 3);

-- Insert sample manual overrides
INSERT INTO manual_overrides (shade_id, user_id, override_type, reason) VALUES
(1, 2, 'close', 'Emergency weather conditions'),
(2, 1, 'partial', 'Special event lighting requirements'),
(3, 2, 'open', 'Maintenance testing');


SELECT * FROM users;
SELECT * FROM alerts;
SELECT * FROM manual_overrides;


