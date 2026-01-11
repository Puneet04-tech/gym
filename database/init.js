require('dotenv').config();
const database = require('../config/database');
const { logger } = require('../config/logger');
const path = require('path');
const fs = require('fs');
const { hashPassword, generateId, generateBillNumber, calculateBillTotal } = require('../backend/utils/helpers');
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123';

const initializeDatabase = async () => {
  try {
    await database.initialize();
    logger.info('Creating database tables...');

    // Users table
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
    logger.info('Created users table');

    // Members table
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
    logger.info('Created members table');

    // Fee Packages table
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
    logger.info('Created fee_packages table');

    // Member Subscriptions table
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
    logger.info('Created member_subscriptions table');

    // Payments table
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
    logger.info('Created payments table');

    // Bills table
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
    logger.info('Created bills table');

    // Notifications table
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
    logger.info('Created notifications table');

    // Gym Status table
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
    logger.info('Created gym_status table');

    // Activity Logs table
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
    logger.info('Created activity_logs table');

    // Create indexes for better performance
    await database.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_bills_member_id ON bills(member_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON member_subscriptions(member_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)');

    // Supplements table (store)
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
    logger.info('Created supplements table');

    // Diet plans table
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
    logger.info('Created diets table');

    // Seed or refresh default admin user idempotently
    const existingAdmin = await database.get(
      'SELECT id, email, username FROM users WHERE email = ? OR username = ?',
      [DEFAULT_ADMIN_EMAIL, 'admin']
    );

    if (!existingAdmin) {
      const adminId = generateId();
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);

      await database.run(
        `INSERT INTO users (id, username, email, password, first_name, last_name, role, is_active)
         VALUES (?, 'admin', ?, ?, 'Admin', 'User', 'admin', 1)`,
        [adminId, DEFAULT_ADMIN_EMAIL, hashedPassword]
      );

      logger.info('Seeded default admin user', { adminId, email: DEFAULT_ADMIN_EMAIL });
      console.log(`\n👤 Seeded admin user: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
    } else {
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      await database.run(
        `UPDATE users
         SET email = ?, username = 'admin', password = ?, role = 'admin', is_active = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [DEFAULT_ADMIN_EMAIL, hashedPassword, existingAdmin.id]
      );
      logger.info('Refreshed default admin user', { adminId: existingAdmin.id, email: DEFAULT_ADMIN_EMAIL });
      console.log(`\n👤 Refreshed admin user: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
    }

    // Seed sample members, payments, and bills idempotently
    const sampleUsers = [
      {
        username: 'alice',
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Wong',
        phone: '555-1001',
        password: 'Password123',
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        first_name: 'Bob',
        last_name: 'Garcia',
        phone: '555-1002',
        password: 'Password123',
      },
      {
        username: 'carol',
        email: 'carol@example.com',
        first_name: 'Carol',
        last_name: 'Singh',
        phone: '555-1003',
        password: 'Password123',
      },
    ];

    for (const user of sampleUsers) {
      const existing = await database.get('SELECT id FROM users WHERE email = ? OR username = ?', [user.email, user.username]);
      const userId = existing ? existing.id : generateId();
      let memberId;

      const hashed = await hashPassword(user.password);

      if (!existing) {
        await database.run(
          `INSERT INTO users (id, username, email, password, first_name, last_name, phone, role, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'member', 1)`,
          [userId, user.username, user.email, hashed, user.first_name, user.last_name, user.phone]
        );
      }

      const existingMember = await database.get('SELECT id FROM members WHERE user_id = ?', [userId]);
      if (existingMember) {
        memberId = existingMember.id;
      } else {
        memberId = generateId();
        await database.run(
          `INSERT INTO members (id, user_id, membership_status, is_active)
           VALUES (?, ?, 'active', 1)`,
          [memberId, userId]
        );
      }

      // Seed a payment if none exist for this member
      const existingPayment = await database.get('SELECT id FROM payments WHERE member_id = ? LIMIT 1', [memberId]);
      let paymentId;
      if (existingPayment) {
        paymentId = existingPayment.id;
      } else {
        paymentId = generateId();
        const amount = 49.99;
        await database.run(
          `INSERT INTO payments (id, member_id, amount, payment_method, status)
           VALUES (?, ?, ?, 'card', 'completed')`,
          [paymentId, memberId, amount]
        );
      }

      // Seed a bill linked to the payment if none exist
      const existingBill = await database.get('SELECT id FROM bills WHERE member_id = ? LIMIT 1', [memberId]);
      if (!existingBill) {
        const billId = generateId();
        const billNumber = generateBillNumber();
        const amount = 49.99;
        const { total } = calculateBillTotal(amount, 5);
        await database.run(
          `INSERT INTO bills (id, member_id, payment_id, bill_number, amount, tax, total, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'generated')`,
          [billId, memberId, paymentId, billNumber, amount, 5, total]
        );
        logger.info('Seeded member with payment and bill', { memberId, paymentId, billId });
      }
    }

    console.log('\n👥 Seeded sample members with payments and bills.');

    logger.info('Database initialization completed successfully');
    console.log('\n✅ Database initialized successfully!');
    console.log('📁 Database file created at:', path.resolve(process.env.DB_PATH || './database/gym_management.db'));
    console.log('\nTables created:');
    console.log('  - users');
    console.log('  - members');
    console.log('  - fee_packages');
    console.log('  - member_subscriptions');
    console.log('  - payments');
    console.log('  - bills');
    console.log('  - notifications');
    console.log('  - gym_status');
    console.log('  - activity_logs');

    await database.close();
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initializeDatabase();
