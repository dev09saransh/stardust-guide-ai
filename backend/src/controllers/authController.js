const User = require('../models/userModel');
const db = require('../config/db');
const { compareData, hashData } = require('../utils/hash');
const jwt = require('jsonwebtoken');
const { sendEmailOTP } = require('../services/emailService');

const generateSecurityCode = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
        code = Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const [rows] = await db.execute('SELECT user_id FROM users WHERE security_code = ?', [code]);
        if (rows.length === 0) isUnique = true;
    }
    return code;
};

const login = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const user = await User.findByIdentifier(identifier);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({
                message: 'Account is temporarily locked. Please try again later.'
            });
        }

        const isMatch = await compareData(password, user.password_hash);

        if (!isMatch) {
            await User.incrementFailedAttempts(user.user_id);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Reset failed attempts on success
        await User.resetFailedAttempts(user.user_id);

        // --- BYPASS OTP FOR ADMIN ---
        if (user.role === 'ADMIN' || user.email === 'admin@stardust.com') {
            const token = jwt.sign(
                { id: user.user_id, role: user.role, email: user.email, mobile: user.mobile },
                process.env.JWT_SECRET,
                { expiresIn: '4h' }
            );

            return res.json({
                message: 'Admin authenticated successfully.',
                status: 'SUCCESS',
                token,
                user: {
                    id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role,
                    is_verified: 1,
                    has_completed_onboarding: !!user.has_completed_onboarding
                }
            });
        }

        // Generate 6-digit OTP for regular users
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [user.user_id, otp_hash, 'WHATSAPP', expires_at]
        );

        console.log(`🔑 [DEVELOPMENT]: OTP for ${user.email} (${user.mobile}): ${otp}`);

        // --- AUDIT LOG & INACTIVITY RESET ---
        const InactivityService = require('../services/inactivityService');
        await InactivityService.resetInactivityOnLogin(user.user_id);

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.execute(
            'INSERT INTO audit_logs (user_id, action, ip_address, device_info) VALUES (?, ?, ?, ?)',
            [user.user_id, 'LOGIN_ATTEMPT_SUCCESS', ip, req.headers['user-agent']]
        );

        // STRICTLY REAL TWILIO SENDING
        const { sendWhatsAppOTP } = require('../services/twilioService');
        try {
            await sendWhatsAppOTP(user.mobile, otp);
        } catch (twilioErr) {
            console.error('❌ [CRITICAL] Twilio failed to send OTP:', twilioErr.message);
            return res.status(503).json({
                message: 'Failed to send WhatsApp OTP. Please ensure Twilio is configured correctly.',
                error: twilioErr.message
            });
        }

        res.json({
            message: 'Step 1 complete: Password verified. OTP required.',
            status: 'OTP_REQUIRED',
            userId: user.user_id,
            mobileSnippet: `XXXXXX${user.mobile.slice(-4)}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const register = async (req, res) => {
    const {
        fullName,
        full_name,
        email,
        mobile,
        password,
        securityAnswers,
        security_answers
    } = req.body;

    const actualFullName = fullName || full_name;
    const actualSecurityAnswers = securityAnswers || security_answers;

    console.log(`🚀 [REGISTRATION]: Starting for ${email}, Mobile: ${mobile}`);

    if (!actualFullName || !email || !mobile || !password || !actualSecurityAnswers) {
        return res.status(400).json({ message: 'Missing required registration fields' });
    }

    if (!Array.isArray(actualSecurityAnswers)) {
        return res.status(400).json({ message: 'Security answers must be provided as an array' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Check if user already exists
        const [existing] = await connection.execute(
            'SELECT * FROM users WHERE email = ? OR mobile = ?',
            [email, mobile]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'User with this email or mobile already exists' });
        }

        const password_hash = await hashData(password);

        // Generate Security Code (Shorter, Plain Text for Dashboard Viewing)
        const rawSecurityCode = await generateSecurityCode();
        // NOT hashing this so user can see it in dashboard

        // Create user
        const [userResult] = await connection.execute(
            'INSERT INTO users (full_name, email, mobile, password_hash, security_code, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
            [actualFullName, email, mobile, password_hash, rawSecurityCode, 0] // Set is_verified = 0, OTP required
        );

        const userId = userResult.insertId;

        // --- NEW: LINK NOMINEE RECORDS TO NEW USER ---
        await connection.execute(
            'UPDATE nominees SET linked_user_id = ? WHERE email = ? OR mobile = ?',
            [userId, email, mobile]
        );

        // Save security answers
        for (const ans of actualSecurityAnswers) {
            if (!ans.question_id || !ans.answer) continue;
            const answer_hash = await hashData(ans.answer.toLowerCase());
            await connection.execute(
                'INSERT INTO user_security_answers (user_id, question_id, answer_hash) VALUES (?, ?, ?)',
                [userId, ans.question_id, answer_hash]
            );
        }

        // Generate Registration OTP (Optional now, but keeping for reference)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await connection.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [userId, otp_hash, 'WHATSAPP', expires_at]
        );

        console.log(`🔑 [DEVELOPMENT]: Registration OTP for ${email} (${mobile}): ${otp}`);

        await connection.commit();

        const { sendWhatsAppOTP } = require('../services/twilioService');
        try {
            await sendWhatsAppOTP(mobile, otp);
        } catch (twilioErr) {
            console.error('⚠️ Twilio failed during registration:', twilioErr.message);
        }

        // Generate Token immediately
        const [userRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        const newUser = userRows[0];
        const token = jwt.sign(
            { id: newUser.user_id, role: newUser.role, email: newUser.email, mobile: newUser.mobile },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.status(201).json({
            message: 'User registered successfully. OTP sent.',
            status: 'REGISTRATION_OTP_REQUIRED',
            userId: userId,
            securityCode: rawSecurityCode,
            mobileSnippet: `XXXXXX${mobile.slice(-4)}`
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    } finally {
        connection.release();
    }
};

const getSecurityQuestions = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM security_questions');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions' });
    }
};

const verifyOTP = async (req, res) => {
    const { userId, otp } = req.body;

    try {
        const [rows] = await db.execute(
            'SELECT * FROM otp_codes WHERE user_id = ? AND channel = "WHATSAPP" AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'No active OTP found' });
        }

        if (new Date(rows[0].expires_at) < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        const isMatch = await compareData(otp, rows[0].otp_code);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Mark OTP as used
        await db.execute('UPDATE otp_codes SET is_used = 1 WHERE otp_id = ?', [rows[0].otp_id]);

        // Mark User as Verified
        await db.execute('UPDATE users SET is_verified = 1 WHERE user_id = ?', [userId]);

        // Get user for token
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        const user = userRows[0];

        const token = jwt.sign(
            { id: user.user_id, role: user.role, email: user.email, mobile: user.mobile },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.json({
            message: 'Verification successful. Accessing vault...',
            token,
            securityCode: user.security_code,
            user: {
                id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                is_verified: 1,
                has_completed_onboarding: !!user.has_completed_onboarding
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// --- RECOVERY LOGIC ---

const getRecoveryQuestions = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const userId = users[0].user_id;
        const [questions] = await db.execute(`
            SELECT q.question_id, q.question 
            FROM security_questions q
            JOIN user_security_answers usa ON q.question_id = usa.question_id
            WHERE usa.user_id = ?
        `, [userId]);

        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching recovery questions' });
    }
};

const verifyRecoveryAnswers = async (req, res) => {
    const { email, answers } = req.body; // answers: [{ question_id: 1, answer: 'pet name' }]
    try {
        const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const userId = users[0].user_id;
        const [storedAnswers] = await db.execute('SELECT question_id, answer_hash FROM user_security_answers WHERE user_id = ?', [userId]);

        let correctCount = 0;
        for (const ans of answers) {
            const stored = storedAnswers.find(s => s.question_id === ans.question_id);
            if (stored && await compareData(ans.answer.toLowerCase(), stored.answer_hash)) {
                correctCount++;
            }
        }

        if (correctCount >= storedAnswers.length && storedAnswers.length > 0) {
            // Success
            const recoveryToken = jwt.sign(
                { id: userId, purpose: 'RECOVERY' },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            res.json({ success: true, recoveryToken });
        } else {
            res.status(400).json({ message: 'Incorrect security answers' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Recovery verification failed' });
    }
};

const resetPassword = async (req, res) => {
    const { email, newPassword, recoveryToken } = req.body;
    try {
        const decoded = jwt.verify(recoveryToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'RECOVERY') return res.status(401).json({ message: 'Invalid token' });

        const hashedPassword = await hashData(newPassword);
        await db.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedPassword, decoded.id]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired recovery token' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = rows[0];
        console.log(`[FORGOT PASSWORD]: Found user ${user.email}, sending OTP to ${user.mobile}`);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.execute(
            'UPDATE users SET reset_otp_hash = ?, reset_otp_expires_at = ?, reset_verified = 0 WHERE user_id = ?',
            [otp_hash, expires_at, user.user_id]
        );

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`FORGOT PASSWORD OTP for ${user.email}: ${otp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const { sendWhatsAppOTP } = require('../services/twilioService');
        try {
            await sendWhatsAppOTP(user.mobile, otp);
            res.json({
                message: 'Password reset OTP sent to WhatsApp',
                userId: user.user_id,
                mobileSnippet: `XXXXXX${user.mobile.slice(-4)}`
            });
        } catch (twilioErr) {
            console.error('Twilio failed for forgot password:', twilioErr.message);
            res.status(503).json({ message: 'Failed to send WhatsApp OTP. Please try again.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyForgotOTP = async (req, res) => {
    const { userId, otp } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT reset_otp_hash, reset_otp_expires_at FROM users WHERE user_id = ?',
            [userId]
        );
        if (rows.length === 0 || !rows[0].reset_otp_hash) {
            return res.status(400).json({ message: 'No reset request found' });
        }
        if (new Date(rows[0].reset_otp_expires_at) < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }
        const isMatch = await compareData(otp, rows[0].reset_otp_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

        await db.execute('UPDATE users SET reset_verified = 1 WHERE user_id = ?', [userId]);

        const resetToken = jwt.sign(
            { id: userId, purpose: 'FORGOT_PASSWORD_RESET' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ message: 'OTP verified successfully', resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPasswordAfterForgot = async (req, res) => {
    const { resetToken, newPassword } = req.body;
    try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'FORGOT_PASSWORD_RESET') return res.status(401).json({ message: 'Invalid reset token' });

        const [userRows] = await db.execute('SELECT reset_verified FROM users WHERE user_id = ?', [decoded.id]);
        if (userRows.length === 0 || !userRows[0].reset_verified) return res.status(401).json({ message: 'Reset not authorized' });

        const hashedPassword = await hashData(newPassword);
        await db.execute(
            'UPDATE users SET password_hash = ?, reset_otp_hash = NULL, reset_otp_expires_at = NULL, reset_verified = 0 WHERE user_id = ?',
            [hashedPassword, decoded.id]
        );
        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired reset token' });
    }
};

// --- ONBOARDING ---

const completeOnboarding = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.execute('UPDATE users SET has_completed_onboarding = 1 WHERE user_id = ?', [userId]);
        res.json({ message: 'Onboarding completed successfully', has_completed_onboarding: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to complete onboarding' });
    }
};

const getOnboardingStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute('SELECT has_completed_onboarding FROM users WHERE user_id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ has_completed_onboarding: !!rows[0].has_completed_onboarding });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch onboarding status' });
    }
};

// --- NOMINEE & PROFILE ---

const saveNominee = async (req, res) => {
    const { full_name, email, mobile, country_code, relationship } = req.body;
    const userId = req.user.id;

    if (!full_name || !email || !mobile || !relationship) {
        return res.status(400).json({ message: 'All nominee fields are required' });
    }

    try {
        const [userRows] = await db.execute('SELECT nominee_limit FROM users WHERE user_id = ?', [userId]);
        const limit = userRows[0]?.nominee_limit || 2;

        const [nominees] = await db.execute('SELECT nominee_id, email, mobile FROM nominees WHERE user_id = ?', [userId]);
        const fullMobile = (country_code || '+91') + mobile;
        const existingNominee = nominees.find(n => n.email === email || n.mobile === fullMobile);

        // Check if the nominee already has a user account
        const [existingUserRows] = await db.execute('SELECT user_id FROM users WHERE email = ? OR mobile = ?', [email, fullMobile]);
        const linkedUserId = existingUserRows[0]?.user_id || null;

        if (existingNominee) {
            await db.execute(
                'UPDATE nominees SET full_name = ?, email = ?, mobile = ?, relationship = ?, linked_user_id = ?, updated_at = NOW() WHERE nominee_id = ?',
                [full_name, email, fullMobile, relationship, linkedUserId, existingNominee.nominee_id]
            );
        } else {
            if (nominees.length >= limit) {
                return res.status(400).json({ message: `Maximum of ${limit} nominees allowed for your vault policy.` });
            }
            await db.execute(
                'INSERT INTO nominees (user_id, full_name, email, mobile, relationship, linked_user_id) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, full_name, email, fullMobile, relationship, linkedUserId]
            );
        }

        res.json({ message: 'Nominee information saved successfully. No account was created for them.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to save nominee' });
    }
};

const getNominee = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute('SELECT * FROM nominees WHERE user_id = ?', [userId]);
        res.json({ nominees: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch nominees' });
    }
};

const sendNomineeEmailOTP = async (req, res) => {
    const { email } = req.body;
    const userId = req.user.id;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await db.execute('INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)', [userId, otp_hash, 'EMAIL', expires_at]);
        await sendEmailOTP(email, otp);
        res.json({ message: `OTP sent to ${email}`, emailSnippet: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
    } catch (error) {
        console.error('Email OTP Error:', error);
        res.status(500).json({ message: 'Failed to send email OTP' });
    }
};

const verifyNomineeEmailOTP = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user.id;
    try {
        const [rows] = await db.execute('SELECT * FROM otp_codes WHERE user_id = ? AND channel = "EMAIL" AND is_used = 0 ORDER BY created_at DESC LIMIT 1', [userId]);
        if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) return res.status(400).json({ message: 'Invalid or expired OTP' });
        const isMatch = await compareData(otp, rows[0].otp_code);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });
        await db.execute('UPDATE otp_codes SET is_used = 1 WHERE otp_id = ?', [rows[0].otp_id]);
        res.json({ message: 'Email verified successfully', email_verified: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to verify email OTP' });
    }
};

const sendNomineePhoneOTP = async (req, res) => {
    const { mobile, country_code } = req.body;
    const userId = req.user.id;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });
    const fullMobile = (country_code || '+91') + mobile;
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await db.execute('INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)', [userId, otp_hash, 'WHATSAPP', expires_at]);
        const { sendWhatsAppOTP } = require('../services/twilioService');
        await sendWhatsAppOTP(fullMobile, otp);
        res.json({ message: `OTP sent to ${fullMobile}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send phone OTP' });
    }
};

const verifyNomineePhoneOTP = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user.id;
    try {
        const [rows] = await db.execute('SELECT * FROM otp_codes WHERE user_id = ? AND channel = "WHATSAPP" AND is_used = 0 ORDER BY created_at DESC LIMIT 1', [userId]);
        if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) return res.status(400).json({ message: 'Invalid or expired OTP' });
        const isMatch = await compareData(otp, rows[0].otp_code);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });
        await db.execute('UPDATE otp_codes SET is_used = 1 WHERE otp_id = ?', [rows[0].otp_id]);
        res.json({ message: 'Phone verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to verify phone OTP' });
    }
};

const getAuditLogs = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.execute('SELECT log_id, action, ip_address, device_info, created_at FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

const getNomineeOpportunities = async (req, res) => {
    // If JWT doesn't have email/mobile, fetch from DB
    let { id, email, mobile } = req.user;

    try {
        if (!email || !mobile) {
            const [rows] = await db.execute('SELECT email, mobile FROM users WHERE user_id = ?', [id]);
            if (rows.length > 0) {
                email = rows[0].email;
                mobile = rows[0].mobile;
            }
        }

        const [rows] = await db.execute(`
            SELECT u_target.full_name, u_target.email, n.nominee_id, n.relationship
            FROM nominees n
            JOIN users u_target ON n.user_id = u_target.user_id
            WHERE n.email = ? OR n.mobile = ?
        `, [email, mobile]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching nominee opportunities' });
    }
};

const linkNomineeAccount = async (req, res) => {
    const { nomineeId, securityCode } = req.body;
    const currentUserId = req.user.id;

    try {
        // Find the nominee record and the vault owner
        const [nomineeRows] = await db.execute('SELECT user_id, email, mobile FROM nominees WHERE nominee_id = ?', [nomineeId]);
        if (nomineeRows.length === 0) return res.status(404).json({ message: 'Nominee record not found' });

        const ownerId = nomineeRows[0].user_id;

        // Verify current user is actually the nominee linked to this record
        const [currentUser] = await db.execute('SELECT email, mobile FROM users WHERE user_id = ?', [currentUserId]);
        if (currentUser.length === 0) return res.status(404).json({ message: 'User not found' });

        const isMatchNominee = (currentUser[0].email === nomineeRows[0].email || currentUser[0].mobile === nomineeRows[0].mobile);
        if (!isMatchNominee) return res.status(403).json({ message: 'Unauthorized: You are not listed as the nominee for this record' });

        // Verify Security Code of the vault owner
        const [ownerRows] = await db.execute('SELECT security_code FROM users WHERE user_id = ?', [ownerId]);
        if (ownerRows.length === 0 || !ownerRows[0].security_code) return res.status(404).json({ message: 'Vault owner not found or has no security code' });

        const sanitize = (code) => code?.replace(/[-\s]/g, '').toUpperCase();
        const isMatchCode = (sanitize(securityCode) === sanitize(ownerRows[0].security_code));
        if (!isMatchCode) return res.status(400).json({ message: 'Invalid security code' });

        // Link the nominee record to the current user if not already linked
        await db.execute('UPDATE nominees SET linked_user_id = ? WHERE nominee_id = ?', [currentUserId, nomineeId]);

        // Set succession status to GREEN for inheritance access (view-only)
        // Note: In a more complex system, we'd have a separate 'account_access' table.
        // For now, setting succession_status = 'GREEN' enables it in inheritedController.
        await db.execute('UPDATE users SET succession_status = "GREEN" WHERE user_id = ?', [ownerId]);

        res.json({ success: true, message: 'Vault linked successfully to your profile' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error linking account' });
    }
};

const getUserProfile = async (req, res) => {
    let userId = req.user.id;
    const vaultContext = req.header('x-vault-context');

    try {
        if (vaultContext && vaultContext !== 'null') {
            const [access] = await db.execute(`
                SELECT u.user_id FROM users u JOIN nominees n ON u.user_id = n.user_id 
                WHERE u.user_id = ? AND n.linked_user_id = ?
            `, [vaultContext, req.user.id]);
            if (access.length > 0) userId = vaultContext;
        }

        const [rows] = await db.execute('SELECT user_id, full_name, email, mobile, address, gender, dob, role, is_verified, has_completed_onboarding, security_code, last_login_at, inactivity_trigger_period, reminder_interval, nominee_limit, created_at FROM users WHERE user_id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

const updateUserProfile = async (req, res) => {
    const { full_name, email, mobile, address, gender, dob } = req.body;
    try {
        const userId = req.user.id;

        // Build dynamic update
        const updates = [];
        const values = [];

        if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (mobile !== undefined) { updates.push('mobile = ?'); values.push(mobile); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address || null); }
        if (gender !== undefined) { updates.push('gender = ?'); values.push(gender || null); }
        if (dob !== undefined) { updates.push('dob = ?'); values.push(dob || null); }

        if (updates.length > 0) {
            values.push(userId);
            await db.execute(
                `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
                values
            );
        }

        // Check completion status regardless of update
        const [nominees] = await db.execute('SELECT COUNT(*) as count FROM nominees WHERE user_id = ?', [userId]);
        const [assets] = await db.execute('SELECT COUNT(*) as count FROM assets WHERE user_id = ?', [userId]);
        const [security] = await db.execute('SELECT COUNT(*) as count FROM user_security_answers WHERE user_id = ?', [userId]);
        const [currentUser] = await db.execute('SELECT full_name, email, mobile, address, gender, dob FROM users WHERE user_id = ?', [userId]);

        const u = currentUser[0];
        const personalFields = (u.full_name && u.email && u.mobile && u.address && u.gender && u.dob);

        if (personalFields && nominees[0].count > 0 && security[0].count > 0) {
            await db.execute('UPDATE users SET has_completed_onboarding = 1 WHERE user_id = ?', [userId]);
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

const getProfileCompletion = async (req, res) => {
    let userId = req.user.id;
    const vaultContext = req.header('x-vault-context');

    try {
        if (vaultContext && vaultContext !== 'null') {
            const [access] = await db.execute(`
                SELECT u.user_id FROM users u JOIN nominees n ON u.user_id = n.user_id 
                WHERE u.user_id = ? AND n.linked_user_id = ?
            `, [vaultContext, req.user.id]);
            if (access.length > 0) userId = vaultContext;
        }

        // 1. Fetch milestones
        const [nominees] = await db.execute('SELECT COUNT(*) as count FROM nominees WHERE user_id = ?', [userId]);
        const [assets] = await db.execute('SELECT COUNT(*) as count FROM assets WHERE user_id = ?', [userId]);
        const [security] = await db.execute('SELECT COUNT(*) as count FROM user_security_answers WHERE user_id = ?', [userId]);

        // 2. Fetch personal fields
        const [userRows] = await db.execute('SELECT full_name, email, mobile, address, gender, dob FROM users WHERE user_id = ?', [userId]);
        const user = userRows[0];

        const fields = {
            full_name: !!user.full_name,
            email: !!user.email,
            mobile: !!user.mobile,
            address: !!user.address,
            gender: !!user.gender,
            dob: !!user.dob,
            has_nominee: nominees[0].count > 0,
            has_security: security[0].count > 0
        };

        const missing = Object.keys(fields).filter(k => !fields[k]);

        // Redistributed Weights for core vault activation:
        // Personal (Name, Email, Mobile, Addr, Gend, DOB) = 70% (approx 11.66% each)
        // Security Questions = 30%
        // Nominee is now a separate milestone (shown but not weighted in core %)

        let score = 0;
        const personalFields = ['full_name', 'email', 'mobile', 'address', 'gender', 'dob'];
        personalFields.forEach(f => { if (fields[f]) score += 11.66; });
        if (fields.has_security) score += 30;

        const finalScore = Math.min(100, Math.round(score));

        res.json({
            percentage: finalScore,
            is_complete: finalScore === 100,
            fields,
            missing
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching completion status' });
    }
};

const recoverLookup = async (req, res) => { res.json({ message: 'Not implemented' }); };
const recoverSendOTP = async (req, res) => { res.json({ message: 'Not implemented' }); };
const recoverVerify = async (req, res) => { res.json({ message: 'Not implemented' }); };
const recoverUpdateAccount = async (req, res) => { res.json({ message: 'Not implemented' }); };

const updateVaultPolicy = async (req, res) => {
    const { inactivity_trigger_period, reminder_interval } = req.body;
    const userId = req.user.id;

    if (!inactivity_trigger_period || !reminder_interval) {
        return res.status(400).json({ message: 'Missing policy fields' });
    }

    try {
        await db.execute(
            'UPDATE users SET inactivity_trigger_period = ?, reminder_interval = ?, updated_at = NOW() WHERE user_id = ?',
            [inactivity_trigger_period, reminder_interval, userId]
        );
        res.json({ message: 'Vault policy updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating vault policy' });
    }
};

module.exports = {
    login,
    register,
    getSecurityQuestions,
    verifyOTP,
    getRecoveryQuestions,
    verifyRecoveryAnswers,
    resetPassword,
    forgotPassword,
    verifyForgotOTP,
    resetPasswordAfterForgot,
    completeOnboarding,
    getOnboardingStatus,
    saveNominee,
    getNominee,
    sendNomineeEmailOTP,
    verifyNomineeEmailOTP,
    sendNomineePhoneOTP,
    verifyNomineePhoneOTP,
    getAuditLogs,
    getNomineeOpportunities,
    linkNomineeAccount,
    getUserProfile,
    updateUserProfile,
    getProfileCompletion,
    recoverLookup,
    recoverSendOTP,
    recoverVerify,
    recoverUpdateAccount,
    updateVaultPolicy
};
