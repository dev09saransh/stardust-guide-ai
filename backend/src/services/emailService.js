const { Resend } = require('resend');
require('dotenv').config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends an OTP email using Resend
 * @param {string} to - The recipient's email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendEmailOTP = async (to, otp) => {
    // Basic verification of environment variables
    if (!process.env.RESEND_API_KEY) {
        // Fallback mock print if Resend is not configured
        console.log(`⚠️ RESEND API KEY NOT CONFIGURED. MOCK EMAIL OTP to ${to}: ${otp} ⚠️`);
        return true;
    }

    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Stardust Vault</h1>
                </div>
                <div style="padding: 30px; background: #ffffff;">
                    <h2 style="color: #1f2937; margin-top: 0;">Nominee Verification</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">You have been added as a legacy contact for a Stardust secure vault. Please use the verification code below to confirm your email address.</p>
                    
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 0;">This code is valid for 10 minutes.</p>
                </div>
            </div>
        `;

        const data = await resend.emails.send({
            from: 'Stardust Security <onboarding@resend.dev>', // Replace with your verified domain later e.g. hello@yourdomain.com
            to: [to],
            subject: 'Your Stardust Verification Code',
            html: htmlContent,
        });

        console.log(`✅ [RESEND EMAIL] OTP sent to ${to}. Message ID: ${data.id}`);
        return data;
    } catch (err) {
        console.error('❌ [RESEND EMAIL ERROR]:', err.message);
        return { error: err.message };
    }
};

const sendEmail = async (to, subject, html) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn(`⚠️ RESEND API KEY NOT CONFIGURED. MOCK EMAIL to ${to}`);
        return { id: 'mock_id' };
    }

    try {
        const data = await resend.emails.send({
            from: 'Stardust <vault@resend.dev>',
            to: [to],
            subject: subject,
            html: html,
        });
        console.log(`✅ [RESEND EMAIL] Sent to ${to}. Message ID: ${data.id}`);
        return data;
    } catch (err) {
        console.error('❌ [RESEND EMAIL ERROR]:', err.message);
        return { error: err.message };
    }
};

module.exports = { sendEmailOTP, sendEmail };
