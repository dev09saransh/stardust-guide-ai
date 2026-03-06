import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, ShieldAlert } from 'lucide-react';

export const VaultConfirm = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-2xl overflow-hidden p-8"
                >
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                            {type === 'danger' ? <ShieldAlert size={40} strokeWidth={1.5} /> : <Info size={40} strokeWidth={1.5} />}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{title}</h3>
                            <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <div className="flex flex-col w-full gap-3 pt-4">
                            <button
                                onClick={onConfirm}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${type === 'danger'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600'
                                        : 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600'
                                    }`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] transition-all"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export const VaultToast = ({ message, type = 'success', isVisible, onClose }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] min-w-[300px]"
                >
                    <div className={`flex items-center space-x-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        <div className="flex-shrink-0">
                            {type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        </div>
                        <p className="flex-1 text-sm font-bold tracking-tight">{message}</p>
                        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
