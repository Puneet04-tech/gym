const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId } = require('../utils/helpers');

const validateSupplement = ({ name, price, stock }) => {
  const priceNumber = parseFloat(price);
  const stockNumber = stock !== undefined ? parseInt(stock, 10) : 0;

  if (!name || !name.trim()) {
    return { valid: false, message: 'Name is required' };
  }
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return { valid: false, message: 'Price must be a positive number' };
  }
  if (Number.isNaN(stockNumber) || stockNumber < 0) {
    return { valid: false, message: 'Stock must be zero or a positive integer' };
  }

  return { valid: true, priceNumber, stockNumber };
};

// Get supplement by id
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await database.get('SELECT * FROM supplements WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ message: 'Supplement not found' });
    }
    res.json({ message: 'Supplement retrieved', data: item });
  } catch (error) {
    logger.error('Get supplement error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve supplement' });
  }
};

// List supplements
exports.list = async (_req, res) => {
  try {
    const items = await database.all('SELECT * FROM supplements WHERE is_active = 1');
    res.json({ message: 'Supplements retrieved', data: items });
  } catch (error) {
    logger.error('List supplements error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve supplements' });
  }
};

// Create supplement
exports.create = async (req, res) => {
  try {
    const { name, description, price, stock = 0, is_active = 1 } = req.body;
    const validation = validateSupplement({ name, price, stock });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const id = generateId();
    await database.run(
      `INSERT INTO supplements (id, name, description, price, stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), description, validation.priceNumber, validation.stockNumber, is_active]
    );
    res.status(201).json({ message: 'Supplement created', id });
  } catch (error) {
    logger.error('Create supplement error', { error: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ message: 'Failed to create supplement', error: error.message });
  }
};

// Update supplement
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, is_active } = req.body;
    const validation = validateSupplement({ name, price, stock });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    await database.run(
      `UPDATE supplements SET name = ?, description = ?, price = ?, stock = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name.trim(), description, validation.priceNumber, validation.stockNumber, is_active, id]
    );
    res.json({ message: 'Supplement updated' });
  } catch (error) {
    logger.error('Update supplement error', { error: error.message });
    res.status(500).json({ message: 'Failed to update supplement' });
  }
};

// Delete supplement
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('DELETE FROM supplements WHERE id = ?', [id]);
    res.json({ message: 'Supplement deleted' });
  } catch (error) {
    logger.error('Delete supplement error', { error: error.message });
    res.status(500).json({ message: 'Failed to delete supplement' });
  }
};
