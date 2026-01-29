const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// NEW: Select use case and create group
router.post('/select-usecase', roleMiddleware('STUDENT'), groupController.selectUseCaseAndCreateGroup);

// NEW: Change use case (only draft)
router.put('/:groupId/change-usecase', roleMiddleware('STUDENT'), groupController.changeUseCase);

// Existing routes
router.get('/my-group', roleMiddleware('STUDENT'), groupController.getMyGroup);
router.get('/:groupId', groupController.getGroupDetails);
router.get('/:groupId/validation', groupController.getValidation);
router.put('/:groupId/name', roleMiddleware('STUDENT'), groupController.updateGroupName);
router.post('/:groupId/lock', roleMiddleware('STUDENT'), groupController.lockTeam);

module.exports = router;

