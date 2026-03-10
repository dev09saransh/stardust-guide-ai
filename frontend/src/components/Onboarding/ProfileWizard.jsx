import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Users, ArrowRight, Check, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = 'http://13.48.25.209:5001/api';

const steps = [
    { id: 'name', emoji: '👋', question: "What's your full name?", subtitle: 'This will appear across your vault' },
    { id: 'details', emoji: '📋', question: 'A few more details', subtitle: 'Help us personalize your experience' },
    { id: 'nominee', emoji: '🤝', question: 'Who is your nominee?', subtitle: 'Designate a trusted person for your vault' },
];

const ProfileWizard = ({ onComplete }) => {
    const { token, fetchProfileCompletion } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState({
        full_name: '', gender: '', dob: '', address: '',
        nominee_name: '', nominee_email: '', nominee_mobile: '',
        nominee_country_code: '+91', nominee_relationship: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const authHeaders = { Authorization: `Bearer ${token}` };
    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const progress = ((currentStep + 1) / steps.length) * 100;

    const inputStyle = {
        width: '100%', padding: '16px 18px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px', color: 'white',
        fontSize: '15px', fontWeight: 500, outline: 'none',
        transition: 'all 0.2s', fontFamily: 'inherit',
    };

    const labelStyle = {
        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)',
        marginBottom: '6px', display: 'block', marginLeft: '4px',
    };

    const handleNext = async () => {
        setError('');
        if (currentStep === 0 && !form.full_name.trim()) { setError('Please enter your name'); return; }
        if (currentStep <= 1) {
            setLoading(true);
            try {
                await axios.put(`${API}/auth/profile`, {
                    full_name: form.full_name,
                    gender: form.gender || undefined,
                    dob: form.dob || undefined,
                    address: form.address || undefined,
                }, { headers: authHeaders });
            } catch { setError('Failed to save. Please try again.'); setLoading(false); return; }
            setLoading(false);
        }
        if (isLastStep) {
            if (!form.nominee_name.trim()) { setError('Please enter nominee name'); return; }
            setLoading(true);
            try {
                await axios.post(`${API}/auth/nominee`, {
                    full_name: form.nominee_name,
                    email: form.nominee_email || undefined,
                    mobile: form.nominee_mobile ? `${form.nominee_country_code}${form.nominee_mobile}` : undefined,
                    relationship: form.nominee_relationship || undefined,
                }, { headers: authHeaders });
                await fetchProfileCompletion();
                onComplete();
            } catch { setError('Failed to save nominee.'); }
            setLoading(false);
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
            <motion.div
                initial={{ scale: 0.88, y: 40 }} animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                style={{
                    position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px',
                    background: 'rgba(18, 18, 32, 0.98)', borderRadius: '2rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.12)',
                    overflow: 'hidden',
                }}
            >
                {/* Progress bar */}
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)' }}>
                    <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }} />
                </div>

                {/* Step Indicator */}
                <div style={{ padding: '20px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
                        Step {currentStep + 1} of {steps.length}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {steps.map((_, i) => (
                            <div key={i} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: i <= currentStep ? '#6366f1' : 'rgba(255,255,255,0.08)',
                                transition: 'all 0.3s',
                            }} />
                        ))}
                        {/* Close (X) Button */}
                        <button
                            type="button"
                            onClick={onComplete}
                            style={{
                                marginLeft: '8px',
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px', padding: '4px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                            title="Close"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '20px 32px 32px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '18px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '28px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                                }}>
                                    {step.emoji}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>{step.question}</h3>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, margin: '2px 0 0' }}>{step.subtitle}</p>
                                </div>
                            </div>

                            {/* Step Content */}
                            {currentStep === 0 && (
                                <div>
                                    <input type="text" placeholder="Enter your full name" style={{ ...inputStyle, fontSize: '18px', padding: '18px 20px' }}
                                        value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                        autoFocus onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={labelStyle}>Gender</label>
                                            <select style={inputStyle} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                                <option value="" style={{ background: '#1a1a2e' }}>Select</option>
                                                <option value="Male" style={{ background: '#1a1a2e' }}>Male</option>
                                                <option value="Female" style={{ background: '#1a1a2e' }}>Female</option>
                                                <option value="Other" style={{ background: '#1a1a2e' }}>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Birthday</label>
                                            <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Address</label>
                                        <input type="text" placeholder="Your city or address" style={inputStyle}
                                            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Nominee Name</label>
                                        <input type="text" placeholder="Nominee's full name" style={inputStyle}
                                            value={form.nominee_name} onChange={(e) => setForm({ ...form, nominee_name: e.target.value })} autoFocus />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Relationship</label>
                                        <select style={inputStyle} value={form.nominee_relationship} onChange={(e) => setForm({ ...form, nominee_relationship: e.target.value })}>
                                            <option value="" style={{ background: '#1a1a2e' }}>Select</option>
                                            <option value="Spouse" style={{ background: '#1a1a2e' }}>Spouse</option>
                                            <option value="Parent" style={{ background: '#1a1a2e' }}>Parent</option>
                                            <option value="Child" style={{ background: '#1a1a2e' }}>Child</option>
                                            <option value="Sibling" style={{ background: '#1a1a2e' }}>Sibling</option>
                                            <option value="Other" style={{ background: '#1a1a2e' }}>Other</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={labelStyle}>Email</label>
                                            <input type="email" placeholder="Email" style={inputStyle}
                                                value={form.nominee_email} onChange={(e) => setForm({ ...form, nominee_email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Phone</label>
                                            <input type="tel" placeholder="Phone" style={inputStyle}
                                                value={form.nominee_mobile} onChange={(e) => setForm({ ...form, nominee_mobile: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div style={{ marginTop: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', borderRadius: '12px', color: '#f87171', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                {currentStep > 0 && (
                                    <button onClick={() => setCurrentStep(prev => prev - 1)} style={{
                                        padding: '14px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                                    }}>Back</button>
                                )}
                                <button onClick={handleNext} disabled={loading} style={{
                                    flex: 1, padding: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none', borderRadius: '16px', color: 'white', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 8px 32px rgba(99,102,241,0.3)', fontFamily: 'inherit',
                                }}>
                                    {loading ? (
                                        <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                    ) : (
                                        <><span>{isLastStep ? 'Complete Setup' : 'Continue'}</span>{isLastStep ? <Check size={18} /> : <ArrowRight size={18} />}</>
                                    )}
                                </button>
                            </div>

                            {/* Skip */}
                            {currentStep > 0 && !isLastStep && (
                                <button onClick={() => setCurrentStep(prev => prev + 1)}
                                    style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'inherit' }}>
                                    Skip for now
                                </button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ProfileWizard;
