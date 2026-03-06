const express = require('express');
const router = express.Router();
const { addAsset, getAssets, updateAsset, deleteAsset } = require('../controllers/assetController');
const { auth } = require('../middleware/auth');

// All asset routes are protected
router.use(auth);

// @route   POST api/assets
router.post('/', addAsset);

// @route   GET api/assets
router.get('/', getAssets);

// @route   PUT api/assets/:id
router.put('/:id', updateAsset);

// @route   DELETE api/assets/:id
router.delete('/:id', deleteAsset);

module.exports = router;
