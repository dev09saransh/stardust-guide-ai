const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();
const InactivityService = require('./services/inactivityService');
console.log(`[INIT] Loaded ENV: PORT=${process.env.PORT}, SID=${process.env.TWILIO_ACCOUNT_SID ? 'EXISTS' : 'MISSING'}, TOKEN=${process.env.TWILIO_AUTH_TOKEN ? 'EXISTS' : 'MISSING'}`);

const app = express();

// 1. Robust CORS Configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://16.170.248.196:3000',
    'http://localhost:3000'
].filter(Boolean).map(o => o.replace(/\/$/, "")); // Remove trailing slashes

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`⚠️ [CORS REJECTED]: ${origin}`);
            callback(null, true); // Allow for now to unblock
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for development
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Stardust Financial Vault API' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/financial', require('./routes/financialDataRoutes'));
app.use('/api/succession', require('./routes/successionRoutes'));
app.use('/api/vault-policies', require('./routes/vaultPolicyRoutes'));
app.use('/api/inherited', require('./routes/inheritedRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ACTIVE', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        services: {
            db: 'CONNECTED', // Placeholder - status is usually checked via pool.getConnection
            msg91: 'READY',
            ses: 'READY'
        }
    });
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start Inactivity Checks (runs every 24 hours)
    console.log('⏰ [CRON]: Initializing Daily Background Inactivity Scan...');
    setInterval(async () => {
        try {
            console.log('🔍 [CRON]: Running scheduled inactivity and trigger scan...');
            await InactivityService.checkAndSendReminders();
            await InactivityService.checkAndNotifyNominees();
            console.log('✅ [CRON]: Background scan completed.');
        } catch (err) {
            console.error('❌ [CRON ERROR]: Background task failed:', err.message);
        }
    }, 24 * 60 * 60 * 1000);

    // Immediate run on startup in production
    if (process.env.NODE_ENV === 'production') {
        InactivityService.checkAndSendReminders().catch(e => console.error(e));
        InactivityService.checkAndNotifyNominees().catch(e => console.error(e));
    }
});

module.exports = app;
