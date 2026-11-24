require('dotenv').config({ quiet: true });

const toList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// Express "trust proxy" accepts booleans, hop counts or subnet strings.
const parseTrustProxy = (value, fallback) => {
  const raw = value === undefined || value === '' ? fallback : value;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^\d+$/.test(String(raw))) return Number(raw);
  return raw;
};

const nodeEnv = process.env.NODE_ENV || 'development';

const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  // 0.0.0.0 so the API is reachable from outside a container.
  host: process.env.HOST || '0.0.0.0',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  // Comma separated list of allowed browser origins. "*" allows any origin.
  corsOrigins: toList(process.env.CORS_ORIGIN),
  // Used to decide what "today" means for attendance & dashboard.
  timezone: process.env.APP_TIMEZONE || 'UTC',
  // Set to the number of reverse proxies in front of the API (e.g. 1 for Nginx).
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, nodeEnv === 'production' ? 1 : false),
  // Optional first-run admin bootstrap. Nothing is hardcoded.
  admin: {
    name: process.env.ADMIN_NAME || 'Administrator',
    email: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
  },
};

/**
 * Fails fast with a readable message when mandatory configuration is missing.
 * Called from server.js (not on require) so tests can import the app freely.
 */
config.validate = () => {
  const problems = [];
  if (!config.mongoUri) problems.push('MONGO_URI is required.');
  if (!config.jwtSecret) {
    problems.push('JWT_SECRET is required. Generate one with: npm run gen-secret');
  } else if (config.jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters long.');
  }
  if (problems.length) {
    console.error('\nInvalid configuration:\n' + problems.map((p) => `  - ${p}`).join('\n') + '\n');
    process.exit(1);
  }
};

module.exports = config;
