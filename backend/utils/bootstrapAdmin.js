const config = require('../config');
const Admin = require('../models/Admin');
const { PASSWORD_RULE } = require('../middleware/validators');

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no admin
 * exists yet. Credentials only ever come from the environment - nothing is
 * hardcoded - and an existing admin is never overwritten.
 */
const ensureAdmin = async () => {
  const { email, password, name } = config.admin;

  if ((await Admin.estimatedDocumentCount()) > 0) return { created: false, reason: 'admin-exists' };

  if (!email || !password) {
    console.warn(
      'No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (or run "npm run create-admin") to create one.'
    );
    return { created: false, reason: 'not-configured' };
  }

  if (!PASSWORD_RULE.test(password)) {
    console.error('ADMIN_PASSWORD is too weak: use at least 10 characters including a letter and a number.');
    return { created: false, reason: 'weak-password' };
  }

  await Admin.create({ name, email, password });
  console.log(`Initial admin account created for ${email}`);
  return { created: true };
};

module.exports = ensureAdmin;
