const db = require('../config/db');
const { sendEmailOTP } = require('./emailService'); // Reusing email infrastructure
const { sendWhatsAppOTP } = require('./twilioService'); // Reusing twilio infrastructure
const crypto = require('crypto');

/**
 * Service to handle user inactivity detection and notifications.
 */
class InactivityService {
    /**
     * Main check function to be run periodically (e.g., daily cron)
     */
    static async performInactivityChecks() {
        console.log('🕵️ [INACTIVITY]: Starting periodic checks using Vault Policies...');

        // 1. Send Periodic Reminders (based on policy interval)
        await this.checkAndSendReminders();

        // 2. Identify Dead Accounts (based on trigger period)
        await this.checkAndNotifyNominees();

        console.log('✅ [INACTIVITY]: Periodic checks completed.');
    }

    static async checkAndSendReminders() {
        // Find users based on their specific vault policies
        const [users] = await db.execute(`
            SELECT u.user_id, u.email, u.mobile, u.full_name, u.inactivity_reminder_count, 
                   vp.reminder_interval, vp.inactivity_trigger_period
            FROM users u
            JOIN vault_policies vp ON u.vault_policy_id = vp.policy_id
            WHERE u.role = 'CUSTOMER' 
            AND u.is_active = 1
            AND u.succession_status = 'NONE'
        `);

        for (const user of users) {
            const monthsInactive = user.inactivity_reminder_count * user.reminder_interval;
            const nextReminderDue = user.reminder_interval * (user.inactivity_reminder_count + 1);

            // Logic: Send reminder if last_login_at < current_date - nextReminderDue
            // and monthsInactive < inactivity_trigger_period
            const [check] = await db.execute(`
                SELECT 1 FROM users 
                WHERE user_id = ? 
                AND last_login_at < DATE_SUB(NOW(), INTERVAL ? MONTH)
                AND ? < ?
            `, [user.user_id, nextReminderDue, monthsInactive, user.inactivity_trigger_period]);

            if (check.length > 0) {
                console.log(`📧 [INACTIVITY]: Sending reminder ${user.inactivity_reminder_count + 1} to ${user.email}`);
                // Increment reminder count
                await db.execute(
                    'UPDATE users SET inactivity_reminder_count = inactivity_reminder_count + 1 WHERE user_id = ?',
                    [user.user_id]
                );
            }
        }
    }

    static async checkAndNotifyNominees() {
        // Users who hit the trigger period
        const [users] = await db.execute(`
            SELECT u.user_id, u.full_name as user_name, vp.inactivity_trigger_period
            FROM users u
            JOIN vault_policies vp ON u.vault_policy_id = vp.policy_id
            WHERE u.role = 'CUSTOMER'
            AND u.succession_status = 'NONE'
            AND u.last_login_at < DATE_SUB(NOW(), INTERVAL vp.inactivity_trigger_period MONTH)
        `);

        for (const user of users) {
            console.log(`🚩 [INACTIVITY]: Account ${user.user_id} reached trigger point (${user.inactivity_trigger_period} months). Marking as RED.`);

            // Mark user as RED
            await db.execute('UPDATE users SET succession_status = "RED" WHERE user_id = ?', [user.user_id]);

            // Get all nominees for this user
            const [nominees] = await db.execute('SELECT * FROM nominees WHERE user_id = ?', [user.user_id]);

            for (const nominee of nominees) {
                const token = crypto.randomBytes(32).toString('hex');
                await db.execute(
                    'INSERT INTO succession_requests (user_id, nominee_id, token) VALUES (?, ?, ?)',
                    [user.user_id, nominee.nominee_id, token]
                );

                const successionLink = `http://localhost:3000/verify-succession?token=${token}`;
                console.log(`[INACTIVITY] Notifying nominee ${nominee.email} for vault ${user.user_id}`);
                console.log(`Link: ${successionLink}`);
            }
        }
    }

    /**
     * Resets inactivity status if the owner logs in.
     * Cancels any pending succession requests.
     */
    static async resetInactivityOnLogin(userId) {
        try {
            const [user] = await db.execute('SELECT succession_status FROM users WHERE user_id = ?', [userId]);

            if (user.length > 0 && user[0].succession_status !== 'NONE') {
                console.log(`🔄 [INACTIVITY]: Owner ${userId} logged in. Resetting succession status and cancelling requests.`);

                await db.execute(`
                    UPDATE users 
                    SET succession_status = 'NONE', 
                        inactivity_reminder_count = 0,
                        last_login_at = NOW() 
                    WHERE user_id = ?
                `, [userId]);

                // Cancel pending succession requests
                await db.execute('DELETE FROM succession_requests WHERE user_id = ? AND status = "PENDING"', [userId]);
            } else {
                await db.execute('UPDATE users SET last_login_at = NOW(), inactivity_reminder_count = 0 WHERE user_id = ?', [userId]);
            }
        } catch (error) {
            console.error('Failed to reset inactivity:', error);
        }
    }
}

module.exports = InactivityService;
