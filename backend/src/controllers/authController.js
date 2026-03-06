const User = require('../models/userModel');
const db = require('../config/db');
const { compareData, hashData } = require('../utils/hash');
const jwt = require('jsonwebtoken');
const { sendEmailOTP } = require('../services/emailService');

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

        // --- SKIP OTP FOR ADMIN ---
        if (user.role === 'ADMIN') {
            const token = jwt.sign(
                { id: user.user_id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.json({
                message: 'Admin authenticated successfully. OTP bypassed.',
                status: 'SUCCESS',
                token,
                user: {
                    id: user.user_id,
                    full_name: user.full_name,
                    role: user.role,
                    has_completed_onboarding: true
                }
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [user.user_id, otp_hash, 'WHATSAPP', expires_at]
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

        // Create user
        const [userResult] = await connection.execute(
            'INSERT INTO users (full_name, email, mobile, password_hash) VALUES (?, ?, ?, ?)',
            [actualFullName, email, mobile, password_hash]
        );

        const userId = userResult.insertId;

        // Save security answers
        for (const ans of actualSecurityAnswers) {
            if (!ans.question_id || !ans.answer) continue;
            const answer_hash = await hashData(ans.answer.toLowerCase());
            await connection.execute(
                'INSERT INTO user_security_answers (user_id, question_id, answer_hash) VALUES (?, ?, ?)',
                [userId, ans.question_id, answer_hash]
            );
        }

        // Generate Registration OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await connection.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [userId, otp_hash, 'WHATSAPP', expires_at]
        );

        await connection.commit();

        // STRICTLY REAL TWILIO SENDING
        const { sendWhatsAppOTP } = require('../services/twilioService');
        try {
            console.log(`📤 [REGISTRATION]: Sending WhatsApp OTP to ${mobile}, OTP: ${otp}`);
            await sendWhatsAppOTP(mobile, otp);
            console.log(`✅ [REGISTRATION]: OTP sent successfully to ${mobile}`);
        } catch (twilioErr) {
            console.error('❌ [CRITICAL] Twilio failed to send Registration OTP:', twilioErr.message);
            return res.status(503).json({
                message: 'User registered but failed to send verification OTP.',
                error: twilioErr.message
            });
        }

        // Generate Token immediately so the frontend can choose to skip OTP
        const [userRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        const newUser = userRows[0];
        const token = jwt.sign(
            { id: newUser.user_id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.status(201).json({
            message: 'User registered. Please verify your mobile number with the OTP sent to WhatsApp.',
            status: 'REGISTRATION_OTP_REQUIRED',
            userId: userId,
            token: token,
            user: {
                id: newUser.user_id,
                full_name: newUser.full_name,
                role: newUser.role,
                has_completed_onboarding: !!newUser.has_completed_onboarding
            },
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
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.json({
            message: 'Verification successful. Accessing vault...',
            token,
            user: {
                id: user.user_id,
                full_name: user.full_name,
                role: user.role,
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

        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: 'Security answers must be provided as an array' });
        }

        for (const ans of answers) {
            const [stored] = await db.execute(
                'SELECT answer_hash FROM user_security_answers WHERE user_id = ? AND question_id = ?',
                [userId, ans.question_id]
            );

            if (stored.length === 0) return res.status(400).json({ message: 'Invalid security question' });

            const isMatch = await compareData(ans.answer.toLowerCase(), stored[0].answer_hash);
            if (!isMatch) return res.status(401).json({ message: 'Security answers incorrect' });
        }

        // Generate temporary reset token
        const resetToken = jwt.sign({ userId, email, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });
        res.json({ message: 'Security verified', resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Recovery verification error' });
    }
};

const resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
    try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'password_reset') throw new Error('Invalid token purpose');

        const hashedPassword = await hashData(newPassword);
        await db.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedPassword, decoded.userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired reset session' });
    }
};

const forgotPassword = async (req, res) => {
    const { identifier } = req.body;
    console.log(`[FORGOT PASSWORD]: Search for ${identifier}`);

    try {
        const user = await User.findByIdentifier(identifier);
        if (!user) {
            console.log(`[FORGOT PASSWORD]: User not found for ${identifier}`);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(`[FORGOT PASSWORD]: Found user ${user.email}, sending OTP to ${user.mobile}`);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.execute(
            'UPDATE users SET reset_otp_hash = ?, reset_otp_expires_at = ?, reset_verified = 0 WHERE user_id = ?',
            [otp_hash, expires_at, user.user_id]
        );

        // Also log to console for dev convenience
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
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await db.execute('UPDATE users SET reset_verified = 1 WHERE user_id = ?', [userId]);

        // Generate a temporary reset token
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
        if (decoded.purpose !== 'FORGOT_PASSWORD_RESET') {
            return res.status(401).json({ message: 'Invalid reset token' });
        }

        const [userRows] = await db.execute('SELECT reset_verified FROM users WHERE user_id = ?', [decoded.id]);
        if (userRows.length === 0 || !userRows[0].reset_verified) {
            return res.status(401).json({ message: 'Reset not authorized' });
        }

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
        const userId = req.user.id; // from JWT middleware
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

// --- NOMINEE & PROFILE COMPLETION ---

const saveNominee = async (req, res) => {
    const { full_name, email, mobile, country_code, relationship } = req.body;
    const userId = req.user.id;

    if (!full_name || !email || !mobile || !relationship) {
        return res.status(400).json({ message: 'All nominee fields are required' });
    }

    try {
        // Check if nominee already exists for this user
        const [existing] = await db.execute('SELECT nominee_id FROM nominees WHERE user_id = ?', [userId]);

        const fullMobile = (country_code || '+91') + mobile;

        if (existing.length > 0) {
            await db.execute(
                'UPDATE nominees SET full_name = ?, email = ?, mobile = ?, relationship = ?, updated_at = NOW() WHERE user_id = ?',
                [full_name, email, fullMobile, relationship, userId]
            );
        } else {
            await db.execute(
                'INSERT INTO nominees (user_id, full_name, email, mobile, relationship) VALUES (?, ?, ?, ?, ?)',
                [userId, full_name, email, fullMobile, relationship]
            );
        }

        // CREATE NOMINEE USER ROLE (Shadow user creation)
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1!' + Date.now();
        const password_hash = await hashData(randomPassword);

        await db.execute(
            'INSERT IGNORE INTO users (full_name, email, mobile, password_hash, role, has_completed_onboarding) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, email, fullMobile, password_hash, 'NOMINEE', 1]
        );

        res.json({ message: 'Nominee saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to save nominee' });
    }
};

const getNominee = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute('SELECT * FROM nominees WHERE user_id = ?', [userId]);
        if (rows.length === 0) return res.json({ nominee: null });
        res.json({ nominee: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch nominee' });
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

        await db.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [userId, otp_hash, 'EMAIL', expires_at]
        );

        await sendEmailOTP(email, otp);

        res.json({ message: `OTP sent to ${email}`, emailSnippet: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
    } catch (error) {
        console.error('Email OTP Error:', error);
        res.status(500).json({ message: 'Failed to send email OTP', error: error.message, stack: error.stack });
    }
};

const verifyNomineeEmailOTP = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(
            'SELECT * FROM otp_codes WHERE user_id = ? AND channel = "EMAIL" AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) return res.status(400).json({ message: 'No active email OTP found' });
        if (new Date(rows[0].expires_at) < new Date()) return res.status(400).json({ message: 'OTP expired' });

        const isMatch = await compareData(otp, rows[0].otp_code);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

        await db.execute('UPDATE otp_codes SET is_used = 1 WHERE otp_id = ?', [rows[0].otp_id]);

        // Mark nominee email as verified by adding a flag
        await db.execute(
            'UPDATE nominees SET updated_at = NOW() WHERE user_id = ?',
            [userId]
        );

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

        await db.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [userId, otp_hash, 'WHATSAPP_NOMINEE', expires_at]
        );

        const { sendWhatsAppOTP } = require('../services/twilioService');
        try {
            await sendWhatsAppOTP(fullMobile, otp);
            res.json({ message: `OTP sent via WhatsApp to ${fullMobile}` });
        } catch (twilioErr) {
            console.error('Twilio failed for nominee phone:', twilioErr.message);
            res.status(503).json({ message: 'Failed to send WhatsApp OTP. Please try again later.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send phone OTP' });
    }
};

const verifyNomineePhoneOTP = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(
            'SELECT * FROM otp_codes WHERE user_id = ? AND channel = "WHATSAPP_NOMINEE" AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) return res.status(400).json({ message: 'No active phone OTP found' });
        if (new Date(rows[0].expires_at) < new Date()) return res.status(400).json({ message: 'OTP expired' });

        const isMatch = await compareData(otp, rows[0].otp_code);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

        await db.execute('UPDATE otp_codes SET is_used = 1 WHERE otp_id = ?', [rows[0].otp_id]);

        res.json({ message: 'Phone verified successfully', phone_verified: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to verify phone OTP' });
    }
};

const getProfileCompletion = async (req, res) => {
    try {
        const userId = req.user.id;

        const [userRows] = await db.execute(
            'SELECT full_name, email, mobile, password_hash, address, gender, dob, is_verified, has_completed_onboarding FROM users WHERE user_id = ?',
            [userId]
        );
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

        const u = userRows[0];
        const [nomineeRows] = await db.execute('SELECT nominee_id FROM nominees WHERE user_id = ?', [userId]);

        // 7 personal fields for completion
        const fields = {
            full_name: !!u.full_name,
            email: !!u.email,
            mobile: !!u.mobile,
            password: !!u.password_hash,
            address: !!u.address,
            gender: !!u.gender,
            dob: !!u.dob,
        };

        const completedCount = Object.values(fields).filter(Boolean).length;
        const totalFields = Object.keys(fields).length;
        const percentage = Math.round((completedCount / totalFields) * 100);

        res.json({
            percentage,
            fields,
            has_nominee: nomineeRows.length > 0,
            onboarding_completed: !!u.has_completed_onboarding,
            is_complete: percentage === 100,
            missing: Object.entries(fields).filter(([, v]) => !v).map(([k]) => k),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch profile completion' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute(
            'SELECT user_id, full_name, email, mobile, address, gender, dob, is_verified, has_completed_onboarding, created_at FROM users WHERE user_id = ?',
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const u = rows[0];
        res.json({
            id: u.user_id,
            full_name: u.full_name,
            email: u.email,
            mobile: u.mobile,
            address: u.address,
            gender: u.gender,
            dob: u.dob,
            is_verified: !!u.is_verified,
            has_completed_onboarding: !!u.has_completed_onboarding,
            created_at: u.created_at,
            // Password is always "set" (we never return it)
            password_set: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
};

const updateUserProfile = async (req, res) => {
    const { full_name, address, gender, dob } = req.body;
    const userId = req.user.id;

    try {
        const updates = [];
        const values = [];

        if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address); }
        if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
        if (dob !== undefined) { updates.push('dob = ?'); values.push(dob); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(userId);
        await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// ──────────────────────────────────────────
// ACCOUNT RECOVERY FLOW
// ──────────────────────────────────────────

/**
 * Step 1: Lookup account — return available verification methods
 */
const recoverLookup = async (req, res) => {
    const { identifier } = req.body; // email or phone
    try {
        const user = await User.findByIdentifier(identifier);
        if (!user) return res.status(404).json({ message: 'No account found with that identifier.' });

        // Check what verification options are available
        const methods = [];

        if (user.email) {
            methods.push({
                id: 'email',
                label: `OTP to Email`,
                hint: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            });
        }
        if (user.mobile) {
            methods.push({
                id: 'phone',
                label: `OTP to WhatsApp`,
                hint: `XXXXXX${user.mobile.slice(-4)}`
            });
        }

        // Check nominee
        const [nominees] = await db.execute('SELECT mobile, full_name FROM nominees WHERE user_id = ?', [user.user_id]);
        if (nominees.length > 0 && nominees[0].mobile) {
            methods.push({
                id: 'nominee',
                label: `OTP to Nominee (${nominees[0].full_name})`,
                hint: `XXXXXX${nominees[0].mobile.slice(-4)}`
            });
        }

        // Check security questions
        const [sqCount] = await db.execute(
            'SELECT COUNT(*) as cnt FROM user_security_answers WHERE user_id = ?', [user.user_id]
        );
        if (sqCount[0].cnt > 0) {
            methods.push({ id: 'security', label: 'Security Questions', hint: `${sqCount[0].cnt} questions` });
        }

        if (methods.length === 0) {
            return res.status(400).json({ message: 'No recovery methods available for this account.' });
        }

        res.json({ userId: user.user_id, methods });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during account lookup.' });
    }
};

/**
 * Step 2: Send OTP to chosen channel
 */
const recoverSendOTP = async (req, res) => {
    const { userId, method } = req.body; // method: 'email' | 'phone' | 'nominee'
    try {
        const [users] = await db.execute('SELECT email, mobile FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000);

        await db.execute(
            'UPDATE users SET reset_otp_hash = ?, reset_otp_expires_at = ?, reset_verified = 0 WHERE user_id = ?',
            [otp_hash, expires_at, userId]
        );

        let targetNumber = null;

        if (method === 'phone') {
            targetNumber = users[0].mobile;
        } else if (method === 'nominee') {
            const [nominees] = await db.execute('SELECT mobile FROM nominees WHERE user_id = ?', [userId]);
            if (nominees.length === 0) return res.status(400).json({ message: 'No nominee found.' });
            targetNumber = nominees[0].mobile;
        } else if (method === 'email') {
            // For email, we send via WhatsApp to the user's phone but log to console
            // In production this would be an email service
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`RECOVERY OTP (EMAIL) for user ${userId}: ${otp}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return res.json({ message: `OTP sent to ${users[0].email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}. Check your email.` });
        }

        if (targetNumber) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`RECOVERY OTP (${method.toUpperCase()}) for user ${userId}: ${otp}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            const { sendWhatsAppOTP } = require('../services/twilioService');
            await sendWhatsAppOTP(targetNumber, otp);
            return res.json({ message: `OTP sent via WhatsApp to XXXXXX${targetNumber.slice(-4)}` });
        }

        res.status(400).json({ message: 'Invalid verification method.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};

/**
 * Step 3: Verify — two phases required
 *   phase='otp'      → verifies OTP, marks reset_verified=1, returns { otpVerified: true }
 *   phase='security' → verifies security answers (requires OTP verified), issues resetToken
 */
const recoverVerify = async (req, res) => {
    const { userId, phase, otp, answers } = req.body;
    try {
        if (phase === 'otp') {
            // Phase 1: Verify OTP
            const [rows] = await db.execute(
                'SELECT reset_otp_hash, reset_otp_expires_at FROM users WHERE user_id = ?', [userId]
            );
            if (rows.length === 0 || !rows[0].reset_otp_hash) {
                return res.status(400).json({ message: 'No OTP request found. Please request a new one.' });
            }
            if (new Date(rows[0].reset_otp_expires_at) < new Date()) {
                return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
            }
            const isMatch = await compareData(otp, rows[0].reset_otp_hash);
            if (!isMatch) return res.status(400).json({ message: 'Invalid OTP.' });

            // Mark OTP as verified (but don't issue token yet)
            await db.execute('UPDATE users SET reset_verified = 1 WHERE user_id = ?', [userId]);

            // Fetch security questions for the next step
            const [questions] = await db.execute(`
                SELECT q.question_id, q.question 
                FROM security_questions q
                JOIN user_security_answers usa ON q.question_id = usa.question_id
                WHERE usa.user_id = ?
            `, [userId]);

            return res.json({
                otpVerified: true,
                message: 'OTP verified. Now answer your security questions.',
                securityQuestions: questions
            });

        } else if (phase === 'security') {
            // Phase 2: Verify security answers (OTP must be verified first)
            const [userRows] = await db.execute('SELECT reset_verified FROM users WHERE user_id = ?', [userId]);
            if (userRows.length === 0 || !userRows[0].reset_verified) {
                return res.status(401).json({ message: 'OTP verification required first.' });
            }

            if (!Array.isArray(answers) || answers.length === 0) {
                return res.status(400).json({ message: 'Security answers required.' });
            }
            for (const ans of answers) {
                const [stored] = await db.execute(
                    'SELECT answer_hash FROM user_security_answers WHERE user_id = ? AND question_id = ?',
                    [userId, ans.question_id]
                );
                if (stored.length === 0) {
                    return res.status(400).json({ message: 'Invalid security question.' });
                }

                const answer = String(ans.answer || '').toLowerCase();
                const isMatch = await compareData(answer, stored[0].answer_hash);
                if (!isMatch) {
                    return res.status(401).json({ message: 'Security answers are incorrect.' });
                }
            }

            // All verified — issue reset token
            const resetToken = jwt.sign(
                { id: userId, purpose: 'ACCOUNT_RECOVERY' },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const [user] = await db.execute('SELECT email, mobile FROM users WHERE user_id = ?', [userId]);

            return res.json({
                message: 'Identity fully verified.',
                resetToken,
                currentEmail: user[0]?.email || '',
                currentMobile: user[0]?.mobile || ''
            });

        } else {
            return res.status(400).json({ message: 'Invalid verification phase.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Verification failed.' });
    }
};

/**
 * Step 4: Update account details (email, phone, password)
 */
const recoverUpdateAccount = async (req, res) => {
    const { resetToken, email, mobile, password } = req.body;
    try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'ACCOUNT_RECOVERY') {
            return res.status(401).json({ message: 'Invalid recovery token.' });
        }

        const [userRows] = await db.execute('SELECT reset_verified FROM users WHERE user_id = ?', [decoded.id]);
        if (userRows.length === 0 || !userRows[0].reset_verified) {
            return res.status(401).json({ message: 'Recovery not authorized.' });
        }

        // Build dynamic update
        const updates = [];
        const values = [];

        if (email) { updates.push('email = ?'); values.push(email); }
        if (mobile) { updates.push('mobile = ?'); values.push(mobile); }
        if (password) {
            const hashedPassword = await hashData(password);
            updates.push('password_hash = ?');
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No changes provided.' });
        }

        // Clear reset state
        updates.push('reset_otp_hash = NULL', 'reset_otp_expires_at = NULL', 'reset_verified = 0');
        values.push(decoded.id);

        await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);

        res.json({ message: 'Account updated successfully. You can now login with your new credentials.' });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Invalid or expired recovery token.' });
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
    getProfileCompletion,
    getUserProfile,
    updateUserProfile,
    recoverLookup,
    recoverSendOTP,
    recoverVerify,
    recoverUpdateAccount
};

module.exports = { login, register, getSecurityQuestions, verifyOTP, getRecoveryQuestions, verifyRecoveryAnswers, resetPassword, forgotPassword, verifyForgotOTP, resetPasswordAfterForgot, completeOnboarding, getOnboardingStatus, saveNominee, getNominee, sendNomineeEmailOTP, verifyNomineeEmailOTP, sendNomineePhoneOTP, verifyNomineePhoneOTP, getProfileCompletion, getUserProfile, updateUserProfile, recoverLookup, recoverSendOTP, recoverVerify, recoverUpdateAccount };

