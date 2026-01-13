const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('./logger');
const fs = require('fs');

// Use absolute path to ensure data persists
const dbPath = process.env.DB_PATH 
  ? (path.isAbsolute(process.env.DB_PATH) 
      ? process.env.DB_PATH 
      : path.resolve(process.cwd(), process.env.DB_PATH))
  : path.join(__dirname, '../database/gym_management.db');

// Ensure directory exists for SQLite file
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Log the actual database path being used
console.log('SQLite database path:', dbPath);

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Database connection failed', { error: err.message });
          reject(err);
        } else {
          logger.info('Database connected successfully', { path: dbPath });
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
              logger.error('Failed to enable foreign keys', { error: err.message });
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  // Run query
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          logger.error('Database error on run', { sql, error: err.message });
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database error on get', { sql, error: err.message });
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all rows
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database error on all', { sql, error: err.message });
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Execute multiple statements
  async exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          logger.error('Database error on exec', { error: err.message });
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database', { error: err.message });
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Begin transaction
  async beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  // Commit transaction
  async commit() {
    return this.run('COMMIT');
  }

  // Rollback transaction
  async rollback() {
    return this.run('ROLLBACK');
  }
}

module.exports = new Database();
