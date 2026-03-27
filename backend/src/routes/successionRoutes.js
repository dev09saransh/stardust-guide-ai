const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, uploadProof, discoverAccounts, submitManualClaim, initiateClaim, verifyClaimOTP } = require('../controllers/successionController');
const { getInheritedAccounts } = require('../controllers/inheritedController');
const { adminAuth, customerAuth } = require('../middleware/auth');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/verify', verifyToken);
router.post('/upload', upload.single('proof'), uploadProof);
router.get('/inherited-accounts', customerAuth, getInheritedAccounts);

// Manual Claim Flow
router.get('/discover', customerAuth, discoverAccounts);
router.post('/submit-claim', customerAuth, upload.single('proof'), submitManualClaim);

// Premium Claim Flow (Claim Code + OTP)
router.post('/initiate-claim', initiateClaim);
router.post('/verify-claim-otp', verifyClaimOTP);

module.exports = router;
