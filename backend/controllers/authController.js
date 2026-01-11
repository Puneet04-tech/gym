const database = require('../../config/database');
const { logger } = require('../../config/logger');
const {
  generateId,
  hashPassword,
  comparePassword,
  generateToken,
  validateEmail,
  validatePhone,
} = require('../utils/helpers');

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123';

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role = 'user' } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }

    const userId = generateId();
    const hashedPassword = await hashPassword(password);

    await database.run(
      `INSERT INTO users (id, username, email, password, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, email, hashedPassword, first_name, last_name, role]
    );

    logger.info('User registered successfully', { userId, email, role });

    // If registering as member, create member record and return the id
    let memberId = null;
    if (role === 'member') {
      memberId = generateId();
      await database.run(
        `INSERT INTO members (id, user_id) VALUES (?, ?)`,
        [memberId, userId]
      );
      logger.info('Member record created', { memberId, userId });
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId,
      memberId,
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    let user = await database.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // Auto-create default admin if requested credentials match
    if (!user && email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      const adminId = generateId();
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);

      await database.run(
        `INSERT INTO users (id, username, email, password, first_name, last_name, role, is_active)
         VALUES (?, 'admin', ?, ?, 'Admin', 'User', 'admin', 1)`,
        [adminId, DEFAULT_ADMIN_EMAIL, hashedPassword]
      );

      logger.info('Auto-created default admin during login', { adminId, email: DEFAULT_ADMIN_EMAIL });

      user = await database.get(
        'SELECT * FROM users WHERE id = ?',
        [adminId]
      );
    }

    if (!user) {
      logger.warn('Login attempt with invalid email', { email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    let isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid && user.email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      // Reset admin password to default and allow login
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      await database.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      isPasswordValid = true;
      logger.warn('Reset default admin password during login', { userId: user.id });
    }

    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { userId: user.id });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login attempt with inactive account', { userId: user.id });
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Ensure member record exists for member users and capture member id
    let member = null;
    if (user.role === 'member') {
      member = await database.get(
        'SELECT id FROM members WHERE user_id = ?',
        [user.id]
      );

      if (!member) {
        const memberId = generateId();
        await database.run(
          `INSERT INTO members (id, user_id) VALUES (?, ?)`,
          [memberId, user.id]
        );
        member = { id: memberId };
        logger.info('Backfilled member record during login', { memberId, userId: user.id });
      }
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        member_id: member ? member.id : undefined,
      },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ message: 'Login failed' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await database.get(
      'SELECT id, username, email, first_name, last_name, phone, address, city, state, postal_code, role, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user,
    });
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, address, city, state, postal_code } = req.body;

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone format' });
    }

    await database.run(
      `UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, state = ?, postal_code = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [first_name, last_name, phone, address, city, state, postal_code, userId]
    );

    logger.info('User profile updated', { userId });

    res.json({
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Get user
    const user = await database.get('SELECT password FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await database.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    logger.info('User password changed', { userId });

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error', { error: error.message });
    res.status(500).json({ message: 'Failed to change password' });
  }
};

module.exports = exports;
