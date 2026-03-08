const db = require('../config/db');

// @route   GET api/admin/users
// @desc    Get all users for management
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT 
                user_id as id, 
                full_name as name, 
                email, 
                mobile, 
                role, 
                created_at as joined,
                (SELECT COUNT(*) FROM assets WHERE user_id = users.user_id) as asset_count
            FROM users
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @route   DELETE api/admin/users/:userId
// @desc    Delete a user and their assets
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    const { userId } = req.params;

    // Prevent self-deletion
    const requestingAdminId = req.user ? (req.user.id || req.user.user_id || req.userId) : null;
    if (requestingAdminId && parseInt(requestingAdminId, 10) === parseInt(userId, 10)) {
        return res.status(403).json({ message: 'Action Denied: You cannot delete your own admin account.' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Find any nominees to purge their shadow accounts
        const [nominees] = await connection.execute('SELECT email, mobile FROM nominees WHERE user_id = ?', [userId]);

        // Delete related data first (Security answers, assets, OTPs)
        await connection.execute('DELETE FROM user_security_answers WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM assets WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM otp_codes WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM audit_logs WHERE user_id = ?', [userId]);

        // Delete the nominee records
        await connection.execute('DELETE FROM nominees WHERE user_id = ?', [userId]);

        // Delete shadow nominee users
        for (const nominee of nominees) {
            await connection.execute('DELETE FROM users WHERE (email = ? OR mobile = ?) AND role = "NOMINEE"', [nominee.email, nominee.mobile]);
        }

        // Final user deletion
        const [result] = await connection.execute('DELETE FROM users WHERE user_id = ?', [userId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        await connection.commit();
        res.json({ message: 'User and all associated data purged successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Critical error during user deletion:', error);
        res.status(500).json({ message: 'Critical error during user deletion' });
    } finally {
        connection.release();
    }
};

const getStats = async (req, res) => {
    try {
        const [userResult] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [customerResult] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role = "CUSTOMER"');
        const [assetResult] = await db.execute('SELECT COUNT(*) as total FROM assets');
        const [recent_signups] = await db.execute('SELECT full_name as name, email, created_at FROM users WHERE role = "CUSTOMER" ORDER BY created_at DESC LIMIT 5');

        const stats = {
            total_users: Number(userResult[0].total) || 0,
            total_customers: Number(customerResult[0].total) || 0,
            total_assets: Number(assetResult[0].total) || 0,
            recent_signups: recent_signups || []
        };

        console.log('📊 [ADMIN STATS]:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ [ADMIN STATS ERROR]:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

const getPendingSuccessions = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT sr.*, n.full_name as nominee_name, u.full_name as owner_name, u.email as owner_email
            FROM succession_requests sr
            JOIN nominees n ON sr.nominee_id = n.nominee_id
            JOIN users u ON sr.user_id = u.user_id
            WHERE sr.status = 'PENDING'
            ORDER BY sr.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pending successions' });
    }
};

const handleSuccessionRequest = async (req, res) => {
    const { requestId, action } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [requests] = await connection.execute('SELECT * FROM succession_requests WHERE request_id = ?', [requestId]);
        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requests[0];
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const userStatus = action === 'APPROVE' ? 'GREEN' : 'RED';

        // Update request status
        await connection.execute('UPDATE succession_requests SET status = ? WHERE request_id = ?', [newStatus, requestId]);

        // Update user status
        await connection.execute('UPDATE users SET succession_status = ? WHERE user_id = ?', [userStatus, request.user_id]);

        await connection.commit();
        res.json({ message: `Succession request ${action.toLowerCase()}d successfully` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error handling succession request' });
    } finally {
        connection.release();
    }
};

module.exports = { getAllUsers, deleteUser, getStats, getPendingSuccessions, handleSuccessionRequest };
