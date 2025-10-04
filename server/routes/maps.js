const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connection = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helpers: sanitize and validate
function sanitizeString(input, { maxLength = 1000 } = {}) {
  if (input === undefined || input === null) return null;
  let value = String(input);
  // Trim and remove control characters
  value = value.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  // Strip HTML tags
  value = value.replace(/<[^>]*>/g, '');
  // Enforce length
  if (value.length > maxLength) value = value.slice(0, maxLength);
  return value;
}

function toNullableInt(input) {
  if (input === undefined || input === null || input === '') return null;
  const n = Number(input);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function isSafeSvgFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.svg') return true; // only check svg
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    // Basic checks against embedded scripts/handlers
    if (content.includes('<script') || content.includes('onload=') || content.includes('javascript:')) {
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error checking SVG:', e);
    return false;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/maps';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only image files and SVG
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files and SVG are allowed!'));
    }
  }
});

// Update area metadata (name/description/building/floor/room info)
router.put('/areas/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const areaId = req.params.id;
  const map_name = sanitizeString(req.body.map_name, { maxLength: 255 });
  const map_description = sanitizeString(req.body.map_description, { maxLength: 2000 });
  const building_number = toNullableInt(req.body.building_number);
  const floor = sanitizeString(req.body.floor, { maxLength: 50 });
  const room = sanitizeString(req.body.room, { maxLength: 100 });
  const room_number = sanitizeString(req.body.room_number, { maxLength: 50 });
  const location_note = sanitizeString(req.body.location_note, { maxLength: 100 });
  const description = sanitizeString(req.body.description, { maxLength: 2000 });

  const query = `
    UPDATE areas
    SET 
      map_name = COALESCE(?, map_name),
      map_description = COALESCE(?, map_description),
      building_number = COALESCE(?, building_number),
      floor = COALESCE(?, floor),
      room = COALESCE(?, room),
      room_number = COALESCE(?, room_number),
      location_note = COALESCE(?, location_note),
      description = COALESCE(?, description)
    WHERE id = ?
  `;

  connection.query(
    query,
    [
      map_name ?? null,
      map_description ?? null,
      building_number ?? null,
      floor ?? null,
      room ?? null,
      room_number ?? null,
      location_note ?? null,
      description ?? null,
      areaId
    ],
    (err) => {
      if (err) {
        console.error('Error updating area:', err);
        res.status(500).json({ error: 'Failed to update area' });
        return;
      }
      res.json({ message: 'Area updated successfully' });
    }
  );
});

// Replace area map file
router.put('/areas/:id/map', authenticateToken, requireRole('admin'), upload.single('mapFile'), (req, res) => {
  const areaId = req.params.id;
  const mapFile = req.file;

  if (!mapFile) {
    return res.status(400).json({ error: 'mapFile is required' });
  }

  // Basic SVG safety check
  if (!isSafeSvgFile(mapFile.path)) {
    try { fs.unlinkSync(mapFile.path); } catch {}
    return res.status(400).json({ error: 'Unsafe SVG content detected' });
  }

  // Get existing filename to delete
  const selectQuery = 'SELECT map_file_path FROM areas WHERE id = ?';
  connection.query(selectQuery, [areaId], (err, rows) => {
    if (err) {
      console.error('Error fetching existing map:', err);
      res.status(500).json({ error: 'Failed to replace map' });
      return;
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    const oldFilename = rows[0].map_file_path;
    const newFilename = path.basename(mapFile.path);

    const updateQuery = 'UPDATE areas SET map_file_path = ?, map_file_type = ? WHERE id = ?';
    connection.query(updateQuery, [newFilename, mapFile.mimetype, areaId], (err2) => {
      if (err2) {
        console.error('Error updating area map path:', err2);
        res.status(500).json({ error: 'Failed to save new map' });
        return;
      }

      // Delete old file if present
      if (oldFilename) {
        const oldPath = path.join(__dirname, '../uploads/maps', oldFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old map:', e); }
        }
      }

      res.json({ message: 'Map replaced successfully', filename: newFilename });
    });
  });
});

// Upload a new map and create area
router.post('/upload', authenticateToken, requireRole('admin'), upload.single('mapFile'), (req, res) => {
  try {
    const mapName = sanitizeString(req.body.mapName, { maxLength: 255 });
    const mapDescription = sanitizeString(req.body.mapDescription, { maxLength: 2000 });
    const buildingNumber = toNullableInt(req.body.buildingNumber);
    const floor = sanitizeString(req.body.floor, { maxLength: 50 });
    const room = sanitizeString(req.body.room, { maxLength: 100 });
    const roomNumber = sanitizeString(req.body.roomNumber, { maxLength: 50 });
    const locationNote = sanitizeString(req.body.locationNote, { maxLength: 100 });
    const description = sanitizeString(req.body.description, { maxLength: 2000 });
    const mapFile = req.file;
    

    
    // Validate required fields
    if (!mapName || !mapFile) {
      return res.status(400).json({ error: 'Map name and file are required' });
    }

    // Reject unsafe SVGs
    if (!isSafeSvgFile(mapFile.path)) {
      try { fs.unlinkSync(mapFile.path); } catch {}
      return res.status(400).json({ error: 'Unsafe SVG content detected' });
    }

    // Use authenticated user from JWT
    const userId = req.user.id;

    // Insert new area with map data
    const query = `
      INSERT INTO areas (
        building_number, floor, room, room_number, location_note, description,
        map_name, map_description, map_file_path, map_file_type, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Store only the filename, not the full path
    const filename = path.basename(mapFile.path);
    


  connection.query(query, [
    buildingNumber || null,
    floor || null,
    room || null,
    roomNumber || null,
    locationNote || null,
    description || null,
    mapName,
    mapDescription || null,
    filename, // Store only filename instead of full path
    mapFile.mimetype,
    userId
  ], (err, result) => {
    if (err) {
      console.error('Error creating area:', err);
      res.status(500).json({ error: 'Failed to create area' });
      return;
    }

    // Log the activity
    const logQuery = `
      INSERT INTO activity_log (type, description, time_description, user_id) 
      VALUES ('map_upload', ?, 'Just now', ?)
    `;

    connection.query(logQuery, [`Map "${mapName}" uploaded successfully`, userId], (err) => {
      if (err) {
        console.error('Error logging activity:', err);
      }

      res.status(201).json({
        message: 'Map uploaded successfully',
        areaId: result.insertId,
        mapPath: mapFile.path
      });
    });
  });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload map: ' + error.message });
  }
});

// Get all areas with maps
router.get('/areas', (req, res) => {
  const query = `
    SELECT 
      a.*,
      u.name as created_by_name,
      COUNT(s.id) as device_count
    FROM areas a
    LEFT JOIN users u ON a.created_by_user_id = u.id
    LEFT JOIN shades s ON a.id = s.area_id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `;

  connection.query(query, (err, areas) => {
    if (err) {
      console.error('Error fetching areas:', err);
      res.status(500).json({ error: 'Failed to fetch areas' });
      return;
    }

    // Fix existing data: convert full paths to just filenames
    const fixedAreas = areas.map(area => {
      if (area.map_file_path && area.map_file_path.includes('\\')) {
        // Convert Windows path to just filename
        area.map_file_path = path.basename(area.map_file_path);
      }
      return area;
    });

    res.json(fixedAreas);
  });
});

// Get a specific area with its map and devices
router.get('/areas/:id', (req, res) => {
  const areaId = req.params.id;
  
  // Get area details
  const areaQuery = `
    SELECT 
      a.*,
      u.name as created_by_name
    FROM areas a
    LEFT JOIN users u ON a.created_by_user_id = u.id
    WHERE a.id = ?
  `;

  connection.query(areaQuery, [areaId], (err, areas) => {
    if (err) {
      console.error('Error fetching area:', err);
      res.status(500).json({ error: 'Failed to fetch area' });
      return;
    }

    if (areas.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    const area = areas[0];

    // Get devices in this area
    const devicesQuery = `
      SELECT 
        s.*,
        u.name as installed_by_name
      FROM shades s
      LEFT JOIN users u ON s.installed_by_user_id = u.id
      WHERE s.area_id = ?
      ORDER BY s.id
    `;

    connection.query(devicesQuery, [areaId], (err, devices) => {
      if (err) {
        console.error('Error fetching devices:', err);
        res.status(500).json({ error: 'Failed to fetch devices' });
        return;
      }

      res.json({
        area,
        devices
      });
    });
  });
});

// Serve uploaded map files
router.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/maps', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

// Delete an area and its map
router.delete('/areas/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const areaId = req.params.id;
  
  // Get area info to delete the file
  const selectQuery = 'SELECT map_file_path FROM areas WHERE id = ?';
  
  connection.query(selectQuery, [areaId], (err, areas) => {
    if (err) {
      console.error('Error fetching area for deletion:', err);
      res.status(500).json({ error: 'Failed to fetch area' });
      return;
    }
    
    if (areas.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    const area = areas[0];

    // 1) Delete child records: overrides and schedules for shades in this area
    const deleteOverrides = `DELETE FROM manual_overrides WHERE shade_id IN (SELECT id FROM shades WHERE area_id = ?)`;
    const deleteSchedules = `DELETE FROM schedules WHERE shade_id IN (SELECT id FROM shades WHERE area_id = ?)`;
    const deleteShades = `DELETE FROM shades WHERE area_id = ?`;

    connection.query(deleteOverrides, [areaId], (err) => {
      if (err) {
        console.error('Error deleting overrides for area:', err);
        res.status(500).json({ error: 'Failed to delete overrides' });
        return;
      }

      connection.query(deleteSchedules, [areaId], (err) => {
        if (err) {
          console.error('Error deleting schedules for area:', err);
          res.status(500).json({ error: 'Failed to delete schedules' });
          return;
        }

        connection.query(deleteShades, [areaId], (err) => {
          if (err) {
            console.error('Error deleting shades for area:', err);
            res.status(500).json({ error: 'Failed to delete shades' });
            return;
          }

          // 2) Delete the map file if it exists
          if (area.map_file_path) {
            const filePath = path.join(__dirname, '../uploads/maps', area.map_file_path);
            if (fs.existsSync(filePath)) {
              try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to delete map file:', e); }
            }
          }

          // 3) Delete the area row
          const deleteArea = 'DELETE FROM areas WHERE id = ?';
          connection.query(deleteArea, [areaId], (err) => {
            if (err) {
              console.error('Error deleting area:', err);
              res.status(500).json({ error: 'Failed to delete area' });
              return;
            }

            res.json({ message: 'Area and related records deleted successfully' });
          });
        });
      });
    });
  });
});

module.exports = router;
