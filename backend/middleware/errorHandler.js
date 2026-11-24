const config = require('../config');
const AppError = require('../utils/AppError');

const FIELD_LABELS = {
  email: 'Email',
  employeeId: 'Employee ID',
  name: 'Name',
  employee: 'Attendance record for this employee and date',
};

const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Translates library errors into friendly, correctly-coded API errors.
const normalise = (err) => {
  if (err instanceof AppError) return err;

  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError(errors[0]?.message || 'Validation failed', 422, errors);
  }

  if (err.name === 'CastError') {
    return new AppError(`Invalid value for "${err.path}".`, 400);
  }

  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const field = keys[0];
    const label = FIELD_LABELS[field] || (field ? `${field}` : 'Record');
    const message =
      keys.includes('employee') && keys.includes('date')
        ? 'Attendance has already been recorded for this employee on this date.'
        : `${label} already exists.`;
    return new AppError(message, 409, field ? [{ field, message }] : undefined);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Your session has expired. Please log in again.', 401);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return new AppError('Invalid authentication token.', 401);
  }

  if (err.type === 'entity.parse.failed') return new AppError('Malformed JSON in request body.', 400);
  if (err.type === 'entity.too.large') return new AppError('Request body is too large.', 413);

  return null;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const known = normalise(err);

  if (!known) {
    console.error('Unhandled error:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong on our side. Please try again.',
      ...(config.isProduction ? {} : { detail: err.message }),
    });
  }

  return res.status(known.statusCode).json({
    success: false,
    message: known.message,
    ...(known.errors ? { errors: known.errors } : {}),
  });
};

module.exports = { notFound, errorHandler };
