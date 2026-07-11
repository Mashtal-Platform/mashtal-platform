const path = require('path');
const fs = require('fs');
const multer = require('multer');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

const FOLDERS = {
  products: path.join(IMAGES_DIR, 'products'),
  posts: path.join(IMAGES_DIR, 'posts'),
  avatars: path.join(IMAGES_DIR, 'avatars'),
};

// Ensure directories exist
function ensureDirs() {
  [PUBLIC_DIR, IMAGES_DIR, ...Object.values(FOLDERS)].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[Upload] Created directory:', dir);
    }
  });
}
ensureDirs();

function uniqueName(originalName) {
  const ext = path.extname(originalName) || '.jpg';
  const base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  return base + ext;
}

function multerFor(folderKey) {
  const dir = FOLDERS[folderKey];
  if (!dir) throw new Error('Unknown upload folder: ' + folderKey);

  const storage = multer.diskStorage({
    destination(_req, _file, cb) {
      ensureDirs();
      cb(null, dir);
    },
    filename(_req, file, cb) {
      cb(null, uniqueName(file.originalname || 'image'));
    },
  });

  return multer({
    storage,
    limits: { fileSize: 7 * 1024 * 1024 }, // 7MB
    fileFilter(_req, file, cb) {
      const ok = /^image\//.test(file.mimetype);
      if (ok) cb(null, true);
      else cb(new Error('Only image files are allowed'), false);
    },
  });
}

const uploadProductImage = multerFor('products').single('image');
const uploadPostImage = multerFor('posts').single('image');
const uploadAvatar = multerFor('avatars').single('avatar');

/** Relative path from public root, e.g. /images/products/abc.jpg */
function getRelativePath(folderKey, filename) {
  const name = path.basename(filename);
  return path.join('/images', folderKey, name).replace(/\\/g, '/');
}

module.exports = {
  ensureDirs,
  uploadProductImage,
  uploadPostImage,
  uploadAvatar,
  getRelativePath,
  FOLDERS,
};
