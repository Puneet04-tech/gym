const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId } = require('../utils/helpers');

const validateAssign = ({ member_id, fee_package_id }) => {
  if (!member_id || !member_id.trim()) {
    return { valid: false, message: 'member_id is required' };
  }
  if (!fee_package_id || !fee_package_id.trim()) {
    return { valid: false, message: 'fee_package_id is required' };
  }
  return { valid: true };
};

// Assign subscription to member
exports.assign = async (req, res) => {
  try {
    const { member_id, fee_package_id, start_date, end_date } = req.body;
    const validation = validateAssign({ member_id, fee_package_id });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const id = generateId();
    await database.run(
      `INSERT INTO member_subscriptions (id, member_id, fee_package_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [id, member_id.trim(), fee_package_id.trim(), start_date || null, end_date || null]
    );
    res.status(201).json({ message: 'Subscription assigned', id });
  } catch (error) {
    logger.error('Assign subscription error', { error: error.message });
    res.status(500).json({ message: 'Failed to assign subscription' });
  }
};

// List subscriptions for member
exports.listByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const subs = await database.all(
      `SELECT s.*, f.name as package_name, f.monthly_fee
       FROM member_subscriptions s
       JOIN fee_packages f ON s.fee_package_id = f.id
       WHERE s.member_id = ?`,
      [memberId]
    );
    res.json({ message: 'Subscriptions retrieved', data: subs });
  } catch (error) {
    logger.error('List subscriptions error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve subscriptions' });
  }
};
