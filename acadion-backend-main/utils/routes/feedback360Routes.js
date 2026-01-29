const express = require('express');
const router = express.Router();
const feedback360Controller = require('../controllers/feedback360Controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Student routes
router.get('/active-period', feedback360Controller.getActiveFeedbackPeriod);
router.get('/team-members', feedback360Controller.getMyTeamMembers);
router.post('/submit', feedback360Controller.submitFeedback);
router.get('/my-progress', feedback360Controller.getMyFeedbackProgress);

// Admin routes
router.get('/periods', roleMiddleware('ADMIN'), feedback360Controller.getAllFeedbackPeriods);
router.post('/periods', roleMiddleware('ADMIN'), feedback360Controller.createFeedbackPeriod);
router.put('/periods/:periodId', roleMiddleware('ADMIN'), feedback360Controller.updateFeedbackPeriod);
router.delete('/periods/:periodId', roleMiddleware('ADMIN'), feedback360Controller.deleteFeedbackPeriod);
router.get('/export', roleMiddleware('ADMIN'), feedback360Controller.exportFeedback);

module.exports = router;