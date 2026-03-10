import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://13.48.25.209:5001/api/auth';

const ForgotPasswordPage = ({ onBackToLogin }) => {
    const [step, setStep] = useState(1); // 1: Identify, 2: OTP, 3: Reset, 4: Success
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);
    const [resetToken, setResetToken] = useState('');
    const [mobileSnippet, setMobileSnippet] = useState('');

    const handleIdentify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/forgot-password`, { identifier });
            setUserId(res.data.userId);
            setMobileSnippet(res.data.mobileSnippet);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not verify user.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/verify-forgot-otp`, {
                userId,
                otp
            });
            setResetToken(res.data.resetToken);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/reset-password-forgot`, {
                resetToken,
                newPassword: passwords.new
            });
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-6">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-[32px] shadow-2xl p-8 lg:p-10 border border-[var(--border)] relative">

                {/* Close (X) Button */}
                {step < 4 && (
                    <button
                        type="button"
                        onClick={onBackToLogin}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '10px', padding: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(0,0,0,0.35)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = 'rgba(0,0,0,0.6)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'rgba(0,0,0,0.35)'; }}
                    >
                        <X size={16} />
                    </button>
                )}


                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                        {step === 4 ? <CheckCircle2 size={32} /> : <Key size={32} />}
                    </div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                        {step === 1 && 'Forgot Password'}
                        {step === 2 && 'WhatsApp Verification'}
                        {step === 3 && 'New Master Password'}
                        {step === 4 && 'All Set!'}
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        {step === 1 && 'Enter your registered email or phone to reset access.'}
                        {step === 2 && `We sent a 6-digit OTP to your WhatsApp ending in ${mobileSnippet}`}
                        {step === 3 && 'Your new password must be at least 8 characters long.'}
                        {step === 4 && 'Your password has been successfully updated.'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.form
                            key="step1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onSubmit={handleIdentify}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--text-secondary)] ml-1">Identity Identifier</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-blue-600 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Email or Mobile"
                                        className="input-field pl-12 shadow-sm"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3 text-sm">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button disabled={loading} className="w-full btn-primary py-4 flex items-center justify-center space-x-2">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Next</span> <ArrowRight size={20} /></>}
                            </button>

                            <button
                                type="button"
                                onClick={onBackToLogin}
                                className="w-full flex items-center justify-center space-x-2 text-sm font-bold text-gray-400 hover:text-gray-600"
                            >
                                <ArrowLeft size={16} /> <span>Back to Login</span>
                            </button>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form
                            key="step2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onSubmit={handleVerifyOtp}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1 text-center block">OTP Code</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        maxLength="6"
                                        placeholder="000000"
                                        className="input-field pl-12 text-center tracking-[0.5em] text-2xl font-bold"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3 text-sm">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button disabled={loading} className="w-full btn-primary py-4">
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600"
                            >
                                Incorrect ID? Change it.
                            </button>
                        </motion.form>
                    )}

                    {step === 3 && (
                        <motion.form
                            key="step3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onSubmit={handleReset}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="input-field pl-12"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="input-field pl-12"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-3 text-sm">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button disabled={loading} className="w-full btn-primary py-4">
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </motion.form>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-6 pt-4"
                        >
                            <button
                                onClick={onBackToLogin}
                                className="w-full btn-primary py-4 font-bold"
                            >
                                Return to Login
                            </button>
                            <p className="text-center text-sm text-[var(--text-secondary)]">
                                You can now access your vault with your new credentials.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
