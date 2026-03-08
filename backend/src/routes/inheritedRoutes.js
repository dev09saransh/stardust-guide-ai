const express = require('express');
const router = express.Router();
const { getInheritedAccounts } = require('../controllers/inheritedController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getInheritedAccounts);

module.exports = router;
