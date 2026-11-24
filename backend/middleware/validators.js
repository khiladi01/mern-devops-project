const { body, param, query } = require('express-validator');
const { EMPLOYMENT_STATUSES } = require('../models/Employee');
const { ATTENDANCE_STATUSES, TIME_RE } = require('../models/Attendance');
const { isValidDateString } = require('../utils/date');

const idParam = param('id').isMongoId().withMessage('Invalid ID');

const dateString = (chain, label) =>
  chain.custom((v) => isValidDateString(v)).withMessage(`${label} must be a valid date (YYYY-MM-DD)`);

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{10,128}$/;

/* ------------------------------- Auth ---------------------------------- */
const login = [
  body('email').isString().trim().isEmail().withMessage('A valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const updateProfile = [
  body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
];

const changePassword = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .matches(PASSWORD_RULE)
    .withMessage('New password must be at least 10 characters and contain a letter and a number'),
];

/* ----------------------------- Employees -------------------------------- */
const employeeBody = (isUpdate) => {
  const required = (chain) => (isUpdate ? chain.optional() : chain);
  return [
    body('employeeId')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .matches(/^[A-Za-z0-9-]{3,20}$/)
      .withMessage('Employee ID may contain letters, numbers and dashes (3-20 characters)'),
    required(body('fullName')).isString().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    required(body('email')).isString().trim().isEmail().withMessage('A valid email is required'),
    required(body('phone'))
      .isString()
      .trim()
      .matches(/^[0-9+()\-\s]{7,20}$/)
      .withMessage('Enter a valid phone number (7-20 digits)'),
    required(body('position')).isString().trim().isLength({ min: 2, max: 100 }).withMessage('Job position is required'),
    required(body('department')).isMongoId().withMessage('Select a valid department'),
    dateString(required(body('joiningDate')), 'Joining date'),
    body('status').optional().isIn(EMPLOYMENT_STATUSES).withMessage(`Status must be one of: ${EMPLOYMENT_STATUSES.join(', ')}`),
    body('profileImage')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Profile image must be a valid http(s) URL')
      .isLength({ max: 500 })
      .withMessage('Profile image URL is too long'),
  ];
};

const employeeList = [
  query('department').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid department filter'),
  query('status').optional({ values: 'falsy' }).isIn(EMPLOYMENT_STATUSES).withMessage('Invalid status filter'),
  query('search').optional().isString().withMessage('Invalid search term'),
  query('sortBy').optional().isString(),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be between 1 and 500'),
];

/* ---------------------------- Departments ------------------------------- */
const departmentBody = (isUpdate) => [
  (isUpdate ? body('name').optional() : body('name')).isString().trim().isLength({ min: 2, max: 80 }).withMessage('Department name must be 2-80 characters'),
  body('description').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }).withMessage('Description can be at most 300 characters'),
  body('head').optional({ values: 'falsy' }).isString().trim().isLength({ max: 100 }).withMessage('Department head can be at most 100 characters'),
];

/* ----------------------------- Attendance ------------------------------- */
const timeField = (name, label) =>
  body(name)
    .optional({ values: 'falsy' })
    .isString()
    .matches(TIME_RE)
    .withMessage(`${label} must be in HH:mm (24-hour) format`);

const attendanceCreate = [
  body('employee').isMongoId().withMessage('Select a valid employee'),
  dateString(body('date').optional(), 'Date'),
  body('status').isIn(ATTENDANCE_STATUSES).withMessage(`Status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`),
  timeField('checkIn', 'Check-in'),
  timeField('checkOut', 'Check-out'),
  body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }).withMessage('Notes can be at most 300 characters'),
];

const attendanceUpdate = [
  body('status').optional().isIn(ATTENDANCE_STATUSES).withMessage(`Status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`),
  timeField('checkIn', 'Check-in'),
  timeField('checkOut', 'Check-out'),
  body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 300 }).withMessage('Notes can be at most 300 characters'),
];

const attendanceList = [
  dateString(query('date').optional({ values: 'falsy' }), 'Date'),
  dateString(query('from').optional({ values: 'falsy' }), 'From date'),
  dateString(query('to').optional({ values: 'falsy' }), 'To date'),
  query('employee').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid employee filter'),
  query('status').optional({ values: 'falsy' }).isIn(ATTENDANCE_STATUSES).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

/* ------------------------------ Dashboard ------------------------------- */
const dashboardStats = [dateString(query('today').optional({ values: 'falsy' }), 'today')];

module.exports = {
  idParam,
  login,
  updateProfile,
  changePassword,
  employeeCreate: employeeBody(false),
  employeeUpdate: employeeBody(true),
  employeeList,
  departmentCreate: departmentBody(false),
  departmentUpdate: departmentBody(true),
  attendanceCreate,
  attendanceUpdate,
  attendanceList,
  dashboardStats,
  PASSWORD_RULE,
};
