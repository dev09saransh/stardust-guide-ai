import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Clock, MapPin, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const LoginAuditTable = ({ mini = false }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('stardust_token');
                const res = await axios.get(`${API}/auth/audit-logs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLogs(mini ? res.data.slice(0, 5) : res.data);
            } catch (err) {
                console.error('Error fetching audit logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [mini]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${mini ? 'p-10' : 'p-20'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={mini ? "" : "card glass overflow-hidden border border-[var(--border)] rounded-2xl bg-[var(--surface-glass)] backdrop-blur-xl"}
        >
            {!mini && (
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)]/20 rounded-lg">
                            <Shield className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Login Audit Trail</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Recent security events and access logs</p>
                        </div>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] italic">
                        Last sync: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--surface-glass)] text-[var(--text-secondary)] text-[9px] uppercase tracking-wider border-b border-[var(--border)]">
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-extrabold uppercase tracking-widest`}>Event</th>
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-extrabold uppercase tracking-widest`}>IP Address</th>
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-extrabold uppercase tracking-widest`}>Device / Browser</th>
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-extrabold uppercase tracking-widest`}>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {logs.length > 0 ? logs.map((log) => (
                            <tr key={log.log_id} className="text-[var(--text-primary)] hover:bg-[var(--surface-glass)] transition-all duration-200">
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.action.includes('SUCCESS') ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`}></div>
                                        <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                                    </div>
                                </td>
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <MapPin className="w-3.5 h-3.5 opacity-50" />
                                        <span className="font-mono text-xs tracking-tight">{log.ip_address}</span>
                                    </div>
                                </td>
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)] max-w-xs">
                                        <Monitor className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                        <span className="text-xs truncate font-medium" title={log.device_info}>{log.device_info}</span>
                                    </div>
                                </td>
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium">
                                        <Clock className="w-3.5 h-3.5 opacity-50" />
                                        {new Date(log.created_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-20 text-center text-[var(--text-secondary)] italic opacity-50">
                                    No login events recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!mini && (
                <div className="p-4 bg-[var(--surface-glass)] border-t border-[var(--border)] flex justify-center">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.2em] font-black opacity-30">End of Audit Trail</p>
                </div>
            )}
        </motion.div>
    );
};

export default LoginAuditTable;
