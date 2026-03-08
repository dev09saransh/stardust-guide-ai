const express = require('express');
const router = express.Router();
const { getPolicy, getAllPolicies, createPolicy } = require('../controllers/vaultPolicyController');
const { adminAuth, customerAuth } = require('../middleware/auth');

router.get('/:id', customerAuth, getPolicy);
router.get('/', adminAuth, getAllPolicies);
router.post('/', adminAuth, createPolicy);

module.exports = router;
