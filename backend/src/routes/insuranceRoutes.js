const express = require('express');
const router = express.Router();
const { addInsurance, getInsurance, updateInsurance, deleteInsurance } = require('../controllers/insuranceController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getInsurance);
router.post('/', auth, addInsurance);
router.put('/:id', auth, updateInsurance);
router.delete('/:id', auth, deleteInsurance);

module.exports = router;
