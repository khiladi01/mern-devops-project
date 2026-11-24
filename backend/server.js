const mongoose = require('mongoose');
const config = require('./config');

config.validate();

const app = require('./app');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/bootstrapAdmin');

let server;

const start = async () => {
  await connectDB();
  await ensureAdmin();

  server = app.listen(config.port, config.host, () => {
    console.log(`PeopleDesk API listening on http://${config.host}:${config.port} (${config.nodeEnv})`);
  });
};

const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  const force = setTimeout(() => process.exit(1), 10000);
  force.unref();

  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('Shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
