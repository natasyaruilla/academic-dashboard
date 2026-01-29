const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Student & Admin can check active period
router.get('/active', registrationController.getActiveRegistrationPeriod);

// Admin only routes
router.get('/', roleMiddleware('ADMIN'), registrationController.getAllRegistrationPeriods);
router.post('/', roleMiddleware('ADMIN'), registrationController.createRegistrationPeriod);
router.put('/:periodId', roleMiddleware('ADMIN'), registrationController.updateRegistrationPeriod);
router.delete('/:periodId', roleMiddleware('ADMIN'), registrationController.deleteRegistrationPeriod);

module.exports = router;