const db = require('../config/db');
const { sendEmailOTP, sendEmail } = require('./emailService'); // Reusing email infrastructure
const { sendWhatsAppOTP, sendWhatsApp } = require('./msg91Service'); // Reusing msg91 infrastructure
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
        // Find users based on their specific settings in the users table
        const [users] = await db.execute(`
            SELECT u.user_id, u.email, u.mobile, u.full_name, u.inactivity_reminder_count, 
                   u.reminder_interval, u.inactivity_trigger_period
            FROM users u
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

                const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
                // 1. Send Email Reminder
                const emailSubject = `🚨 Action Required: Stardust Asset Management Pulse Check`;
                const emailHtml = `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
                        <h2 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Securing Your Assets & Succession</h2>
                        <p>Hi ${user.full_name || 'Valued User'},</p>
                        <p>This is an automated <strong>Security Pulse Check</strong> from Stardust.</p>
                        <p>Stardust is a comprehensive <strong>Asset Management and Succession Platform</strong>. Our mission is to ensure that your financial assets and digital legacy are protected and seamlessly transitioned to your loved ones when the time comes.</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                            <p style="margin: 0; font-weight: bold;">Current Status: Inactive</p>
                            <p style="margin: 5px 0 0 0; font-size: 14px;">According to your custom protocol, we send a reminder every <strong>${user.reminder_interval} months</strong>.</p>
                        </div>
                        <p><strong>To prevent your legacy protocol from initiating:</strong> Please log in to your dashboard within the next ${user.inactivity_trigger_period - (user.inactivity_reminder_count * user.reminder_interval)} months.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Log In to Reset Timer</a>
                        </div>
                        <p style="font-size: 12px; color: #6b7280; line-height: 1.6;">If you do not take action, your registered nominees will eventually be granted access to your vault metadata to begin the succession process.</p>
                    </div>
                `;
                await sendEmail(user.email, emailSubject, emailHtml);

                // 2. Send WhatsApp Reminder
                const waMessage = `✨ [Stardust Security] Hi ${user.full_name}. This is your scheduled activity pulse. To keep your vault private and prevent legacy transfer, please log in at: ${loginUrl}`;
                await sendWhatsApp(user.mobile, waMessage);

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
            SELECT u.user_id, u.full_name as user_name, u.inactivity_trigger_period
            FROM users u
            WHERE u.role = 'CUSTOMER'
            AND u.succession_status = 'NONE'
            AND u.last_login_at < DATE_SUB(NOW(), INTERVAL u.inactivity_trigger_period MONTH)
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

                const successionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-succession?token=${token}`;
                console.log(`[INACTIVITY] Notifying nominee ${nominee.email} for vault ${user.user_id}`);

                // 1. Send Nominee Email (Production Ready)
                const nomineeSubject = `📜 Legacy Succession Invitation: Action Required for ${user.user_name}'s Vault`;
                const nomineeHtml = `
                    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 0; margin: 0; background-color: #f8fafc; color: #1e293b; line-height: 1.6;">
                        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 48px 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Stardust</h1>
                                <p style="color: rgba(255, 255, 255, 0.9); margin-top: 8px; font-weight: 500;">Asset Management & Succession Platform</p>
                            </div>
                            
                            <div style="padding: 40px;">
                                <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 24px;">Hello ${nominee.full_name},</h2>
                                
                                <p style="margin-bottom: 24px;">We are writing to you on behalf of <strong>${user.user_name}</strong>. You have been designated as a trusted <strong>Legacy Contact</strong> in their Stardust account.</p>
                                
                                <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #4f46e5;">
                                    <h3 style="font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">About Stardust</h3>
                                    <p style="margin: 0; font-size: 15px; color: #334155;">Stardust is a secure digital vault that helps individuals manage their financial life and ensure their legacy is never lost. Our platform automates the transfer of vital documents and asset details to family members in the event of unforeseen circumstances or prolonged inactivity.</p>
                                </div>
                                
                                <p style="margin-bottom: 16px;">Because ${user.user_name}'s account has reached its <strong>${user.inactivity_trigger_period}-month inactivity threshold</strong>, our protocol has been initiated. If the account owner is no longer able to manage their assets, you are authorized to begin the succession process.</p>
                                
                                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Next Steps for Access:</h3>
                                <ul style="margin: 0 0 32px 0; padding-left: 20px;">
                                    <li style="margin-bottom: 8px;"><strong>Verify Identity:</strong> Use the secure link below to confirm your contact details.</li>
                                    <li style="margin-bottom: 8px;"><strong>Provide Proof:</strong> Following the link, you will need to upload official documentation (e.g., ID or a certificate) for our safety team to review.</li>
                                    <li style="margin-bottom: 8px;"><strong>Wait for Synchronization:</strong> Once approved by our administrators, you will receive the final Master Security Code to unlock ${user.user_name}'s vault.</li>
                                </ul>
                                
                                <div style="text-align: center; margin-bottom: 32px;">
                                    <a href="${successionLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4);">Initiate Verification Process</a>
                                </div>
                                
                                <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This communication is confidential. For your security, please do not share this link with anyone else. If you believe this was sent to you in error, please disregard it.</p>
                            </div>
                            
                            <div style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">&copy; 2026 Stardust Asset Management Platform. All Rights Reserved.</p>
                            </div>
                        </div>
                    </div>
                `;
                await sendEmail(nominee.email, nomineeSubject, nomineeHtml);

                // 2. Send Nominee WhatsApp (Production Ready & Descriptive)
                const nomineeWAMsg =
                    `✨ Hello from Stardust - Asset Management & Succession Platform.

We are reaching out to you on behalf of ${user.user_name}. You have been appointed as their official Legacy Contact. 

Due to extended inactivity on ${user.user_name}'s vault, we are initiating our secure succession protocol. If the account owner is no longer with us or unretrievable, you are authorized to begin the process of claiming their digital assets and financial legacy.

*Steps to Proceed:*
1. Verify your identity.
2. Upload proof (ID/Death Certificate).
3. Wait for Admin approval.

Initiate the legacy transfer here: ${successionLink}

Stardust ensures your loved ones are never left without access to vital financial information.
-------------------
Powered by Stardust`;

                await sendWhatsApp(nominee.mobile, nomineeWAMsg);

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
