const mongoose = require('mongoose');
let Product;
let User;
try {
  Product = require('../models/Product');
  User = require('../models/User');
} catch (loadErr) {
  console.error('[Products] Model load error:', loadErr.message);
}

function getBusinessIdFromRef(businessRef) {
  if (!businessRef) return '';
  if (typeof businessRef === 'string') return businessRef;
  if (businessRef._id) return String(businessRef._id);
  if (typeof businessRef.toString === 'function') return businessRef.toString();
  return '';
}

function shapeOneProduct(p, businessMap) {
  const b = p.business && typeof p.business === 'object' ? p.business : {};
  const isPopulated = !!(b.fullName != null || b.companyName != null || b.avatar != null);
  const businessIdRaw = isPopulated ? getBusinessIdFromRef(b) : getBusinessIdFromRef(p.business);
  const businessId = businessIdRaw || (p.business && p.business.toString ? p.business.toString() : '');
  let businessName = 'Unknown Business';
  let businessAvatar = '';
  let businessVerified = false;
  let businessRating;
  let businessLocation = 'Saudi Arabia';
  if (isPopulated) {
    businessName = String(b.fullName || b.companyName || 'Unknown Business');
    businessAvatar = String(b.avatar || '');
    businessVerified = Boolean(b.verified);
    businessRating = b.rating != null ? Number(b.rating) : undefined;
    businessLocation = String(b.location || b.businessProfile?.location || 'Saudi Arabia');
  } else if (businessMap && businessId && businessMap[businessId]) {
    const biz = businessMap[businessId];
    businessName = String(biz.fullName || biz.companyName || 'Unknown Business');
    businessAvatar = String(biz.avatar || '');
    businessVerified = Boolean(biz.verified);
    businessRating = biz.rating != null ? Number(biz.rating) : undefined;
    businessLocation = String(biz.location || (biz.businessProfile && biz.businessProfile.location) || 'Saudi Arabia');
  }
  return {
    id: (p._id && p._id.toString()) ? String(p._id.toString()) : '',
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    price: Number(p.price) || 0,
    image: String(p.image ?? ''),
    category: (p.category && ['seeds', 'tools', 'fertilizers', 'plants', 'irrigation', 'equipment', 'trees', 'medicament', 'other'].includes(p.category)) ? p.category : 'plants',
    stock: Number(p.stock) || 0,
    rating: Number(p.rating) || 0,
    reviewsCount: Number(p.reviewsCount) || 0,
    businessId,
    businessName,
    businessAvatar,
    businessRole: 'business',
    businessVerified,
    businessRating,
    businessLocation,
    inStock: (Number(p.stock) || 0) > 0,
  };
}

async function getProducts(req, res) {
  const sendEmpty = () => {
    if (!res.headersSent) res.json([]);
  };
  try {
    if (!Product || typeof Product.find !== 'function') {
      console.error('[Products] Product model not available');
      return sendEmpty();
    }
    const query = req && req.query ? req.query : {};
    const businessId = query.businessId;
    const category = query.category;

    // No businessId => return all products from all businesses (e.g. shop page)
    const filter = {};

    if (businessId) {
      try {
        if (User && typeof User.findOne === 'function') {
          const business = await User.findOne({
            $or: [{ _id: businessId }, { businessId }],
            role: 'business',
          }).lean();
          if (business) {
            filter.business = business._id;
          } else {
            try {
              filter.business = new mongoose.Types.ObjectId(businessId);
            } catch (_) {
              return sendEmpty();
            }
          }
        } else {
          filter.business = new mongoose.Types.ObjectId(businessId);
        }
      } catch (userErr) {
        try {
          filter.business = new mongoose.Types.ObjectId(businessId);
        } catch (_) {
          console.error('[Products] User lookup error:', userErr.message);
          return sendEmpty();
        }
      }
    }

    if (category && typeof category === 'string') {
      filter.category = category;
    }

    let products = [];
    try {
      products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .allowDiskUse(true)
        .lean();
    } catch (findErr) {
      console.error('[Products] Product.find error:', findErr.message);
      return sendEmpty();
    }

    if (!Array.isArray(products)) return sendEmpty();

    const businessIds = [...new Set(products.map((p) => {
      const ref = p.business;
      if (!ref) return null;
      if (ref._id) return String(ref._id);
      if (ref.toString && typeof ref.toString === 'function') return ref.toString();
      return null;
    }).filter(Boolean))];
    let businessMap = {};
    if (User && businessIds.length > 0) {
      try {
        const users = await User.find({ _id: { $in: businessIds } })
          .select('fullName avatar verified businessProfile')
          .lean();
        users.forEach((u) => {
          const id = u._id ? String(u._id) : '';
          if (id) {
            businessMap[id] = {
              fullName: u.fullName,
              companyName: u.businessProfile?.companyName,
              avatar: u.avatar || '',
              verified: !!u.verified,
              rating: u.businessProfile?.rating,
              location: u.businessProfile?.location,
              businessProfile: u.businessProfile,
            };
          }
        });
      } catch (mapErr) {
        console.error('[Products] business lookup error:', mapErr.message);
      }
    }

    const shaped = [];
    for (let i = 0; i < products.length; i++) {
      try {
        shaped.push(shapeOneProduct(products[i], businessMap));
      } catch (mapErr) {
        console.error('[Products] shape error:', mapErr.message);
      }
    }
    if (!res.headersSent) {
      console.log('[Products] GET /products: returning', shaped.length, 'products (filter:', Object.keys(filter).length ? 'with filters' : 'all businesses', ')');
      res.json(shaped);
    }
  } catch (err) {
    console.error('[Products] getProducts error:', err.message || err);
    console.error('[Products] getProducts stack:', err.stack);
    sendEmpty();
  }
}

async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id).populate('business').lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const b = product.business || {};
    const shaped = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      businessId: b.businessId || b._id?.toString(),
      businessName: b.fullName || b.companyName || 'Unknown Business',
      businessAvatar: b.avatar,
      businessRole: 'business',
      businessVerified: !!b.verified,
      businessRating: b.rating,
      businessLocation: b.location || 'Saudi Arabia',
      inStock: product.stock > 0,
    };

    res.json(shaped);
  } catch (err) {
    console.error('[Products] getProductById error:', err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  try {
    const body = req.body || {};
    const name = body.name;
    const description = body.description;
    const price = body.price != null ? Number(body.price) : undefined;
    const category = body.category;
    const stock = body.stock != null ? Number(body.stock) : 0;
    const businessIdFromBody = body.businessId;
    const businessId =
      req.user?.role === 'business' ? req.user.id : businessIdFromBody;

    let imagePath = body.image; // optional URL/path from JSON (fallback)
    if (req.file && req.file.filename) {
      const { getRelativePath } = require('../middleware/upload');
      imagePath = getRelativePath('products', req.file.filename);
    }

    if (!name || !description || price == null || !category || !businessId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const business = await User.findOne({
      $or: [{ _id: businessId }, { businessId }],
      role: 'business',
    });

    if (!business) {
      return res.status(400).json({ message: 'Invalid businessId' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: imagePath || undefined,
      category,
      stock,
      business: business._id,
      businessExternalId: business.businessId,
      rating: 3.5,
      reviewsCount: 0,
    });

    res.status(201).json(product.toJSON());
  } catch (err) {
    console.error('[Products] createProduct error:', err);
    res.status(500).json({ message: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const productId = req.params.id;
    const body = req.body || {};
    const name = body.name;
    const description = body.description;
    const price = body.price != null ? Number(body.price) : undefined;
    const category = body.category;
    const stock = body.stock != null ? Number(body.stock) : undefined;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Optional: ensure only the owning business can update (if req.user available)
    if (req.user && req.user.role === 'business' && product.business && product.business.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to update this product' });
    }

    let imagePath = product.image; // keep existing by default
    if (req.file && req.file.filename) {
      const { getRelativePath } = require('../middleware/upload');
      imagePath = getRelativePath('products', req.file.filename);
    } else if (body.image !== undefined) {
      // JSON body can send new path or empty to clear
      imagePath = body.image || '';
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    product.image = imagePath;

    await product.save();
    res.json(product.toJSON());
  } catch (err) {
    console.error('[Products] updateProduct error:', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
};

