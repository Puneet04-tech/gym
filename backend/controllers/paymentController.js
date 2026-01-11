const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId } = require('../utils/helpers');

// Payment stats (admin)
exports.getPaymentStats = async (_req, res) => {
  try {
    const stats = await database.get('SELECT COUNT(*) as total, SUM(amount) as total_amount FROM payments');
    res.json({
      message: 'Payment stats retrieved',
      data: {
        total: stats?.total || 0,
        total_amount: stats?.total_amount || 0,
      },
    });
  } catch (error) {
    logger.error('Get payment stats error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve payment stats' });
  }
};

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const { member_id, subscription_id, amount, payment_method, transaction_id, notes } = req.body;

    // Check if member exists
    const member = await database.get('SELECT id FROM members WHERE id = ?', [member_id]);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const paymentId = generateId();

    await database.run(
      `INSERT INTO payments (id, member_id, subscription_id, amount, payment_method, transaction_id, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)`,
      [paymentId, member_id, subscription_id, amount, payment_method, transaction_id, notes]
    );

    logger.info('Payment created', { paymentId, memberId: member_id, amount });

    res.status(201).json({
      message: 'Payment created successfully',
      paymentId,
    });
  } catch (error) {
    logger.error('Create payment error', { error: error.message });
    res.status(500).json({ message: 'Failed to create payment' });
  }
};

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const payments = await database.all(
      `SELECT p.*, u.username, u.email FROM payments p
       JOIN members m ON p.member_id = m.id
       JOIN users u ON m.user_id = u.id
       ORDER BY p.payment_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await database.get('SELECT COUNT(*) as total FROM payments');

    res.json({
      message: 'Payments retrieved successfully',
      data: payments,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all payments error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve payments' });
  }
};

// Get payments by member
exports.getPaymentsByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if member exists
    const member = await database.get('SELECT id FROM members WHERE id = ?', [memberId]);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const payments = await database.all(
      `SELECT * FROM payments WHERE member_id = ? ORDER BY payment_date DESC LIMIT ? OFFSET ?`,
      [memberId, limit, offset]
    );

    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM payments WHERE member_id = ?',
      [memberId]
    );

    res.json({
      message: 'Member payments retrieved successfully',
      data: payments,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    logger.error('Get payments by member error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve payments' });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await database.get(
      `SELECT p.*, u.username, u.email FROM payments p
       JOIN members m ON p.member_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      message: 'Payment retrieved successfully',
      data: payment,
    });
  } catch (error) {
    logger.error('Get payment by ID error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve payment' });
  }
};

module.exports = exports;
