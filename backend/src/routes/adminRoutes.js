const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, getStats } = require('../controllers/adminController');
const jwt = require('jsonwebtoken');

// Simple admin middleware
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('⚠️ [ADMIN AUTH]: No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'ADMIN') {
            console.log('🚫 [ADMIN AUTH]: Access denied for role:', decoded.role);
            return res.status(403).json({ message: 'Access denied. Admin rights required.' });
        }
        req.user = decoded;
        console.log('👤 [ADMIN AUTH]: Authorized user:', decoded.id);
        next();
    } catch (err) {
        console.log('❌ [ADMIN AUTH]: JWT Error:', err.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

router.get('/users', adminAuth, getAllUsers);
router.get('/stats', adminAuth, getStats);
router.delete('/users/:userId', adminAuth, deleteUser);

module.exports = router;
