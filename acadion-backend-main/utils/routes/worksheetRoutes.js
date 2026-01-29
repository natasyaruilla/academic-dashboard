const express = require('express');
const router = express.Router();
const worksheetController = require('../controllers/worksheetController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Checkin periods
router.get('/periods', worksheetController.getCheckinPeriods);
router.post('/periods', roleMiddleware('ADMIN'), worksheetController.createCheckinPeriod);
router.put('/periods/:periodId', roleMiddleware('ADMIN'), worksheetController.updateCheckinPeriod);
router.delete('/periods/:periodId', roleMiddleware('ADMIN'), worksheetController.deleteCheckinPeriod);

// Worksheets
router.post('/', roleMiddleware('STUDENT'), worksheetController.submitWorksheet);
router.put('/:worksheetId', roleMiddleware('STUDENT'), worksheetController.updateWorksheet);
router.get('/my-worksheets', roleMiddleware('STUDENT'), worksheetController.getMyWorksheets);
router.get('/all', roleMiddleware('ADMIN'), worksheetController.getAllWorksheets);
router.put('/:worksheetId/validate', roleMiddleware('ADMIN'), worksheetController.validateWorksheet);

module.exports = router;
