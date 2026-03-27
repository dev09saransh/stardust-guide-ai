import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { User, Mail, Phone, Heart, Shield, CheckCircle, Loader2, ChevronDown, ArrowRight, ArrowLeft, X, Users, Link, AlertCircle } from 'lucide-react';
import AddAccountModal from '../Dashboard/AddAccountModal';

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
    // 0: Selection, 1: Identity, 2: Phone, 3: Relationship, 4: Phone OTP, 5: Success
    const [step, setStep] = useState(0); 
    const [form, setForm] = useState({
        full_name: '',
        mobile: '',
        confirm_mobile: '',
        country_code: '+91',
        relationship: '',
    });
    const [showAssociationModal, setShowAssociationModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [otpError, setOtpError] = useState('');

    const API = (process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api') + '/auth';
    const headers = { Authorization: `Bearer ${user.token}` };

    const validateStep = (currentStep) => {
        const errs = {};
        if (currentStep === 1) {
            if (!form.full_name.trim()) errs.full_name = 'Full name is required';
        } else if (currentStep === 2) {
            if (!form.mobile.trim()) errs.mobile = 'Phone number is required';
            else if (!/^\d{7,15}$/.test(form.mobile)) errs.mobile = 'Enter a valid phone number';
            if (form.mobile !== form.confirm_mobile) errs.confirm_mobile = 'Phone numbers do not match';
        } else if (currentStep === 3) {
            if (!form.relationship) errs.relationship = 'Please select a relationship';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = async () => {
        if (!validateStep(step)) return;

        if (step === 3) {
            // Last detail step, send Phone OTP
            setLoading(true);
            try {
                await axios.post(`${API}/nominee/send-phone-otp`, {
                    mobile: form.mobile,
                    country_code: form.country_code
                }, { headers });
                setStep(4);
            } catch (err) {
                setErrors({ mobile: err.response?.data?.message || 'Failed to send Phone OTP' });
            } finally {
                setLoading(false);
            }
        } else {
            setStep(step + 1);
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

            await axios.post(`${API}/nominee`, {
                full_name: form.full_name,
                mobile: form.mobile,
                country_code: form.country_code,
                relationship: form.relationship,
            }, { headers });

            setStep(5);
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
            if (step === 4) {
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

    const percentage = step === 0 ? 0 : getPercentage();

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', overflowY: 'auto',
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                    style={{
                        position: 'relative', zIndex: 10,
                        width: '100%', maxWidth: step === 4 ? '420px' : '480px',
                        background: 'rgba(18, 18, 32, 0.98)',
                        borderRadius: '2rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.15)',
                        overflow: 'hidden',
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    {/* Close (X) Button */}
                    {step < 4 && (
                        <button
                            type="button"
                            onClick={onComplete}
                            style={{
                                position: 'absolute', top: '22px', right: '22px', zIndex: 20,
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px', padding: '7px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                        >
                            <X size={17} />
                        </button>
                    )}
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
                        padding: '32px 32px 28px',
                        color: 'white',
                        position: 'relative',
                    }}>
                        {/* Close button */}
                        <button
                            onClick={() => { if (onComplete) onComplete(); }}
                            style={{
                                position: 'absolute', top: '24px', right: '24px',
                                background: 'rgba(255,255,255,0.15)', border: 'none',
                                borderRadius: '10px', color: 'white', padding: '6px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px', paddingRight: '40px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {step === 6 ? <CheckCircle size={22} /> : (step === 4 || step === 5) ? (step === 5 ? <Phone size={22} /> : <Mail size={22} />) : <Shield size={22} />}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                                    {step === 5 ? 'All Set!' : step === 4 ? 'Verify Phone' : step === 3 ? 'Vault Connection' : step === 2 ? 'Security Contact' : step === 1 ? 'Nominee Identity' : 'Nominee Onboarding'}
                                </h2>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '3px 0 0', fontWeight: 500 }}>
                                    {step === 5 ? 'Your nominee has been saved securely.' : step === 4 ? 'Security code sent via WhatsApp' : step === 0 ? 'Choose your preferred setup method.' : 'Designate a trusted person for vault recovery.'}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Nominee Readiness</span>
                                <span style={{ fontSize: '12px', fontWeight: 900 }}>{percentage}%</span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '100px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5 }}
                                    style={{ height: '100%', background: 'white', borderRadius: '100px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '24px 32px 32px' }}>
                        <AnimatePresence mode="wait">
                            {/* STEP 0: Selection */}
                            {step === 0 && (
                                <motion.div
                                    key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                                >
                                    <p className="text-[13px] text-white/40 font-bold mb-2 px-1">Choosing a nominee is a critical step for your legacy. Select how you want to proceed.</p>
                                    
                                    <button 
                                        onClick={() => setStep(1)}
                                        className="group relative flex items-center p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/[0.08] hover:border-[var(--primary)]/30 transition-all text-left"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mr-5 group-hover:scale-110 transition-transform">
                                            <User size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-white mb-1">Complete Manual Setup</h4>
                                            <p className="text-[11px] text-white/40 font-bold leading-relaxed uppercase tracking-widest">Add a new nominee from scratch</p>
                                        </div>
                                        <ArrowRight size={18} className="text-white/20 group-hover:text-[var(--primary)] transition-colors" />
                                    </button>

                                    <button 
                                        onClick={() => setShowAssociationModal(true)}
                                        className="group relative flex items-center p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/[0.08] hover:border-[var(--primary)]/30 transition-all text-left"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-5 group-hover:scale-110 transition-transform">
                                            <Link size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-white mb-1">Link to an Existing Account</h4>
                                            <p className="text-[11px] text-white/40 font-bold leading-relaxed uppercase tracking-widest">Match with shared vault permissions</p>
                                        </div>
                                        <ArrowRight size={18} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
                                    </button>

                                    <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                                        <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest leading-relaxed">
                                            Your legacy vault will not be active until a nominee is verified.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 1: Identity */}
                            {step === 1 && (
                                <motion.div
                                    key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
                                >
                                    <div>
                                        <label style={labelStyle}>Full Name</label>
                                        <div style={inputWrapperStyle}>
                                            <User size={18} style={{ color: 'rgba(255,255,255,0.3)', marginRight: '10px' }} />
                                            <input
                                                type="text" placeholder="Enter nominee's full name"
                                                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                                                style={inputStyle}
                                            />
                                        </div>
                                        {errors.full_name && <span style={errStyle}>{errors.full_name}</span>}
                                    </div>
                                    <button onClick={handleNext} style={primaryBtnStyle}>
                                        Continue <ArrowRight size={14} />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: Contact */}
                            {step === 2 && (
                                <motion.div
                                    key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
                                >
                                    <div>
                                        <label style={labelStyle}>Phone Number</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ ...inputWrapperStyle, width: '120px', paddingRight: '10px' }}>
                                                <select
                                                    value={form.country_code} onChange={e => setForm({ ...form, country_code: e.target.value })}
                                                    style={{ ...inputStyle, appearance: 'none', background: 'transparent' }}
                                                >
                                                    {COUNTRY_CODES.map(cc => <option key={cc.code} value={cc.code} style={{ background: '#121220' }}>{cc.flag} {cc.code}</option>)}
                                                </select>
                                                <ChevronDown size={14} style={{ opacity: 0.3 }} />
                                            </div>
                                            <div style={{ ...inputWrapperStyle, flex: 1 }}>
                                                <Phone size={18} style={{ color: 'rgba(255,255,255,0.3)', marginRight: '10px' }} />
                                                <input
                                                    type="tel" placeholder="Phone number"
                                                    value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </div>
                                        {errors.mobile && <span style={errStyle}>{errors.mobile}</span>}
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Confirm Phone Number</label>
                                        <div style={inputWrapperStyle}>
                                            <Phone size={18} style={{ color: 'rgba(255,255,255,0.3)', marginRight: '10px' }} />
                                            <input
                                                type="tel" placeholder="Re-enter phone number"
                                                value={form.confirm_mobile} onChange={e => setForm({ ...form, confirm_mobile: e.target.value.replace(/\D/g, '') })}
                                                style={inputStyle}
                                            />
                                        </div>
                                        {errors.confirm_mobile && <span style={errStyle}>{errors.confirm_mobile}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setStep(1)} style={secondaryBtnStyle}><ArrowLeft size={14} /> Back</button>
                                        <button onClick={handleNext} style={{ ...primaryBtnStyle, flex: 1 }}>Continue <ArrowRight size={14} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: Relationship */}
                            {step === 3 && (
                                <motion.div
                                    key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
                                >
                                    <div>
                                        <label style={labelStyle}>Relationship</label>
                                        <div style={inputWrapperStyle}>
                                            <Heart size={18} style={{ color: 'rgba(255,255,255,0.3)', marginRight: '10px' }} />
                                            <select
                                                value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}
                                                style={{ ...inputStyle, appearance: 'none', background: 'transparent' }}
                                            >
                                                <option value="" style={{ background: '#121220' }}>Select relationship</option>
                                                {RELATIONSHIPS.map(r => <option key={r} value={r} style={{ background: '#121220' }}>{r}</option>)}
                                            </select>
                                            <ChevronDown size={14} style={{ opacity: 0.3 }} />
                                        </div>
                                        {errors.relationship && <span style={errStyle}>{errors.relationship}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setStep(2)} style={secondaryBtnStyle}><ArrowLeft size={14} /> Back</button>
                                        <button onClick={handleNext} disabled={loading} style={{ ...primaryBtnStyle, flex: 1 }}>
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify & Complete <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></>}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: Phone OTP */}
                            {step === 4 && (
                                <motion.div
                                    key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}
                                >
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontWeight: 500 }}>Enter the code sent via WhatsApp to verify phone.</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <input
                                                key={i} type="text" maxLength={1} value={otp[i] || ''}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    const newOtp = otp.split(''); newOtp[i] = val; setOtp(newOtp.join(''));
                                                    if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                                                }}
                                                onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && e.target.previousElementSibling) e.target.previousElementSibling.focus(); }}
                                                style={otpInputStyle}
                                            />
                                        ))}
                                    </div>
                                    {otpError && <span style={errStyle}>{otpError}</span>}
                                    <button onClick={handleVerifyPhoneOTP} disabled={loading || otp.length !== 6} style={primaryBtnStyle}>
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm & Save'}
                                    </button>
                                    <button onClick={handleResendOTP} style={linkBtnStyle}>Resend Code</button>
                                </motion.div>
                            )}

                            {/* STEP 5: Success */}
                            {step === 5 && (
                                <motion.div
                                    key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', padding: '24px 0 12px' }}
                                >
                                    <div style={successIconStyle}>
                                        <CheckCircle size={38} color="white" />
                                    </div>
                                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Nominee Saved!</h3>
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{form.full_name} is now your legacy contact.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </AnimatePresence>
            <AddAccountModal 
                user={user} 
                isOpen={showAssociationModal} 
                onClose={() => setShowAssociationModal(false)}
                onComplete={() => {
                    setShowAssociationModal(false);
                    onComplete();
                }}
            />
        </div >
    );
};

// Styles
const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 800,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em',
    marginBottom: '6px', marginLeft: '4px',
};
const inputWrapperStyle = {
    display: 'flex', alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
    padding: '12px 14px', background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s',
};
const inputStyle = {
    flex: 1, border: 'none', outline: 'none',
    fontSize: '14px', fontWeight: 500, color: 'white', background: 'transparent',
};
const errStyle = {
    fontSize: '11px', color: '#f87171', fontWeight: 700, marginTop: '6px', marginLeft: '4px',
};
const primaryBtnStyle = {
    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: '0 8px 32px rgba(99,102,241,0.3)', transition: 'all 0.2s',
};
const secondaryBtnStyle = {
    padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
    fontSize: '14px', fontWeight: 800, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
};
const otpInputStyle = {
    width: '56px', height: '64px', textAlign: 'center', fontSize: '24px', fontWeight: 800,
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white',
    background: 'rgba(255,255,255,0.04)', outline: 'none',
};
const successIconStyle = {
    width: '80px', height: '80px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
};
const linkBtnStyle = {
    background: 'none', border: 'none', color: '#818cf8', fontSize: '13px',
    fontWeight: 700, cursor: 'pointer', marginTop: '4px',
};

export default NomineeSetupModal;
