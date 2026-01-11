const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', authorize(['admin']), subscriptionController.assign);
router.get('/member/:memberId', authorize(['admin', 'member']), subscriptionController.listByMember);

module.exports = router;
