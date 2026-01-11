const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId, validatePhone } = require('../utils/helpers');

// Member stats (admin)
exports.getMemberStats = async (_req, res) => {
  try {
    const stats = await database.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active
      FROM members
    `);

    res.json({
      message: 'Member stats retrieved',
      data: {
        total: stats?.total || 0,
        active: stats?.active || 0,
      },
    });
  } catch (error) {
    logger.error('Get member stats error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve member stats' });
  }
};

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const members = await database.all(
      `SELECT m.*, u.username, u.email, u.first_name, u.last_name, u.phone
       FROM members m
       JOIN users u ON m.user_id = u.id
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await database.get('SELECT COUNT(*) as total FROM members');

    logger.info('Retrieved all members', { count: members.length });

    res.json({
      message: 'Members retrieved successfully',
      data: members,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all members error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve members' });
  }
};

// Get member by ID
exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await database.get(
      `SELECT m.*, u.username, u.email, u.first_name, u.last_name, u.phone, u.address
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [id]
    );

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({
      message: 'Member retrieved successfully',
      data: member,
    });
  } catch (error) {
    logger.error('Get member by ID error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve member' });
  }
};

// Add new member
exports.addMember = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      emergency_contact,
      emergency_phone,
      medical_conditions,
    } = req.body;

    // Validate phone
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone format' });
    }

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }

    const { hashPassword } = require('../utils/helpers');
    const userId = generateId();
    const memberId = generateId();
    const hashedPassword = await hashPassword(password);

    // Begin transaction
    await database.beginTransaction();

    try {
      // Create user
      await database.run(
        `INSERT INTO users (id, username, email, password, first_name, last_name, phone, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'member', 1)`,
        [userId, username, email, hashedPassword, first_name, last_name, phone]
      );

      // Create member
      await database.run(
        `INSERT INTO members (id, user_id, emergency_contact, emergency_phone, medical_conditions, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [memberId, userId, emergency_contact, emergency_phone, medical_conditions]
      );

      await database.commit();

      logger.info('New member added', { memberId, userId, email });

      res.status(201).json({
        message: 'Member added successfully',
        memberId,
        userId,
      });
    } catch (error) {
      await database.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Add member error', { error: error.message });
    res.status(500).json({ message: 'Failed to add member' });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      phone,
      address,
      city,
      state,
      postal_code,
      emergency_contact,
      emergency_phone,
      medical_conditions,
      membership_status,
    } = req.body;

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone format' });
    }

    // Check if member exists
    const member = await database.get('SELECT user_id FROM members WHERE id = ?', [id]);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Begin transaction
    await database.beginTransaction();

    try {
      // Update user info
      await database.run(
        `UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, state = ?, postal_code = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [first_name, last_name, phone, address, city, state, postal_code, member.user_id]
      );

      // Update member info
      await database.run(
        `UPDATE members SET emergency_contact = ?, emergency_phone = ?, medical_conditions = ?, membership_status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [emergency_contact, emergency_phone, medical_conditions, membership_status, id]
      );

      await database.commit();

      logger.info('Member updated', { memberId: id });

      res.json({
        message: 'Member updated successfully',
      });
    } catch (error) {
      await database.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Update member error', { error: error.message });
    res.status(500).json({ message: 'Failed to update member' });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const member = await database.get('SELECT user_id FROM members WHERE id = ?', [id]);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Delete member (cascade delete via FK)
    await database.run('DELETE FROM members WHERE id = ?', [id]);

    logger.info('Member deleted', { memberId: id });

    res.json({
      message: 'Member deleted successfully',
    });
  } catch (error) {
    logger.error('Delete member error', { error: error.message });
    res.status(500).json({ message: 'Failed to delete member' });
  }
};

// Search members
exports.searchMembers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const members = await database.all(
      `SELECT m.*, u.username, u.email, u.first_name, u.last_name, u.phone
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );

    logger.info('Members search performed', { query: q, results: members.length });

    res.json({
      message: 'Search completed successfully',
      data: members,
    });
  } catch (error) {
    logger.error('Search members error', { error: error.message });
    res.status(500).json({ message: 'Search failed' });
  }
};

module.exports = exports;
