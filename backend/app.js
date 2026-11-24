const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

app.use(helmet());

const corsOrigins = config.corsOrigins.length ? config.corsOrigins : ['http://localhost:5173'];
app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

if (config.nodeEnv !== 'test') app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));

// Health checks (outside /api rate limits so monitors are never throttled).
const healthRoutes = require('./routes/health.routes');
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Generous global limiter as a safety net; login has its own stricter one.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' },
  })
);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
