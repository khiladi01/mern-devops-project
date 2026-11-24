const mongoose = require('mongoose');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activity');

const EDITABLE = ['name', 'description', 'head'];
const pick = (source, keys) =>
  keys.reduce((acc, key) => (source[key] !== undefined ? { ...acc, [key]: source[key] } : acc), {});

const countsByDepartment = async (ids) => {
  const match = ids ? { department: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } : {};
  const rows = await Employee.aggregate([
    { $match: match },
    { $group: { _id: '$department', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
};

const withCount = (dept, counts) => {
  const row = counts.get(String(dept._id));
  return { ...dept, employeeCount: row ? row.total : 0, activeCount: row ? row.active : 0 };
};

// GET /api/departments
exports.list = asyncHandler(async (_req, res) => {
  const [departments, counts] = await Promise.all([
    Department.find().sort({ name: 1 }).collation({ locale: 'en' }).lean(),
    countsByDepartment(),
  ]);
  res.json({ success: true, data: departments.map((d) => withCount(d, counts)) });
});

// POST /api/departments
exports.create = asyncHandler(async (req, res) => {
  const department = await Department.create(pick(req.body, EDITABLE));
  logActivity('department', `Department "${department.name}" was created`, req.user.name);
  res.status(201).json({
    success: true,
    message: 'Department created',
    data: { ...department.toObject(), employeeCount: 0, activeCount: 0 },
  });
});

// PUT /api/departments/:id
exports.update = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new AppError('Department not found.', 404);

  department.set(pick(req.body, EDITABLE));
  await department.save();

  const counts = await countsByDepartment([department._id]);
  logActivity('department', `Department "${department.name}" was updated`, req.user.name);
  res.json({ success: true, message: 'Department updated', data: withCount(department.toObject(), counts) });
});

// DELETE /api/departments/:id
exports.remove = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new AppError('Department not found.', 404);

  const members = await Employee.countDocuments({ department: department._id });
  if (members > 0) {
    throw new AppError(
      `Cannot delete "${department.name}" because it still has ${members} employee${members === 1 ? '' : 's'}. Move or remove them first.`,
      409
    );
  }

  await department.deleteOne();
  logActivity('department', `Department "${department.name}" was deleted`, req.user.name);
  res.json({ success: true, message: 'Department deleted' });
});
