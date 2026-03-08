const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

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

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
        next();
    };
};

const adminAuth = (req, res, next) => {
    auth(req, res, (err) => {
        if (err) return next(err);
        if (req.user && req.user.role === 'ADMIN') {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
    });
};

const customerAuth = auth;

module.exports = { auth, requireRole, adminAuth, customerAuth };
