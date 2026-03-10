const twilio = require('twilio');
require('dotenv').config();

/**
 * Sends a WhatsApp OTP using Twilio
 * @param {string} to - The recipient's mobile number (with country code)
 * @param {string} otp - The 6-digit OTP code
 */
const sendWhatsAppOTP = async (to, otp) => {
    // Basic verification of environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Twilio credentials missing in environment variables');
    }

    // Initialize client inside function to ensure fresh ENV is used
    const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );

    // Ensure the phone number starts with + and has no spaces/dashes
    let cleanNumber = to.replace(/[^\d+]/g, '');
    if (!cleanNumber.startsWith('+')) {
        cleanNumber = '+' + cleanNumber;
    }

    const formattedTo = `whatsapp:${cleanNumber}`;

    try {
        const messageData = {
            to: formattedTo,
            from: process.env.TWILIO_WHATSAPP_NUMBER
        };

        // Use Content Template if SID is provided, otherwise fallback to body
        if (process.env.TWILIO_CONTENT_SID) {
            messageData.contentSid = process.env.TWILIO_CONTENT_SID;
            messageData.contentVariables = JSON.stringify({ "1": otp });
            console.log(`📋 [TWILIO]: Using Content Template ${process.env.TWILIO_CONTENT_SID}`);
        } else {
            messageData.body = `Your Stardust Vault OTP is ${otp}. Valid for 5 minutes.`;
        }

        const message = await client.messages.create(messageData);
        console.log(`✅ [TWILIO] OTP sent. SID: ${message.sid}`);
        return message;
    } catch (err) {
        console.error('❌ [TWILIO ERROR]:', err.message);
        return { error: err.message };
    }
};

const sendWhatsApp = async (to, body) => {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.warn('⚠️ TWILIO API KEYS NOT CONFIGURED. MOCKING WHATSAPP TO:', to);
        return { sid: 'mock_sid' };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    let cleanNumber = to.replace(/[^\d+]/g, '');
    if (!cleanNumber.startsWith('+')) cleanNumber = '+' + cleanNumber;
    const formattedTo = `whatsapp:${cleanNumber}`;

    try {
        const message = await client.messages.create({
            to: formattedTo,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            body: body
        });
        console.log(`✅ [TWILIO] Message sent. SID: ${message.sid}`);
        return message;
    } catch (err) {
        console.error('❌ [TWILIO ERROR]:', err.message);
        return { error: err.message };
    }
};

module.exports = { sendWhatsAppOTP, sendWhatsApp };
