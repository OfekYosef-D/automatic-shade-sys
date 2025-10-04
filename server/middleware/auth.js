const jwt = require('jsonwebtoken');
const connection = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // Attach user info to request
        req.user = user;
        next();
    });
};

// Middleware to check if user has required role
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Permission denied: ${allowedRoles.join(' or ')} role required`,
                requiredRole: allowedRoles.join(' or '),
                yourRole: req.user.role
            });
        }

        next();
    };
};

// Middleware to check area access for planners
const checkAreaAccess = (getAreaIdFromReq) => {
    return (req, res, next) => {
        // Admin and Maintenance have access to all areas
        if (req.user.role === 'admin' || req.user.role === 'maintenance') {
            return next();
        }

        // Planners need explicit area assignment
        const areaId = getAreaIdFromReq(req);
        if (!areaId) {
            return res.status(400).json({ error: 'Area ID required' });
        }

        const query = 'SELECT 1 FROM area_assignments WHERE user_id = ? AND area_id = ?';
        connection.query(query, [req.user.id, areaId], (err, results) => {
            if (err) {
                console.error('Error checking area access:', err);
                return res.status(500).json({ error: 'Permission check failed' });
            }

            if (results.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied: You are not assigned to this area',
                    requiredRole: 'admin or maintenance',
                    yourRole: req.user.role
                });
            }

            next();
        });
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    checkAreaAccess
};

