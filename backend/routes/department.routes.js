const router = require('express').Router();
const ctrl = require('../controllers/department.controller');
const v = require('../middleware/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.list);
router.post('/', v.departmentCreate, validate, ctrl.create);
router.put('/:id', v.idParam, v.departmentUpdate, validate, ctrl.update);
router.delete('/:id', v.idParam, validate, ctrl.remove);

module.exports = router;
