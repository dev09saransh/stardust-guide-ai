import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Terminal, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const AdminLoginPage = ({ onLoginSuccess, onBackToWelcome }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API}/auth/login`, {
                identifier: formData.email,
                password: formData.password
            });

            // For admins, OTP is bypassed on backend, so we expect token immediately
            if (response.data.token && response.data.user.role === 'ADMIN') {
                onLoginSuccess(response.data);
            } else if (response.data.user.role !== 'ADMIN') {
                setError('Unauthorized access. This portal is for system administrators only.');
            } else {
                setError('Login failed. Please verify credentials.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Access Denied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)] p-6">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6 shadow-2xl shadow-blue-500/20">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Internal Access</h1>
                    <p className="text-[var(--text-secondary)] font-mono text-sm uppercase tracking-widest">Stardust Financial Operations</p>
                </div>

                <div className="bg-[var(--surface-glass)] backdrop-blur-xl border border-[var(--border)] p-8 rounded-[32px] shadow-2xl relative">
                    {/* Close (X) Button */}
                    <button
                        type="button"
                        onClick={onBackToWelcome}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', padding: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                    >
                        <X size={16} />
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Admin Identifier</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@stardust.com"
                                    className="w-full bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-[var(--text-primary)]"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Master Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-[var(--text-primary)]"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center space-x-3 text-xs font-bold"
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Initialize Session</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col gap-4">
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-600 uppercase tracking-widest px-1">
                            <span>System Status: Optimal</span>
                            <span>v2.4.0-Stable</span>
                        </div>
                        <button
                            onClick={onBackToWelcome}
                            className="w-full py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-bold uppercase tracking-widest"
                        >
                            Back to Landing
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-center items-center space-x-4 text-gray-600">
                    <Terminal size={14} />
                    <span className="text-[10px] font-mono tracking-tighter">SECURE ENV DETECTED - IP LOGGING ACTIVE</span>
                </div>
            </motion.div>
        </div>

    );
};

export default AdminLoginPage;
