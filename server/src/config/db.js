const dns = require('dns');
const mongoose = require('mongoose');

// Prefer IPv4 for DNS; often fixes queryTxt ETIMEOUT with MongoDB Atlas on some networks
dns.setDefaultResultOrder('ipv4first');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[DB] MONGODB_URI is not set. Please configure it in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 20000,
    });
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.error('[DB] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
};

