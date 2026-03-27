const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends an OTP email
 */
const sendEmailOTP = async (to, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Stardust Vault - Your Verification Code',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.025em;">STARDUST</h1>
                    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Secure Digital Legacy</p>
                </div>
                
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 800; margin-bottom: 16px;">Security Verification</h2>
                <p style="color: #475569; font-size: 15px; line-height: 24px; margin-bottom: 24px;">Hello, your one-time verification code for Stardust Vault is below. This code will expire in 10 minutes.</p>
                
                <div style="background: #f8fafc; border: 1px solid #f1f5f9; padding: 24px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1e1b4b;">
                        ${otp}
                    </span>
                </div>
                
                <p style="color: #64748b; font-size: 13px; line-height: 20px;">If you did not request this code, please ignore this email or contact support if you have concerns about your account security.</p>
                
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
                
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 Stardust Financial Vault. ap-south-1 SECURE SERVER.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [EMAIL SENT]: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ [EMAIL ERROR]:', error);
        throw error;
    }
};

/**
 * Generic Email Sender
 */
const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [EMAIL SENT]: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ [EMAIL ERROR]:', error);
        throw error;
    }
};

module.exports = { sendEmailOTP, sendEmail };


