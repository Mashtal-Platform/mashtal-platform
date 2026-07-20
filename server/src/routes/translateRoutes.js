const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { translate } = require('../controllers/translateController');

const router = express.Router();

router.post('/', requireAuth, translate);

module.exports = router;
