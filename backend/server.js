require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const database = require('../config/database');
const { logger, httpRequestLogger } = require('../config/logger');
const { hashPassword, generateId } = require('./utils/helpers');
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

// Ensure required tables exist (lightweight runtime init for Render)
const ensureCoreTables = async () => {
  await database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT CHECK(role IN ('admin', 'member', 'user')) NOT NULL DEFAULT 'user',
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      membership_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      membership_status TEXT CHECK(membership_status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
      emergency_contact TEXT,
      emergency_phone TEXT,
      medical_conditions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS fee_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      monthly_fee DECIMAL(10, 2) NOT NULL,
      duration_days INTEGER,
      benefits TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS member_subscriptions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      fee_package_id TEXT NOT NULL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      renewal_date DATETIME,
      status TEXT CHECK(status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (fee_package_id) REFERENCES fee_packages(id)
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      subscription_id TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'upi', 'cheque')) NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      transaction_id TEXT UNIQUE,
      status TEXT CHECK(status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES member_subscriptions(id)
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      bill_number TEXT UNIQUE NOT NULL,
      bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      amount DECIMAL(10, 2) NOT NULL,
      tax DECIMAL(10, 2) DEFAULT 0,
      total DECIMAL(10, 2) NOT NULL,
      status TEXT CHECK(status IN ('generated', 'emailed', 'downloaded', 'printed')) DEFAULT 'generated',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('payment_due', 'payment_received', 'membership_expiring', 'gym_update', 'general')) DEFAULT 'general',
      is_read INTEGER DEFAULT 0,
      scheduled_date DATETIME,
      sent_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS gym_status (
      id TEXT PRIMARY KEY,
      gym_name TEXT NOT NULL,
      is_open INTEGER DEFAULT 1,
      status TEXT CHECK(status IN ('open', 'closed', 'maintenance')) DEFAULT 'open',
      opening_time TIME,
      closing_time TIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS supplements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.run(`
    CREATE TABLE IF NOT EXISTS diets (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      title TEXT,
      plan TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);
};

const seedDefaultAdmin = async () => {
  const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123';

  const existing = await database.get('SELECT id FROM users WHERE email = ? OR username = ?', [DEFAULT_ADMIN_EMAIL, 'admin']);
  if (existing) {
    return;
  }

  const adminId = generateId();
  const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  await database.run(
    `INSERT INTO users (id, username, email, password, first_name, last_name, role, is_active)
     VALUES (?, 'admin', ?, ?, 'Admin', 'User', 'admin', 1)`,
    [adminId, DEFAULT_ADMIN_EMAIL, hashedPassword]
  );
  logger.info('Seeded default admin user', { adminId, email: DEFAULT_ADMIN_EMAIL });
};

// Middleware
const defaultOrigins = ['http://localhost:3000', 'https://gym-app-b5298.web.app', 'https://gym-app-b5298.firebaseapp.com'];
const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and any whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn('CORS blocked request', { origin });
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Explicit 403 handler for CORS rejections
app.use((err, req, res, next) => {
  if (err?.message === 'CORS not allowed') {
    return res.status(403).json({ message: 'CORS not allowed' });
  }
  return next(err);
});

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
    await ensureCoreTables();
    await seedDefaultAdmin();
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
