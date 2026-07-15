/**
 * Loads STRIPE_SECRET_KEY from server/.env and starts stripe listen.
 * Avoids relying on expired `stripe login` device keys.
 */
require('dotenv').config();
const { spawn } = require('child_process');

const apiKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
if (!apiKey || !apiKey.startsWith('sk_')) {
  console.error(
    'STRIPE_SECRET_KEY is missing or invalid in server/.env (must start with sk_test_ or sk_live_).'
  );
  process.exit(1);
}

const args = [
  'listen',
  '--api-key',
  apiKey,
  '--forward-to',
  'localhost:5000/api/payments/stripe/webhook',
  '--events',
  'payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled',
];

const child = spawn('stripe', args, { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));
