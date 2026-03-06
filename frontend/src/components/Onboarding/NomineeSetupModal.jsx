import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { User, Mail, Phone, Heart, Shield, CheckCircle, Loader2, ChevronDown, ArrowRight, ArrowLeft, X } from 'lucide-react';

const COUNTRY_CODES = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+65', flag: '🇸🇬', name: 'Singapore' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
];

const RELATIONSHIPS = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Business Partner', 'Legal Advisor', 'Other'
];

const NomineeSetupModal = ({ user, onComplete }) => {
    const [step, setStep] = useState(1); // 1 = details, 2 = email OTP, 3 = success
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        mobile: '',
        confirm_mobile: '',
        country_code: '+91',
        relationship: '',
    });
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [otpError, setOtpError] = useState('');

    const API = 'http://localhost:5001/api/auth';
    const headers = { Authorization: `Bearer ${user.token}` };

    const validateForm = () => {
        const errs = {};
        if (!form.full_name.trim()) errs.full_name = 'Full name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
        if (!form.mobile.trim()) errs.mobile = 'Phone number is required';
        else if (!/^\d{7,15}$/.test(form.mobile)) errs.mobile = 'Enter a valid phone number';
        if (form.mobile !== form.confirm_mobile) errs.confirm_mobile = 'Phone numbers do not match';
        if (!form.relationship) errs.relationship = 'Please select a relationship';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSendOTP = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            await axios.post(`${API}/nominee/send-email-otp`, { email: form.email }, { headers });
            setOtpSent(true);
            setStep(2);
        } catch (err) {
            setErrors({ email: err.response?.data?.message || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailOTP = async () => {
        if (!otp || otp.length !== 6) {
            setOtpError('Please enter a valid 6-digit OTP');
            return;
        }
        setLoading(true);
        setOtpError('');
        try {
            await axios.post(`${API}/nominee/verify-email-otp`, { otp }, { headers });
            setEmailVerified(true);

            // Send Phone OTP
            await axios.post(`${API}/nominee/send-phone-otp`, {
                mobile: form.mobile,
                country_code: form.country_code
            }, { headers });

            setOtp(''); // Clear OTP input
            setOtpError('');
            setStep(3);
        } catch (err) {
            setOtpError(err.response?.data?.message || 'Email OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPhoneOTP = async () => {
        if (!otp || otp.length !== 6) {
            setOtpError('Please enter a valid 6-digit OTP');
            return;
        }
        setLoading(true);
        setOtpError('');
        try {
            await axios.post(`${API}/nominee/verify-phone-otp`, { otp }, { headers });

            // Now save the nominee
            await axios.post(`${API}/nominee`, {
                full_name: form.full_name,
                email: form.email,
                mobile: form.mobile,
                country_code: form.country_code,
                relationship: form.relationship,
            }, { headers });

            setStep(4);
            // Auto-close after 2 seconds
            setTimeout(() => { if (onComplete) onComplete(); }, 2000);
        } catch (err) {
            setOtpError(err.response?.data?.message || 'Phone OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setOtpError('');
        try {
            if (step === 2) {
                await axios.post(`${API}/nominee/send-email-otp`, { email: form.email }, { headers });
            } else if (step === 3) {
                await axios.post(`${API}/nominee/send-phone-otp`, { mobile: form.mobile, country_code: form.country_code }, { headers });
            }
            setOtpError('');
            setOtp('');
        } catch (err) {
            setOtpError('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: step === 4 ? '420px' : '520px',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Close (X) Button */}
                    {step < 4 && (
                        <button
                            type="button"
                            onClick={onComplete}
                            style={{
                                position: 'absolute', top: '14px', right: '14px', zIndex: 20,
                                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '10px', padding: '6px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                            <X size={16} />
                        </button>
                    )}
                    {/* Header gradient */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)',
                        padding: '32px 32px 24px',
                        color: 'white',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.2)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {step === 4 ? <CheckCircle size={24} /> : (step === 2 || step === 3) ? (step === 3 ? <Phone size={24} /> : <Mail size={24} />) : <Shield size={24} />}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
                                    {step === 4 ? 'All Set!' : step === 3 ? 'Verify Phone' : step === 2 ? 'Verify Email' : 'Add Your Legacy Contact'}
                                </h2>
                                <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 0', fontWeight: 500 }}>
                                    {step === 4
                                        ? 'Your nominee has been saved securely.'
                                        : step === 3
                                            ? `We sent a 6-digit code via WhatsApp to ${form.mobile}`
                                            : step === 2
                                                ? `We sent a 6-digit code to ${form.email}`
                                                : 'Designate a trusted person as your vault contact.'}
                                </p>
                            </div>
                        </div>
                        {/* Progress bar */}
                        {step < 4 && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                {[1, 2, 3].map(s => (
                                    <div key={s} style={{
                                        flex: 1, height: '4px', borderRadius: '2px',
                                        background: s <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                                        transition: 'all 0.3s ease',
                                    }} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '28px 32px 32px' }}>
                        {/* STEP 1: Nominee Details */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {/* Full Name */}
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <div style={inputWrapperStyle}>
                                        <User size={18} style={{ color: '#9ca3af', marginRight: '10px', flexShrink: 0 }} />
                                        <input
                                            type="text"
                                            placeholder="Enter nominee's full name"
                                            value={form.full_name}
                                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    {errors.full_name && <span style={errStyle}>{errors.full_name}</span>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label style={labelStyle}>Email Address</label>
                                    <div style={inputWrapperStyle}>
                                        <Mail size={18} style={{ color: '#9ca3af', marginRight: '10px', flexShrink: 0 }} />
                                        <input
                                            type="email"
                                            placeholder="nominee@email.com"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    {errors.email && <span style={errStyle}>{errors.email}</span>}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ ...inputWrapperStyle, width: '130px', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
                                            <select
                                                value={form.country_code}
                                                onChange={e => setForm({ ...form, country_code: e.target.value })}
                                                style={{
                                                    ...inputStyle, appearance: 'none', cursor: 'pointer',
                                                    paddingRight: '28px', background: 'transparent',
                                                }}
                                            >
                                                {COUNTRY_CODES.map(cc => (
                                                    <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                        </div>
                                        <div style={{ ...inputWrapperStyle, flex: 1 }}>
                                            <Phone size={18} style={{ color: '#9ca3af', marginRight: '10px', flexShrink: 0 }} />
                                            <input
                                                type="tel"
                                                placeholder="Phone number"
                                                value={form.mobile}
                                                onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                    {errors.mobile && <span style={errStyle}>{errors.mobile}</span>}
                                </div>

                                {/* Confirm Phone */}
                                <div>
                                    <label style={labelStyle}>Confirm Phone Number</label>
                                    <div style={inputWrapperStyle}>
                                        <Phone size={18} style={{ color: '#9ca3af', marginRight: '10px', flexShrink: 0 }} />
                                        <input
                                            type="tel"
                                            placeholder="Re-enter phone number"
                                            value={form.confirm_mobile}
                                            onChange={e => setForm({ ...form, confirm_mobile: e.target.value.replace(/\D/g, '') })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    {errors.confirm_mobile && <span style={errStyle}>{errors.confirm_mobile}</span>}
                                </div>

                                {/* Relationship */}
                                <div>
                                    <label style={labelStyle}>Relationship</label>
                                    <div style={{ ...inputWrapperStyle, position: 'relative' }}>
                                        <Heart size={18} style={{ color: '#9ca3af', marginRight: '10px', flexShrink: 0 }} />
                                        <select
                                            value={form.relationship}
                                            onChange={e => setForm({ ...form, relationship: e.target.value })}
                                            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '28px', background: 'transparent' }}
                                        >
                                            <option value="">Select relationship</option>
                                            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                    </div>
                                    {errors.relationship && <span style={errStyle}>{errors.relationship}</span>}
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                                        background: loading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                        color: 'white', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginTop: '6px',
                                    }}
                                >
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> Sending OTP...</> : <>Verify Email & Continue <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Email OTP Verification */}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                                <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>
                                    Check the <strong>backend console</strong> for the 6-digit OTP code sent to your email.
                                </p>

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            value={otp[i] || ''}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const newOtp = otp.split('');
                                                newOtp[i] = val;
                                                setOtp(newOtp.join(''));
                                                if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Backspace' && !otp[i] && e.target.previousElementSibling) {
                                                    e.target.previousElementSibling.focus();
                                                }
                                            }}
                                            style={{
                                                width: '50px', height: '56px', textAlign: 'center',
                                                fontSize: '22px', fontWeight: 800,
                                                border: '2px solid #e5e7eb', borderRadius: '14px',
                                                outline: 'none', transition: 'all 0.2s',
                                                color: '#1f2937',
                                            }}
                                            onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    ))}
                                </div>

                                {otpError && <span style={{ ...errStyle, textAlign: 'center' }}>{otpError}</span>}

                                <button
                                    onClick={handleVerifyEmailOTP}
                                    disabled={loading || otp.length !== 6}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                                        background: loading || otp.length !== 6 ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                        color: 'white', fontSize: '15px', fontWeight: 700,
                                        cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    }}
                                >
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <>Verify Email & Next <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
                                </button>

                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                    <button onClick={() => { setStep(1); setOtp(''); setOtpError(''); }} style={linkBtnStyle}>
                                        <ArrowLeft size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back
                                    </button>
                                    <button onClick={handleResendOTP} disabled={loading} style={linkBtnStyle}>
                                        Resend OTP
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Phone OTP Verification */}
                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                                <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>
                                    Enter the 6-digit OTP code sent via WhatsApp to verify phone.
                                </p>

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            value={otp[i] || ''}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const newOtp = otp.split('');
                                                newOtp[i] = val;
                                                setOtp(newOtp.join(''));
                                                if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Backspace' && !otp[i] && e.target.previousElementSibling) {
                                                    e.target.previousElementSibling.focus();
                                                }
                                            }}
                                            style={{
                                                width: '50px', height: '56px', textAlign: 'center',
                                                fontSize: '22px', fontWeight: 800,
                                                border: '2px solid #e5e7eb', borderRadius: '14px',
                                                outline: 'none', transition: 'all 0.2s',
                                                color: '#1f2937',
                                            }}
                                            onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    ))}
                                </div>

                                {otpError && <span style={{ ...errStyle, textAlign: 'center' }}>{otpError}</span>}

                                <button
                                    onClick={handleVerifyPhoneOTP}
                                    disabled={loading || otp.length !== 6}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                                        background: loading || otp.length !== 6 ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                        color: 'white', fontSize: '15px', fontWeight: 700,
                                        cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    }}
                                >
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying & Saving...</> : 'Verify Phone & Save Nominee'}
                                </button>

                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                    <button onClick={handleResendOTP} disabled={loading} style={linkBtnStyle}>
                                        Resend OTP
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Success */}
                        {step === 4 && (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)',
                                }}>
                                    <CheckCircle size={40} color="white" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1f2937', margin: '0 0 8px' }}>
                                    Nominee Saved!
                                </h3>
                                <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                                    {form.full_name} has been registered as your legacy contact.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// Shared styles
const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '6px', marginLeft: '2px',
};

const inputWrapperStyle = {
    display: 'flex', alignItems: 'center',
    border: '2px solid #e5e7eb', borderRadius: '14px',
    padding: '10px 14px', transition: 'all 0.2s',
    background: '#fafafa',
};

const inputStyle = {
    flex: 1, border: 'none', outline: 'none',
    fontSize: '15px', fontWeight: 600, color: '#1f2937',
    background: 'transparent',
};

const errStyle = {
    fontSize: '12px', color: '#ef4444', fontWeight: 600,
    marginTop: '4px', display: 'block', marginLeft: '2px',
};

const linkBtnStyle = {
    background: 'none', border: 'none', color: '#7c3aed',
    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    padding: '4px 0',
};

export default NomineeSetupModal;
