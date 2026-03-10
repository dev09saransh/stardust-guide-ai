import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    User, Mail, Phone, MapPin, Calendar, Shield, CheckCircle,
    Loader2, ChevronDown, Lock, AlertCircle, ArrowRight, X
} from 'lucide-react';

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer Not to Say'];

const AccountDetailsModal = ({ user, onComplete }) => {
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        mobile: '',
        address: '',
        gender: '',
        dob: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [profileData, setProfileData] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const API = 'http://13.48.25.209:5001/api/auth';
    const headers = { Authorization: `Bearer ${user.token}` };

    // Fetch existing profile data and auto-fill
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API}/profile`, { headers });
                const p = res.data;
                setProfileData(p);
                setForm({
                    full_name: p.full_name || '',
                    email: p.email || '',
                    mobile: p.mobile || '',
                    address: p.address || '',
                    gender: p.gender || '',
                    dob: p.dob ? p.dob.split('T')[0] : '',
                });
            } catch (err) {
                console.error('Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const getMissingFields = () => {
        const missing = [];
        if (!form.address) missing.push('address');
        if (!form.gender) missing.push('gender');
        if (!form.dob) missing.push('dob');
        return missing;
    };

    const validate = () => {
        const errs = {};
        if (!form.full_name.trim()) errs.full_name = 'Full name is required';
        if (!form.address.trim()) errs.address = 'Address is required';
        if (!form.gender) errs.gender = 'Please select gender';
        if (!form.dob) errs.dob = 'Date of birth is required';
        if (!termsAccepted) errs.terms = 'You must accept the Terms & Conditions';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await axios.put(`${API}/profile`, {
                full_name: form.full_name,
                address: form.address,
                gender: form.gender,
                dob: form.dob,
            }, { headers });
            setSaveSuccess(true);
            setTimeout(() => { if (onComplete) onComplete(); }, 1500);
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const missingCount = getMissingFields().length;

    if (loading) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(15,23,42,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Loader2 size={36} className="animate-spin" style={{ color: '#7c3aed' }} />
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', overflowY: 'auto',
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={saveSuccess ? 'success' : 'form'}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: saveSuccess ? '420px' : '560px',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Close (X) Button */}
                    {!saveSuccess && (
                        <button
                            type="button"
                            onClick={onComplete}
                            style={{
                                position: 'absolute', top: '14px', right: '14px', zIndex: 10,
                                background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.12)',
                                borderRadius: '10px', padding: '6px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'rgba(0,0,0,0.4)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,1)'; e.currentTarget.style.color = 'rgba(0,0,0,0.7)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = 'rgba(0,0,0,0.4)'; }}
                        >
                            <X size={16} />
                        </button>
                    )}
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)',
                        padding: '28px 32px 22px',
                        color: 'white',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.2)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {saveSuccess ? <CheckCircle size={24} /> : <User size={24} />}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                                    {saveSuccess ? 'Profile Updated!' : 'Complete Your Profile'}
                                </h2>
                                <p style={{ fontSize: '13px', opacity: 0.8, margin: '2px 0 0', fontWeight: 500 }}>
                                    {saveSuccess
                                        ? 'Your account details have been saved.'
                                        : missingCount > 0
                                            ? `${missingCount} field${missingCount > 1 ? 's' : ''} missing — fill them in to unlock all features.`
                                            : 'Review your information below.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {saveSuccess ? (
                        <div style={{ textAlign: 'center', padding: '40px 32px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', boxShadow: '0 8px 30px rgba(16,185,129,0.3)',
                            }}>
                                <CheckCircle size={40} color="white" />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1f2937', margin: '0 0 8px' }}>All Set!</h3>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Your profile is now complete.</p>
                        </div>
                    ) : (
                        <div style={{ padding: '24px 32px 32px', maxHeight: '65vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Full Name */}
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <div style={inputWrapperStyle}>
                                        <User size={18} style={iconStyle} />
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                                            placeholder="Your full name"
                                            style={inputStyle}
                                        />
                                    </div>
                                    {errors.full_name && <span style={errStyle}>{errors.full_name}</span>}
                                </div>

                                {/* Email (verified, read-only) */}
                                <div>
                                    <label style={labelStyle}>
                                        Email Address
                                        {profileData?.is_verified && (
                                            <span style={{ marginLeft: '8px', color: '#10b981', fontSize: '10px', fontWeight: 800 }}>
                                                ✓ VERIFIED
                                            </span>
                                        )}
                                    </label>
                                    <div style={{ ...inputWrapperStyle, background: '#f3f4f6', opacity: 0.8 }}>
                                        <Mail size={18} style={iconStyle} />
                                        <input type="email" value={form.email} readOnly style={{ ...inputStyle, cursor: 'not-allowed' }} />
                                        <Lock size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'block', marginLeft: '2px' }}>
                                        Email is verified and cannot be changed here.
                                    </span>
                                </div>

                                {/* Phone (verified, read-only) */}
                                <div>
                                    <label style={labelStyle}>
                                        Phone Number
                                        {profileData?.is_verified && (
                                            <span style={{ marginLeft: '8px', color: '#10b981', fontSize: '10px', fontWeight: 800 }}>
                                                ✓ VERIFIED
                                            </span>
                                        )}
                                    </label>
                                    <div style={{ ...inputWrapperStyle, background: '#f3f4f6', opacity: 0.8 }}>
                                        <Phone size={18} style={iconStyle} />
                                        <input type="tel" value={form.mobile} readOnly style={{ ...inputStyle, cursor: 'not-allowed' }} />
                                        <Lock size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'block', marginLeft: '2px' }}>
                                        Phone is verified and cannot be changed here.
                                    </span>
                                </div>

                                {/* Password */}
                                <div>
                                    <label style={labelStyle}>Password</label>
                                    <div style={{ ...inputWrapperStyle, background: '#f3f4f6', opacity: 0.8 }}>
                                        <Shield size={18} style={iconStyle} />
                                        <input type="password" value="••••••••" readOnly style={{ ...inputStyle, cursor: 'not-allowed' }} />
                                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800, flexShrink: 0 }}>SET</span>
                                    </div>
                                </div>

                                {/* Address — EDITABLE / MISSING */}
                                <div>
                                    <label style={labelStyle}>
                                        Address
                                        {!form.address && <span style={missingBadge}>REQUIRED</span>}
                                    </label>
                                    <div style={{ ...inputWrapperStyle, borderColor: !form.address ? '#f59e0b' : '#e5e7eb' }}>
                                        <MapPin size={18} style={iconStyle} />
                                        <textarea
                                            value={form.address}
                                            onChange={e => setForm({ ...form, address: e.target.value })}
                                            placeholder="Enter your full address"
                                            rows={2}
                                            style={{ ...inputStyle, resize: 'vertical', minHeight: '40px' }}
                                        />
                                    </div>
                                    {errors.address && <span style={errStyle}>{errors.address}</span>}
                                </div>

                                {/* Gender — EDITABLE / MISSING */}
                                <div>
                                    <label style={labelStyle}>
                                        Gender
                                        {!form.gender && <span style={missingBadge}>REQUIRED</span>}
                                    </label>
                                    <div style={{ ...inputWrapperStyle, position: 'relative', borderColor: !form.gender ? '#f59e0b' : '#e5e7eb' }}>
                                        <User size={18} style={iconStyle} />
                                        <select
                                            value={form.gender}
                                            onChange={e => setForm({ ...form, gender: e.target.value })}
                                            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '28px', background: 'transparent' }}
                                        >
                                            <option value="">Select gender</option>
                                            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                    </div>
                                    {errors.gender && <span style={errStyle}>{errors.gender}</span>}
                                </div>

                                {/* Date of Birth — EDITABLE / MISSING */}
                                <div>
                                    <label style={labelStyle}>
                                        Date of Birth
                                        {!form.dob && <span style={missingBadge}>REQUIRED</span>}
                                    </label>
                                    <div style={{ ...inputWrapperStyle, borderColor: !form.dob ? '#f59e0b' : '#e5e7eb' }}>
                                        <Calendar size={18} style={iconStyle} />
                                        <input
                                            type="date"
                                            value={form.dob}
                                            onChange={e => setForm({ ...form, dob: e.target.value })}
                                            max={new Date().toISOString().split('T')[0]}
                                            style={{ ...inputStyle, cursor: 'pointer' }}
                                        />
                                    </div>
                                    {errors.dob && <span style={errStyle}>{errors.dob}</span>}
                                </div>

                                {errors.general && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                                        <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                                        <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>{errors.general}</span>
                                    </div>
                                )}

                                {/* Terms & Conditions */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                                    <input
                                        type="checkbox"
                                        id="onboarding-tnc"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#7c3aed', width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="onboarding-tnc" style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, cursor: 'pointer' }}>
                                        I accept the <strong>Terms & Conditions</strong> and acknowledge that I am fully responsible for securing my account facts accurately.
                                    </label>
                                </div>
                                {errors.terms && <span style={errStyle} className="mt-[-8px]">{errors.terms}</span>}

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                                        background: saving ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                        color: 'white', fontSize: '15px', fontWeight: 700,
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginTop: '4px',
                                    }}
                                >
                                    {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <>Save & Continue <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const labelStyle = {
    display: 'flex', alignItems: 'center',
    fontSize: '11px', fontWeight: 700,
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
    background: 'transparent', fontFamily: 'inherit',
};

const iconStyle = { color: '#9ca3af', marginRight: '10px', flexShrink: 0 };

const errStyle = {
    fontSize: '12px', color: '#ef4444', fontWeight: 600,
    marginTop: '4px', display: 'block', marginLeft: '2px',
};

const missingBadge = {
    marginLeft: '8px', fontSize: '9px', fontWeight: 800,
    color: '#f59e0b', background: '#fffbeb', padding: '2px 6px',
    borderRadius: '4px', border: '1px solid #fde68a',
};

export default AccountDetailsModal;
