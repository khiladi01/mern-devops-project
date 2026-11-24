const router = require('express').Router();
const mongoose = require('mongoose');
const pkg = require('../package.json');

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Liveness: is the process up? (Docker HEALTHCHECK, load balancer, uptime monitors)
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: pkg.name,
    version: pkg.version,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness: can the API actually serve requests (database reachable)?
router.get('/ready', (_req, res) => {
  const state = mongoose.connection.readyState;
  const ready = state === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'unavailable',
    database: DB_STATES[state] || 'unknown',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
