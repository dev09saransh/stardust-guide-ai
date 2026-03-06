import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';

const DataSyncModal = ({ isOpen, onClose, onSyncComplete, userToken, syncCategory = 'Investment' }) => {
    const [step, setStep] = useState('mobile'); // mobile, consent, loading, success, error
    const [mobile, setMobile] = useState('');
    const [consentId, setConsentId] = useState(null);
    const [consentUrl, setConsentUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    const API_BASE = 'http://localhost:5001/api/financial';
    const authHeaders = { Authorization: `Bearer ${userToken}` };

    const handleInitiateSync = async () => {
        const cleaned = mobile.replace(/\D/g, '');
        if (cleaned.length !== 10) {
            setErrorMsg('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsProcessing(true);
        setErrorMsg('');

        try {
            // Focus ONLY on Investment categories for Setu AA
            const res = await axios.post(`${API_BASE}/consent`, {
                pan: cleaned,
                types: ['MUTUAL_FUNDS', 'EQUITIES', 'SIP', 'ETF', 'BONDS', 'NPS']
            }, { headers: authHeaders });

            setConsentId(res.data.id);
            setConsentUrl(res.data.url);
            setStep('consent');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to initiate sync request');
            setStep('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenConsentWindow = () => {
        const win = window.open(consentUrl, '_blank');
        const timer = setInterval(async () => {
            if (win.closed) {
                clearInterval(timer);
                checkConsentStatus();
            }
        }, 1000);
    };

    const checkConsentStatus = async () => {
        setStep('loading');
        try {
            const res = await axios.get(`${API_BASE}/status/${consentId}`, { headers: authHeaders });
            if (res.data.status === 'ACTIVE' || res.data.status === 'APPROVED' || res.data.status === 'SUCCESS') {
                finalizeAASync();
            } else {
                setStep('consent');
                setErrorMsg('Consent not yet approved. Please complete the process in the popup.');
            }
        } catch (err) {
            setErrorMsg('Failed to verify consent status');
            setStep('error');
        }
    };

    const finalizeAASync = async () => {
        setStep('loading');
        try {
            const res = await axios.post(`${API_BASE}/sync`, { consentId }, { headers: authHeaders });
            setResults(res.data.assets.map(a => ({ title: a.title, detail: `Category: ${a.category}` })));
            setStep('success');
            if (onSyncComplete) onSyncComplete();
        } catch (err) {
            setErrorMsg('Failed to fetch data from aggregator');
            setStep('error');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="p-8">
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[var(--surface-glass)] rounded-full transition-colors"><X size={20} /></button>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${step === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                                {step === 'success' ? <CheckCircle size={32} /> : step === 'error' ? <AlertTriangle size={32} /> : <Shield size={32} />}
                            </div>

                            {step === 'mobile' && (
                                <>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-2">Sync Portfolio</h2>
                                    <p className="text-sm text-[var(--text-secondary)] mb-8">Securely fetch your investments via Setu Account Aggregator.</p>
                                    <div className="w-full space-y-4">
                                        <input
                                            type="text"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            placeholder="Enter 10-digit Mobile Number"
                                            className="w-full px-6 py-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-lg font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all placeholder:opacity-30"
                                        />
                                        {errorMsg && <p className="text-xs text-red-500 mt-2 font-bold">{errorMsg}</p>}
                                        <button onClick={handleInitiateSync} disabled={isProcessing} className="w-full btn-primary py-4 rounded-2xl font-black flex items-center justify-center space-x-2">
                                            {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <span>Start Precise Sync</span>}
                                        </button>
                                    </div>
                                </>
                            )}

                            {step === 'consent' && (
                                <>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-2">Approve Access</h2>
                                    <p className="text-sm text-[var(--text-secondary)] mb-8">Click below to open the Setu/Onemoney portal and approve data sharing.</p>
                                    <div className="w-full space-y-3">
                                        <button onClick={handleOpenConsentWindow} className="w-full btn-primary py-4 rounded-2xl font-black text-sm">Authorize via AA Browser</button>
                                        <button onClick={checkConsentStatus} className="w-full py-4 bg-[var(--surface-glass)] text-[var(--text-primary)] border border-[var(--border)] rounded-2xl font-black text-sm">Verify Approval Status</button>
                                    </div>
                                </>
                            )}

                            {step === 'loading' && (
                                <div className="py-12 flex flex-col items-center space-y-6">
                                    <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Fetching Investments...</p>
                                </div>
                            )}

                            {step === 'success' && (
                                <>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-2">Sync Successful!</h2>
                                    <p className="text-sm text-[var(--text-secondary)] mb-8">We found {results.length} investment records.</p>
                                    <div className="w-full max-h-[250px] overflow-y-auto custom-scrollbar space-y-2 mb-8 text-left">
                                        {results.map((r, i) => (
                                            <div key={i} className="p-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl">
                                                <p className="text-sm font-black text-[var(--text-primary)]">{r.title}</p>
                                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{r.detail}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={onClose} className="w-full btn-primary py-4 rounded-2xl font-black">Close & View Vault</button>
                                </>
                            )}

                            {step === 'error' && (
                                <>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-2">Sync Failed</h2>
                                    <p className="text-sm text-red-500 font-bold mb-8">{errorMsg}</p>
                                    <button onClick={() => setStep('mobile')} className="w-full btn-primary py-4 rounded-2xl font-black">Try Again</button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DataSyncModal;
