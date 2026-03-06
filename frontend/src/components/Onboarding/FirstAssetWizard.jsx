import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Building, Shield, FileText, Car, Key, Briefcase,
    ArrowRight, PartyPopper, Sparkles, X
} from 'lucide-react';

const categories = [
    { id: 'Credit Card', label: 'Credit Card', icon: <CreditCard size={24} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'Bank Account', label: 'Bank Account', icon: <Building size={24} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'Insurance', label: 'Insurance', icon: <Shield size={24} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'Password', label: 'Password', icon: <Key size={24} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'Property', label: 'Property', icon: <Building size={24} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'Vehicle', label: 'Vehicle', icon: <Car size={24} />, color: 'text-sky-400', bg: 'bg-sky-500/10' },
];

const FirstAssetWizard = ({ onSelectCategory, onDismiss }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />

            <motion.div
                initial={{ scale: 0.9, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative z-10 w-full max-w-lg bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-2xl shadow-black/40 overflow-hidden"
            >
                {/* Dismiss */}
                <button
                    onClick={onDismiss}
                    className="absolute top-5 right-5 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] rounded-xl transition-all z-20"
                >
                    <X size={18} />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20"
                        >
                            <Sparkles size={28} className="text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                            Add Your First Asset
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
                            Choose a category to get started. It takes less than a minute.
                        </p>
                    </div>

                    {/* Category Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {categories.map((cat, i) => (
                            <motion.button
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 group ${selectedCategory === cat.id
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-blue-500/10'
                                        : 'border-[var(--border)] bg-[var(--surface-glass)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface)]'
                                    }`}
                            >
                                <div className={`${cat.bg} ${cat.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    {cat.icon}
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">{cat.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => selectedCategory && onSelectCategory(selectedCategory)}
                        disabled={!selectedCategory}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${selectedCategory
                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01]'
                                : 'bg-[var(--surface-glass)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed'
                            }`}
                    >
                        <span>Continue</span>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        onClick={onDismiss}
                        className="w-full mt-3 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
                    >
                        I'll do this later
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Celebration Screen ───
export const CelebrationScreen = ({ onContinue }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Confetti Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: '50vw',
                            y: '50vh',
                            scale: 0,
                            rotate: 0,
                        }}
                        animate={{
                            x: `${Math.random() * 100}vw`,
                            y: `${Math.random() * 100}vh`,
                            scale: [0, 1, 0.5],
                            rotate: Math.random() * 720 - 360,
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            delay: Math.random() * 0.5,
                            ease: 'easeOut',
                        }}
                        className="absolute"
                        style={{
                            width: `${8 + Math.random() * 12}px`,
                            height: `${8 + Math.random() * 12}px`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            background: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'][Math.floor(Math.random() * 6)],
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 0.3 }}
                className="relative z-10 w-full max-w-md bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-2xl shadow-black/40 overflow-hidden text-center p-10"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.6, damping: 12 }}
                    className="text-7xl mb-6 inline-block"
                >
                    🎉
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-3xl font-black text-[var(--text-primary)] tracking-tight mb-3"
                >
                    Your first asset is secured!
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="text-[var(--text-secondary)] font-medium mb-8"
                >
                    Congratulations! You've taken the first step toward securing your digital legacy. Your vault is now active.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    onClick={onContinue}
                    className="btn-primary py-4 px-10 text-lg mx-auto"
                >
                    <span>Continue to Dashboard</span>
                    <ArrowRight size={20} />
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default FirstAssetWizard;
