require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
  const Product = require('../src/models/Product');
  const Post = require('../src/models/Post');
  const SavedItem = require('../src/models/SavedItem');
  const ids = [
    '6a5b4ef3d2ab16898abe2e95',
    '6a5b50113dd441507732c297',
    '6a5b50263dd441507732c2a4',
  ].map((id) => new mongoose.Types.ObjectId(id));
  const r = await SavedItem.deleteMany({ refId: { $in: ids } });
  console.log('SavedItems cleaned:', r.deletedCount);
  const recentProducts = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .select('name description image price createdAt')
    .lean();
  const recentPosts = await Post.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .select('title content image createdAt')
    .lean();
  console.log('Recent products:', JSON.stringify(recentProducts, null, 2));
  console.log('Recent posts:', JSON.stringify(recentPosts, null, 2));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
