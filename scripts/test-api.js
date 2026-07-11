#!/usr/bin/env node
/**
 * Quick API smoke test. Run with: node scripts/test-api.js
 * Requires: backend running on http://localhost:5000 and MONGODB_URI in server/.env
 */
const BASE = 'http://localhost:5000/api';

async function request(method, path, body) {
  const url = BASE + path;
  const opts = { method };
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const results = [];

  // Health
  const health = await request('GET', '/health');
  results.push({ name: 'GET /api/health', ok: health.ok, status: health.status });

  // Public endpoints (no auth)
  const posts = await request('GET', '/posts');
  results.push({ name: 'GET /api/posts', ok: posts.ok, status: posts.status });

  const threads = await request('GET', '/threads');
  results.push({ name: 'GET /api/threads', ok: threads.ok, status: threads.status });

  const products = await request('GET', '/products');
  results.push({ name: 'GET /api/products', ok: products.ok, status: products.status });

  const businesses = await request('GET', '/businesses');
  results.push({ name: 'GET /api/businesses', ok: businesses.ok, status: businesses.status });

  console.log('API smoke test results:');
  results.forEach((r) => {
    const icon = r.ok ? '✓' : '✗';
    console.log(`  ${icon} ${r.name} → ${r.status}`);
  });
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
