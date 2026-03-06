const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload, uploadFile, getFile, deleteFile } = require('../controllers/uploadController');
const jwt = require('jsonwebtoken');

// Middleware that allows token from query string (for file viewing in browser)
const authFlexible = (req, res, next) => {
    // Try header first, then query param
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Upload a file (protected)
router.post('/', auth, upload.single('file'), uploadFile);

// View/download a file (allows token in query string for browser viewing)
router.get('/:filename', authFlexible, getFile);

// Delete a file (protected)
router.delete('/:filename', auth, deleteFile);

module.exports = router;
