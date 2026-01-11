const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId } = require('../utils/helpers');

const isNumber = (value) => Number.isFinite(value);

const validatePayload = ({ name, monthly_fee, duration_days }) => {
  const monthlyFeeNumber = parseFloat(monthly_fee);
  const durationNumber = duration_days !== undefined ? parseInt(duration_days, 10) : null;

  if (!name || !name.trim()) {
    return { valid: false, message: 'Name is required' };
  }

  if (!isNumber(monthlyFeeNumber) || monthlyFeeNumber < 0) {
    return { valid: false, message: 'Monthly fee must be a positive number' };
  }

  if (duration_days !== undefined && (Number.isNaN(durationNumber) || durationNumber < 0)) {
    return { valid: false, message: 'Duration days must be a positive integer' };
  }

  return { valid: true, monthlyFeeNumber, durationNumber };
};

// List fee packages
exports.list = async (req, res) => {
  try {
    const packages = await database.all('SELECT * FROM fee_packages WHERE is_active = 1');
    res.json({ message: 'Fee packages retrieved', data: packages });
  } catch (error) {
    logger.error('Fee packages list error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve fee packages' });
  }
};

// Create fee package
exports.create = async (req, res) => {
  try {
    const { name, description, monthly_fee, duration_days, benefits, is_active = 1 } = req.body;
    const validation = validatePayload({ name, monthly_fee, duration_days });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const id = generateId();
    await database.run(
      `INSERT INTO fee_packages (id, name, description, monthly_fee, duration_days, benefits, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
      , [id, name.trim(), description, validation.monthlyFeeNumber, validation.durationNumber, benefits, is_active]
    );
    res.status(201).json({ message: 'Fee package created', id });
  } catch (error) {
    logger.error('Fee package create error', { error: error.message });
    res.status(500).json({ message: 'Failed to create fee package' });
  }
};

// Update fee package
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, monthly_fee, duration_days, benefits, is_active } = req.body;
    const validation = validatePayload({ name, monthly_fee, duration_days });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    await database.run(
      `UPDATE fee_packages SET name = ?, description = ?, monthly_fee = ?, duration_days = ?, benefits = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name.trim(), description, validation.monthlyFeeNumber, validation.durationNumber, benefits, is_active, id]
    );
    res.json({ message: 'Fee package updated' });
  } catch (error) {
    logger.error('Fee package update error', { error: error.message });
    res.status(500).json({ message: 'Failed to update fee package' });
  }
};

// Delete fee package
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('DELETE FROM fee_packages WHERE id = ?', [id]);
    res.json({ message: 'Fee package deleted' });
  } catch (error) {
    logger.error('Fee package delete error', { error: error.message });
    res.status(500).json({ message: 'Failed to delete fee package' });
  }
};
