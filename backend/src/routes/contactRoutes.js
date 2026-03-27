const express = require('express');
const router = express.Router();
const { addContact, getContacts, updateContact, deleteContact } = require('../controllers/contactController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getContacts);
router.post('/', auth, addContact);
router.put('/:id', auth, updateContact);
router.delete('/:id', auth, deleteContact);

module.exports = router;
