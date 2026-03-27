const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, securityController.getLogs);

module.exports = router;
