const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Add a new contact
 */
const addContact = async (req, res) => {
    const { name, relation, phone, email, id_type, id_number, notes, metadata, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const encryptedIdNumber = id_number ? encrypt(id_number) : null;
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        
        const [result] = await db.execute(
            'INSERT INTO contacts (user_id, name, relation, phone, email, id_type, id_number, notes, metadata, is_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, relation, phone, email, id_type, encryptedIdNumber, notes, encryptedMetadata, is_encrypted]
        );

        res.status(201).json({
            message: 'Contact added successfully',
            contactId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding contact' });
    }
};

/**
 * Get all contacts for the authenticated user
 */
const getContacts = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        const contacts = rows.map(contact => {
            let decryptedIdNumber = contact.id_number;
            if (decryptedIdNumber && decryptedIdNumber.includes(':')) {
                decryptedIdNumber = decrypt(decryptedIdNumber);
            }
            
            let metadataStr = contact.metadata;
            if (metadataStr && metadataStr.includes(':')) {
                metadataStr = decrypt(metadataStr);
            }
            let parsedMetadata = {};
            try {
                parsedMetadata = JSON.parse(metadataStr);
            } catch (pErr) {
                parsedMetadata = { error: 'Failed to parse metadata', raw: metadataStr };
            }

            return {
                ...contact,
                id_number: decryptedIdNumber,
                metadata: parsedMetadata
            };
        });

        res.json(contacts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching contacts' });
    }
};

/**
 * Update an existing contact
 */
const updateContact = async (req, res) => {
    const contactId = req.params.id;
    const { name, relation, phone, email, id_type, id_number, notes, metadata, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        const encryptedIdNumber = id_number ? encrypt(id_number) : null;
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        
        const [result] = await db.execute(
            'UPDATE contacts SET name = ?, relation = ?, phone = ?, email = ?, id_type = ?, id_number = ?, notes = ?, metadata = ?, is_encrypted = ? WHERE contact_id = ? AND user_id = ?',
            [name, relation, phone, email, id_type, encryptedIdNumber, notes, encryptedMetadata, is_encrypted, contactId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contact not found or unauthorized' });
        }

        res.json({ message: 'Contact updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating contact' });
    }
};

/**
 * Delete a contact
 */
const deleteContact = async (req, res) => {
    const contactId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM contacts WHERE contact_id = ? AND user_id = ?',
            [contactId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contact not found or unauthorized' });
        }

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting contact' });
    }
};

module.exports = { addContact, getContacts, updateContact, deleteContact };
