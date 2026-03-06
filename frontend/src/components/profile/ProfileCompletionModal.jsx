import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Shield, CheckCircle, Loader2, X } from 'lucide-react';
import ProfileProgressBar from './ProfileProgressBar';
import ProfileStepCarousel from './ProfileStepCarousel';

const API = 'http://localhost:5001/api/auth';

const TOTAL_FIELDS = ['full_name', 'email', 'mobile', 'password', 'address', 'gender', 'dob'];

const ProfileCompletionModal = ({ user, onComplete }) => {
    const headers = { Authorization: `Bearer ${user?.token}` };

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Profile data from backend
    const [profileData, setProfileData] = useState(null); // full profile fields (booleans)
    const [missingFields, setMissingFields] = useState([]); // array of missing field keys
    const [percentage, setPercentage] = useState(0);

    // Form state (only missing fields are ever edited)
    const [form, setForm] = useState({
        full_name: '',
        address: '',
        gender: '',
        dob: '',
    });

    // ── Fetch profile completion ──
    const fetchData = async () => {
        setLoading(true);
        try {
            const [completionRes, profileRes] = await Promise.all([
                axios.get(`${API}/profile-completion`, { headers }),
                axios.get(`${API}/profile`, { headers }),
            ]);

            const comp = completionRes.data;
            const prof = profileRes.data;

            setProfileData(comp.fields);
            setMissingFields(comp.missing || []);
            setPercentage(comp.percentage || 0);

            // Pre-fill form with whatever already exists (so editable fields are not blank)
            setForm({
                full_name: prof.full_name || '',
                address: prof.address || '',
                gender: prof.gender || '',
                dob: prof.dob ? prof.dob.split('T')[0] : '',
            });
        } catch (err) {
            console.error('ProfileCompletionModal: failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Compute display values ──
    const completedCount = profileData
        ? TOTAL_FIELDS.filter(f => profileData[f]).length
        : 0;
    const totalCount = TOTAL_FIELDS.length;

    // ── Save only changed missing fields ──
    const handleSave = async () => {
        setError('');
        // Validate: any field in missingFields that is editable must be filled
        const editableMissing = missingFields.filter(f => ['address', 'gender', 'dob', 'full_name'].includes(f));
        for (const field of editableMissing) {
            if (!form[field]?.trim?.()) {
                setError(`Please fill in your ${field.replace('_', ' ')} before saving.`);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {};
            editableMissing.forEach(f => { payload[f] = form[f]; });
            await axios.put(`${API}/profile`, payload, { headers });
            setSaveSuccess(true);
            setTimeout(() => { if (onComplete) onComplete(); }, 1600);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Loader2 size={36} style={{ color: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', overflowY: 'auto',
                }}
            >
                {/* Backdrop */}
                <motion.div
                    onClick={onComplete}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
                    }}
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 30, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                    style={{
                        position: 'relative', zIndex: 10,
                        width: '100%', maxWidth: '460px',
                        background: 'rgba(18, 18, 32, 0.98)',
                        borderRadius: '2rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.15)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onComplete}
                        style={{
                            position: 'absolute', top: '18px', right: '18px', zIndex: 20,
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

                    <AnimatePresence mode="wait">
                        {saveSuccess ? (
                            /* ── SUCCESS SCREEN ── */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ padding: '56px 32px', textAlign: 'center' }}
                            >
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    boxShadow: '0 8px 30px rgba(16,185,129,0.3)',
                                }}>
                                    <CheckCircle size={38} color="white" />
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                                    Profile Complete!
                                </h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                                    Your profile is now fully set up. Welcome aboard!
                                </p>
                            </motion.div>
                        ) : (
                            /* ── MAIN FORM ── */
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {/* Header */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
                                    padding: '28px 32px 24px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '14px',
                                            background: 'rgba(255,255,255,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Shield size={22} color="white" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                                                Complete Your Profile
                                            </h2>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '3px 0 0', fontWeight: 500 }}>
                                                {missingFields.length === 0
                                                    ? 'All set! Your profile looks great.'
                                                    : `${missingFields.length} field${missingFields.length > 1 ? 's' : ''} remaining to unlock all features.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ padding: '20px 32px 0' }}>
                                    <ProfileProgressBar
                                        percentage={percentage}
                                        completedFields={completedCount}
                                        totalFields={totalCount}
                                    />
                                </div>

                                {/* Already-completed fields summary (read-only badges) */}
                                {profileData && (
                                    <div style={{ padding: '0 32px 6px' }}>
                                        <p style={{
                                            fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                            letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)',
                                            marginBottom: '8px', marginLeft: '2px',
                                        }}>
                                            Already Complete
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {TOTAL_FIELDS.filter(f => profileData[f]).map(f => (
                                                <span key={f} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '4px 10px', borderRadius: '100px',
                                                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
                                                    fontSize: '11px', fontWeight: 700, color: '#34d399',
                                                    textTransform: 'capitalize',
                                                }}>
                                                    ✓ {f.replace('_', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                {missingFields.length > 0 && (
                                    <div style={{
                                        height: '1px', background: 'rgba(255,255,255,0.05)',
                                        margin: '18px 32px 0',
                                    }} />
                                )}

                                {/* Carousel / Step form for missing fields */}
                                <ProfileStepCarousel
                                    missingFields={missingFields.filter(f => ['address', 'gender', 'dob', 'full_name'].includes(f))}
                                    form={form}
                                    setForm={setForm}
                                    onSave={handleSave}
                                    saving={saving}
                                    error={error}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileCompletionModal;
