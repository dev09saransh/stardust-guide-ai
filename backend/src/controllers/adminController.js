const db = require('../config/db');
const { sendEmail } = require('../services/emailService');
const { sendWhatsApp } = require('../services/msg91Service');

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

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        console.log(`🗑️ [ADMIN DELETE]: Initiating robust purge for User ${userId}`);
        
        // Disable FK checks for a clean sweep
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Helper to run delete queries safely
        const safeQuery = async (sql, params) => {
            try {
                await connection.execute(sql, params);
            } catch (err) {
                console.warn(`⚠️ [ADMIN DELETE]: Non-critical step failed: ${sql}. Error: ${err.message}`);
                // Continue despite non-critical failure
            }
        };

        // 1. Identify shadow accounts (NOMINEE role) before deleting the primary user's nominees
        const [nomineeRecs] = await connection.execute('SELECT email, mobile FROM nominees WHERE user_id = ?', [userId]);
        
        // 2. Clear any links where this user is someone else's nominee (linked_user_id)
        await safeQuery('UPDATE nominees SET linked_user_id = NULL WHERE linked_user_id = ?', [userId]);

        // 3. Purge all child records across all known tables
        const tablesToClear = [
            'audit_logs',
            'assets',
            'nominees',
            'succession_requests',
            'user_security_answers',
            'otp_codes'
        ];

        for (const table of tablesToClear) {
            await safeQuery(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
        }
        
        // 4. Clean up shadow accounts created for this user's nominees
        for (const nominee of nomineeRecs) {
            if (nominee.email || nominee.mobile) {
                await safeQuery(
                    'DELETE FROM users WHERE role = "NOMINEE" AND (email = ? OR mobile = ?)', 
                    [nominee.email || '---', nominee.mobile || '---']
                );
            }
        }

        // 5. Final user deletion
        const [result] = await connection.execute('DELETE FROM users WHERE user_id = ?', [userId]);

        // 6. Re-enable FK checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        await connection.commit();
        console.log(`✅ [ADMIN DELETE]: User ${userId} and all child data purged.`);
        res.json({ message: 'User and all associated data purged successfully' });

    } catch (error) {
        try { await connection.execute('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) {}
        await connection.rollback();
        console.error('❌ [ADMIN DELETE ERROR]:', error);
        res.status(500).json({ 
            message: 'Purge Failed', 
            error: error.sqlMessage || error.message,
            code: error.code 
        });
    } finally {
        if (connection) connection.release();
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

        // --- Post-Approval Notification to Nominee ---
        if (action === 'APPROVE') {
            try {
                // Fetch owner, nominee, and user details for the final mail
                const [details] = await db.execute(`
                    SELECT 
                        u.full_name as owner_name, 
                        u.security_code,
                        n.full_name as nominee_name,
                        n.email as nominee_email,
                        n.mobile as nominee_mobile
                    FROM succession_requests sr
                    JOIN users u ON sr.user_id = u.user_id
                    JOIN nominees n ON sr.nominee_id = n.nominee_id
                    WHERE sr.request_id = ?
                `, [requestId]);

                if (details.length > 0) {
                    const d = details[0];
                    const prodUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    const approvalSubject = `✅ Access Granted: ${d.owner_name}'s Stardust Vault`;
                    const approvalHtml = `
                        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
                            <h2 style="color: #10b981; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Verification Successful</h2>
                            <p>Hi ${d.nominee_name},</p>
                            <p>Our administrators have verified your documentation. You have been granted formal <strong>Succession Access</strong> to <strong>${d.owner_name}</strong>'s vault on the Stardust <strong>Asset Management and Succession Platform</strong>.</p>
                            
                            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #bbf7d0; text-align: center;">
                                <p style="margin: 0; font-size: 12px; font-weight: bold; color: #15803d; text-transform: uppercase; tracking-widest: 0.1em;">Master Security Code</p>
                                <p style="margin: 10px 0; font-size: 32px; font-weight: 900; color: #166534; font-family: monospace; letter-spacing: 4px;">${d.security_code}</p>
                            </div>

                            <h3 style="font-size: 18px; font-weight: 700;">Final Steps to Access:</h3>
                            <ol style="line-height: 1.8;">
                                <li><strong>Join Stardust:</strong> If you don't have an account, create one at <a href="${prodUrl}/signup">${prodUrl}/signup</a>.</li>
                                <li><strong>Link the Vault:</strong> Go to your Dashboard, click <strong>"Add Account"</strong> (or "Link Legacy Vault").</li>
                                <li><strong>Input Code:</strong> Enter the Master Security Code provided above when prompted.</li>
                            </ol>

                            <p style="margin-top: 30px; padding: 15px; background: #fffbeb; border-radius: 10px; font-size: 12px; color: #92400e;">
                                🛡️ <strong>Note:</strong> You now have view-access to the vault metadata. This process ensures the privacy of the owner while providing you with necessary asset details.
                            </p>
                        </div>
                    `;
                    await sendEmail(d.nominee_email, approvalSubject, approvalHtml);

                    const approvalWAMsg = `✅ [Stardust] Verification Complete! You now have access to ${d.owner_name}'s vault. Your Master Security Code is: ${d.security_code}. Log in to ${prodUrl} to link the account.`;
                    await sendWhatsApp(d.nominee_mobile, approvalWAMsg);
                }
            } catch (notifyErr) {
                console.error('Failed to send approval notification:', notifyErr);
            }
        }

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
