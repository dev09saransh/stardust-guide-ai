const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Add a new password entry
 */
const addPassword = async (req, res) => {
    const { site, username, password, notes, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    if (!site || !username || !password) {
        return res.status(400).json({ message: 'Site, username, and password are required' });
    }

    try {
        const encryptedPassword = encrypt(password);
        const [result] = await db.execute(
            'INSERT INTO passwords (user_id, site, username, encrypted_password, notes, is_encrypted) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, site, username, encryptedPassword, notes, is_encrypted]
        );

        res.status(201).json({
            message: 'Password saved successfully',
            passwordId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving password' });
    }
};

/**
 * Get all passwords for the authenticated user
 */
const getPasswords = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM passwords WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        const passwords = rows.map(pw => {
            let decryptedPassword = pw.encrypted_password;
            if (decryptedPassword && decryptedPassword.includes(':')) {
                decryptedPassword = decrypt(decryptedPassword);
            }
            return {
                ...pw,
                password: decryptedPassword,
                encrypted_password: undefined // Don't send the raw IV string
            };
        });

        res.json(passwords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching passwords' });
    }
};

/**
 * Update an existing password entry
 */
const updatePassword = async (req, res) => {
    const passwordId = req.params.id;
    const { site, username, password, notes, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        let updateQuery = 'UPDATE passwords SET site = ?, username = ?, notes = ?, is_encrypted = ?';
        let params = [site, username, notes, is_encrypted];

        if (password) {
            const encryptedPassword = encrypt(password);
            updateQuery += ', encrypted_password = ?';
            params.push(encryptedPassword);
        }

        updateQuery += ' WHERE password_id = ? AND user_id = ?';
        params.push(passwordId, userId);

        const [result] = await db.execute(updateQuery, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Password entry not found or unauthorized' });
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating password' });
    }
};

/**
 * Delete a password entry
 */
const deletePassword = async (req, res) => {
    const passwordId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM passwords WHERE password_id = ? AND user_id = ?',
            [passwordId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Password entry not found or unauthorized' });
        }

        res.json({ message: 'Password deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting password' });
    }
};

module.exports = { addPassword, getPasswords, updatePassword, deletePassword };
