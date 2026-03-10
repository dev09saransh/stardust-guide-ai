import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { VaultToast } from '../components/common/VaultUI';

const LoginPage = ({ onLoginSuccess, onRegisterClick, setCurrentPage }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loginDetails, setLoginDetails] = useState(null);

  // Recovery States
  const [recoveryStep, setRecoveryStep] = useState(null); // 'questions', 'reset'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryQuestions, setRecoveryQuestions] = useState([]);
  const [recoveryAnswers, setRecoveryAnswers] = useState([]);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://13.48.25.209:5000/api/auth';

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        identifier: formData.email,
        password: formData.password
      });

      if (response.data.status === 'OTP_REQUIRED') {
        setShowOtp(true);
        setLoginDetails(response.data);
      } else if (response.data.status === 'SUCCESS' || response.data.token) {
        onLoginSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/verify-otp`, {
        userId: loginDetails.userId,
        otp: otpCode
      });

      if (response.data.token) {
        onLoginSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/recovery/verify`, {
        email: recoveryEmail,
        answers: recoveryAnswers
      });
      setResetToken(res.data.resetToken);
      setRecoveryStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Security verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/recovery/reset`, {
        resetToken,
        newPassword
      });
      setRecoveryStep(null);
      setError('');
      showToast('Password reset successfully. Please log in with your new password.', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Left side: Hero/Branding */}
      <div className="hidden lg:flex flex-1 celestial-bg p-12 items-center justify-center text-white relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[var(--primary)] rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20" />
        </div>

        <div className="max-w-md relative z-10 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-3 mb-10 justify-center lg:justify-start">
              <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--surface-glass)] backdrop-blur-md flex items-center justify-center border border-[var(--border)] shadow-xl text-white">
                <Shield size={28} />
              </div>
              <span className="text-3xl font-bold tracking-tight text-white">Stardust</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-[1.1]">Welcome Back to Your Vault</h1>
            <p className="text-blue-100/70 text-lg leading-relaxed font-medium">
              Access your distributed financial identity, secured by military-grade encryption.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-5 rounded-3xl text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-200">AES-256</div>
            </div>
            <div className="glass p-5 rounded-3xl text-center">
              <div className="text-3xl mb-2">🔑</div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-200">2FA Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-20 relative">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-4xl font-bold mb-3">{showOtp ? 'Security Verification' : 'Sign In'}</h2>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              {showOtp
                ? `We've sent an OTP to your WhatsApp ending in ${loginDetails?.mobileSnippet}`
                : 'Enter your vault credentials to proceed.'}
            </p>
          </div>

          {!showOtp && !recoveryStep && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="input-field pl-14"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Master Password</label>
                  <button onClick={() => setCurrentPage('forgot-password')} type="button" className="text-xs text-[var(--primary)] font-bold hover:underline">Lost access?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="input-field pl-14 pr-12"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 my-4">
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">{error}</span>
                </motion.div>
              )}

              <button
                disabled={loading}
                className="w-full btn-primary py-4 text-lg"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Vault</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {showOtp && !recoveryStep && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1 text-center block">Verification Code</label>
                <div className="relative group">
                  <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="••••••"
                    className="input-field pl-14 text-center tracking-[0.7em] text-3xl font-bold placeholder:tracking-normal"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 my-4">
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">{error}</span>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full btn-primary py-4 text-lg"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Identity</span>
                    <Shield size={20} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className="w-full text-center text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pt-4 transition-colors"
              >
                Return to Login
              </button>
            </motion.form>
          )}

          <div className="mt-12 pt-12 border-t border-[var(--border)] text-center space-y-4">
            <p className="text-[var(--text-secondary)] font-medium">
              New to Stardust?{" "}
              <button onClick={onRegisterClick} className="text-[var(--primary)] font-bold hover:underline">
                Initialize Account
              </button>
            </p>
            <p className="text-[var(--text-secondary)]/50 font-medium">
              Need assistance?{" "}
              <button onClick={() => setCurrentPage('recover-account')} className="text-indigo-400 font-bold hover:underline">
                Emergency Recovery
              </button>
            </p>
          </div>
        </div>
      </div>

      <VaultToast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default LoginPage;
