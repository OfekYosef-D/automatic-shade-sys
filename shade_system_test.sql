#CREATE DATABASE shade_system_test;
USE shade_system_test;

DROP TABLE IF EXISTS manual_overrides;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS shades;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schedules;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  email VARCHAR(100),
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
  created_by_user_id INT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_id INT,
  description VARCHAR(100),
  type ENUM('umbrella','pergola','blinds','curtains','shutters') DEFAULT 'blinds',
  current_position INT DEFAULT 0, -- 0 = closed, 100 = fully open
  target_position INT DEFAULT 0,
  status ENUM('active', 'under_maintenance', 'inactive') DEFAULT 'active',
  x INT,
  y INT,
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
  end_time TIME,
  target_position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('reboot', 'override', 'alert', 'update', 'check', 'maintenance', 'installation', 'schedule') DEFAULT 'update',
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
  position INT DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (shade_id) REFERENCES shades(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert users
INSERT INTO users (name, email, role) VALUES
('Alice Green', 'alice@campus.edu', 'admin'),
('Bob Shade', 'bob@campus.edu', 'maintenance'),
('Dana Planner', 'dana@campus.edu', 'planner'),
('Gal Levy', 'levigal50@gmail.com', 'admin');

-- Insert building and room data
INSERT INTO areas (building_number, floor, room, room_number, description, created_by_user_id) VALUES
-- Building 1
(1, 'Ground Floor', 'Student Advancement Center', '100', 'המרכז לקידום הסטודנט', 1),
(1, '5th Floor', 'Computer Lab', '500', 'מעבדת מחשבים', 1),
(1, '6th Floor', 'Industrial Engineering Faculty', '', 'הפקולטה להנדסת תעשייה וניהול טכנולוגיה', 1),

-- Building 3
(3, '1st Floor', 'Computer Center', '104', 'מרכז המחשבים', 1),
(3, '2nd Floor', 'Auditorium', '', 'אודיטוריום', 1),

-- Building 5
(5, 'Ground Floor', 'Student Association Club', '', 'מועדון האגודה', 1),
(5, 'Ground Floor', 'Cafeteria', '', 'קפיטריה', 1),
(5, 'Ground Floor', 'Student Association Secretariat', '105', 'מזכירות האגודה', 1),
(5, 'Ground Floor', 'Learning Technologies Faculty', '', 'הפקולטה לטכנולוגיות למידה', 1),
(5, '2nd Floor', 'Student Management', '', 'מנהל הסטודנטים', 1),
(5, '2nd Floor', 'Engineering Faculty', '230', 'הפקולטה להנדסה', 1),
(5, '2nd Floor', 'Engineering Faculty', '231', 'הפקולטה להנדסה', 1),
(5, '2nd Floor', 'Engineering Faculty', '235', 'הפקולטה להנדסה', 1),
(5, '2nd Floor', 'Tuition Department', '201', 'מדור שכר לימוד', 1),
(5, '2nd Floor', 'Student Dean', '202', 'דקנאט הסטודנטים', 1),
(5, '2nd Floor', 'Career Guidance Unit', '202 ג', 'היחידה להכוון תעסוקתי', 1),
(5, '3rd Floor', 'Library', '', 'ספריה', 1),
(5, '3rd Floor', 'Multidisciplinary Studies Department', '314', 'המחלקה ללימודים רב תחומיים', 1),

-- Building 6
(6, '1st Floor', 'Audio-Visual Equipment Rental', '', 'השאלת ציוד אורקולי', 1),
(6, '1st Floor', 'Student Association Club', '', 'מועדון האגודה', 1),
(6, '1st Floor', 'Auditorium', '', 'אודיטוריום', 1),
(6, '4th Floor', 'Design Faculty', '', 'הפקולטה לעיצוב', 1),

-- Building 7
(7, '1st Floor', 'Materials Store', '', 'חנות חומרים (בין בניין 6 ו7)', 1),
(7, 'Ground Floor', 'Light Workshop', '', 'סדנה קלה', 1),
(7, 'Ground Floor', 'Heavy Workshop', '', 'סדנה כבדה', 1),
(7, '1st Floor', 'Self-Study Space', '', 'מרחב ללימוד עצמי', 1),
(7, '1st Floor', 'Printing', '', 'הדפסות', 1),

-- Building 8
(8, 'Ground Floor', 'Digital Technologies in Medicine Faculty', '', 'הפקולטה לטכנולוגיות דיגיטליות ברפואה', 1),
(8, '2nd Floor', 'Self-Study Space', '', 'מרחב ללימוד עצמי', 1),
(8, '3rd Floor', 'Self-Study Space', '', 'מרחב ללימוד עצמי', 1),
(8, '4th Floor', 'Sciences Faculty', '', 'הפקולטה למדעים', 1),
(8, '4th Floor', 'Auditorium', '', 'אודיטוריום', 1);

-- Insert sample shades for key areas
INSERT INTO shades (area_id, description, type, current_position, target_position, installed_by_user_id) VALUES
-- Building 5 Cafeteria (important area)
(7, 'Cafeteria Patio Blinds', 'blinds', 50, 50, 2),
(7, 'Cafeteria Windows', 'curtains', 75, 75, 2),

-- Building 5 Library (important area)
(16, 'Library Main Windows', 'blinds', 25, 25, 2),
(16, 'Library Reading Area', 'curtains', 60, 60, 2),

-- Building 6 Auditorium (important area)
(20, 'Auditorium Stage Curtains', 'curtains', 0, 0, 2),
(20, 'Auditorium Windows', 'blinds', 40, 40, 2),

-- Building 8 Sciences Faculty (important area)
(28, 'Sciences Lab Windows', 'blinds', 30, 30, 2),
(28, 'Sciences Faculty Windows', 'curtains', 45, 45, 2);

-- Insert sample schedules
INSERT INTO schedules (shade_id, name, day_of_week, start_time, end_time, target_position, created_by_user_id) VALUES
(1, 'Cafeteria Morning', 'daily', '07:00:00', '09:00:00', 25, 3),
(1, 'Cafeteria Lunch', 'daily', '12:00:00', '14:00:00', 75, 3),
(1, 'Cafeteria Evening', 'daily', '18:00:00', '20:00:00', 50, 3),
(3, 'Library Opening', 'daily', '08:00:00', '10:00:00', 40, 3),
(3, 'Library Evening', 'daily', '17:00:00', '22:00:00', 20, 3),
(5, 'Auditorium Events', 'daily', '19:00:00', '23:00:00', 0, 3);

-- Insert sample alerts
INSERT INTO alerts (description, location, priority, created_by_user_id) VALUES
('Shade 1 in Cafeteria is stuck', 'Building 5, Cafeteria', 'High', 2),
('Sensor malfunction in Library', 'Building 5, Library', 'Medium', 2),
('Unexpected shade movement in Auditorium', 'Building 6, Auditorium', 'Low', 1);

-- Insert sample activity log
INSERT INTO activity_log (type, description, time_description, user_id) VALUES
('reboot', 'System rebooted successfully', '2 hours ago', 1),
('override', 'Manual override in Cafeteria', '4 hours ago', 2),
('alert', 'Alert triggered in Library', '6 hours ago', 2),
('update', 'System updated shade positions', '8 hours ago', 1),
('schedule', 'New schedule created for Cafeteria', '10 hours ago', 3),
('check', 'System check completed', '12 hours ago', 3);

-- Insert sample manual overrides
INSERT INTO manual_overrides (shade_id, user_id, override_type, position, reason) VALUES
(1, 2, 'partial', 80, 'Special event lighting requirements'),
(3, 1, 'partial', 60, 'Reading comfort adjustment'),
(5, 2, 'close', 0, 'Performance preparation');

SELECT * FROM users;
SELECT * FROM areas ORDER BY building_number, floor;
SELECT * FROM shades;
SELECT * FROM schedules;
SELECT * FROM alerts;
SELECT * FROM manual_overrides;


