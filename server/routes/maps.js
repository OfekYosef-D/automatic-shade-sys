const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connection = require('../db');

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

// Upload a new map and create area
router.post('/upload', upload.single('mapFile'), (req, res) => {
  try {
    const { mapName, mapDescription, buildingNumber, floor, room, roomNumber, locationNote, description } = req.body;
    const mapFile = req.file;
    

    
    // Validate required fields
    if (!mapName || !mapFile) {
      return res.status(400).json({ error: 'Map name and file are required' });
    }

    // For now, use user ID 1 (admin) - in real app, get from auth
    const userId = 1;

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
router.delete('/areas/:id', (req, res) => {
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

    // Delete the map file if it exists
    if (area.map_file_path) {
      const filePath = path.join(__dirname, '../uploads/maps', area.map_file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the area (cascade will handle related records)
    const deleteQuery = 'DELETE FROM areas WHERE id = ?';
    
    connection.query(deleteQuery, [areaId], (err) => {
      if (err) {
        console.error('Error deleting area:', err);
        res.status(500).json({ error: 'Failed to delete area' });
        return;
      }

      res.json({ message: 'Area and map deleted successfully' });
    });
  });
});

module.exports = router;
