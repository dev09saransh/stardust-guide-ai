const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: 'Too many requests, please try again after 15 minutes'
});
app.use('/api/', globalLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/passwords', require('./routes/passwordRoutes'));
app.use('/api/insurance', require('./routes/insuranceRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/legal', require('./routes/legalRoutes'));
app.use('/api/others', require('./routes/othersRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/security-logs', require('./routes/securityRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default route
app.get('/', (req, res) => {
    res.json({ message: 'Stardust Vault App Backend API' });
});

// Port
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`🚀 App Backend running on port ${PORT}`);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
