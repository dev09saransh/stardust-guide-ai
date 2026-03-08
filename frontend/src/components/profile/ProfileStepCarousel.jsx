import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User, Calendar, ArrowRight, ArrowLeft, CheckCircle, Loader2, ChevronDown } from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Other'];

const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
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

// Map missing field keys → slide definitions
const buildSlides = (missingFields) => {
    const all = [];

    // 1. Personal Identity Fields
    if (missingFields.includes('address')) {
        all.push({
            key: 'address',
            title: 'Your Address',
            subtitle: 'Where are you located?',
            emoji: '📍',
            fields: ['address'],
        });
    }

    const missingGender = missingFields.includes('gender');
    const missingDob = missingFields.includes('dob');
    if (missingGender || missingDob) {
        all.push({
            key: 'personal',
            title: 'A Little About You',
            subtitle: 'Help us personalize your experience',
            emoji: '🪪',
            fields: [
                ...(missingGender ? ['gender'] : []),
                ...(missingDob ? ['dob'] : []),
            ],
        });
    }

    // Name slide
    if (missingFields.includes('full_name')) {
        all.push({
            key: 'name',
            title: 'Your Full Name',
            subtitle: 'This appears across your vault',
            emoji: '👤',
            fields: ['full_name'],
        });
    }

    // Email slide
    if (missingFields.includes('email')) {
        all.push({
            key: 'email',
            title: 'Email Address',
            subtitle: 'Used for critical alerts',
            emoji: '📧',
            fields: ['email'],
        });
    }

    // Mobile slide
    if (missingFields.includes('mobile')) {
        all.push({
            key: 'mobile',
            title: 'Mobile Number',
            subtitle: 'Required for OTP security',
            emoji: '📱',
            fields: ['mobile'],
        });
    }

    // 2. Vault Pillars (Skipped in this modal, handled via separate triggers)
    /*
    const missingPillars = missingFields.filter(f => ['has_nominee', 'has_security'].includes(f));
    if (missingPillars.length > 0) {
        all.push({
            key: 'milestones',
            title: 'Vault Pillars',
            subtitle: 'Required for active vault release',
            emoji: '🏛️',
            fields: [], // Special rendering for this slide
            pillars: missingPillars
        });
    }
    */

    return all;
};

const ProfileStepCarousel = ({ missingFields, form, setForm, onSave, saving, error, percentage }) => {
    const slides = buildSlides(missingFields);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slide = slides[currentSlide];
    const isLastSlide = currentSlide === slides.length - 1;
    const isFirstSlide = currentSlide === 0;

    const handleNext = () => {
        if (isLastSlide) {
            onSave();
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (!isFirstSlide) setCurrentSlide(prev => prev - 1);
    };

    if (slides.length === 0) {
        // If background thinks we are complete but carousel is logically empty, 
        // fallback to either success or loading based on percentage
        if (percentage < 100) {
            return (
                <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 30px rgba(245,158,11,0.3)',
                    }}>
                        <CheckCircle size={32} color="white" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
                        Almost There!
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.5 }}>
                        Your personal details are set. Please add a nominee or security questions from the dashboard to reach 100%.
                    </p>
                    <button
                        type="button"
                        onClick={onSave}
                        style={{
                            marginTop: '20px', padding: '12px 24px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none', borderRadius: '12px',
                            color: 'white', fontWeight: 700, fontSize: '13px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Got it
                    </button>
                </div>
            );
        }

        return (
            <div style={{ padding: '20px 32px 32px', textAlign: 'center' }}>
                <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 8px 30px rgba(16,185,129,0.3)',
                }}>
                    <CheckCircle size={32} color="white" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
                    Vault Ready!
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.5 }}>
                    Your profile is 100% complete and your vault is fully secured and operational.
                </p>
            </div>
        );
    }

    const renderField = (fieldKey) => {
        const inputFocus = (e) => {
            e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
            e.target.style.background = 'rgba(255,255,255,0.06)';
        };
        const inputBlur = (e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.background = 'rgba(255,255,255,0.04)';
        };

        if (fieldKey === 'address') {
            return (
                <div key="address">
                    <label style={labelStyle}>Full Address</label>
                    <div style={{ position: 'relative' }}>
                        <MapPin size={17} style={{
                            position: 'absolute', left: '14px', top: '15px',
                            color: 'rgba(255,255,255,0.28)',
                        }} />
                        <textarea
                            placeholder="Enter your city or full address"
                            value={form.address}
                            rows={3}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            style={{
                                ...inputStyle,
                                paddingLeft: '44px',
                                resize: 'vertical',
                                minHeight: '80px',
                            }}
                        />
                    </div>
                </div>
            );
        }

        if (fieldKey === 'gender') {
            return (
                <div key="gender">
                    <label style={labelStyle}>Gender</label>
                    <div style={{ position: 'relative' }}>
                        <User size={17} style={{
                            position: 'absolute', left: '14px', top: '50%',
                            transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)',
                        }} />
                        <ChevronDown size={15} style={{
                            position: 'absolute', right: '14px', top: '50%',
                            transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)',
                            pointerEvents: 'none',
                        }} />
                        <select
                            value={form.gender}
                            onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                            style={{ ...inputStyle, paddingLeft: '44px', paddingRight: '40px', appearance: 'none', cursor: 'pointer' }}
                        >
                            <option value="" style={{ background: '#1a1a2e' }}>Select gender</option>
                            {GENDERS.map(g => <option key={g} value={g} style={{ background: '#1a1a2e' }}>{g}</option>)}
                        </select>
                    </div>
                </div>
            );
        }

        if (fieldKey === 'dob') {
            return (
                <div key="dob">
                    <label style={labelStyle}>Date of Birth</label>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={17} style={{
                            position: 'absolute', left: '14px', top: '50%',
                            transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)', pointerEvents: 'none',
                        }} />
                        <input
                            type="date"
                            value={form.dob}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            style={{ ...inputStyle, paddingLeft: '44px', colorScheme: 'dark', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            );
        }

        if (fieldKey === 'full_name') {
            return (
                <div key="full_name">
                    <label style={labelStyle}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                        <User size={17} style={{
                            position: 'absolute', left: '14px', top: '50%',
                            transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)',
                        }} />
                        <input
                            type="text"
                            placeholder="Your full legal name"
                            value={form.full_name}
                            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                            style={{ ...inputStyle, paddingLeft: '44px' }}
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div style={{ padding: '16px 32px 32px' }}>
            {/* Slide Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
                {slides.map((s, i) => (
                    <div key={s.key} style={{
                        width: i === currentSlide ? '20px' : '6px',
                        height: '6px', borderRadius: '100px',
                        background: i <= currentSlide ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)',
                        transition: 'all 0.35s ease',
                    }} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={slide.key}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                >
                    {/* Slide Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '18px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '26px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', flexShrink: 0,
                        }}>
                            {slide.emoji}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                                {slide.title}
                            </h3>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', fontWeight: 500, margin: '2px 0 0' }}>
                                {slide.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                        {slide.key === 'milestones' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {slide.pillars.map(p => (
                                    <div key={p} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '14px 18px', borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                                        }} />
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                                            Missing: {p.replace('has_', '')}
                                        </span>
                                    </div>
                                ))}
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>
                                    Complete these in the dashboard to finish setup.
                                </p>
                            </div>
                        ) : (
                            slide.fields.map(renderField)
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            padding: '10px 14px', borderRadius: '12px',
                            color: '#f87171', fontSize: '13px', fontWeight: 700, marginBottom: '14px',
                        }}>
                            {error}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {!isFirstSlide && (
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            padding: '14px 20px',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: 700, fontSize: '13px', fontFamily: 'inherit',
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={saving}
                    style={{
                        flex: 1, padding: '15px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', borderRadius: '16px',
                        color: 'white', fontWeight: 700, fontSize: '14px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
                        fontFamily: 'inherit', opacity: saving ? 0.8 : 1,
                    }}
                >
                    {saving ? (
                        <><Loader2 size={18} style={{ animation: 'spin 0.6s linear infinite' }} /> Saving...</>
                    ) : isLastSlide ? (
                        <><span>Save & Complete</span><CheckCircle size={17} /></>
                    ) : (
                        <><span>Continue</span><ArrowRight size={17} /></>
                    )}
                </button>
            </div>

            {/* Slide count */}
            <p style={{
                textAlign: 'center', marginTop: '14px',
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.18)',
            }}>
                Step {currentSlide + 1} of {slides.length}
            </p>
        </div>
    );
};

export default ProfileStepCarousel;
