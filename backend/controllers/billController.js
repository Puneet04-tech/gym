const database = require('../../config/database');
const { logger } = require('../../config/logger');
const { generateId, calculateBillTotal, generateBillNumber } = require('../utils/helpers');

// Create bill
exports.createBill = async (req, res) => {
  try {
    const { member_id, payment_id, amount, tax = 0 } = req.body;

    // Check if member exists
    const member = await database.get('SELECT id FROM members WHERE id = ?', [member_id]);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if payment exists
    const payment = await database.get('SELECT id FROM payments WHERE id = ?', [payment_id]);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const billId = generateId();
    const billNumber = generateBillNumber();
    const { total } = calculateBillTotal(amount, tax);

    await database.run(
      `INSERT INTO bills (id, member_id, payment_id, bill_number, amount, tax, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'generated')`,
      [billId, member_id, payment_id, billNumber, amount, tax, total]
    );

    logger.info('Bill created', { billId, billNumber, amount: total });

    res.status(201).json({
      message: 'Bill created successfully',
      billId,
      billNumber,
      total,
    });
  } catch (error) {
    logger.error('Create bill error', { error: error.message });
    res.status(500).json({ message: 'Failed to create bill' });
  }
};

// Get all bills
exports.getAllBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const bills = await database.all(
      `SELECT b.*, u.username, u.email FROM bills b
       JOIN members m ON b.member_id = m.id
       JOIN users u ON m.user_id = u.id
       ORDER BY b.bill_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await database.get('SELECT COUNT(*) as total FROM bills');

    res.json({
      message: 'Bills retrieved successfully',
      data: bills,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    logger.error('Get all bills error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve bills' });
  }
};

// Get bill by ID
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await database.get(
      `SELECT b.*, u.username, u.email, u.phone, u.address
       FROM bills b
       JOIN members m ON b.member_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE b.id = ?`,
      [id]
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({
      message: 'Bill retrieved successfully',
      data: bill,
    });
  } catch (error) {
    logger.error('Get bill by ID error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve bill' });
  }
};

// Download/receipt
exports.getBillReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await database.get(
      `SELECT b.*, u.username, u.email, u.phone, u.address
       FROM bills b
       JOIN members m ON b.member_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE b.id = ?`,
      [id]
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const html = `<!DOCTYPE html><html><head><title>Receipt ${bill.bill_number}</title></head><body>
      <h1>Receipt</h1>
      <p><strong>Bill #:</strong> ${bill.bill_number}</p>
      <p><strong>Date:</strong> ${bill.bill_date}</p>
      <p><strong>Member:</strong> ${bill.username} (${bill.email})</p>
      <p><strong>Amount:</strong> ${bill.amount}</p>
      <p><strong>Tax:</strong> ${bill.tax}</p>
      <p><strong>Total:</strong> ${bill.total}</p>
    </body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Get bill receipt error', { error: error.message });
    res.status(500).json({ message: 'Failed to generate receipt' });
  }
};

// Get bills by member
exports.getBillsByMember = async (req, res) => {
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

    const bills = await database.all(
      `SELECT * FROM bills WHERE member_id = ? ORDER BY bill_date DESC LIMIT ? OFFSET ?`,
      [memberId, limit, offset]
    );

    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM bills WHERE member_id = ?',
      [memberId]
    );

    res.json({
      message: 'Member bills retrieved successfully',
      data: bills,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    logger.error('Get bills by member error', { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve bills' });
  }
};

// Update bill status
exports.updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['generated', 'emailed', 'downloaded', 'printed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid bill status' });
    }

    const bill = await database.get('SELECT id FROM bills WHERE id = ?', [id]);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await database.run(
      'UPDATE bills SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    logger.info('Bill status updated', { billId: id, status });

    res.json({
      message: 'Bill status updated successfully',
    });
  } catch (error) {
    logger.error('Update bill status error', { error: error.message });
    res.status(500).json({ message: 'Failed to update bill' });
  }
};

// Delete bill
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await database.get('SELECT id FROM bills WHERE id = ?', [id]);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    await database.run('DELETE FROM bills WHERE id = ?', [id]);

    logger.info('Bill deleted', { billId: id });

    res.json({
      message: 'Bill deleted successfully',
    });
  } catch (error) {
    logger.error('Delete bill error', { error: error.message });
    res.status(500).json({ message: 'Failed to delete bill' });
  }
};

module.exports = exports;
