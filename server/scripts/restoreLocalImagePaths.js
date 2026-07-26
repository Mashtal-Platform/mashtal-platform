/**
 * Restore product/post image fields to local /images/... files
 * that already exist under server/public/images (from previous seed).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Post = require('../src/models/Post');

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function indexFolder(absDir, webPrefix) {
  const map = new Map(); // slug prefix -> web path
  if (!fs.existsSync(absDir)) return map;
  for (const file of fs.readdirSync(absDir)) {
    if (!/\.(jpe?g|png|webp|gif)$/i.test(file)) continue;
    const base = file.replace(/\.(jpe?g|png|webp|gif)$/i, '');
    // file like arbequina-olive-tree-aeb2dec5 or title-flickr-xxx
    const withoutHash = base.replace(/-(flickr-)?[a-f0-9]{6,}$/i, '');
    const web = `${webPrefix}/${file}`;
    if (!map.has(withoutHash)) map.set(withoutHash, web);
    map.set(base, web);
  }
  return map;
}

function findImage(map, name) {
  const s = slug(name);
  if (map.has(s)) return map.get(s);
  // longest prefix match
  let best = null;
  let bestLen = 0;
  for (const [key, web] of map.entries()) {
    if (s.startsWith(key) || key.startsWith(s) || s.includes(key) || key.includes(s)) {
      if (key.length > bestLen) {
        best = web;
        bestLen = key.length;
      }
    }
  }
  return best;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 25000 });
  console.log('[Restore] DB', mongoose.connection.name);

  const productMap = indexFolder(
    path.join(__dirname, '..', 'public', 'images', 'products'),
    '/images/products'
  );
  const postMap = indexFolder(
    path.join(__dirname, '..', 'public', 'images', 'posts'),
    '/images/posts'
  );
  console.log('[Restore] local product files indexed:', productMap.size);
  console.log('[Restore] local post files indexed:', postMap.size);

  const products = await Product.find({});
  let pOk = 0;
  let pMiss = 0;
  for (const p of products) {
    const img = findImage(productMap, p.name);
    if (!img) {
      console.warn('  miss product', p.name);
      pMiss += 1;
      continue;
    }
    p.image = img;
    await p.save();
    pOk += 1;
  }

  const posts = await Post.find({});
  let postOk = 0;
  let postMiss = 0;
  for (const post of posts) {
    // strip " — Business" suffix for matching
    const baseTitle = String(post.title || '').split(' — ')[0].trim();
    const img = findImage(postMap, baseTitle) || findImage(postMap, post.title);
    if (!img) {
      console.warn('  miss post', post.title);
      postMiss += 1;
      continue;
    }
    post.image = img;
    await post.save();
    postOk += 1;
  }

  console.log(`[Restore] products restored: ${pOk}, miss: ${pMiss}`);
  console.log(`[Restore] posts restored: ${postOk}, miss: ${postMiss}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
