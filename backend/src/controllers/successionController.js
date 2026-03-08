const db = require('../config/db');
const path = require('path');

const verifyToken = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        const [requests] = await db.execute(`
            SELECT sr.*, n.full_name as nominee_name, u.full_name as user_name
            FROM succession_requests sr
            JOIN nominees n ON sr.nominee_id = n.nominee_id
            JOIN users u ON sr.user_id = u.user_id
            WHERE sr.token = ? AND sr.status = 'PENDING'
        `, [token]);

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired succession token' });
        }

        const request = requests[0];
        res.json({
            nominee_name: request.nominee_name,
            user_name: request.user_name,
            request_id: request.request_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying succession token' });
    }
};

const uploadProof = async (req, res) => {
    const { token } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Proof document is required' });
    }

    try {
        const [requests] = await db.execute('SELECT * FROM succession_requests WHERE token = ? AND status = "PENDING"', [token]);

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Invalid succession request' });
        }

        const request = requests[0];
        const proofPath = req.file.path;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update request
            await connection.execute(
                'UPDATE succession_requests SET proof_path = ?, updatedAt = NOW() WHERE request_id = ?',
                [proofPath, request.request_id]
            );

            // Update user status to ORANGE
            await connection.execute(
                'UPDATE users SET succession_status = "ORANGE" WHERE user_id = ?',
                [request.user_id]
            );

            await connection.commit();
            res.json({ message: 'Succession proof uploaded successfully. Awaiting admin verification.' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading succession proof' });
    }
};

const discoverAccounts = async (req, res) => {
    const { email, mobile } = req.user;

    try {
        // Find accounts where this user is a nominee
        const [nomineeRecords] = await db.execute(`
            SELECT u.user_id, u.full_name as user_name, n.nominee_id, n.created_at as assigned_date, u.succession_status
            FROM users u
            JOIN nominees n ON u.user_id = n.user_id
            WHERE (n.email = ? OR n.mobile = ?)
            AND u.user_id != ?
        `, [email, mobile, req.user.user_id]);

        res.json(nomineeRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error discovering accounts' });
    }
};

const submitManualClaim = async (req, res) => {
    const { targetUserId, nomineeId } = req.body;
    const currentUserId = req.user.user_id;

    if (!req.file) {
        return res.status(400).json({ message: 'Proof document is required' });
    }

    try {
        // Verify current user IS indeed a nominee for the target user
        const [verify] = await db.execute(
            'SELECT * FROM nominees WHERE nominee_id = ? AND user_id = ?',
            [nomineeId, targetUserId]
        );

        if (verify.length === 0) {
            return res.status(403).json({ message: 'Unauthorized claim' });
        }

        const proofPath = req.file.path;
        const token = `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Create succession request
            await connection.execute(
                'INSERT INTO succession_requests (user_id, nominee_id, proof_path, token, status) VALUES (?, ?, ?, ?, "PENDING")',
                [targetUserId, nomineeId, proofPath, token]
            );

            // Update user status to ORANGE
            await connection.execute(
                'UPDATE users SET succession_status = "ORANGE" WHERE user_id = ?',
                [targetUserId]
            );

            await connection.commit();
            res.json({ message: 'Succession claim submitted for review.' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting manual claim' });
    }
};

const verifyClaimOTP = async (req, res) => {
    const { ownerEmail, otp } = req.body;

    try {
        // In a real scenario, we'd verify the OTP against the otp_codes table
        if (otp && otp.length === 6) {
            // Get owner's assets
            const [owner] = await db.execute('SELECT user_id FROM users WHERE email = ?', [ownerEmail]);
            if (owner.length === 0) return res.status(404).json({ message: 'Owner not found' });

            const [assets] = await db.execute('SELECT * FROM assets WHERE user_id = ?', [owner[0].user_id]);

            res.json({
                success: true,
                message: 'Vault access granted',
                vaultData: assets
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid verification code' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

const initiateClaim = async (req, res) => {
    const { ownerEmail, claimCode } = req.body;

    try {
        const [ownerRows] = await db.execute('SELECT user_id, security_code FROM users WHERE email = ?', [ownerEmail]);
        if (ownerRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Vault owner not found' });
        }

        const ownerId = ownerRows[0].user_id;
        const sanitize = (code) => code?.replace(/[-\s]/g, '').toUpperCase();

        // Verify that the provided claimCode matches the vault's master security_code
        if (sanitize(claimCode) !== sanitize(ownerRows[0].security_code)) {
            return res.status(403).json({ success: false, message: 'Invalid claim code for this vault' });
        }

        // Verify that the person initiating the claim is actually a registered nominee for this vault
        // We'll use the discover logic or previous context, but for now, we just check if any nominee exists for this owner
        const [nomineeRows] = await db.execute(
            'SELECT * FROM nominees WHERE user_id = ?',
            [ownerId]
        );

        if (nomineeRows.length === 0) {
            return res.status(403).json({ success: false, message: 'Unauthorized claim: No nominees registered for this vault' });
        }

        console.log(`[SUCCESSION] Security ID Verified. Sending recovery pulse for vault ${ownerEmail} to nominee: ${nomineeRows[0].full_name}`);

        res.json({
            success: true,
            message: 'Recovery pulse sent. Please verify your identity.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to initiate succession protocol' });
    }
};

module.exports = {
    verifyToken,
    uploadProof,
    discoverAccounts,
    submitManualClaim,
    initiateClaim,
    verifyClaimOTP
};
