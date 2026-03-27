const express = require('express');
const router = express.Router();
const { addPassword, getPasswords, updatePassword, deletePassword } = require('../controllers/passwordController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getPasswords);
router.post('/', auth, addPassword);
router.put('/:id', auth, updatePassword);
router.delete('/:id', auth, deletePassword);

module.exports = router;
