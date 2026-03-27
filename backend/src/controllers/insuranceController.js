const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Add a new insurance entry
 */
const addInsurance = async (req, res) => {
    const { policy_name, provider, type, policy_number, premium, coverage, expiry_date, notes, metadata, is_encrypted = 1 } = req.body;
    const userId = req.user.id;

    if (!policy_name) {
        return res.status(400).json({ message: 'Policy name is required' });
    }

    try {
        const encryptedPolicyNumber = encrypt(policy_number);
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        const [result] = await db.execute(
            'INSERT INTO insurance (user_id, policy_name, provider, type, policy_number, premium, coverage, expiry_date, notes, metadata, is_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, policy_name, provider, type, encryptedPolicyNumber, premium, coverage, expiry_date, notes, encryptedMetadata, is_encrypted]
        );

        res.status(201).json({
            message: 'Insurance saved successfully',
            insuranceId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving insurance' });
    }
};

/**
 * Get all insurance policies for the authenticated user
 */
const getInsurance = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM insurance WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        const insurance = rows.map(ins => {
            let decryptedPolicyNumber = ins.policy_number;
            if (decryptedPolicyNumber && decryptedPolicyNumber.includes(':')) {
                decryptedPolicyNumber = decrypt(decryptedPolicyNumber);
            }
            
            let metadataStr = ins.metadata;
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
                ...ins,
                policy_number: decryptedPolicyNumber,
                metadata: parsedMetadata
            };
        });

        res.json(insurance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching insurance' });
    }
};

/**
 * Update an existing insurance entry
 */
const updateInsurance = async (req, res) => {
    const insuranceId = req.params.id;
    const { policy_name, provider, type, policy_number, premium, coverage, expiry_date, notes, metadata, is_encrypted } = req.body;
    const userId = req.user.id;

    try {
        const encryptedPolicyNumber = encrypt(policy_number);
        const encryptedMetadata = encrypt(JSON.stringify(metadata || {}));
        const [result] = await db.execute(
            'UPDATE insurance SET policy_name = ?, provider = ?, type = ?, policy_number = ?, premium = ?, coverage = ?, expiry_date = ?, notes = ?, metadata = ?, is_encrypted = ? WHERE insurance_id = ? AND user_id = ?',
            [policy_name, provider, type, encryptedPolicyNumber, premium, coverage, expiry_date, notes, encryptedMetadata, is_encrypted, insuranceId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Insurance entry not found or unauthorized' });
        }

        res.json({ message: 'Insurance updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating insurance' });
    }
};

/**
 * Delete an insurance entry
 */
const deleteInsurance = async (req, res) => {
    const insuranceId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM insurance WHERE insurance_id = ? AND user_id = ?',
            [insuranceId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Insurance entry not found or unauthorized' });
        }

        res.json({ message: 'Insurance deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting insurance' });
    }
};

module.exports = { addInsurance, getInsurance, updateInsurance, deleteInsurance };
