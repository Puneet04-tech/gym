const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create payment (admin only)
router.post('/', authorize(['admin']), paymentController.createPayment);

// Get all payments (admin only)
router.get('/', authorize(['admin']), paymentController.getAllPayments);

// Payment stats (admin only)
router.get('/stats', authorize(['admin']), paymentController.getPaymentStats);

// Get payments by member
router.get('/member/:memberId', authorize(['admin', 'member']), paymentController.getPaymentsByMember);

// Get payment by ID
router.get('/:id', authorize(['admin', 'member']), paymentController.getPaymentById);

module.exports = router;
