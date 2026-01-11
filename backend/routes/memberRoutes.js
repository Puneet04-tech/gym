const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all members (admin only)
router.get('/', authorize(['admin']), memberController.getAllMembers);

// Member stats (admin only)
router.get('/stats', authorize(['admin']), memberController.getMemberStats);

// Search members (admin only)
router.get('/search', authorize(['admin']), memberController.searchMembers);

// Get specific member
router.get('/:id', authorize(['admin', 'member']), memberController.getMemberById);

// Add new member (admin only)
router.post('/', authorize(['admin']), memberController.addMember);

// Update member (admin only)
router.put('/:id', authorize(['admin']), memberController.updateMember);

// Delete member (admin only)
router.delete('/:id', authorize(['admin']), memberController.deleteMember);

module.exports = router;
