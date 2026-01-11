const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', authorize(['admin']), notificationController.create);
router.get('/user/:userId/unread-count', authorize(['admin', 'member']), notificationController.unreadCount);
router.get('/user/:userId', authorize(['admin', 'member']), notificationController.listByUser);
router.patch('/:id/read', authorize(['admin', 'member']), notificationController.markRead);
router.post('/seed/monthly', authorize(['admin']), notificationController.seedMonthly);

module.exports = router;
