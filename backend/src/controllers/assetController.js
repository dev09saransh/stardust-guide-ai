const db = require('../config/db');

// @desc    Add a new asset
// @route   POST /api/assets
const addAsset = async (req, res) => {
    const { category, title, metadata, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'INSERT INTO assets (user_id, category, title, metadata, is_encrypted) VALUES (?, ?, ?, ?, ?)',
            [userId, category, title, JSON.stringify(metadata), is_encrypted]
        );

        res.status(201).json({
            message: 'Asset added to vault successfully',
            assetId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding asset to vault' });
    }
};

// @desc    Get all assets for a user
// @route   GET /api/assets
const getAssets = async (req, res) => {
    let userId = req.user.id;
    const { category } = req.query;
    const vaultContext = req.header('x-vault-context');

    console.log(`[GET ASSETS] Context: ${vaultContext}, User: ${req.user.id}`);
    try {
        if (vaultContext && vaultContext !== 'null') {
            const targetUserId = parseInt(vaultContext);
            // Verify access: current user must be a nominee for targetUserId AND targetUserId must be in GREEN status
            const [accessRows] = await db.execute(`
                SELECT u.user_id 
                FROM users u 
                JOIN nominees n ON u.user_id = n.user_id 
                WHERE u.user_id = ? AND n.linked_user_id = ? AND u.succession_status = 'GREEN'
            `, [targetUserId, req.user.id]);

            console.log(`[GET ASSETS] targetUserId=${targetUserId}, req.user.id=${req.user.id}, accessRows.length=${accessRows.length}`);

            if (accessRows.length > 0) {
                userId = targetUserId;
            } else if (targetUserId !== req.user.id) {
                console.log(`[GET ASSETS] Unauthorized. targetUserId !== req.user.id`);
                return res.status(403).json({ message: 'Unauthorized access to this vault' });
            }
        }

        console.log(`[GET ASSETS] Preparing query for userId=${userId}, category=${category}`);

        let query = 'SELECT * FROM assets WHERE user_id = ?';
        let params = [userId];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.execute(query, params);

        // Parse metadata JSON
        const assets = rows.map(asset => ({
            ...asset,
            metadata: typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata
        }));

        res.json(assets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching vault assets' });
    }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
const updateAsset = async (req, res) => {
    const assetId = req.params.id;
    const { category, title, metadata, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'UPDATE assets SET category = ?, title = ?, metadata = ?, is_encrypted = ? WHERE asset_id = ? AND user_id = ?',
            [category, title, JSON.stringify(metadata), is_encrypted, assetId, userId]
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

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
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
