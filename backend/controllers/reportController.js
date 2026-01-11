const database = require('../../config/database');
const { logger } = require('../../config/logger');

// Export simple CSV for bills
exports.exportBills = async (_req, res) => {
  try {
    const bills = await database.all(
      `SELECT b.bill_number, b.bill_date, b.total, u.email, u.username
       FROM bills b
       JOIN members m ON b.member_id = m.id
       JOIN users u ON m.user_id = u.id`
    );

    const header = 'bill_number,bill_date,total,email,username';
    const rows = bills.map(b => `${b.bill_number},${b.bill_date},${b.total},${b.email},${b.username}`);
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bills_report.csv"');
    res.send(csv);
  } catch (error) {
    logger.error('Export bills report error', { error: error.message });
    res.status(500).json({ message: 'Failed to export report' });
  }
};
