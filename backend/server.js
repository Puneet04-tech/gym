require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const database = require('../config/database');
const { logger, httpRequestLogger } = require('../config/logger');
const { errorHandler, logActivity } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const feePackageRoutes = require('./routes/feePackageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const storeRoutes = require('./routes/storeRoutes');
const dietRoutes = require('./routes/dietRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://gym-app-b5298.web.app,https://gym-app-b5298.firebaseapp.com').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware
app.use(httpRequestLogger);
app.use(logActivity);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Gym Management API is running',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fee-packages', feePackageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/reports', reportRoutes);

// Serve frontend files for spa routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// 404 Handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use(errorHandler);

// Database initialization and server start with port fallback
const startServer = async () => {
  try {
    await database.initialize();
    logger.info('Database connection established');

    const desiredPort = PORT;
    const maxRetries = 5;

    const listenOnPort = (port, attempt = 0) => new Promise((resolve, reject) => {
      const server = app.listen(port, HOST, () => {
        console.log(`
╔════════════════════════════════════════╗
║  Gym Management System API             ║
║  Server running successfully!          ║
╠════════════════════════════════════════╣
║  Host: http://${HOST}:${port}
║  Environment: ${process.env.NODE_ENV || 'development'}
║  Database: ${process.env.DB_PATH || './database/gym_management.db'}
╚════════════════════════════════════════╝
        `);
        logger.info('Server started', { host: HOST, port });
        resolve(server);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && attempt < maxRetries) {
          const nextPort = port + 1;
          logger.warn('Port in use, retrying with next port', { port, nextPort });
          setTimeout(() => {
            listenOnPort(nextPort, attempt + 1).then(resolve).catch(reject);
          }, 150);
        } else {
          reject(err);
        }
      });
    });

    await listenOnPort(desiredPort);
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

// Start the server only when executed directly (not during tests/imports)
if (require.main === module) {
  startServer();
}

module.exports = app;
