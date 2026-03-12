const db = require('../config/db');

const getInheritedAccounts = async (req, res) => {
    const userId = req.user.id;

    try {
        // Return only accounts that have been explicitly linked via the security code check
        const [accounts] = await db.execute(`
            SELECT u_target.user_id, u_target.full_name, u_target.email
            FROM nominees n
            JOIN users u_target ON n.user_id = u_target.user_id
            WHERE n.linked_user_id = ?
        `, [userId]);

        res.json(accounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching inherited accounts' });
    }
};

module.exports = { getInheritedAccounts };
