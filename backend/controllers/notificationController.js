const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId } = require('../utils/helpers');

const ALLOWED_TYPES = ['payment_due', 'payment_received', 'membership_expiring', 'gym_update', 'general'];

const validateNotification = ({ user_id, title, message, type }) => {
  if (!user_id || !user_id.trim()) {
    return { valid: false, message: 'user_id is required' };
  }
  if (!title || !title.trim()) {
    return { valid: false, message: 'title is required' };
  }
  if (!message || !message.trim()) {
    return { valid: false, message: 'message is required' };
  }
  if (type && !ALLOWED_TYPES.includes(type)) {
    return { valid: false, message: 'type is invalid' };
  }
  return { valid: true };
};

// Create notification
exports.create = async (req, res) => {
  try {
    const { user_id, title, message, type = 'general', scheduled_date = null } = req.body;
    const validation = validateNotification({ user_id, title, message, type });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    
    // Verify user exists
    const userExists = await database.get('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userExists) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    const id = generateId();
    await database.run(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, scheduled_date)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [id, user_id, title, message, type, scheduled_date]
    );
    logger.info('Notification created', { id, user_id, type });
    res.status(201).json({ message: 'Notification created', id });
  } catch (error) {
    logger.error('Create notification error', { error: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

// List notifications for a user
exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const userExists = await database.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found', data: [] });
    }
    
    const items = await database.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC',
      [userId]
    );
    logger.info('Notifications retrieved', { userId, count: items.length });
    res.json({ message: 'Notifications retrieved', data: items });
  } catch (error) {
    logger.error('List notifications error', { error: error.message, stack: error.stack, userId: req.params.userId });
    res.status(500).json({ message: 'Failed to retrieve notifications', error: error.message });
  }
};

// Mark notification read
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('UPDATE notifications SET is_read = 1, sent_date = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ message: 'Notification marked read' });
  } catch (error) {
    logger.error('Mark notification read error', { error: error.message });
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

// Seed monthly notifications (stub)
exports.seedMonthly = async (_req, res) => {
  try {
    const members = await database.all('SELECT u.id as user_id, u.email FROM users u JOIN members m ON u.id = m.user_id');
    const now = new Date();
    const title = 'Monthly Fee Reminder';
    const message = 'Your monthly fee is due soon. Please make payment.';
    for (const m of members) {
      const id = generateId();
      await database.run(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, scheduled_date)
         VALUES (?, ?, ?, ?, 'payment_due', 0, ?)`,
        [id, m.user_id, title, message, now.toISOString()]
      );
    }
    res.json({ message: 'Monthly reminders seeded', count: members.length });
  } catch (error) {
    logger.error('Seed monthly notifications error', { error: error.message });
    res.status(500).json({ message: 'Failed to seed notifications' });
  }
};

// Count unread notifications for a user
exports.unreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await database.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    res.json({ message: 'Unread count retrieved', count: result?.count || 0 });
  } catch (error) {
    logger.error('Unread notifications count error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve unread count' });
  }
};
