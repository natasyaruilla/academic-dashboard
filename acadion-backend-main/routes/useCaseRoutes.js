const express = require('express');
const router = express.Router();
const useCaseController = require('../controllers/useCaseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Rules Management (MUST BE BEFORE dynamic routes!)
router.get('/admin/rules', roleMiddleware('ADMIN'), useCaseController.getAllRules);
router.post('/admin/rules', roleMiddleware('ADMIN'), useCaseController.createRule);
router.put('/admin/rules/:ruleId', roleMiddleware('ADMIN'), useCaseController.updateRule);
router.delete('/admin/rules/:ruleId', roleMiddleware('ADMIN'), useCaseController.deleteRule);

// Use Cases
router.get('/', useCaseController.getAllUseCases);
router.get('/:useCaseId', useCaseController.getUseCaseDetail);
router.get('/:useCaseId/rules', useCaseController.getUseCaseRules);

router.post('/', roleMiddleware('ADMIN'), useCaseController.createUseCase);
router.put('/:useCaseId', roleMiddleware('ADMIN'), useCaseController.updateUseCase);
router.delete('/:useCaseId', roleMiddleware('ADMIN'), useCaseController.deleteUseCase);

// Assign rules to use case
router.post('/:useCaseId/assign-rules', roleMiddleware('ADMIN'), useCaseController.assignRulesToUseCase);

module.exports = router;

