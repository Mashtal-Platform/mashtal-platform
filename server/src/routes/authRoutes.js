const express = require('express');
const { register, login, me, verifyEmail } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/verify-email', verifyEmail);

module.exports = router;

