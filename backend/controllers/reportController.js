const database = require('../../config/database');
const { logger } = require('../../config/logger');

// Export CSV report with comprehensive data
exports.exportBills = async (_req, res) => {
  try {
    // Fetch all bills with member details
    const bills = await database.all(
      `SELECT 
        b.bill_number,
        b.bill_date,
        b.amount,
        b.tax,
        b.total,
        b.status,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        m.membership_status,
        b.created_at
       FROM bills b
       JOIN members m ON b.member_id = m.id
       JOIN users u ON m.user_id = u.id
       ORDER BY b.created_at DESC`
    );

    // Fetch summary statistics
    const [memberStats, paymentStats, billStats] = await Promise.all([
      database.all(`SELECT COUNT(*) as count FROM members WHERE is_active = 1`),
      database.all(`SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE status = 'completed'`),
      database.all(`SELECT COUNT(*) as count, SUM(total) as revenue FROM bills`)
    ]);

    const memberCount = memberStats[0]?.count || 0;
    const paymentCount = paymentStats[0]?.count || 0;
    const paymentTotal = paymentStats[0]?.total || 0;
    const billCount = billStats[0]?.count || 0;
    const totalRevenue = billStats[0]?.revenue || 0;

    // Build CSV content
    let csv = 'Gym Management System - Comprehensive Report\n';
    csv += `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    // Add summary section
    csv += 'SUMMARY STATISTICS\n';
    csv += `Total Active Members,${memberCount}\n`;
    csv += `Total Bills Generated,${billCount}\n`;
    csv += `Completed Payments,${paymentCount}\n`;
    csv += `Total Payments Amount,$${parseFloat(paymentTotal || 0).toFixed(2)}\n`;
    csv += `Total Revenue,$${parseFloat(totalRevenue || 0).toFixed(2)}\n\n`;
    
    // Add bills detail section
    csv += 'BILLS DETAILS\n';
    csv += 'Bill Number,Bill Date,Member Name,Email,Phone,Membership Status,Amount,Tax,Total,Status,Created At\n';
    
    bills.forEach(bill => {
      const memberName = `${bill.first_name || ''} ${bill.last_name || ''}`.trim() || 'N/A';
      const billDate = bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : 'N/A';
      const createdAt = bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A';
      
      csv += `"${bill.bill_number || 'N/A'}",`;
      csv += `"${billDate}",`;
      csv += `"${memberName}",`;
      csv += `"${bill.email || 'N/A'}",`;
      csv += `"${bill.phone || 'N/A'}",`;
      csv += `"${bill.membership_status || 'N/A'}",`;
      csv += `$${parseFloat(bill.amount || 0).toFixed(2)},`;
      csv += `$${parseFloat(bill.tax || 0).toFixed(2)},`;
      csv += `$${parseFloat(bill.total || 0).toFixed(2)},`;
      csv += `"${bill.status || 'N/A'}",`;
      csv += `"${createdAt}"\n`;
    });

    // Set response headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gym_report_' + Date.now() + '.csv"');
    res.send(csv);

  } catch (error) {
    logger.error('Export bills report error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};

