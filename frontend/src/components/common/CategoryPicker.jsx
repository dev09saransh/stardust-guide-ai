import React from 'react';
import {
    Building,
    Home,
    TrendingUp,
    Car,
    Gem,
    CreditCard,
    Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
    { id: 'Property', label: 'Real Estate', icon: <Home />, description: 'Residential and commercial properties', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'Bank Account', label: 'Bank Account', icon: <Building />, description: 'Savings, current, and global accounts', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'Credit Card', label: 'Credit Card', icon: <CreditCard />, description: 'Cards and credit metadata', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'Investment', label: 'Equity / Stocks', icon: <TrendingUp />, description: 'Shares, mutual funds, and crypto', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'Vehicle', label: 'Vehicle', icon: <Car />, description: 'Cars, bikes, and other transports', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'Collectible', label: 'Valuables', icon: <Gem />, description: 'Watches, jewelry, and art', color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

const CategoryPicker = ({ onSelect, onCancel }) => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Select Asset Type</h1>
                <p className="text-[var(--text-secondary)] mt-1 font-medium">Choose a category to register in your secure vault.</p>
            </div>
            <button
                onClick={onCancel}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] transition-all"
            >
                Back to List
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
                <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => onSelect(cat.id)}
                    className="card glass p-8 text-left group hover:border-[var(--primary)] hover:shadow-xl transition-all border border-[var(--border)]"
                >
                    <div className={`w-14 h-14 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-[var(--border)] group-hover:scale-110 transition-transform`}>
                        {React.cloneElement(cat.icon, { size: 28 })}
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{cat.label}</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-6">{cat.description}</p>
                    <div className="flex items-center text-[var(--primary)] text-[11px] font-bold uppercase tracking-widest">
                        <Plus size={14} className="mr-2" />
                        Continue to Form
                    </div>
                </motion.button>
            ))}
        </div>
    </div>
);

export default CategoryPicker;
