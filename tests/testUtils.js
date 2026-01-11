const database = require('../config/database');

// Ensure minimal schema exists for tests (no seeding)
async function ensureTables() {
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
}

async function clearTables() {
  await database.run('PRAGMA foreign_keys = OFF');
  const tables = [
    'bills',
    'payments',
    'member_subscriptions',
    'diets',
    'notifications',
    'activity_logs',
    'members',
    'users',
    'fee_packages',
    'supplements',
    'gym_status',
  ];

  for (const table of tables) {
    await database.run(`DELETE FROM ${table}`);
  }

  await database.run('PRAGMA foreign_keys = ON');
}

async function resetDatabase() {
  await ensureTables();
  await clearTables();
}

module.exports = {
  ensureTables,
  resetDatabase,
};