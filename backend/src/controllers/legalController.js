const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Add a new legal document
 */
const addLegalDocument = async (req, res) => {
    const { title, doc_type, description, metadata, notes, file_key, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        const [result] = await db.execute(
            'INSERT INTO legal_documents (user_id, title, doc_type, description, metadata, notes, file_key, is_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, doc_type, description, encryptedMetadata, notes, file_key, is_encrypted]
        );

        res.status(201).json({
            message: 'Legal document added successfully',
            documentId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding legal document' });
    }
};

/**
 * Get all legal documents for the authenticated user
 */
const getLegalDocuments = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM legal_documents WHERE user_id = ? ORDER BY created_at DESC', [userId]);

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
        res.status(500).json({ message: 'Error fetching legal documents' });
    }
};

/**
 * Update an existing legal document
 */
const updateLegalDocument = async (req, res) => {
    const documentId = req.params.id;
    const { title, doc_type, description, metadata, notes, file_key, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        const [result] = await db.execute(
            'UPDATE legal_documents SET title = ?, doc_type = ?, description = ?, metadata = ?, notes = ?, file_key = ?, is_encrypted = ? WHERE document_id = ? AND user_id = ?',
            [title, doc_type, description, encryptedMetadata, notes, file_key, is_encrypted, documentId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Legal document not found or unauthorized' });
        }

        res.json({ message: 'Legal document updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating legal document' });
    }
};

/**
 * Delete a legal document
 */
const deleteLegalDocument = async (req, res) => {
    const documentId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM legal_documents WHERE document_id = ? AND user_id = ?',
            [documentId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Legal document not found or unauthorized' });
        }

        res.json({ message: 'Legal document deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting legal document' });
    }
};

module.exports = { addLegalDocument, getLegalDocuments, updateLegalDocument, deleteLegalDocument };
