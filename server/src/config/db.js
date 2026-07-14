const dns = require('dns');
const mongoose = require('mongoose');

// Prefer IPv4 + public DNS; often fixes queryTxt ETIMEOUT with MongoDB Atlas on broken ISP DNS
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {
  // ignore if runtime disallows changing DNS servers
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  if (!uri) {
    console.error('[DB] MONGODB_URI is not set. Please configure it in server/.env');
    process.exit(1);
  }

  const connectWithUri = async (targetUri, label) => {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 20000,
      family: 4,
    });
    console.log(`[DB] Connected to MongoDB (${label})`);
  };

  try {
    await connectWithUri(uri, 'primary');
    return;
  } catch (err) {
    const atlasNetworkError =
      /whitelist|querySrv|ENOTFOUND|ETIMEOUT|Could not connect to any servers/i.test(err.message || '');

    console.error('[DB] Primary MongoDB connection failed:', err.message);
    if (atlasNetworkError) {
      console.error('[DB] Atlas/network issue detected. Ensure your current IP is whitelisted in Atlas.');
      console.error('[DB] Atlas whitelist docs: https://www.mongodb.com/docs/atlas/security-whitelist/');
      console.error('[DB] You can also set MONGODB_URI_FALLBACK to a local URI, e.g. mongodb://127.0.0.1:27017/mashtal');
    }

    if (fallbackUri) {
      try {
        await connectWithUri(fallbackUri, 'fallback');
        return;
      } catch (fallbackErr) {
        console.error('[DB] Fallback MongoDB connection failed:', fallbackErr.message);
      }
    }

    process.exit(1);
  }
}

module.exports = {
  connectDB,
};

