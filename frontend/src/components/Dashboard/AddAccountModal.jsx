import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X, UserPlus, Shield, CheckCircle, AlertCircle, ChevronRight, Lock } from 'lucide-react';

const AddAccountModal = ({ isOpen, onClose, onAccountAdded }) => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Select, 2: Security Code
    const [selectedNominee, setSelectedNominee] = useState(null);
    const [securityCode, setSecurityCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchOpportunities();
        }
    }, [isOpen]);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('stardust_token');
            const res = await axios.get('http://16.170.248.196:5001/api/auth/nominee-opportunities', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpportunities(res.data);
        } catch (err) {
            console.error('Error fetching opportunities:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLink = async () => {
        try {
            setVerifying(true);
            setError('');
            const token = localStorage.getItem('stardust_token');
            await axios.post('http://16.170.248.196:5001/api/auth/link-account', {
                nomineeId: selectedNominee.nominee_id,
                securityCode: securityCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onAccountAdded(selectedNominee);
            setStep(3); // Success step
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid security code. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[var(--surface)] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight italic">ASSOCIATE VAULT</h2>
                            <p className="text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Manual Account Linking</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors rounded-xl bg-white/5">
                            <X size={20} />
                        </button>
                    </div>

                    {step === 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p className="text-sm text-white/70 mb-6 font-medium leading-relaxed">
                                Stardust has identified the following vaults where you are a designated nominee. Select a vault to begin association.
                            </p>

                            {loading ? (
                                <div className="py-20 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                </div>
                            ) : opportunities.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {opportunities.map((opp) => (
                                        <button
                                            key={opp.nominee_id}
                                            onClick={() => { setSelectedNominee(opp); setStep(2); }}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{opp.full_name}</p>
                                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{opp.email}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest">No associations found.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Shield size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Target Vault</p>
                                    <p className="text-sm font-bold text-white">{selectedNominee.full_name}</p>
                                </div>
                                <button onClick={() => setStep(1)} className="text-[10px] text-white/30 font-bold hover:text-white transition-colors uppercase">Change</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 block ml-1">Vault Security Code</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                        <input
                                            type="text"
                                            placeholder="STARDUST-XXXX-XXXX"
                                            value={securityCode}
                                            onChange={(e) => setSecurityCode(e.target.value.toUpperCase())}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 transition-all font-mono text-sm tracking-wider uppercase text-white placeholder:text-white/20"
                                        />
                                    </div>
                                </div>

                                {error ? (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-white/30 leading-relaxed font-medium italic ml-1">
                                        This code was provided by the vault owner at the time of account creation.
                                    </p>
                                )}

                                <button
                                    onClick={handleLink}
                                    disabled={!securityCode || verifying}
                                    className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-2"
                                >
                                    {verifying ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            <span>Link Account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">VAULT LINKED</h3>
                            <p className="text-sm text-white/50 font-medium leading-relaxed mb-8">
                                {selectedNominee.full_name}'s vault is now accessible via your account switcher. You have view-only permissions.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                            >
                                Enter Vault
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AddAccountModal;
