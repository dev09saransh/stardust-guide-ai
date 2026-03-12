const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an OTP email using AWS SES (via Nodemailer)
 * @param {string} to - The recipient's email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendEmailOTP = async (to, otp) => {
    if (!process.env.SMTP_HOST) {
        console.log(`⚠️ SMTP NOT CONFIGURED. MOCK EMAIL OTP to ${to}: ${otp} ⚠️`);
        return { success: true, mock: true };
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

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Stardust Security" <onboarding@resend.dev>',
            to: to,
            subject: 'Your Stardust Verification Code',
            html: htmlContent,
        });

        console.log(`✅ [SES EMAIL] OTP sent to ${to}. Message ID: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error('❌ [SES EMAIL ERROR]:', err.message);
        return { error: err.message };
    }
};

const sendEmail = async (to, subject, html) => {
    if (!process.env.SMTP_HOST) {
        console.warn(`⚠️ SMTP NOT CONFIGURED. MOCK EMAIL to ${to}`);
        return { id: 'mock_id', success: true };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Stardust" <vault@resend.dev>',
            to: to,
            subject: subject,
            html: html,
        });
        console.log(`✅ [SES EMAIL] Sent to ${to}. Message ID: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error('❌ [SES EMAIL ERROR]:', err.message);
        return { error: err.message };
    }
};

module.exports = { sendEmailOTP, sendEmail };


