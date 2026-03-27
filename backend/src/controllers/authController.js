const db = require('../config/db');
const { hashData, compareData } = require('../utils/hash');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../services/otpProvider');
const User = require('../models/userModel');

/**
 * Generate a random 9-character security code
 */
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

/**
 * Login Controller
 */
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

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        const channel = identifier.includes('@') ? 'EMAIL' : 'WHATSAPP';

        await db.execute(
            'INSERT INTO otp_codes (user_id, otp_code, channel, expires_at) VALUES (?, ?, ?, ?)',
            [user.user_id, otp_hash, channel, expires_at]
        );

        // Send OTP via our provider (Twilio or Console)
        await sendOTP(channel === 'EMAIL' ? user.email : user.mobile, otp);

        res.json({
            message: `Step 1 complete: Password verified. OTP required via ${channel}.`,
            status: 'OTP_REQUIRED',
            userId: user.user_id,
            destinationSnippet: channel === 'EMAIL' ? user.email : `XXXXXX${user.mobile.slice(-4)}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Register Controller
 */
const register = async (req, res) => {
    const { fullName, email, mobile, password, securityAnswers } = req.body;

    if (!fullName || !mobile || !password || !securityAnswers) {
        return res.status(400).json({ message: 'Missing required registration fields' });
    }

    try {
        // Check if user already exists
        const [existing] = await db.execute(
            'SELECT user_id FROM users WHERE mobile = ?' + (email ? ' OR email = ?' : ''),
            email ? [mobile, email] : [mobile]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const password_hash = await hashData(password);

        // Generate Registration OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_hash = await hashData(otp);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Clean up pending
        await db.execute('DELETE FROM pending_registrations WHERE mobile = ?' + (email ? ' OR email = ?' : ''), email ? [mobile, email] : [mobile]);

        // Insert into pending_registrations
        await db.execute(
            'INSERT INTO pending_registrations (full_name, email, mobile, password_hash, security_answers_json, otp_code_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fullName, email || null, mobile, password_hash, JSON.stringify(securityAnswers), otp_hash, expires_at]
        );

        const channel = email ? 'EMAIL' : 'WHATSAPP';
        await sendOTP(email || mobile, otp);

        res.status(200).json({
            message: `OTP sent to ${channel}. Please verify to complete registration.`,
            status: 'REGISTRATION_OTP_REQUIRED',
            destinationSnippet: channel === 'EMAIL' ? email : `XXXXXX${mobile.slice(-4)}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Verify OTP Controller
 */
const verifyOTP = async (req, res) => {
    const { userId, otp, email, mobile } = req.body;

    try {
        // 1. Login Verification
        if (userId) {
            const [rows] = await db.execute(
                'SELECT * FROM otp_codes WHERE user_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
                [userId]
            );

            if (rows.length > 0) {
                if (new Date(rows[0].expires_at) < new Date()) {
                    return res.status(400).json({ message: 'OTP expired' });
                }

                const isMatch = await compareData(otp, rows[0].otp_code);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Invalid OTP' });
                }

                await db.execute('UPDATE otp_codes SET is_used = 1 WHERE otp_id = ?', [rows[0].otp_id]);
                await db.execute('UPDATE users SET is_verified = 1 WHERE user_id = ?', [userId]);

                const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
                const user = userRows[0];

                const token = jwt.sign(
                    { id: user.user_id, role: user.role, email: user.email, mobile: user.mobile },
                    process.env.JWT_SECRET,
                    { expiresIn: '4h' }
                );

                return res.json({
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
            }
        }

        // 2. Registration Verification
        const identifier = email || mobile;
        if (identifier) {
            const [pending] = await db.execute(
                'SELECT * FROM pending_registrations WHERE email = ? OR mobile = ? ORDER BY created_at DESC LIMIT 1',
                [identifier, identifier]
            );

            if (pending.length === 0) {
                return res.status(400).json({ message: 'No registration data found' });
            }

            if (new Date(pending[0].expires_at) < new Date()) {
                return res.status(400).json({ message: 'OTP expired' });
            }

            const isMatch = await compareData(otp, pending[0].otp_code_hash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid OTP' });
            }

            // Atomic transaction for user creation
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                const security_code = await generateSecurityCode();
                const p = pending[0];

                const [userResult] = await connection.execute(
                    'INSERT INTO users (full_name, email, mobile, password_hash, security_code, is_verified, has_completed_onboarding) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [p.full_name, p.email, p.mobile, p.password_hash, security_code, 1, 0]
                );

                const newUserId = userResult.insertId;

                // Save security answers
                let answers = p.security_answers_json;
                if (typeof answers === 'string') answers = JSON.parse(answers);

                for (const ans of answers) {
                    const answer_hash = await hashData(ans.answer.toLowerCase());
                    await connection.execute(
                        'INSERT INTO user_security_answers (user_id, question_id, answer_hash) VALUES (?, ?, ?)',
                        [newUserId, ans.question_id, answer_hash]
                    );
                }

                await connection.execute('DELETE FROM pending_registrations WHERE id = ?', [p.id]);
                await connection.commit();

                const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [newUserId]);
                const user = userRows[0];

                const token = jwt.sign(
                    { id: user.user_id, role: user.role, email: user.email, mobile: user.mobile },
                    process.env.JWT_SECRET,
                    { expiresIn: '4h' }
                );

                return res.json({
                    token,
                    securityCode: user.security_code,
                    user: {
                        id: user.user_id,
                        full_name: user.full_name,
                        email: user.email,
                        mobile: user.mobile,
                        role: user.role,
                        is_verified: 1,
                        has_completed_onboarding: 0
                    }
                });

            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        }

        return res.status(400).json({ message: 'Invalid request' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT user_id, full_name, email, mobile, role, is_verified, has_completed_onboarding, security_code FROM users WHERE user_id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, register, verifyOTP, getProfile, getAuditLogs };
