const { sendWhatsAppOTP } = require('./src/services/twilioService');
require('dotenv').config();

const testMobile = '+919830232532'; // Replacing with user's potential number or my test

async function test() {
    console.log('🧪 Testing Twilio WhatsApp OTP...');
    try {
        const result = await sendWhatsAppOTP(testMobile, '123456');
        console.log('✅ Success! Message SID:', result.sid);
    } catch (err) {
        console.error('❌ Failed:', err.message);
    }
}

test();
