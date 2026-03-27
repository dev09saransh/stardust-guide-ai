/**
 * OTP Provider - switches between 'console' (dev) and 'twilio' (testing)
 * Follows web team's pattern: generate OTP ourselves, hash, store in otp_codes, then SEND via provider
 */
require('dotenv').config();

const sendOTP = async (to, otp) => {
    const provider = process.env.OTP_PROVIDER || 'console';

    if (provider === 'twilio') {
        return await sendViaTwilio(to, otp);
    }

    // Default: console (dev mode - prints OTP to terminal)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📱 OTP for ${to}: ${otp}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true, provider: 'console' };
};

const sendViaTwilio = async (to, otp) => {
    try {
        const client = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const message = await client.messages.create({
            body: `Your Stardust Vault verification code is: ${otp}. Valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        console.log(`✅ [TWILIO] SMS sent to ${to}, SID: ${message.sid}`);
        return { success: true, provider: 'twilio', sid: message.sid };
    } catch (err) {
        console.error(`❌ [TWILIO ERROR]:`, err.message);
        // Fallback to console if Twilio fails
        console.log(`📱 FALLBACK OTP for ${to}: ${otp}`);
        return { success: true, provider: 'console_fallback' };
    }
};

module.exports = { sendOTP };
