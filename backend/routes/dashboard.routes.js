const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const v = require('../middleware/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, v.dashboardStats, validate, ctrl.stats);

module.exports = router;
