import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Mail, Lock, Phone, ArrowRight, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = 'http://127.0.0.1:5001/api';

const AuthModal = () => {
    const { showAuthModal, closeAuthModal, authModalTab, setAuthModalTab, login, register, showToast } = useAuth();

    // Login State
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [loginDetails, setLoginDetails] = useState(null);
    const [showLoginPass, setShowLoginPass] = useState(false);
    const [showRegPass, setShowRegPass] = useState(false);
    const [showSecurityCodeScreen, setShowSecurityCodeScreen] = useState(false);

    // Register State
    const [regStep, setRegStep] = useState(1);
    const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [countryCode, setCountryCode] = useState('+91');
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [showRegOtp, setShowRegOtp] = useState(false);
    const [regOtpCode, setRegOtpCode] = useState('');
    const [regDetails, setRegDetails] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [securityData, setSecurityData] = useState([
        { question_id: '', answer: '' },
        { question_id: '', answer: '' }
    ]);

    const countryCodes = [
        { code: '+91', name: 'India' },
        { code: '+1', name: 'USA' },
        { code: '+44', name: 'UK' },
        { code: '+971', name: 'UAE' },
        { code: '+61', name: 'Australia' },
    ];

    useEffect(() => {
        if (showAuthModal && authModalTab === 'signup') {
            axios.get(`${API}/auth/questions`)
                .then(res => setQuestions(res.data))
                .catch(() => { });
        }
    }, [showAuthModal, authModalTab]);

    // Reset state on close
    useEffect(() => {
        if (!showAuthModal) {
            setLoginForm({ email: '', password: '' });
            setLoginError('');
            setShowOtp(false);
            setOtpCode('');
            setRegStep(1);
            setRegForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
            setRegError('');
            setShowRegOtp(false);
            setRegOtpCode('');
            setSecurityData([{ question_id: '', answer: '' }, { question_id: '', answer: '' }]);
        }
    }, [showAuthModal]);

    // ─── LOGIN ───
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await axios.post(`${API}/auth/login`, {
                identifier: loginForm.email,
                password: loginForm.password
            });
            if (res.data.status === 'OTP_REQUIRED') {
                setShowOtp(true);
                setLoginDetails(res.data);
            } else if (res.data.token) {
                showToast(`Welcome back, ${res.data.user.full_name || 'Agent'}`, 'success');
                login(res.data);
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLoginOtp = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await axios.post(`${API}/auth/verify-otp`, {
                userId: loginDetails.userId,
                otp: otpCode
            });
            if (res.data.token) {
                showToast(`Identity Verified. Access Granted.`, 'success');
                login(res.data);
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setLoginLoading(false);
        }
    };

    // ─── REGISTER ───
    const handleRegister = async (e) => {
        e.preventDefault();
        setRegError('');
        if (regForm.password !== regForm.confirmPassword) {
            setRegError('Passwords do not match');
            return;
        }
        if (securityData.some(s => !s.question_id || !s.answer)) {
            setRegError('Please answer all security questions');
            return;
        }
        setRegLoading(true);
        try {
            const fullPhone = `${countryCode}${regForm.phone.replace(/\D/g, '')}`;
            const res = await axios.post(`${API}/auth/register`, {
                full_name: regForm.name,
                email: regForm.email,
                mobile: fullPhone,
                password: regForm.password,
                security_answers: securityData
            });
            if (res.data.status === 'REGISTRATION_OTP_REQUIRED') {
                setRegDetails(res.data);
                setShowRegOtp(true);
            } else if (res.data.token) {
                register(res.data);
            }
        } catch (err) {
            setRegError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setRegLoading(false);
        }
    };

    function handleVerificationSuccess(data) {
        if (data.securityCode) {
            setRegDetails(prev => ({ ...prev, securityCode: data.securityCode }));
            setShowSecurityCodeScreen(true);
        } else {
            showToast(`Vault encryption protocol initialized. Welcome, ${data.user.full_name || 'Agent'}`, 'success');
            register(data);
        }
    }

    const handleRegOtp = async (e) => {
        e.preventDefault();
        setRegLoading(true);
        setRegError('');
        try {
            const res = await axios.post(`${API}/auth/verify-otp`, {
                userId: regDetails.userId,
                otp: regOtpCode
            });
            if (res.data.token) {
                // Verification successful. Update regDetails with token/user info
                // and show the security code screen (using the code we got from register call)
                setRegDetails(prev => ({ ...prev, ...res.data }));
                setShowSecurityCodeScreen(true);
            }
        } catch (err) {
            setRegError(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setRegLoading(false);
        }
    };

    const handleSecurityChange = (index, field, value) => {
        const updated = [...securityData];
        updated[index][field] = value;
        setSecurityData(updated);
    };

    if (!showAuthModal) return null;

    // ─── Shared styles ───
    const inputStyle = {
        width: '100%',
        padding: '14px 16px 14px 48px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        outline: 'none',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    };

    const inputStyleNoPad = {
        ...inputStyle,
        paddingLeft: '16px',
    };

    const labelStyle = {
        fontSize: '11px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: '6px',
        display: 'block',
        marginLeft: '4px',
    };

    const btnPrimary = {
        width: '100%',
        padding: '16px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontWeight: 700,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    };

    const btnSecondary = {
        ...btnPrimary,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'none',
    };

    const errorBox = (msg) => msg ? (
        <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f87171',
        }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{msg}</span>
        </div>
    ) : null;

    const spinner = <div style={{
        width: '20px', height: '20px',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
    }} />;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px',
                }}
            >
                {/* Backdrop */}
                <motion.div
                    onClick={closeAuthModal}
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                    }}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.88, y: 35, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.88, y: 35, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                    style={{
                        position: 'relative', zIndex: 10,
                        width: '100%', maxWidth: '440px',
                        background: 'rgba(18, 18, 32, 0.98)',
                        borderRadius: '2rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(99, 102, 241, 0.15)',
                        overflow: 'hidden',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    {/* Close */}
                    <button
                        onClick={closeAuthModal}
                        style={{
                            position: 'absolute', top: '20px', right: '20px', zIndex: 20,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', padding: '8px',
                            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <X size={18} />
                    </button>

                    {/* Header */}
                    <div style={{ padding: '32px 32px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                            }}>
                                <Shield size={20} color="white" />
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                                STARDUST
                            </span>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex', gap: '4px',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '14px', padding: '4px',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {['login', 'signup'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setAuthModalTab(tab); setShowOtp(false); setShowRegOtp(false); setRegStep(1); setLoginError(''); setRegError(''); }}
                                    style={{
                                        flex: 1, padding: '12px',
                                        borderRadius: '11px',
                                        fontSize: '13px', fontWeight: 700,
                                        border: 'none', cursor: 'pointer',
                                        transition: 'all 0.25s',
                                        fontFamily: 'inherit',
                                        background: authModalTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                                        color: authModalTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
                                        boxShadow: authModalTab === tab ? '0 4px 16px rgba(99, 102, 241, 0.3)' : 'none',
                                    }}
                                >
                                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }} className="custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {/* ─── LOGIN ─── */}
                            {authModalTab === 'login' && (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {!showOtp ? (
                                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div>
                                                <label style={labelStyle}>Email Address</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                    <input
                                                        type="email" required placeholder="you@company.com"
                                                        style={inputStyle}
                                                        value={loginForm.email}
                                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                                        onFocus={e => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Password</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                    <input
                                                        type={showLoginPass ? 'text' : 'password'}
                                                        required placeholder="••••••••"
                                                        style={{ ...inputStyle, paddingRight: '48px' }}
                                                        value={loginForm.password}
                                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                                        onFocus={e => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLoginPass(!showLoginPass)}
                                                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                                                    >
                                                        {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {errorBox(loginError)}

                                            <button type="submit" disabled={loginLoading} style={btnPrimary}>
                                                {loginLoading ? spinner : <><span>Sign In</span><ArrowRight size={18} /></>}
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleLoginOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                                OTP sent to WhatsApp ending in <b style={{ color: 'white' }}>{loginDetails?.mobileSnippet}</b>
                                            </p>
                                            <input
                                                type="text" required maxLength="6" placeholder="000000"
                                                style={{ ...inputStyleNoPad, textAlign: 'center', letterSpacing: '0.5em', fontSize: '24px', fontWeight: 700, padding: '18px' }}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            />
                                            {errorBox(loginError)}
                                            <button type="submit" disabled={loginLoading} style={btnPrimary}>
                                                {loginLoading ? spinner : 'Verify & Enter'}
                                            </button>
                                            <button type="button" onClick={() => setShowOtp(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '8px', fontFamily: 'inherit' }}>
                                                Back to Login
                                            </button>
                                        </form>
                                    )}
                                </motion.div>
                            )}

                            {/* ─── SIGNUP ─── */}
                            {authModalTab === 'signup' && (
                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {!showRegOtp ? (
                                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {/* Step Indicators */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '4px' }}>
                                                {[1, 2].map(s => (
                                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '30px', height: '30px', borderRadius: '10px', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '12px', fontWeight: 800,
                                                            background: regStep >= s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                                                            color: regStep >= s ? 'white' : 'rgba(255,255,255,0.3)',
                                                            border: `1px solid ${regStep >= s ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                            boxShadow: regStep >= s ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                                                        }}>
                                                            {regStep > s ? '\u2713' : s}
                                                        </div>
                                                        <span style={{
                                                            fontSize: '12px', fontWeight: 700,
                                                            color: regStep >= s ? 'white' : 'rgba(255,255,255,0.3)',
                                                        }}>
                                                            {s === 1 ? 'Identity' : 'Security'}
                                                        </span>
                                                        {s < 2 && <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />}
                                                    </div>
                                                ))}
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {regStep === 1 && (
                                                    <motion.div
                                                        key="step1"
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                                                    >
                                                        <div>
                                                            <label style={labelStyle}>Full Name</label>
                                                            <div style={{ position: 'relative' }}>
                                                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                                <input type="text" required placeholder="John Doe" style={inputStyle}
                                                                    value={regForm.name}
                                                                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                                                    onFocus={e => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'; }}
                                                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={labelStyle}>Email</label>
                                                            <div style={{ position: 'relative' }}>
                                                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                                <input type="email" required placeholder="john@example.com" style={inputStyle}
                                                                    value={regForm.email}
                                                                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                                                    onFocus={e => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'; }}
                                                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={labelStyle}>Phone</label>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <select
                                                                    value={countryCode}
                                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                                    style={{
                                                                        width: '90px',
                                                                        padding: '14px 8px',
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        borderRadius: '14px',
                                                                        color: 'white',
                                                                        fontSize: '14px',
                                                                        fontWeight: 700,
                                                                        outline: 'none',
                                                                        fontFamily: 'inherit',
                                                                    }}
                                                                >
                                                                    {countryCodes.map(c => <option key={c.code} value={c.code} style={{ background: '#1a1a2e' }}>{c.code}</option>)}
                                                                </select>
                                                                <div style={{ position: 'relative', flex: 1 }}>
                                                                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                                    <input type="tel" required placeholder="98765 43210" style={inputStyle}
                                                                        value={regForm.phone}
                                                                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button type="button" style={btnPrimary}
                                                            onClick={() => {
                                                                if (!regForm.name || !regForm.email || !regForm.phone) {
                                                                    setRegError('All fields are required');
                                                                    return;
                                                                }
                                                                setRegError('');
                                                                setRegStep(2);
                                                            }}
                                                        >
                                                            <span>Continue</span><ArrowRight size={18} />
                                                        </button>
                                                    </motion.div>
                                                )}

                                                {regStep === 2 && (
                                                    <motion.div
                                                        key="step2"
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                                                    >
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <div style={{ position: 'relative' }}>
                                                                <label style={labelStyle}>Password</label>
                                                                <input
                                                                    type={showRegPass ? 'text' : 'password'}
                                                                    required placeholder="••••••••"
                                                                    style={{ ...inputStyleNoPad, paddingRight: '40px' }}
                                                                    value={regForm.password}
                                                                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowRegPass(!showRegPass)}
                                                                    style={{ position: 'absolute', right: '12px', bottom: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                                                                >
                                                                    {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                </button>
                                                            </div>
                                                            <div style={{ position: 'relative' }}>
                                                                <label style={labelStyle}>Confirm</label>
                                                                <input
                                                                    type={showRegPass ? 'text' : 'password'}
                                                                    required placeholder="••••••••"
                                                                    style={{ ...inputStyleNoPad, paddingRight: '40px' }}
                                                                    value={regForm.confirmPassword}
                                                                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <p style={{ ...labelStyle, marginBottom: '12px' }}>Recovery Questions</p>
                                                            {securityData.map((item, i) => (
                                                                <div key={i} style={{
                                                                    background: 'rgba(255,255,255,0.03)',
                                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                                    borderRadius: '16px',
                                                                    padding: '14px',
                                                                    marginBottom: '10px',
                                                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                                                }}>
                                                                    <select style={{
                                                                        width: '100%',
                                                                        padding: '10px 12px',
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                                        borderRadius: '10px',
                                                                        color: 'white',
                                                                        fontSize: '13px',
                                                                        fontWeight: 500,
                                                                        outline: 'none',
                                                                        fontFamily: 'inherit',
                                                                    }}
                                                                        value={item.question_id}
                                                                        onChange={(e) => handleSecurityChange(i, 'question_id', e.target.value)}
                                                                    >
                                                                        <option value="" style={{ background: '#1a1a2e' }}>Select question</option>
                                                                        {questions.map(q => <option key={q.question_id} value={q.question_id} style={{ background: '#1a1a2e' }}>{q.question}</option>)}
                                                                    </select>
                                                                    <input type="text" placeholder="Your answer" style={{ ...inputStyleNoPad, padding: '10px 12px', fontSize: '13px' }}
                                                                        value={item.answer}
                                                                        onChange={(e) => handleSecurityChange(i, 'answer', e.target.value)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button type="button" onClick={() => setRegStep(1)} style={{ ...btnSecondary, flex: 1 }}>Back</button>
                                                            <button type="submit" disabled={regLoading} style={{ ...btnPrimary, flex: 2 }}>
                                                                {regLoading ? spinner : 'Create Account'}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {errorBox(regError)}
                                        </form>
                                    ) : showSecurityCodeScreen ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                                <Shield size={32} color="#22c55e" />
                                            </div>
                                            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>VAULT INITIALIZED</h3>
                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px', lineHeight: 1.6 }}>
                                                Your unique vault security code has been generated. <b style={{ color: 'white' }}>Write this down.</b> You will need it to link your vault to nominees or recover access.
                                            </p>
                                            <div style={{
                                                padding: '16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                                                borderRadius: '16px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '24px',
                                                fontWeight: 900, color: '#818cf8', letterSpacing: '0.2em',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {regDetails?.securityCode}
                                            </div>
                                            <button onClick={() => register({ token: regDetails.token, user: regDetails.user })} style={btnPrimary}>
                                                <span>Securely Enter Vault</span>
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                                Verification sent to <b style={{ color: 'white' }}>{regDetails?.mobileSnippet}</b>
                                            </p>
                                            <input
                                                type="text" maxLength="6" placeholder="000000"
                                                style={{ ...inputStyleNoPad, textAlign: 'center', letterSpacing: '0.5em', fontSize: '24px', fontWeight: 700, padding: '18px' }}
                                                value={regOtpCode}
                                                onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                                            />
                                            {errorBox(regError)}
                                            <button onClick={handleRegOtp} disabled={regLoading} style={btnPrimary}>
                                                {regLoading ? spinner : 'Verify & Enter'}
                                            </button>
                                            {regDetails?.token && (
                                                <button onClick={() => handleVerificationSuccess(regDetails)}
                                                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    Skip verification & continue
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};

export default AuthModal;
