import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Key, Mail, Phone, Users, Lock, AlertCircle, ArrowLeft,
    ArrowRight, CheckCircle2, Loader2, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';

const API = 'http://127.0.0.1:5001/api/auth';

const RecoverAccountPage = ({ onBackToLogin }) => {
    // Steps: 1=Identify, 2=Choose OTP method, 3=Enter OTP, 4=Security Questions, 5=Update Account, 6=Success
    const [step, setStep] = useState(1);
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1 result
    const [userId, setUserId] = useState(null);
    const [methods, setMethods] = useState([]);

    // Step 2-3: OTP
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [otp, setOtp] = useState('');
    const [otpMessage, setOtpMessage] = useState('');

    // Step 4: Security questions
    const [securityQuestions, setSecurityQuestions] = useState([]);
    const [securityAnswers, setSecurityAnswers] = useState([]);

    // Step 5: Account update
    const [resetToken, setResetToken] = useState('');
    const [editForm, setEditForm] = useState({ email: '', mobile: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);

    const totalSteps = 6;

    const anim = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
    };

    // ─── Step 1: Lookup ───
    const handleLookup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/recover/lookup`, { identifier });
            setUserId(res.data.userId);
            // Filter out 'security' from methods — it's now mandatory after OTP
            setMethods(res.data.methods.filter(m => m.id !== 'security'));
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Account not found.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2: Send OTP ───
    const handleSelectMethod = async (method) => {
        setSelectedMethod(method);
        setError('');
        setOtp('');
        setLoading(true);
        try {
            const res = await axios.post(`${API}/recover/send-otp`, { userId, method: method.id });
            setOtpMessage(res.data.message);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 3: Verify OTP → get security questions ───
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/recover/verify`, {
                userId,
                phase: 'otp',
                otp
            });
            // OTP verified — now show security questions
            setSecurityQuestions(res.data.securityQuestions || []);
            setSecurityAnswers((res.data.securityQuestions || []).map(q => ({ question_id: q.question_id, answer: '' })));
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 4: Verify Security Questions → get reset token ───
    const handleVerifySecurity = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/recover/verify`, {
                userId,
                phase: 'security',
                answers: securityAnswers
            });
            setResetToken(res.data.resetToken);
            setEditForm({
                email: res.data.currentEmail || '',
                mobile: res.data.currentMobile || '',
                password: '',
                confirmPassword: ''
            });
            setStep(5);
        } catch (err) {
            setError(err.response?.data?.message || 'Security verification failed.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 5: Update Account ───
    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (editForm.password && editForm.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        try {
            await axios.put(`${API}/recover/update-account`, {
                resetToken,
                email: editForm.email || undefined,
                mobile: editForm.mobile || undefined,
                password: editForm.password || undefined
            });
            setStep(6);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update account.');
        } finally {
            setLoading(false);
        }
    };

    const methodIcons = {
        email: <Mail size={22} />,
        phone: <Phone size={22} />,
        nominee: <Users size={22} />
    };

    const methodColors = {
        email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        phone: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        nominee: 'bg-violet-500/10 text-violet-500 border-violet-500/20'
    };

    const stepTitles = {
        1: 'Account Lookup',
        2: 'Identity Shield',
        3: 'Pulse Verification',
        4: 'Protocol Review',
        5: 'Vault Reconfiguration',
        6: 'Restoration Succesful'
    };

    const stepDescs = {
        1: 'Enter your account identifier to begin restoration.',
        2: 'Choose a bypass channel for identity pulse.',
        3: otpMessage || 'Decrypt the 6-digit pulse sequence.',
        4: 'Verify your secondary recovery protocols.',
        5: 'Reconfigure your master credentials securely.',
        6: 'Your vault access has been restored successfully.'
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)] relative overflow-hidden p-6">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10">
                <div className="card glass overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="celestial-bg p-10 text-center relative">
                        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                        </div>

                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/10 mx-auto mb-6 shadow-2xl relative z-10">
                            {step === 6 ? <CheckCircle2 size={40} className="text-emerald-400" /> : step === 4 ? <HelpCircle size={40} /> : <Shield size={40} />}
                        </div>
                        <h2 className="text-3xl font-bold mb-2 tracking-tight relative z-10">{stepTitles[step]}</h2>
                        <p className="text-blue-100/60 font-medium text-sm max-w-xs mx-auto relative z-10">{stepDescs[step]}</p>

                        {/* Progress Tracker */}
                        <div className="flex justify-center gap-3 mt-8 relative z-10">
                            {[1, 2, 3, 4, 5, 6].map(s => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-10 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : s < step ? 'w-4 bg-white/40' : 'w-4 bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-10">
                        <AnimatePresence mode="wait">

                            {/* ─── STEP 1: IDENTIFY ─── */}
                            {step === 1 && (
                                <motion.form key="s1" variants={anim} initial="hidden" animate="visible" exit="exit" onSubmit={handleLookup} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Account Identifier</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                            <input type="text" required placeholder="Email or Phone Link"
                                                className="input-field pl-14" value={identifier}
                                                onChange={e => setIdentifier(e.target.value)} />
                                        </div>
                                    </div>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold">
                                            <AlertCircle size={20} />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                    <button disabled={loading} className="w-full btn-primary py-5 text-lg group">
                                        {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>Locate Vault</span> <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                                    </button>
                                    <button type="button" onClick={onBackToLogin} className="w-full flex items-center justify-center space-x-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest pt-4">
                                        <ArrowLeft size={16} /><span>Return to Gate</span>
                                    </button>
                                </motion.form>
                            )}

                            {/* ─── STEP 2: CHOOSE OTP METHOD ─── */}
                            {step === 2 && (
                                <motion.div key="s2" variants={anim} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1 mb-4">Select Decryption Channel</p>
                                    {methods.map(m => (
                                        <button key={m.id} onClick={() => handleSelectMethod(m)} disabled={loading}
                                            className="w-full flex items-center p-5 glass rounded-[1.5rem] border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.05] transition-all group text-left relative overflow-hidden">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-5 transition-transform group-hover:scale-110 border ${methodColors[m.id]}`}>
                                                {methodIcons[m.id] || <Key size={26} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{m.label}</p>
                                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">{m.hint}</p>
                                            </div>
                                            <ArrowRight size={20} className="text-[var(--text-primary)] opacity-10 group-hover:opacity-100 group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                    {loading && <div className="flex justify-center py-4"><Loader2 size={32} className="animate-spin text-[var(--primary)]" /></div>}
                                    <button type="button" onClick={() => { setStep(1); setError(''); }}
                                        className="w-full text-center text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] pt-6 transition-colors font-medium">
                                        <ArrowLeft size={16} className="inline mr-2" />Try different identifier
                                    </button>
                                </motion.div>
                            )}

                            {/* ─── STEP 3: ENTER OTP ─── */}
                            {step === 3 && (
                                <motion.form key="s3" variants={anim} initial="hidden" animate="visible" exit="exit" onSubmit={handleVerifyOtp} className="space-y-8">
                                    <div className="space-y-4 text-center">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Verification Pulse</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={24} />
                                            <input type="text" required maxLength="6" placeholder="••••••"
                                                className="w-full pl-16 pr-6 py-5 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl outline-none focus:bg-[var(--surface)] focus:border-[var(--primary)] transition-all font-bold tracking-[0.7em] text-center text-3xl text-[var(--text-primary)] placeholder:tracking-normal"
                                                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                                        </div>
                                    </div>
                                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold"><AlertCircle size={20} /><span>{error}</span></div>}
                                    <button disabled={loading || otp.length < 6} className="w-full btn-primary py-5 text-xl group">
                                        {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>Decrypt Pulse</span> <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                                    </button>
                                    <div className="flex flex-col items-center gap-4 pt-2">
                                        <button type="button" onClick={() => selectedMethod && handleSelectMethod(selectedMethod)}
                                            className="text-sm font-bold text-[var(--primary)] hover:underline">Re-send Verification Pulse</button>
                                        <button type="button" onClick={() => { setStep(2); setOtp(''); setError(''); setSelectedMethod(null); }}
                                            className="text-sm font-bold text-[var(--text-secondary)] hover:text-white transition-colors">
                                            <ArrowLeft size={14} className="inline mr-1" />Change Channel
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {/* ─── STEP 4: SECURITY QUESTIONS (MANDATORY) ─── */}
                            {step === 4 && (
                                <motion.form key="s4" variants={anim} initial="hidden" animate="visible" exit="exit" onSubmit={handleVerifySecurity} className="space-y-6">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center space-x-4 text-sm font-bold">
                                        <CheckCircle2 size={24} className="shrink-0" />
                                        <span>Pulse Decrypted. Proceeding to Protocol Review.</span>
                                    </div>

                                    {securityQuestions.map((q, idx) => (
                                        <div key={q.question_id} className="space-y-3 p-6 glass rounded-[1.5rem] border-[var(--border)]">
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1 block">{q.question}</label>
                                            <input type="text" required placeholder="Pulse answer" className="input-field py-3 bg-[var(--surface-glass)] text-[var(--text-primary)]"
                                                value={securityAnswers[idx]?.answer || ''}
                                                onChange={e => {
                                                    const updated = [...securityAnswers];
                                                    updated[idx] = { ...updated[idx], answer: e.target.value };
                                                    setSecurityAnswers(updated);
                                                }} />
                                        </div>
                                    ))}

                                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold"><AlertCircle size={20} /><span>{error}</span></div>}
                                    <button disabled={loading} className="w-full btn-primary py-5 text-lg group">
                                        {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>Validate Identity</span> <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                                    </button>
                                </motion.form>
                            )}

                            {/* ─── STEP 5: UPDATE ACCOUNT ─── */}
                            {step === 5 && (
                                <motion.form key="s5" variants={anim} initial="hidden" animate="visible" exit="exit" onSubmit={handleUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">New Digital Mail</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                            <input type="email" placeholder="Update Email (Optional)" className="input-field pl-14"
                                                value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">New Contact Link</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                            <input type="tel" placeholder="Update Phone (Optional)" className="input-field pl-14"
                                                value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">New Master Key</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-14 pr-12"
                                                    value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Repeat Master Key</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                                <input type="password" placeholder="••••••••" className="input-field pl-14"
                                                    value={editForm.confirmPassword} onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-secondary)] text-center uppercase tracking-widest opacity-50 font-bold">Null values will retain legacy parameters.</p>
                                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold"><AlertCircle size={20} /><span>{error}</span></div>}
                                    <button disabled={loading} className="w-full btn-primary py-5 text-lg group font-bold">
                                        {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>Commit Reconfiguration</span> <CheckCircle2 size={20} /></>}
                                    </button>
                                </motion.form>
                            )}

                            {/* ─── STEP 6: SUCCESS ─── */}
                            {step === 6 && (
                                <motion.div key="s6" variants={anim} initial="hidden" animate="visible" className="text-center space-y-8 py-6">
                                    <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                                        <CheckCircle2 size={48} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Access Restored</h3>
                                        <p className="text-[var(--text-secondary)] font-medium">Your account parameters have been re-encrypted successfully.</p>
                                    </div>
                                    <button onClick={onBackToLogin} className="w-full btn-primary py-5 text-xl font-bold glow-on-hover mt-4">
                                        Enter Vault
                                    </button>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center mt-10 text-[var(--text-secondary)] font-medium text-sm">
                    Stardust Zero-Knowledge Architecture &copy; 2026
                </p>
            </div>
        </div>
    );
};

export default RecoverAccountPage;
