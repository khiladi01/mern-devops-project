const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildPagination, escapeRegex, asString } = require('../utils/query');
const { logActivity } = require('../utils/activity');

const SORTABLE = {
  name: 'fullName',
  employeeId: 'employeeId',
  position: 'position',
  joined: 'joiningDate',
  status: 'status',
  created: 'createdAt',
};

const EDITABLE = ['fullName', 'email', 'phone', 'position', 'department', 'joiningDate', 'status', 'profileImage'];

const pick = (source, keys) =>
  keys.reduce((acc, key) => (source[key] !== undefined ? { ...acc, [key]: source[key] } : acc), {});

const buildFilter = (q) => {
  const filter = {};
  const search = asString(q.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }, { employeeId: rx }, { position: rx }];
  }
  if (asString(q.department)) filter.department = asString(q.department);
  if (asString(q.status)) filter.status = asString(q.status);
  return filter;
};

const ensureDepartment = async (id) => {
  const exists = await Department.exists({ _id: id });
  if (!exists) throw new AppError('The selected department does not exist.', 400);
};

// GET /api/employees
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildFilter(req.query);
  const sortField = SORTABLE[asString(req.query.sortBy)] || 'createdAt';
  const sortDir = req.query.order === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name')
      .sort({ [sortField]: sortDir, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: buildPagination({ page, limit, total }) });
});

// GET /api/employees/options  (lightweight list for dropdowns)
exports.options = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const data = await Employee.find(filter)
    .select('employeeId fullName position profileImage status')
    .sort({ fullName: 1 })
    .limit(500)
    .lean();
  res.json({ success: true, data });
});

// GET /api/employees/:id
exports.getOne = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('department', 'name description head');
  if (!employee) throw new AppError('Employee not found.', 404);
  res.json({ success: true, data: employee });
});

// POST /api/employees
exports.create = asyncHandler(async (req, res) => {
  await ensureDepartment(req.body.department);

  const payload = pick(req.body, EDITABLE);
  if (payload.profileImage === '') delete payload.profileImage;

  const customId = asString(req.body.employeeId);
  let employee;

  if (customId) {
    employee = await Employee.create({ ...payload, employeeId: customId });
  } else {
    // Auto-generate; retry if a manually-entered ID already used the number.
    for (let attempt = 0; attempt < 5 && !employee; attempt += 1) {
      const employeeId = await Employee.generateEmployeeId();
      try {
        employee = await Employee.create({ ...payload, employeeId });
      } catch (err) {
        const idClash = err.code === 11000 && err.keyPattern && err.keyPattern.employeeId;
        if (!idClash || attempt === 4) throw err;
      }
    }
  }

  logActivity('employee', `${employee.fullName} was added as ${employee.position}`, req.user.name);
  await employee.populate('department', 'name');
  res.status(201).json({ success: true, message: 'Employee created', data: employee });
});

// PUT /api/employees/:id
exports.update = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new AppError('Employee not found.', 404);

  if (req.body.department) await ensureDepartment(req.body.department);

  employee.set(pick(req.body, EDITABLE));
  await employee.save();

  logActivity('employee', `${employee.fullName}'s profile was updated`, req.user.name);
  await employee.populate('department', 'name');
  res.json({ success: true, message: 'Employee updated', data: employee });
});

// DELETE /api/employees/:id
exports.remove = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) throw new AppError('Employee not found.', 404);

  await Attendance.deleteMany({ employee: employee._id });
  logActivity('employee', `${employee.fullName} was removed`, req.user.name);

  res.json({ success: true, message: 'Employee deleted' });
});
