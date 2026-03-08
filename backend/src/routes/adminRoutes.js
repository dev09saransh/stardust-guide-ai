const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getStats, getPendingSuccessions, handleSuccessionRequest } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/users', adminAuth, getAllUsers);
router.get('/stats', adminAuth, getStats);
router.delete('/users/:userId', adminAuth, deleteUser);

// Succession Management
router.get('/successions/pending', adminAuth, getPendingSuccessions);
router.post('/successions/handle', adminAuth, handleSuccessionRequest);

module.exports = router;
