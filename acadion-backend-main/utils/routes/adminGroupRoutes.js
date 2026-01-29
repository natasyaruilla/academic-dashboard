const express = require('express');
const router = express.Router();
const adminGroupController = require('../controllers/adminGroupController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/validation', adminGroupController.getGroupsForValidation);
router.get('/search-users', adminGroupController.searchAvailableUsers);
router.put('/:groupId/validate', adminGroupController.validateGroup);
router.post('/batch-validate', adminGroupController.batchValidateGroups);
router.delete('/:groupId/members/:userId', adminGroupController.removeMemberFromGroup);
router.post('/:groupId/members', adminGroupController.addMemberToGroup);

module.exports = router;