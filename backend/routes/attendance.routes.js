const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const v = require('../middleware/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', v.attendanceList, validate, ctrl.list);
router.post('/', v.attendanceCreate, validate, ctrl.create);
router.put('/:id', v.idParam, v.attendanceUpdate, validate, ctrl.update);

module.exports = router;
