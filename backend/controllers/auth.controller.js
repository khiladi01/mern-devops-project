const bcrypt = require('bcrypt');
const config = require('../config');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

// Compared against when the email is unknown so response time doesn't reveal
// which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new AppError('Invalid email or password.', 401);
  }

  const ok = await admin.comparePassword(password);
  if (!ok) throw new AppError('Invalid email or password.', 401);

  admin.lastLoginAt = new Date();
  await admin.save();
  logActivity('auth', `${admin.name} signed in`, admin.name);

  res.json({
    success: true,
    message: 'Login successful',
    data: { token: signToken(admin), user: admin.toJSON() },
  });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } });
});

// PUT /api/auth/me
exports.updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.body.name.trim();
  await req.user.save();
  res.json({ success: true, message: 'Profile updated', data: { user: req.user.toJSON() } });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user._id).select('+password');
  const ok = await admin.comparePassword(req.body.currentPassword);
  if (!ok) throw new AppError('Current password is incorrect.', 400);

  if (req.body.currentPassword === req.body.newPassword) {
    throw new AppError('New password must be different from the current password.', 400);
  }

  admin.password = req.body.newPassword; // hashed by the pre-save hook
  await admin.save();
  logActivity('auth', `${admin.name} changed their password`, admin.name);

  res.json({ success: true, message: 'Password updated successfully' });
});
