const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create bill (admin only)
router.post('/', authorize(['admin']), billController.createBill);

// Get all bills (admin only)
router.get('/', authorize(['admin']), billController.getAllBills);

// Get bill by ID
router.get('/:id', authorize(['admin', 'member']), billController.getBillById);

// Get bill receipt
router.get('/:id/receipt', authorize(['admin', 'member']), billController.getBillReceipt);

// Get bills by member
router.get('/member/:memberId', authorize(['admin', 'member']), billController.getBillsByMember);

// Update bill status (admin only)
router.patch('/:id/status', authorize(['admin']), billController.updateBillStatus);

// Delete bill (admin only)
router.delete('/:id', authorize(['admin']), billController.deleteBill);

module.exports = router;
