const express = require('express');
const router = express.Router();
const {
    login,
    register,
    getSecurityQuestions,
    verifyOTP,
    getRecoveryQuestions,
    verifyRecoveryAnswers,
    resetPassword,
    forgotPassword,
    verifyForgotOTP,
    resetPasswordAfterForgot,
    completeOnboarding,
    getOnboardingStatus,
    saveNominee,
    getNominee,
    sendNomineeEmailOTP,
    verifyNomineeEmailOTP,
    sendNomineePhoneOTP,
    verifyNomineePhoneOTP,
    getProfileCompletion,
    getUserProfile,
    updateUserProfile,
    recoverLookup,
    recoverSendOTP,
    recoverVerify,
    recoverUpdateAccount,
    getAuditLogs,
    getNomineeOpportunities,
    linkNomineeAccount,
    updateVaultPolicy
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/login
router.post('/login', login);

// @route   POST api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// @route   POST api/auth/register
router.post('/register', register);

// @route   GET api/auth/questions
router.get('/questions', getSecurityQuestions);

// Account Recovery (security questions flow)
router.post('/recovery/questions', getRecoveryQuestions);
router.post('/recovery/verify', verifyRecoveryAnswers);
router.post('/recovery/reset', resetPassword);

// Forgot Password Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOTP);
router.post('/reset-password-forgot', resetPasswordAfterForgot);

// Account Recovery Flow (new multi-method)
router.post('/recover/lookup', recoverLookup);
router.post('/recover/send-otp', recoverSendOTP);
router.post('/recover/verify', recoverVerify);
router.put('/recover/update-account', recoverUpdateAccount);

// Onboarding Tour
router.post('/complete-onboarding', auth, completeOnboarding);
router.get('/onboarding-status', auth, getOnboardingStatus);

// Nominee Management
router.post('/nominee', auth, saveNominee);
router.get('/nominee', auth, getNominee);
router.post('/nominee/send-email-otp', auth, sendNomineeEmailOTP);
router.post('/nominee/verify-email-otp', auth, verifyNomineeEmailOTP);
router.post('/nominee/send-phone-otp', auth, sendNomineePhoneOTP);
router.post('/nominee/verify-phone-otp', auth, verifyNomineePhoneOTP);

// Profile
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.put('/vault-policy', auth, updateVaultPolicy);
router.get('/profile-completion', auth, getProfileCompletion);

// Audit & Account Switching
router.get('/audit-logs', auth, getAuditLogs);
router.get('/nominee-opportunities', auth, getNomineeOpportunities);
router.post('/link-account', auth, linkNomineeAccount);

module.exports = router;

