import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Key, Mail, Smartphone, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ManualClaimModal = ({ isOpen, onClose, onVerified, user }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        ownerEmail: '',
        claimCode: '',
        verificationMethod: 'email'
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[0];
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const initiateClaim = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Mocking the API call for now to align with existing frontend flows
            // In a real scenario, this would call the backend to verify the claim code and email
            const response = await axios.post('http://16.170.248.196:5001/api/succession/initiate-claim', {
                ownerEmail: formData.ownerEmail,
                claimCode: formData.claimCode
            });

            if (response.data.success) {
                setStep(2);
            } else {
                setError(response.data.message || 'Invalid claim details. Please verify and try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate claim. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setLoading(true);
        setError('');
        const code = otp.join('');

        try {
            const response = await axios.post('http://16.170.248.196:5001/api/succession/verify-claim-otp', {
                ownerEmail: formData.ownerEmail,
                otp: code
            });

            if (response.data.success) {
                setStep(3);
                // Delay before closing to show success state
                setTimeout(() => {
                    onVerified(response.data.vaultData);
                    onClose();
                }, 2000);
            } else {
                setError(response.data.message || 'Invalid verification code.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] rounded-xl transition-all"
                >
                    <X size={20} />
                </button>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)] mb-6">
                                        <Shield size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Vault Recovery</h2>
                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                                        Enter the owner's email and your unique claim code to initiate the succession protocol.
                                    </p>
                                </div>

                                <form onSubmit={initiateClaim} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Owner's Primary Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                            <input
                                                type="email"
                                                name="ownerEmail"
                                                required
                                                placeholder="owner@example.com"
                                                className="input-field pl-14"
                                                value={formData.ownerEmail}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Vault Security ID</label>
                                        <div className="relative group">
                                            <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors" size={20} />
                                            <input
                                                type="text"
                                                name="claimCode"
                                                required
                                                placeholder="XXX-XXX-XXX"
                                                className="input-field pl-14 uppercase tracking-widest"
                                                value={formData.claimCode}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold"
                                        >
                                            <AlertCircle size={18} />
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-[var(--primary)] text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                <span>Initiate Recovery</span>
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 font-black text-2xl">
                                        <Smartphone size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Identity Check</h2>
                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                                        A secure 6-digit pulse has been sent to your registered contact point.
                                    </p>
                                </div>

                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            className="w-12 h-16 bg-[var(--surface-glass)] border-2 border-[var(--border)] rounded-2xl text-center text-2xl font-black text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <button
                                        onClick={verifyOtp}
                                        disabled={loading || otp.some(d => !d)}
                                        className="w-full py-4 bg-[var(--primary)] text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                <span>Validate Pulse</span>
                                                <CheckCircle2 size={20} />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full py-4 text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        Back to Credentials
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 12 }}
                                    >
                                        <CheckCircle2 size={48} className="text-emerald-500" />
                                    </motion.div>
                                </div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Access Granted</h2>
                                <p className="text-[var(--text-secondary)] font-medium max-w-sm mx-auto">
                                    Identity confirmed. The succession protocol is now active. Decrypting vault assets...
                                </p>
                                <div className="pt-4">
                                    <Loader2 className="animate-spin text-[var(--primary)] mx-auto" size={32} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ManualClaimModal;
