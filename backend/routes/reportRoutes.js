const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/bills', authorize(['admin']), reportController.exportBills);

module.exports = router;
