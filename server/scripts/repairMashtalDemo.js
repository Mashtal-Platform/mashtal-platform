/**
 * Repair Mashtal demo data after accidentally running the full seed more than once.
 *
 * What it does:
 * 1. Keeps one canonical copy of every demo user/business.
 * 2. Reassigns products, posts, threads, comments and follows from duplicate users.
 * 3. Removes duplicate products, posts and threads created by repeated seeding.
 * 4. Rebuilds the Follow collection and User.followers/User.following arrays.
 * 5. Recalculates Post.commentsCount and Thread.commentsCount.
 * 6. Replaces repeated product/post images with deterministic topic-based URLs.
 *
 * It does NOT delete orders.
 *
 * Run from the backend root:
 *   node scripts/repairMashtalDemo.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const MODEL_DIR = path.resolve(process.cwd(), process.env.MODEL_DIR || './src/models');

const User = require(path.join(MODEL_DIR, 'User'));
const Product = require(path.join(MODEL_DIR, 'Product'));
const Post = require(path.join(MODEL_DIR, 'Post'));
const Thread = require(path.join(MODEL_DIR, 'Thread'));
const Comment = require(path.join(MODEL_DIR, 'Comment'));
const Follow = require(path.join(MODEL_DIR, 'Follow'));

// Optional models. The repair still works when they do not exist.
function optionalModel(name) {
  try {
    return require(path.join(MODEL_DIR, name));
  } catch {
    return null;
  }
}

const Order = optionalModel('Order');
const Review = optionalModel('Review');
const BusinessReview = optionalModel('BusinessReview');
const SavedItem = optionalModel('SavedItem');
const Notification = optionalModel('Notification');
const Conversation = optionalModel('Conversation');
const ChatMessage = optionalModel('ChatMessage');

const DEMO_DOMAIN = 'mashtal-demo.com';

function normalise(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueObjectIds(values = []) {
  return [...new Set(values.filter(Boolean).map(value => String(value)))]
    .filter(mongoose.isValidObjectId)
    .map(value => new mongoose.Types.ObjectId(value));
}

function productImageUrl(product, index) {
  const category = normalise(product.category).replace(/[^a-z0-9]+/g, '-');
  const name = normalise(product.name)
    .replace(/\b(pack|kit|kg|litre|liter|ml|cm|mm|m)\b/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[^a-z0-9]+/g, ',')
    .replace(/^,+|,+$/g, '');

  const keywords = encodeURIComponent(
    [name, category, 'agriculture product'].filter(Boolean).join(',')
  );

  // lock makes the selected image stable and different for every product.
  return `https://loremflickr.com/900/700/${keywords}?lock=${1000 + index}`;
}

function postImageUrl(post, index) {
  const tags = Array.isArray(post.tags) ? post.tags.join(',') : '';
  const title = normalise(post.title)
    .replace(/[^a-z0-9]+/g, ',')
    .replace(/^,+|,+$/g, '');

  const keywords = encodeURIComponent(
    [title, tags, 'agriculture Lebanon'].filter(Boolean).join(',')
  );

  return `https://loremflickr.com/1400/900/${keywords}?lock=${5000 + index}`;
}

async function replaceUserReference(Model, field, duplicateId, canonicalId) {
  if (!Model) return;
  await Model.updateMany(
    { [field]: duplicateId },
    { $set: { [field]: canonicalId } }
  );
}

async function replaceUserInArray(Model, field, duplicateId, canonicalId) {
  if (!Model) return;

  const docs = await Model.find({ [field]: duplicateId }).select(`_id ${field}`);

  for (const doc of docs) {
    doc[field] = uniqueObjectIds(
      doc[field].map(id => String(id) === String(duplicateId) ? canonicalId : id)
    );
    await doc.save();
  }
}

async function reassignDuplicateUser(duplicateId, canonicalId) {
  await Promise.all([
    replaceUserReference(Product, 'business', duplicateId, canonicalId),
    replaceUserReference(Post, 'author', duplicateId, canonicalId),
    replaceUserReference(Thread, 'author', duplicateId, canonicalId),
    replaceUserReference(Comment, 'author', duplicateId, canonicalId),

    replaceUserReference(Follow, 'follower', duplicateId, canonicalId),
    replaceUserReference(Follow, 'following', duplicateId, canonicalId),

    replaceUserReference(Order, 'user', duplicateId, canonicalId),
    replaceUserReference(Order, 'statusUpdatedBy', duplicateId, canonicalId),

    replaceUserReference(Review, 'user', duplicateId, canonicalId),
    replaceUserReference(BusinessReview, 'user', duplicateId, canonicalId),
    replaceUserReference(BusinessReview, 'business', duplicateId, canonicalId),

    replaceUserReference(SavedItem, 'user', duplicateId, canonicalId),
    replaceUserReference(Notification, 'recipient', duplicateId, canonicalId),
    replaceUserReference(Notification, 'sender', duplicateId, canonicalId),

    replaceUserReference(ChatMessage, 'sender', duplicateId, canonicalId),
    replaceUserReference(Conversation, 'supportLockBy', duplicateId, canonicalId),

    replaceUserInArray(Conversation, 'participants', duplicateId, canonicalId),
    replaceUserInArray(Comment, 'likes', duplicateId, canonicalId),
    replaceUserInArray(Post, 'likes', duplicateId, canonicalId),
    replaceUserInArray(Thread, 'likes', duplicateId, canonicalId),
    replaceUserInArray(User, 'followers', duplicateId, canonicalId),
    replaceUserInArray(User, 'following', duplicateId, canonicalId),
    replaceUserInArray(User, 'blockedUsers', duplicateId, canonicalId),
  ]);
}

function userIdentityKey(user) {
  const email = normalise(user.email);
  if (email) return `email:${email}`;

  if (user.role === 'business') {
    const companyName = normalise(user.businessProfile?.companyName || user.fullName);
    return `business:${companyName}`;
  }

  return `user:${normalise(user.fullName)}:${normalise(user.phone)}`;
}

async function mergeDuplicateUsers() {
  const users = await User.find({
    $or: [
      { email: { $regex: `@${DEMO_DOMAIN}$`, $options: 'i' } },
      { role: 'business' },
    ],
  }).sort({ createdAt: 1, _id: 1 });

  const groups = new Map();

  for (const user of users) {
    const key = userIdentityKey(user);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(user);
  }

  let removed = 0;

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const canonical = group[0];

    for (const duplicate of group.slice(1)) {
      await reassignDuplicateUser(duplicate._id, canonical._id);

      canonical.followers = uniqueObjectIds([
        ...(canonical.followers || []),
        ...(duplicate.followers || []),
      ]);

      canonical.following = uniqueObjectIds([
        ...(canonical.following || []),
        ...(duplicate.following || []),
      ]);

      canonical.blockedUsers = uniqueObjectIds([
        ...(canonical.blockedUsers || []),
        ...(duplicate.blockedUsers || []),
      ]);

      if (!canonical.avatar && duplicate.avatar) canonical.avatar = duplicate.avatar;
      if (!canonical.coverImage && duplicate.coverImage) canonical.coverImage = duplicate.coverImage;
      if (!canonical.bio && duplicate.bio) canonical.bio = duplicate.bio;

      if (
        canonical.role === 'business' &&
        !canonical.businessProfile?.companyName &&
        duplicate.businessProfile
      ) {
        canonical.businessProfile = duplicate.businessProfile;
      }

      await User.deleteOne({ _id: duplicate._id });
      removed += 1;
    }

    canonical.followers = canonical.followers.filter(
      id => String(id) !== String(canonical._id)
    );
    canonical.following = canonical.following.filter(
      id => String(id) !== String(canonical._id)
    );

    await canonical.save();
  }

  return removed;
}

async function removeDuplicateDocuments(Model, keyBuilder, beforeDelete) {
  const docs = await Model.find({}).sort({ createdAt: 1, _id: 1 });
  const seen = new Map();
  let removed = 0;

  for (const doc of docs) {
    const key = keyBuilder(doc);

    if (!seen.has(key)) {
      seen.set(key, doc);
      continue;
    }

    const canonical = seen.get(key);

    if (beforeDelete) {
      await beforeDelete(doc, canonical);
    }

    await Model.deleteOne({ _id: doc._id });
    removed += 1;
  }

  return removed;
}

async function removeDuplicateProducts() {
  return removeDuplicateDocuments(
    Product,
    product => `${product.business}:${normalise(product.name)}`,
    async (duplicate, canonical) => {
      if (Order) {
        await Order.updateMany(
          { 'items.product': duplicate._id },
          { $set: { 'items.$[item].product': canonical._id } },
          { arrayFilters: [{ 'item.product': duplicate._id }] }
        );
      }

      if (Review) {
        await Review.updateMany(
          { product: duplicate._id },
          { $set: { product: canonical._id } }
        );
      }

      if (SavedItem) {
        await SavedItem.updateMany(
          { type: 'product', refId: duplicate._id },
          { $set: { refId: canonical._id } }
        );
      }
    }
  );
}

async function removeDuplicatePosts() {
  return removeDuplicateDocuments(
    Post,
    post => `${post.author}:${normalise(post.title)}:${normalise(post.content)}`,
    async (duplicate, canonical) => {
      await Comment.updateMany(
        { targetType: 'post', targetId: duplicate._id },
        { $set: { targetId: canonical._id } }
      );

      if (SavedItem) {
        await SavedItem.updateMany(
          { type: 'post', refId: duplicate._id },
          { $set: { refId: canonical._id } }
        );
      }
    }
  );
}

async function removeDuplicateThreads() {
  return removeDuplicateDocuments(
    Thread,
    thread => `${thread.author}:${normalise(thread.title)}:${normalise(thread.content)}`,
    async (duplicate, canonical) => {
      await Comment.updateMany(
        { targetType: 'thread', targetId: duplicate._id },
        { $set: { targetId: canonical._id } }
      );

      if (SavedItem) {
        await SavedItem.updateMany(
          { type: 'thread', refId: duplicate._id },
          { $set: { refId: canonical._id } }
        );
      }
    }
  );
}

async function rebuildFollowData() {
  // Remove invalid/self follows first.
  await Follow.deleteMany({
    $expr: { $eq: ['$follower', '$following'] },
  });

  const follows = await Follow.find({}).sort({ createdAt: 1, _id: 1 });
  const seen = new Set();
  const duplicateIds = [];

  for (const follow of follows) {
    const key = `${follow.follower}:${follow.following}`;

    if (seen.has(key)) {
      duplicateIds.push(follow._id);
    } else {
      seen.add(key);
    }
  }

  if (duplicateIds.length) {
    await Follow.deleteMany({ _id: { $in: duplicateIds } });
  }

  const validFollows = await Follow.find({});
  const users = await User.find({}).select('_id');

  const followersMap = new Map(users.map(user => [String(user._id), []]));
  const followingMap = new Map(users.map(user => [String(user._id), []]));

  for (const follow of validFollows) {
    const followerKey = String(follow.follower);
    const followingKey = String(follow.following);

    if (!followingMap.has(followerKey) || !followersMap.has(followingKey)) {
      await Follow.deleteOne({ _id: follow._id });
      continue;
    }

    followingMap.get(followerKey).push(follow.following);
    followersMap.get(followingKey).push(follow.follower);
  }

  const operations = users.map(user => ({
    updateOne: {
      filter: { _id: user._id },
      update: {
        $set: {
          followers: uniqueObjectIds(followersMap.get(String(user._id))),
          following: uniqueObjectIds(followingMap.get(String(user._id))),
        },
      },
    },
  }));

  if (operations.length) {
    await User.bulkWrite(operations);
  }

  return duplicateIds.length;
}

async function recalculateCommentsCount() {
  const [postCounts, threadCounts] = await Promise.all([
    Comment.aggregate([
      { $match: { targetType: 'post' } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { targetType: 'thread' } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]),
  ]);

  await Promise.all([
    Post.updateMany({}, { $set: { commentsCount: 0 } }),
    Thread.updateMany({}, { $set: { commentsCount: 0 } }),
  ]);

  if (postCounts.length) {
    await Post.bulkWrite(
      postCounts.map(item => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { commentsCount: item.count } },
        },
      }))
    );
  }

  if (threadCounts.length) {
    await Thread.bulkWrite(
      threadCounts.map(item => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { commentsCount: item.count } },
        },
      }))
    );
  }
}

async function repairImages() {
  const products = await Product.find({}).sort({ business: 1, name: 1, _id: 1 });
  const posts = await Post.find({}).sort({ author: 1, title: 1, _id: 1 });

  const productOperations = products.map((product, index) => ({
    updateOne: {
      filter: { _id: product._id },
      update: { $set: { image: productImageUrl(product, index) } },
    },
  }));

  const postOperations = posts.map((post, index) => ({
    updateOne: {
      filter: { _id: post._id },
      update: { $set: { image: postImageUrl(post, index) } },
    },
  }));

  if (productOperations.length) await Product.bulkWrite(productOperations);
  if (postOperations.length) await Post.bulkWrite(postOperations);

  return {
    productsUpdated: products.length,
    postsUpdated: posts.length,
    uniqueProductImages: new Set(
      products.map((product, index) => productImageUrl(product, index))
    ).size,
    uniquePostImages: new Set(
      posts.map((post, index) => postImageUrl(post, index))
    ).size,
  };
}

async function ensureIndexes() {
  // Prevent the same e-mail and follow relation from being inserted again.
  // If your User schema already has unique: true on email, syncIndexes is enough.
  try {
    await User.collection.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: {
          email: { $type: 'string' },
        },
        name: 'unique_user_email',
      }
    );
  } catch (error) {
    console.warn('Could not create unique email index:', error.message);
  }

  try {
    await Follow.collection.createIndex(
      { follower: 1, following: 1 },
      { unique: true, name: 'unique_follow_relation' }
    );
  } catch (error) {
    console.warn('Could not create unique follow index:', error.message);
  }
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing from .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const removedUsers = await mergeDuplicateUsers();
  const removedProducts = await removeDuplicateProducts();
  const removedPosts = await removeDuplicatePosts();
  const removedThreads = await removeDuplicateThreads();
  const removedFollows = await rebuildFollowData();

  await recalculateCommentsCount();
  const images = await repairImages();
  await ensureIndexes();

  console.log('\nRepair completed successfully.');
  console.log(`Duplicate users/businesses removed: ${removedUsers}`);
  console.log(`Duplicate products removed: ${removedProducts}`);
  console.log(`Duplicate posts removed: ${removedPosts}`);
  console.log(`Duplicate threads removed: ${removedThreads}`);
  console.log(`Duplicate follows removed: ${removedFollows}`);
  console.log(`Product images updated: ${images.productsUpdated}`);
  console.log(`Unique product image URLs: ${images.uniqueProductImages}`);
  console.log(`Post images updated: ${images.postsUpdated}`);
  console.log(`Unique post image URLs: ${images.uniquePostImages}`);
}

run()
  .catch(error => {
    console.error('\nRepair failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
