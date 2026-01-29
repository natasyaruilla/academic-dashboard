const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Get settings (all users)
router.get('/', settingsController.getSettings);

// Update settings (admin only)
router.post('/update', roleMiddleware('ADMIN'), settingsController.updateSetting);
router.post('/toggle-registration', roleMiddleware('ADMIN'), settingsController.toggleGroupRegistration);

module.exports = router;