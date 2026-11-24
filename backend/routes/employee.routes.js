const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const v = require('../middleware/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', v.employeeList, validate, ctrl.list);
router.post('/', v.employeeCreate, validate, ctrl.create);
// Must be declared before "/:id" so "options" isn't treated as an ID.
router.get('/options', v.employeeList, validate, ctrl.options);
router.get('/:id', v.idParam, validate, ctrl.getOne);
router.put('/:id', v.idParam, v.employeeUpdate, validate, ctrl.update);
router.delete('/:id', v.idParam, validate, ctrl.remove);

module.exports = router;
