const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Information (all users can read, admin can CRUD)
router.get('/information', contentController.getInformation);
router.post('/information', roleMiddleware('ADMIN'), contentController.createInformation);
router.put('/information/:id', roleMiddleware('ADMIN'), contentController.updateInformation);
router.delete('/information/:id', roleMiddleware('ADMIN'), contentController.deleteInformation);

// Timeline
router.get('/timeline', contentController.getTimeline);
router.post('/timeline', roleMiddleware('ADMIN'), contentController.createTimeline);
router.put('/timeline/:id', roleMiddleware('ADMIN'), contentController.updateTimeline);
router.delete('/timeline/:id', roleMiddleware('ADMIN'), contentController.deleteTimeline);

// Docs
router.get('/docs', contentController.getDocs);
router.post('/docs', roleMiddleware('ADMIN'), contentController.createDoc);
router.put('/docs/:id', roleMiddleware('ADMIN'), contentController.updateDoc);
router.delete('/docs/:id', roleMiddleware('ADMIN'), contentController.deleteDoc);

module.exports = router;