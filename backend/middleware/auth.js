const { verifyToken } = require('../utils/helpers');
const { logger } = require('../../config/logger');
const database = require('../../config/database');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('No token provided for authentication');
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn('Invalid token provided');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Authorization middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Unauthorized access attempt', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
        });
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      next();
    } catch (error) {
      logger.error('Authorization error', { error: error.message });
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      logger.warn('Validation error', {
        path: req.path,
        error: error.details[0].message,
      });
      return res.status(400).json({ message: error.details[0].message });
    }
    req.validatedData = value;
    next();
  };
};

// Activity logging middleware
const logActivity = async (req, res, next) => {
  try {
    if (req.user) {
      const { generateId } = require('../utils/helpers');
      
      // Log after response is sent
      res.on('finish', async () => {
        if (res.statusCode < 400) {
          try {
            await database.run(
              `INSERT INTO activity_logs (id, user_id, action, ip_address, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [generateId(), req.user.id, `${req.method} ${req.path}`, req.ip]
            );
          } catch (error) {
            logger.error('Failed to log activity', { error: error.message });
          }
        }
      });
    }
    next();
  } catch (error) {
    logger.error('Activity logging error', { error: error.message });
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  errorHandler,
  validateRequest,
  logActivity,
};
