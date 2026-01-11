const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId } = require('../utils/helpers');

const validateDiet = ({ member_id, title, plan }) => {
  if (!member_id || !member_id.trim()) {
    return { valid: false, message: 'member_id is required' };
  }
  if (!title && !plan) {
    return { valid: false, message: 'At least a title or plan is required' };
  }
  return { valid: true };
};

// List all diets (admin)
exports.listAll = async (_req, res) => {
  try {
    const items = await database.all(`
      SELECT d.*, m.user_id
      FROM diets d
      LEFT JOIN members m ON d.member_id = m.id
    `);
    res.json({ message: 'Diets retrieved', data: items });
  } catch (error) {
    logger.error('List all diets error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve diets' });
  }
};

// List diets for member
exports.listByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const items = await database.all('SELECT * FROM diets WHERE member_id = ?', [memberId]);
    res.json({ message: 'Diets retrieved', data: items });
  } catch (error) {
    logger.error('List diets error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve diets' });
  }
};

// Create diet
exports.create = async (req, res) => {
  try {
    const { member_id, title, plan, notes } = req.body;
    const validation = validateDiet({ member_id, title, plan });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const id = generateId();
    await database.run(
      `INSERT INTO diets (id, member_id, title, plan, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, member_id.trim(), title, plan, notes]
    );
    res.status(201).json({ message: 'Diet created', id });
  } catch (error) {
    logger.error('Create diet error', { error: error.message });
    res.status(500).json({ message: 'Failed to create diet' });
  }
};

// Update diet
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, plan, notes } = req.body;
    if (!title && !plan && !notes) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    await database.run(
      `UPDATE diets SET title = ?, plan = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, plan, notes, id]
    );
    res.json({ message: 'Diet updated' });
  } catch (error) {
    logger.error('Update diet error', { error: error.message });
    res.status(500).json({ message: 'Failed to update diet' });
  }
};

// Get single diet
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await database.get('SELECT * FROM diets WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ message: 'Diet not found' });
    }
    res.json({ message: 'Diet retrieved', data: item });
  } catch (error) {
    logger.error('Get diet error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve diet' });
  }
};

// Delete diet
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('DELETE FROM diets WHERE id = ?', [id]);
    res.json({ message: 'Diet deleted' });
  } catch (error) {
    logger.error('Delete diet error', { error: error.message });
    res.status(500).json({ message: 'Failed to delete diet' });
  }
};
