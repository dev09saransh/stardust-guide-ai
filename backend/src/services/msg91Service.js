const axios = require('axios');
require('dotenv').config();

/**
 * Sends an OTP via MSG91 (Defaults to SMS, can be configured for WhatsApp)
 * @param {string} to - The recipient's mobile number (with country code, e.g., 919999999999)
 * @param {string} otp - The 6-digit OTP code
 */
const sendWhatsAppOTP = async (to, otp) => {
    // Basic verification of environment variables
    if (!process.env.MSG91_AUTH_KEY) {
        throw new Error('MSG91 Auth Key missing in environment variables');
    }

    // Ensure the phone number is clean (digits only)
    let cleanNumber = to.replace(/\D/g, '');
    
    // MSG91 prefers number without '+' for the OTP API but with country code
    // If it starts with 0 or has fewer than 10 digits, it might be invalid
    // Assuming 'to' already includes country code from frontend/controllers

    try {
        console.log(`📡 [MSG91]: Sending OTP to ${cleanNumber}`);
        
        const response = await axios.post('https://control.msg91.com/api/v5/otp', null, {
            params: {
                template_id: process.env.MSG91_OTP_TEMPLATE_ID,
                mobile: cleanNumber,
                authkey: process.env.MSG91_AUTH_KEY,
                otp: otp
            }
        });

        if (response.data.type === 'error') {
            throw new Error(response.data.message);
        }

        console.log(`✅ [MSG91] OTP sent successfully.`);
        return response.data;
    } catch (err) {
        console.error('❌ [MSG91 ERROR]:', err.response?.data || err.message);
        return { error: err.message };
    }
};

/**
 * Sends a WhatsApp message via MSG91
 * @param {string} to - The recipient's mobile number
 * @param {string} body - The message body
 */
const sendWhatsApp = async (to, body) => {
    if (!process.env.MSG91_AUTH_KEY) {
        console.warn('⚠️ MSG91 API KEYS NOT CONFIGURED. MOCKING MESSAGE TO:', to);
        return { message: 'mock_sent' };
    }

    let cleanNumber = to.replace(/\D/g, '');

    try {
        // MSG91 WhatsApp API requires a template usually for first-time messages
        // But they also have a 'send message' API if the session is open.
        // For simplicity and matching Twilio's current usage (which seems to be free-text body),
        // we'll try to use their WhatsApp message API.
        
        const payload = {
            integrated_number: process.env.MSG91_WHATSAPP_NUMBER,
            content_type: 'text',
            payload: {
                messaging_product: 'whatsapp',
                type: 'text',
                text: {
                    body: body
                }
            },
            recipients: [
                {
                    recipient: cleanNumber
                }
            ]
        };

        const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/send', payload, {
            headers: {
                'authkey': process.env.MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ [MSG91 WHATSAPP] Message sent.`);
        return response.data;
    } catch (err) {
        console.error('❌ [MSG91 WHATSAPP ERROR]:', err.response?.data || err.message);
        return { error: err.message };
    }
};

module.exports = { sendWhatsAppOTP, sendWhatsApp };
