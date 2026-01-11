const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/profile', require('../middleware/auth').authenticateToken, authController.getProfile);
router.put('/profile', require('../middleware/auth').authenticateToken, authController.updateProfile);
router.post('/change-password', require('../middleware/auth').authenticateToken, authController.changePassword);

module.exports = router;
