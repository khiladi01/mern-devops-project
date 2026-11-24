const mongoose = require('mongoose');
const config = require('./index');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MongoDB, retrying a few times. The retries matter in Docker
 * Compose / EC2 where the API container can start before MongoDB is ready.
 */
const connectDB = async ({ retries = 10, delayMs = 3000 } = {}) => {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`);
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await sleep(delayMs);
    }
  }
  return null;
};

module.exports = connectDB;
