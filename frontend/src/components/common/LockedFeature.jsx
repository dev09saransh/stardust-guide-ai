import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LockedFeature = ({ children, message = 'Sign up to unlock this feature', className = '' }) => {
    const { isAuthenticated, openAuthModal } = useAuth();

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className={`relative group ${className}`}>
            {/* Blurred content behind */}
            <div className="pointer-events-none select-none filter blur-[6px] opacity-40">
                {children}
            </div>

            {/* Lock Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer rounded-[2rem] z-10"
                onClick={() => openAuthModal('signup')}
            >
                {/* Glass background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-app)]/60 via-[var(--bg-app)]/40 to-[var(--bg-app)]/60 backdrop-blur-[2px] rounded-[2rem] border border-[var(--border)]/50" />

                {/* Lock Icon & Text */}
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10"
                    >
                        <Lock size={24} className="text-[var(--primary)]" />
                    </motion.div>

                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                        🔒 {message}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                        Click to get started
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LockedFeature;
