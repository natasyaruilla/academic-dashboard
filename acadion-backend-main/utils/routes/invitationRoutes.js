const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware('STUDENT'), invitationController.sendInvitation);
router.get('/my-invitations', roleMiddleware('STUDENT'), invitationController.getMyInvitations);
router.post('/:invitationId/respond', roleMiddleware('STUDENT'), invitationController.respondToInvitation);
router.delete('/:invitationId', roleMiddleware('STUDENT'), invitationController.cancelInvitation);

module.exports = router;