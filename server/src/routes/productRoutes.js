const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
} = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');

const router = express.Router();

router.get('/', (req, res, next) => {
  Promise.resolve(getProducts(req, res)).catch((err) => {
    console.error('[Products] route error:', err.message || err);
    console.error('[Products] stack:', err.stack);
    if (!res.headersSent) res.json([]);
    next(err);
  });
});
router.get('/:id', (req, res, next) => {
  getProductById(req, res).catch((err) => {
    console.error('[Products] getProductById error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to fetch product' });
    next(err);
  });
});
router.post(
  '/',
  requireAuth,
  requireRole(['business', 'admin']),
  (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    uploadProductImage(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Image upload failed' });
      }
      next();
    });
  },
  createProduct
);

router.put(
  '/:id',
  requireAuth,
  requireRole(['business', 'admin']),
  (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    uploadProductImage(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Image upload failed' });
      }
      next();
    });
  },
  updateProduct
);

module.exports = router;

