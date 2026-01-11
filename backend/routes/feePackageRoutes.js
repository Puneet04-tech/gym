const express = require('express');
const router = express.Router();
const feePackageController = require('../controllers/feePackageController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', authorize(['admin', 'member']), feePackageController.list);
router.post('/', authorize(['admin']), feePackageController.create);
router.put('/:id', authorize(['admin']), feePackageController.update);
router.delete('/:id', authorize(['admin']), feePackageController.remove);

module.exports = router;
