const db = require('../config/db');

class User {
    static async findByIdentifier(identifier) {
        if (identifier.includes('@')) {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [identifier.toLowerCase()]);
            return rows[0];
        }

        const cleanDigits = identifier.replace(/\D/g, '');
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE mobile = ? OR mobile LIKE ?',
            [identifier, `%${cleanDigits}`]
        );
        return rows[0];
    }

    static async incrementFailedAttempts(userId) {
        await db.execute(
            'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE user_id = ?',
            [userId]
        );
        const [rows] = await db.execute('SELECT failed_attempts FROM users WHERE user_id = ?', [userId]);
        if (rows[0].failed_attempts >= 5) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            await db.execute('UPDATE users SET locked_until = ? WHERE user_id = ?', [lockUntil, userId]);
        }
    }

    static async resetFailedAttempts(userId) {
        await db.execute(
            'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?',
            [userId]
        );
    }
}

module.exports = User;
