const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', authorize(['admin']), dietController.listAll);
router.get('/member/:memberId', authorize(['admin', 'member']), dietController.listByMember);
router.get('/:id', authorize(['admin', 'member']), dietController.getOne);
router.post('/', authorize(['admin']), dietController.create);
router.put('/:id', authorize(['admin']), dietController.update);
router.delete('/:id', authorize(['admin']), dietController.remove);

module.exports = router;
