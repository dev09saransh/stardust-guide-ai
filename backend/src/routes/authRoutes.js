const express = require('express');
const router = express.Router();
const { login, register, verifyOTP, getProfile, getAuditLogs } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/profile', auth, getProfile);
router.get('/audit-logs', auth, getAuditLogs);

module.exports = router;
