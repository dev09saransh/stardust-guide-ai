const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Add a new other document
 */
const addOtherDocument = async (req, res) => {
    const { title, category, description, metadata, notes, file_key, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        const [result] = await db.execute(
            'INSERT INTO other_documents (user_id, title, category, description, metadata, notes, file_key, is_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, category, description, encryptedMetadata, notes, file_key, is_encrypted]
        );

        res.status(201).json({
            message: 'Document added to Others section successfully',
            documentId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding document' });
    }
};

/**
 * Get all other documents for the authenticated user
 */
const getOtherDocuments = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM other_documents WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        const documents = rows.map(doc => {
            let metadataStr = doc.metadata;
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
                ...doc,
                metadata: parsedMetadata
            };
        });

        res.json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching documents' });
    }
};

/**
 * Update an existing other document
 */
const updateOtherDocument = async (req, res) => {
    const documentId = req.params.id;
    const { title, category, description, metadata, notes, file_key, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        const [result] = await db.execute(
            'UPDATE other_documents SET title = ?, category = ?, description = ?, metadata = ?, notes = ?, file_key = ?, is_encrypted = ? WHERE document_id = ? AND user_id = ?',
            [title, category, description, encryptedMetadata, notes, file_key, is_encrypted, documentId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Document not found or unauthorized' });
        }

        res.json({ message: 'Document updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating document' });
    }
};

/**
 * Delete an other document
 */
const deleteOtherDocument = async (req, res) => {
    const documentId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM other_documents WHERE document_id = ? AND user_id = ?',
            [documentId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Document not found or unauthorized' });
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting document' });
    }
};

module.exports = { addOtherDocument, getOtherDocuments, updateOtherDocument, deleteOtherDocument };
