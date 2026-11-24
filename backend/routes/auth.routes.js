const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const v = require('../middleware/validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

// Slows down password-guessing. Successful logins don't count against the limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
});

router.post('/login', loginLimiter, v.login, validate, ctrl.login);
router.get('/me', protect, ctrl.me);
router.put('/me', protect, v.updateProfile, validate, ctrl.updateProfile);
router.put('/password', protect, v.changePassword, validate, ctrl.changePassword);

module.exports = router;
