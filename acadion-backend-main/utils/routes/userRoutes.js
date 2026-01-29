const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', userController.getAllUsers);
router.delete('/:userId', userController.deleteUser);
router.get('/groups-validation', userController.getGroupsForValidation);
router.put('/groups/:groupId/validate', userController.validateGroup);
router.get('/export-groups', userController.exportGroups);

module.exports = router;