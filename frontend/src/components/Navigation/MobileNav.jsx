import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, Shield, Settings, Plus } from 'lucide-react';

const MobileNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'assets', label: 'Assets', icon: Wallet },
        { id: 'quick-add', label: 'Add', icon: Plus },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-6 pb-6 pt-2 pointer-events-none">
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="w-full h-[72px] bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-[2rem] shadow-2xl pointer-events-auto flex items-center justify-around px-4"
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center w-12 h-12 transition-colors"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-[var(--primary)]/10 rounded-2xl"
                                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                                />
                            )}
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)'
                                }}
                            >
                                <Icon size={24} />
                            </motion.div>
                            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </motion.nav>
        </div>
    );
};

export default MobileNav;
