const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, submitFeedback);
router.get('/admin', adminAuth, getAllFeedback);

module.exports = router;
