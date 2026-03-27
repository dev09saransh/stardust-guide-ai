const express = require('express');
const router = express.Router();
const { addOtherDocument, getOtherDocuments, updateOtherDocument, deleteOtherDocument } = require('../controllers/othersController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getOtherDocuments);
router.post('/', auth, addOtherDocument);
router.put('/:id', auth, updateOtherDocument);
router.delete('/:id', auth, deleteOtherDocument);

module.exports = router;
