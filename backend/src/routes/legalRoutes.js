const express = require('express');
const router = express.Router();
const { addLegalDocument, getLegalDocuments, updateLegalDocument, deleteLegalDocument } = require('../controllers/legalController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getLegalDocuments);
router.post('/', auth, addLegalDocument);
router.put('/:id', auth, updateLegalDocument);
router.delete('/:id', auth, deleteLegalDocument);

module.exports = router;
