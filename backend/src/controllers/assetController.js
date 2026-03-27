const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Add a new asset
 */
const addAsset = async (req, res) => {
    const { category, title, metadata, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    try {
        const encryptedMetadata = encrypt(JSON.stringify(metadata));
        const [result] = await db.execute(
            'INSERT INTO assets (user_id, category, title, metadata, is_encrypted) VALUES (?, ?, ?, ?, ?)',
            [userId, category, title, encryptedMetadata, is_encrypted]
        );

        res.status(201).json({
            message: 'Asset added successfully',
            assetId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding asset' });
    }
};

/**
 * Get all assets for the authenticated user
 */
const getAssets = async (req, res) => {
    const userId = req.user.id;
    const { category } = req.query;

    try {
        let query = 'SELECT * FROM assets WHERE user_id = ?';
        let params = [userId];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.execute(query, params);

        const assets = rows.map(asset => {
            let metadataStr = asset.metadata;
            // Decrypt if it follows the encrypted format (iv:data)
            if (metadataStr && metadataStr.includes(':')) {
                metadataStr = decrypt(metadataStr);
            }
            
            let parsedMetadata = {};
            try {
                parsedMetadata = JSON.parse(metadataStr);
            } catch (pErr) {
                console.error('[PARSE ERROR] Asset ID:', asset.asset_id, pErr.message);
                parsedMetadata = { error: 'Failed to parse metadata', raw: metadataStr };
            }

            return { ...asset, metadata: parsedMetadata };
        });

        res.json(assets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching assets' });
    }
};

/**
 * Update an existing asset
 */
const updateAsset = async (req, res) => {
    const assetId = req.params.id;
    const { category, title, metadata, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        const encryptedMetadata = encrypt(JSON.stringify(metadata));
        const [result] = await db.execute(
            'UPDATE assets SET category = ?, title = ?, metadata = ?, is_encrypted = ? WHERE asset_id = ? AND user_id = ?',
            [category, title, encryptedMetadata, is_encrypted, assetId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Asset not found or unauthorized' });
        }

        res.json({ message: 'Asset updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating asset' });
    }
};

/**
 * Delete an asset
 */
const deleteAsset = async (req, res) => {
    const assetId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM assets WHERE asset_id = ? AND user_id = ?',
            [assetId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Asset not found or unauthorized' });
        }

        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting asset' });
    }
};

module.exports = { addAsset, getAssets, updateAsset, deleteAsset };
