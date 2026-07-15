/**
 * One-time bootstrap: create an admin user from env vars.
 *
 * Usage (from server/):
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret npm run create-admin
 *
 * Or set ADMIN_EMAIL / ADMIN_PASSWORD in server/.env and run: npm run create-admin
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');

async function main() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const fullName = String(process.env.ADMIN_FULL_NAME || 'Mashtal Admin').trim();

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (env or server/.env) then retry.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }
    existing.role = 'admin';
    existing.passwordHash = await bcrypt.hash(password, 10);
    existing.fullName = fullName || existing.fullName;
    existing.verified = true;
    await existing.save();
    console.log(`Upgraded existing user to admin: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    fullName,
    email,
    passwordHash,
    role: 'admin',
    verified: true,
    subscriptionStatus: 'inactive',
  });
  console.log(`Created admin user: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[create-admin] failed:', err);
  process.exit(1);
});
