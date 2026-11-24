const Activity = require('../models/Activity');

/**
 * Records an entry in the activity feed. Failures are logged but never break
 * the request that triggered them.
 */
const logActivity = async (type, message, actor) => {
  try {
    await Activity.create({ type, message, actor: actor || 'System' });
  } catch (err) {
    console.error('Failed to record activity:', err.message);
  }
};

module.exports = { logActivity };
