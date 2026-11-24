const jwt = require('jsonwebtoken');
const config = require('../config');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/** Requires a valid "Authorization: Bearer <jwt>" header. */
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  // JsonWebTokenError / TokenExpiredError are mapped to 401 by the error handler.
  const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });

  const admin = await Admin.findById(payload.sub);
  if (!admin) throw new AppError('The account for this token no longer exists.', 401);

  req.user = admin;
  next();
});

const signToken = (admin) =>
  jwt.sign({ sub: admin._id.toString(), role: admin.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });

module.exports = { protect, signToken };
