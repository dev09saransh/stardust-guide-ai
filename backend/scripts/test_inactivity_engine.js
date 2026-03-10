const db = require('../src/config/db');
const InactivityService = require('../src/services/inactivityService');

async function runTest() {
    const TEST_USER_ID = 110; // workbedangshu@gmail.com
    const VERIFIED_EMAIL = 'bedangshu2003@gmail.com';

    console.log('🚀 [TEST]: Starting Inactivity Engine Test for User ID:', TEST_USER_ID);

    try {
        // 1. Setup: Use the VERIFIED account email for the nominee
        // This is a bypass for Resend trial limitations which only allow sending to the verified owner
        console.log('📝 [TEST]: Updating/Creating nominee with verified email to bypass SMTP trial limits...');

        await db.execute('DELETE FROM nominees WHERE user_id = ?', [TEST_USER_ID]);
        await db.execute(
            'INSERT INTO nominees (user_id, full_name, email, mobile, relationship) VALUES (?, ?, ?, ?, ?)',
            [TEST_USER_ID, 'Succession Test Nominee', VERIFIED_EMAIL, '+917086396372', 'Self-Test']
        );

        // 2. Scenario 1: Trigger a Reminder (Age login by 4 months)
        console.log('\n📅 [SCENARIO 1]: Testing Reminder Pulse (Age login by 4 months)...');
        await db.execute(
            'UPDATE users SET last_login_at = DATE_SUB(NOW(), INTERVAL 4 MONTH), inactivity_reminder_count = 0, succession_status = "NONE" WHERE user_id = ?',
            [TEST_USER_ID]
        );
        await InactivityService.performInactivityChecks();

        // 3. Scenario 2: Trigger Succession (Age login by 10 months)
        console.log('\n🚩 [SCENARIO 2]: Testing Succession Trigger (Age login by 10 months)...');
        await db.execute(
            'UPDATE users SET last_login_at = DATE_SUB(NOW(), INTERVAL 10 MONTH), succession_status = "NONE" WHERE user_id = ?',
            [TEST_USER_ID]
        );
        await InactivityService.performInactivityChecks();

        // 4. Cleanup/Reset
        console.log('\n🔄 [TEST]: Resetting user to normal state...');
        await InactivityService.resetInactivityOnLogin(TEST_USER_ID);

        console.log('\n✅ [TEST]: End-to-end Inactivity Engine test completed.');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ [TEST ERROR]:', err);
        process.exit(1);
    }
}

runTest();
