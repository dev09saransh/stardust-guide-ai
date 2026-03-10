const db = require('../config/db');

const getInheritedAccounts = async (req, res) => {
    const { email, mobile, id } = req.user;

    try {
        // Find users for whom the current user is a nominee and succession_status is GREEN
        const [accounts] = await db.execute(`
            SELECT u_target.user_id, u_target.full_name, u_target.email
            FROM nominees n
            JOIN users u_target ON n.user_id = u_target.user_id
            WHERE (n.email = ? OR n.mobile = ?) 
            AND (u_target.succession_status = 'GREEN' OR n.linked_user_id = ?)
        `, [email || null, mobile || null, id]);

        res.json(accounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching inherited accounts' });
    }
};

module.exports = { getInheritedAccounts };
