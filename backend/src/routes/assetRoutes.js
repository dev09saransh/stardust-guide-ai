const express = require('express');
const router = express.Router();
const { addAsset, getAssets, updateAsset, deleteAsset } = require('../controllers/assetController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAssets);
router.post('/', auth, addAsset);
router.put('/:id', auth, updateAsset);
router.delete('/:id', auth, deleteAsset);

module.exports = router;
