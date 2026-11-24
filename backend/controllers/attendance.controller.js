const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildPagination, asString } = require('../utils/query');
const { todayString } = require('../utils/date');
const { logActivity } = require('../utils/activity');

const POPULATE = {
  path: 'employee',
  select: 'employeeId fullName position profileImage department',
  populate: { path: 'department', select: 'name' },
};

const buildDateFilter = (q) => {
  const date = asString(q.date);
  const from = asString(q.from);
  const to = asString(q.to);
  if (date) return { date };
  if (from || to) {
    return { date: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } };
  }
  return {};
};

// GET /api/attendance
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 15 });

  const base = buildDateFilter(req.query);
  if (asString(req.query.employee)) base.employee = new mongoose.Types.ObjectId(asString(req.query.employee));

  const filter = { ...base };
  if (asString(req.query.status)) filter.status = asString(req.query.status);

  const [data, total, summaryRows] = await Promise.all([
    Attendance.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, checkIn: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
    // Summary ignores the status filter so the chips always show the full picture.
    Attendance.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const summary = { present: 0, late: 0, absent: 0 };
  summaryRows.forEach((r) => {
    summary[r._id] = r.count;
  });

  res.json({ success: true, data, summary, pagination: buildPagination({ page, limit, total }) });
});

// POST /api/attendance
exports.create = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.body.employee).select('fullName');
  if (!employee) throw new AppError('Employee not found.', 404);

  const record = await Attendance.create({
    employee: employee._id,
    date: req.body.date || todayString(),
    status: req.body.status,
    checkIn: req.body.checkIn || null,
    checkOut: req.body.checkOut || null,
    notes: req.body.notes || '',
  });

  logActivity('attendance', `${employee.fullName} was marked ${record.status} for ${record.date}`, req.user.name);
  await record.populate(POPULATE);
  res.status(201).json({ success: true, message: 'Attendance recorded', data: record });
});

// PUT /api/attendance/:id
exports.update = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw new AppError('Attendance record not found.', 404);

  ['status', 'checkIn', 'checkOut', 'notes'].forEach((key) => {
    if (req.body[key] !== undefined) record[key] = req.body[key] === '' ? null : req.body[key];
  });
  if (req.body.notes !== undefined) record.notes = req.body.notes || '';
  await record.save();

  await record.populate(POPULATE);
  logActivity('attendance', `Attendance for ${record.employee?.fullName || 'an employee'} on ${record.date} was updated`, req.user.name);
  res.json({ success: true, message: 'Attendance updated', data: record });
});
