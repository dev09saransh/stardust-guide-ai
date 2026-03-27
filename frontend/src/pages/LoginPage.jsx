import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { VaultToast } from '../components/common/VaultUI';

const LoginPage = ({ onLoginSuccess, onRegisterClick, setCurrentPage, isLite = false, onBack, initialStep = 'login' }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loginDetails, setLoginDetails] = useState(null);

  // Recovery States
  const [recoveryStep, setRecoveryStep] = useState(initialStep === 'forgot-password' ? 'lookup' : null); // null, 'lookup', 'otp', 'reset'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryQuestions, setRecoveryQuestions] = useState([]);
  const [recoveryAnswers, setRecoveryAnswers] = useState([]);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const countryCodes = [
    { code: '+91', name: 'India' },
    { code: '+1', name: 'USA' },
    { code: '+44', name: 'UK' },
    { code: '+971', name: 'UAE' },
    { code: '+61', name: 'Australia' },
  ];

  const getBaseUrl = () => {
    const raw = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';
    return raw.endsWith('/auth') ? raw : `${raw}/auth`;
  };
  const API_BASE = getBaseUrl();

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isEmail = formData.email.includes('@');
      const finalIdentifier = isEmail ? formData.email.trim() : `${countryCode}${formData.email.replace(/\D/g, '')}`;
      const response = await axios.post(`${API_BASE}/login`, {
        identifier: finalIdentifier,
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

  // ─── Forgot Password Handlers ───
  const handleForgotLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const inputVal = formData.email || recoveryEmail;
      const isEmail = inputVal.includes('@');
      const finalIdentifier = isEmail ? inputVal.trim() : `${countryCode}${inputVal.replace(/\D/g, '')}`;
      const res = await axios.post(`${API_BASE}/forgot-password`, { identifier: finalIdentifier });
      setLoginDetails(res.data);
      setRecoveryStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Account not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/verify-forgot-otp`, {
        userId: loginDetails.userId,
        otp: otpCode
      });
      setResetToken(res.data.resetToken);
      setRecoveryStep('reset');
      setOtpCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/reset-password-forgot`, {
        resetToken,
        newPassword
      });
      showToast('Vault credentials updated.', 'success');
      setRecoveryStep(null);
      setShowOtp(false);
      setFormData({ ...formData, password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Reconfiguration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (isLite) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-0 z-20 relative">
        <div className="w-full">
          <div className="mb-8 text-center mt-4">
            <h2 className="text-2xl font-bold mb-2">
              {recoveryStep === 'lookup' ? 'Locate Vault' :
               recoveryStep === 'otp' ? 'Verification Pulse' :
               recoveryStep === 'reset' ? 'Reconfigure Master Key' :
               showOtp ? 'Security Verification' : 'Sign In'}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              {recoveryStep === 'lookup' ? 'Enter your registered mobile to search the ledger.' :
               recoveryStep === 'otp' ? `We've sent a pulse to XXXXXX${loginDetails?.mobileSnippet}` :
               recoveryStep === 'reset' ? 'Define your new master credentials.' :
               showOtp ? `We've sent an OTP to ${loginDetails?.destinationSnippet || 'your device'}` :
               'Enter your vault credentials to proceed.'}
            </p>
          </div>

          {recoveryStep === 'lookup' && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleForgotLookup} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Mobile Number</label>
                <div className="flex gap-2 relative">
                  <div className="relative w-[85px]">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full px-3 py-[11px] bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-1 transition-all hover:bg-[var(--surface)]"
                    >
                      {countryCode}
                      <motion.div animate={{ rotate: showCountryDropdown ? 180 : 0 }}>
                        <ArrowRight size={14} className="rotate-90" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden p-1.5"
                        >
                          {countryCodes.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false); }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${countryCode === c.code ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-primary)] hover:bg-[var(--surface-glass)]'}`}
                            >
                              <span>{c.name}</span>
                              <span className="opacity-60">{c.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative flex-1 group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                    <input type="text" required placeholder="98765 43210" className="input-field pl-12 py-3"
                      value={formData.email || recoveryEmail} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setRecoveryEmail(e.target.value); }} />
                  </div>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center space-x-3 text-xs font-bold"><AlertCircle size={18} /><span>{error}</span></div>}
              <button disabled={loading} className="w-full btn-primary py-3.5 text-base group">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Locate Vault</span><ArrowRight size={18} /></>}
              </button>
              <button type="button" onClick={() => setRecoveryStep(null)} className="w-full text-center text-xs font-bold text-[var(--text-secondary)] hover:text-white pt-2 transition-colors uppercase tracking-widest">Back to Login</button>
            </motion.form>
          )}

          {recoveryStep === 'otp' && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleForgotVerify} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Verification Code</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                  <input type="text" required maxLength="6" placeholder="••••••" className="input-field pl-12 text-center tracking-[0.5em] text-2xl font-bold py-3"
                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center space-x-3 text-xs font-bold"><AlertCircle size={18} /><span>{error}</span></div>}
              <button disabled={loading} className="w-full btn-primary py-3.5 text-base group">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Verify Pulse</span><Shield size={18} /></>}
              </button>
              <button type="button" onClick={() => setRecoveryStep('lookup')} className="w-full text-center text-xs font-bold text-[var(--text-secondary)] hover:text-white pt-2 transition-colors uppercase tracking-widest">Change Email</button>
            </motion.form>
          )}

          {recoveryStep === 'reset' && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleForgotReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">New Master Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                  <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="input-field pl-12 pr-12 py-3"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center space-x-3 text-xs font-bold"><AlertCircle size={18} /><span>{error}</span></div>}
              <button disabled={loading} className="w-full btn-primary py-3.5 text-base group">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Apply Reconfiguration</span><ArrowRight size={18} /></>}
              </button>
            </motion.form>
          )}

          {!showOtp && !recoveryStep && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <div style={{ position: 'relative' }}>
                  {formData.email?.includes('@') || /^[a-zA-Z]/.test(formData.email || '') ? (
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.5 }} />
                  ) : (
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={18} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', opacity: 0.9 }}>{countryCode}</span>
                    </div>
                  )}
                  <input 
                    type="text" 
                    required 
                    placeholder="Email or Mobile" 
                    className="input-field py-3.5"
                    style={{ 
                      paddingLeft: (formData.email?.includes('@') || /^[a-zA-Z]/.test(formData.email || '')) ? '44px' : '74px' 
                    }}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Master Password</label>
                  <button onClick={() => setRecoveryStep('lookup')} type="button" className="text-xs text-[var(--primary)] font-bold hover:underline">Lost access?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="input-field pl-12 pr-12 py-3"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center space-x-3 my-2">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold">{error}</span>
                </motion.div>
              )}

              <button
                disabled={loading}
                className="w-full btn-primary py-3.5 text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Vault</span>
                    <ArrowRight size={18} />
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
              className="space-y-5"
            >
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Verification Code</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="••••••"
                    className="input-field pl-12 text-center tracking-[0.5em] text-2xl font-bold py-3"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center space-x-3 my-2">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full btn-primary py-3.5 text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Identity</span>
                    <Shield size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className="w-full text-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pt-2 transition-colors"
              >
                Return to Login
              </button>
            </motion.form>
          )}

          <div className="mt-8 pt-8 border-t border-[var(--border)] text-center space-y-3">
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              New to Stardust?{" "}
              <button onClick={onRegisterClick} className="text-[var(--primary)] font-bold hover:underline">
                Initialize Account
              </button>
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]/50 font-medium pb-4">
              Need assistance?{" "}
              <button onClick={() => setCurrentPage('recover-account')} className="text-indigo-400 font-bold hover:underline">
                Emergency Recovery
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] relative overflow-hidden">
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-20 relative overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-4xl font-bold mb-3">
              {recoveryStep === 'lookup' ? 'Locate Vault' :
               recoveryStep === 'otp' ? 'Verification Pulse' :
               recoveryStep === 'reset' ? 'Reconfigure Master Key' :
               showOtp ? 'Security Verification' : 'Sign In'}
            </h2>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              {recoveryStep === 'lookup' ? 'Enter your registered mobile to search the ledger.' :
               recoveryStep === 'otp' ? `We've sent a pulse to XXXXXX${loginDetails?.mobileSnippet}` :
               recoveryStep === 'reset' ? 'Define your new master credentials.' :
               showOtp ? `We've sent an OTP to ${loginDetails?.destinationSnippet || 'your device'}` :
               'Enter your vault credentials to proceed.'}
            </p>
          </div>

          {recoveryStep === 'lookup' && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleForgotLookup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Mobile Number</label>
                <div className="flex gap-2 relative">
                  <div className="relative w-[90px]">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full px-4 py-[13px] bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:bg-[var(--surface)]"
                    >
                      {countryCode}
                      <motion.div animate={{ rotate: showCountryDropdown ? 180 : 0 }}>
                        <ArrowRight size={16} className="rotate-90" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-2xl z-50 overflow-hidden p-2"
                        >
                          {countryCodes.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false); }}
                              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex justify-between items-center ${countryCode === c.code ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-primary)] hover:bg-[var(--surface-glass)]'}`}
                            >
                              <span>{c.name}</span>
                              <span className="opacity-60">{c.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative flex-1 group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                    <input type="text" required placeholder="98765 43210" className="input-field pl-14"
                      value={formData.email || recoveryEmail} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setRecoveryEmail(e.target.value); }} />
                  </div>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 my-4"><AlertCircle size={20} /><span>{error}</span></div>}
              <button disabled={loading} className="w-full btn-primary py-4 text-lg">
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Locate Vault</span><ArrowRight size={20} /></>}
              </button>
              <button type="button" onClick={() => setRecoveryStep(null)} className="w-full text-center text-sm font-bold text-[var(--text-secondary)] hover:text-white pt-4 transition-colors uppercase tracking-widest">Back to Login</button>
            </motion.form>
          )}

          {recoveryStep === 'otp' && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleForgotVerify} className="space-y-6">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Verification Code</label>
                <div className="relative group">
                  <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                  <input type="text" required maxLength="6" placeholder="••••••" className="input-field pl-14 text-center tracking-[0.7em] text-3xl font-bold placeholder:tracking-normal"
                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 my-4"><AlertCircle size={20} /><span>{error}</span></div>}
              <button disabled={loading} className="w-full btn-primary py-4 text-lg">
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Verify Pulse</span><Shield size={20} /></>}
              </button>
              <button type="button" onClick={() => setRecoveryStep('lookup')} className="w-full text-center text-sm font-bold text-[var(--text-secondary)] hover:text-white pt-4 transition-colors uppercase tracking-widest">Change Email</button>
            </motion.form>
          )}

          {recoveryStep === 'reset' && (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleForgotReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">New Master Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                  <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="input-field pl-14 pr-12"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 my-4"><AlertCircle size={20} /><span>{error}</span></div>}
              <button disabled={loading} className="w-full btn-primary py-4 text-lg">
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Apply Reconfiguration</span><ArrowRight size={20} /></>}
              </button>
            </motion.form>
          )}

          {!showOtp && !recoveryStep && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Email or Mobile</label>
                <div className="flex gap-2 relative">
                  <div className="relative w-[90px]">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full px-4 py-[13px] bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:bg-[var(--surface)]"
                    >
                      {countryCode}
                      <motion.div animate={{ rotate: showCountryDropdown ? 180 : 0 }}>
                        <ArrowRight size={16} className="rotate-90" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-2xl z-50 overflow-hidden p-2"
                        >
                          {countryCodes.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false); }}
                              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex justify-between items-center ${countryCode === c.code ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-primary)] hover:bg-[var(--surface-glass)]'}`}
                            >
                              <span>{c.name}</span>
                              <span className="opacity-60">{c.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative flex-1 group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="name@email.com or 98765 43210"
                      className="input-field pl-14"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Master Password</label>
                  <button onClick={() => setRecoveryStep('lookup')} type="button" className="text-xs text-[var(--primary)] font-bold hover:underline">Lost access?</button>
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
