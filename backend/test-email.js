require('dotenv').config();
const { Resend } = require('resend');

// Explicitly pass the key we see in the screenshot just in case dotenv is caching
const apiKey = process.env.RESEND_API_KEY || "re_KY1Q6uRi_4v4YBuHxVpUcKdv8UR9cg1n4";
const resend = new Resend(apiKey);

async function testEmail() {
    console.log("Using API Key starting with:", apiKey.substring(0, 10) + "...");

    try {
        const data = await resend.emails.send({
            from: 'Stardust Security <onboarding@resend.dev>',
            to: ['bedangshurajmudiar@gmail.com'],
            subject: 'Stardust OTP Verification',
            html: '<h1>Your OTP is 728192</h1>',
        });
        console.log("✅ Success! Email sent object:", data);
    } catch (error) {
        console.error("❌ Failed with error:", error);
    }
}

testEmail();
