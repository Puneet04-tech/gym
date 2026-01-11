const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', authorize(['admin', 'member']), storeController.list);
router.get('/:id', authorize(['admin', 'member']), storeController.getOne);
router.post('/', authorize(['admin']), storeController.create);
router.put('/:id', authorize(['admin']), storeController.update);
router.delete('/:id', authorize(['admin']), storeController.remove);

module.exports = router;
