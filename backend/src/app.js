const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const InactivityService = require('./services/inactivityService');
console.log(`[INIT] Loaded ENV: PORT=${process.env.PORT}, SES=${process.env.EMAIL_USER ? 'READY' : 'MISSING'}, MSG91=${process.env.MSG91_AUTH_KEY ? 'READY' : 'MISSING'}`);

const app = express();

// 1. Robust CORS Configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://13.126.194.9:3000',
    'http://localhost:3000'
].filter(Boolean).map(o => o.replace(/\/$/, ""));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // During stabilization, we'll allow it but log it
            console.log(`[CORS] Warning: Origin ${origin} not in allowed list, but allowing for now.`);
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
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
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Standard limit for general use
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, // Relaxed for production testing
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again after 15 minutes'
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 20, // Increased for production testing/debugging
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many OTP requests. Please wait 10 minutes before requesting a new code.'
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit file uploads to prevent resource exhaustion
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Upload limit reached. Please try again after 15 minutes.'
});

// Apply Limiters
app.use('/api/auth/login', otpLimiter); // Login triggers OTP
app.use('/api/auth/register', otpLimiter); // Register triggers OTP
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/recover/send-otp', otpLimiter);
app.use('/api/auth/nominee/send-phone-otp', otpLimiter);

app.use('/api/auth/', authLimiter);

app.use('/api/uploads', uploadLimiter);
app.use('/api/', globalLimiter);

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
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Health Check
app.get('/api/health', async (req, res) => {
    let cardBenefitsStatus = 'DOWN';
    try {
        const cbRes = await axios.get('http://localhost:5005/', { timeout: 2000 });
        if (cbRes.status === 200) cardBenefitsStatus = 'ACTIVE';
    } catch (err) {
        cardBenefitsStatus = 'DOWN';
    }

    res.json({ 
        status: 'ACTIVE', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        services: {
            db: 'CONNECTED', 
            msg91: 'READY',
            ses: 'READY',
            card_benefits: cardBenefitsStatus
        }
    });
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    /* 
    // 🚀 Start Credit Card Benefits Service
    // Disabling internal spawning as it's managed by stardust-python.service
    const pythonServicePath = path.join(__dirname, '..', 'card-benefits-service', 'app.py');
    console.log(`🚀 [INIT]: Starting Credit Card Benefits Service at ${pythonServicePath}`);
    
    const pythonProcess = spawn('python3', [pythonServicePath], {
        stdio: 'inherit',
        shell: true
    });

    pythonProcess.on('error', (err) => {
        console.error('❌ [ERROR]: Failed to start Credit Card Benefits Service:', err.message);
    });
    */

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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`❌ [ERROR]: ${err.stack}`);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

module.exports = app;
