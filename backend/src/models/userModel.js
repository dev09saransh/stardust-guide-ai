const db = require('../config/db');

class User {
    static async findByIdentifier(identifier) {
        // If it's an email, search directly
        if (identifier.includes('@')) {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [identifier.toLowerCase()]);
            return rows[0];
        }

        // Clean digits for phone search
        const cleanDigits = identifier.replace(/\D/g, '');

        // Search by exact match OR match ending with digits (to handle country codes)
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

        // Check if we should lock (e.g. 5 attempts)
        const [rows] = await db.execute('SELECT failed_attempts FROM users WHERE user_id = ?', [userId]);
        if (rows[0].failed_attempts >= 5) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
            await db.execute('UPDATE users SET locked_until = ? WHERE user_id = ?', [lockUntil, userId]);
        }
    }

    static async updateFailedAttempts(userId, attempts, lockUntil = null) {
        await db.execute(
            'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE user_id = ?',
            [attempts, lockUntil, userId]
        );
    }

    static async resetFailedAttempts(userId) {
        await db.execute(
            'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?',
            [userId]
        );
    }

    static async create(userData) {
        const { full_name, email, mobile, password_hash, role = 'CUSTOMER' } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, mobile, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, mobile, password_hash, role]
        );
        return result.insertId;
    }
}

module.exports = User;
