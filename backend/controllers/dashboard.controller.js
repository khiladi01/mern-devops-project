const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const { todayString, addDays } = require('../utils/date');
const { asString } = require('../utils/query');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Last `count` calendar months ending at the month of `todayStr` (UTC). */
const monthWindow = (todayStr, count) => {
  const [y, m] = todayStr.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return { key, label: MONTHS[d.getUTCMonth()], start: d };
  });
};

const growthSeries = async (todayStr) => {
  const months = monthWindow(todayStr, 12);
  const windowStart = months[0].start;

  const [before, rows] = await Promise.all([
    Employee.countDocuments({ joiningDate: { $lt: windowStart } }),
    Employee.aggregate([
      { $match: { joiningDate: { $gte: windowStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$joiningDate' } }, added: { $sum: 1 } } },
    ]),
  ]);

  const addedByMonth = new Map(rows.map((r) => [r._id, r.added]));
  let running = before;
  return months.map(({ key, label }) => {
    const added = addedByMonth.get(key) || 0;
    running += added;
    return { month: key, label, added, total: running };
  });
};

const departmentDistribution = async () => {
  const rows = await Employee.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: Department.collection.name, localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: false } },
    { $project: { _id: 0, id: '$dept._id', name: '$dept.name', count: 1 } },
    { $sort: { count: -1, name: 1 } },
  ]);
  return rows;
};

const attendanceOverview = async (todayStr, totalActive) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayStr, i - 6));
  const rows = await Attendance.aggregate([
    { $match: { date: { $in: days } } },
    { $group: { _id: { date: '$date', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const byDay = new Map(days.map((date) => [date, { date, present: 0, late: 0, absent: 0 }]));
  rows.forEach((r) => {
    const day = byDay.get(r._id.date);
    if (day) day[r._id.status] = r.count;
  });

  const last7Days = days.map((date) => {
    const d = byDay.get(date);
    const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    return { ...d, label: weekday };
  });

  const today = byDay.get(todayStr);
  const recorded = today.present + today.late + today.absent;
  const notMarked = Math.max(0, totalActive - recorded);
  const attending = today.present + today.late;
  const attendanceRate = totalActive > 0 ? Math.round((attending / totalActive) * 100) : 0;

  return { today: { ...today, notMarked }, last7Days, attendanceRate };
};

// GET /api/dashboard/stats
exports.stats = asyncHandler(async (req, res) => {
  const todayStr = asString(req.query.today) || todayString();

  const [totalEmployees, activeEmployees, totalDepartments, presentToday] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Department.countDocuments(),
    Attendance.countDocuments({ date: todayStr, status: { $in: ['present', 'late'] } }),
  ]);

  const [growth, distribution, recentEmployees, recentActivity, attendance] = await Promise.all([
    growthSeries(todayStr),
    departmentDistribution(),
    Employee.find()
      .populate('department', 'name')
      .select('employeeId fullName position department joiningDate status profileImage createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Activity.find().sort({ createdAt: -1 }).limit(8).lean(),
    attendanceOverview(todayStr, activeEmployees),
  ]);

  res.json({
    success: true,
    data: {
      date: todayStr,
      totals: {
        employees: totalEmployees,
        activeEmployees,
        departments: totalDepartments,
        presentToday,
      },
      growth,
      departmentDistribution: distribution,
      recentEmployees,
      recentActivity,
      attendance,
    },
  });
});
