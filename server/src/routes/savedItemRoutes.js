const express = require('express');
const {
  getMySaved,
  saveItem,
  deleteSaved,
} = require('../controllers/savedItemController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getMySaved);
router.post('/', requireAuth, saveItem);
router.delete('/:id', requireAuth, deleteSaved);

module.exports = router;

