import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Lock, Phone, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://13.48.25.209:5000/api/auth';

const RegistrationPage = ({ onRegisterSuccess, onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [securityData, setSecurityData] = useState([
    { question_id: '', answer: '' },
    { question_id: '', answer: '' }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regDetails, setRegDetails] = useState(null);
  const [showSecurityCode, setShowSecurityCode] = useState(false);

  const countryCodes = [
    { code: '+91', name: 'India' },
    { code: '+1', name: 'USA' },
    { code: '+44', name: 'UK' },
    { code: '+971', name: 'UAE' },
    { code: '+61', name: 'Australia' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+65', name: 'Singapore' },
  ];

  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/questions`);
        setQuestions(res.data);
      } catch (err) {
        console.error('Failed to fetch questions');
      }
    };
    fetchQuestions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (securityData.some(item => !item.question_id || !item.answer)) {
      setError('Please answer all security questions');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${formData.phone.replace(/\D/g, '')}`;
      const response = await axios.post(`${API_BASE}/register`, {
        full_name: formData.name,
        email: formData.email,
        mobile: fullPhone,
        password: formData.password,
        security_answers: securityData
      });

      if (response.data.status === 'SUCCESS' || response.data.token) {
        setRegDetails(response.data);
        setShowSecurityCode(true);
      } else if (response.data.status === 'REGISTRATION_OTP_REQUIRED') {
        setRegDetails(response.data);
        setShowOtp(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/verify-otp`, {
        userId: regDetails.userId,
        otp: otpCode
      });

      if (response.data.token) {
        setRegDetails(prev => ({ ...prev, ...response.data }));
        setShowSecurityCode(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityChange = (index, field, value) => {
    const updated = [...securityData];
    updated[index][field] = value;
    setSecurityData(updated);
  };

  const steps = [
    { id: 1, title: 'Identity', icon: <User size={18} /> },
    { id: 2, title: 'Security', icon: <Shield size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col lg:flex-row text-[var(--text-primary)]">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:flex-[0.4] celestial-bg text-white p-16 flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[150px] opacity-20" />
        </div>

        <div className="flex items-center space-x-3 mb-24 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-glass)] backdrop-blur-md flex items-center justify-center border border-[var(--border)] shadow-xl text-white">
            <Shield size={26} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">Stardust</span>
        </div>

        <div className="flex-1 relative z-10">
          <h1 className="text-5xl font-bold mb-10 leading-tight">Build your <br /> financial fortress.</h1>
          <div className="space-y-10">
            {[
              { title: 'Privacy First', desc: 'Zero-knowledge architecture means we never see your data.' },
              { title: 'Legacy Shield', desc: 'Pre-configure asset transfers for your loved ones.' },
              { title: 'Global Trust', desc: 'AES-256 hardware isolation for your sensitive keys.' }
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-5 group transition-transform hover:translate-x-1">
                <div className="mt-1 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 text-xs font-bold border border-white/10">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-blue-100/60 text-sm mt-1 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-12 border-t border-[var(--border)] text-blue-100/40 text-sm relative z-10">
          Already part of the network?
          <button onClick={onBackToLogin} className="ml-2 text-[var(--primary)] font-bold hover:underline">Sign In</button>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 p-8 lg:p-24 flex items-center justify-center relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="mb-12">
            <button
              onClick={onBackToLogin}
              className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm mb-10 transition-colors uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="mr-2" /> Return
            </button>
            <h2 className="text-4xl font-bold mb-3">
              {showOtp ? 'ID Verification' : 'Initialize Vault'}
            </h2>
            <p className="text-[var(--text-secondary)] text-lg font-medium leading-relaxed">
              {showOtp ? `Enter the 6-digit pulse sent to your device.` : 'Set up your encrypted workspace in minutes.'}
            </p>
          </div>

          {!showOtp && (
            <div className="flex items-center space-x-6 mb-12">
              {steps.map((s) => (
                <div key={s.id} className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${step >= s.id ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20 scale-110' : 'bg-[var(--surface-glass)] text-[var(--text-secondary)] border border-[var(--border)]'
                    }`}>
                    {step > s.id ? <Check size={20} /> : s.id}
                  </div>
                  <span className={`text-sm font-bold tracking-tight ${step >= s.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{s.title}</span>
                  {s.id !== steps.length && <div className="w-8 h-px bg-[var(--border)]" />}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!showOtp && step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Legal Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                    <input
                      type="text" required placeholder="John Doe" className="input-field pl-14"
                      value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Digital Mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                    <input
                      type="email" required placeholder="john@cloud.com" className="input-field pl-14"
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Contact Link</label>
                  <div className="flex space-x-3">
                    <select
                      className="w-32 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl px-3 py-4 text-sm font-bold focus:bg-[var(--surface)] transition-all outline-none text-[var(--text-primary)]"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {countryCodes.map(c => (
                        <option key={c.code} value={c.code} className="bg-[var(--surface)]">{c.code}</option>
                      ))}
                    </select>
                    <div className="relative group flex-1">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                      <input
                        type="tel" required placeholder="98765 43210" className="input-field pl-14"
                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!formData.name || !formData.email || !formData.phone) {
                      setError('Required fields missing in Identity section.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="w-full btn-primary py-5 group"
                >
                  <span>Build Security Phase</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ) : !showOtp && step === 2 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Master Password</label>
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
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Repeat Key</label>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          className="input-field pl-14 pr-12"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--border)]">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6 ml-1">Recovery Protocol Questions</h3>
                    {securityData.map((item, index) => (
                      <div key={index} className="space-y-3 mb-4 last:mb-0 p-6 glass rounded-3xl">
                        <select
                          className="w-full bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl px-5 py-3 text-sm font-medium focus:bg-[var(--surface)] outline-none transition-all text-[var(--text-primary)]"
                          value={item.question_id}
                          onChange={(e) => handleSecurityChange(index, 'question_id', e.target.value)}
                        >
                          <option value="" className="bg-[var(--surface)]">Select a question</option>
                          {questions.map((q) => (
                            <option key={q.question_id} value={q.question_id} className="bg-[var(--surface)]">
                              {q.question}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Secret answer"
                          className="input-field py-3"
                          value={item.answer}
                          onChange={(e) => handleSecurityChange(index, 'answer', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 my-4">
                    <AlertCircle size={20} />
                    <span className="text-sm font-bold">{error}</span>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1 btn-secondary py-5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] btn-primary py-5 flex items-center justify-center glow-on-hover"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                    ) : (
                      'Finalize Vault'
                    )}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </form>

          {showOtp && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="glass p-6 rounded-[2rem] border-[var(--primary)]/20 flex items-start space-x-4">
                <AlertCircle className="text-[var(--primary)] shrink-0 mt-1" size={24} />
                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                  Encryption keys generated. A 6-digit pulse has been sent to your WhatsApp ending in <b className="text-[var(--text-primary)]">{regDetails?.mobileSnippet}</b>.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest block text-center">Security Pulse</label>
                <div className="relative group">
                  <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={24} />
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="••••••"
                    className="w-full pl-16 pr-6 py-5 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl outline-none focus:bg-[var(--surface)] focus:border-[var(--primary)] transition-all font-bold tracking-[0.7em] text-center text-3xl text-[var(--text-primary)] placeholder:tracking-normal"
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
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full btn-primary py-6 text-xl group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-[var(--text-primary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Decrypt & Enter</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {regDetails?.token && (
                <button
                  type="button"
                  onClick={() => setShowSecurityCode(true)}
                  className="w-full text-center text-[var(--primary)] font-bold hover:underline transition-colors py-2"
                >
                  Skip for now & access workspace
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className="w-full text-center text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Reconfigure Details
              </button>
            </motion.div>
          )}

          {showSecurityCode && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Shield size={32} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Vault Initialized</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
                Your unique vault security code has been generated. <b className="text-[var(--text-primary)]">Write this down.</b> You will need it to link your vault to nominees or recover access.
              </p>
              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl mb-10 font-mono text-3xl font-black text-blue-400 tracking-[0.2em] shadow-lg shadow-blue-500/5 flex items-center justify-center">
                {(() => {
                  const code = regDetails?.securityCode || '';
                  if (code.length === 9) {
                    return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
                  }
                  return code;
                })()}
              </div>
              <button
                onClick={() => onRegisterSuccess({ token: regDetails.token, user: regDetails.user })}
                className="w-full btn-primary py-5"
              >
                <span>Securely Enter Vault</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const Check = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default RegistrationPage;