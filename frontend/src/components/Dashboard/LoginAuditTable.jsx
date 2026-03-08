import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Clock, MapPin, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginAuditTable = ({ mini = false }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('stardust_token');
                const res = await axios.get('http://localhost:5001/api/auth/audit-logs', {
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
            className={mini ? "" : "glass-card overflow-hidden border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl"}
        >
            {!mini && (
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Login Audit Trail</h3>
                            <p className="text-sm text-white/50">Recent security events and access logs</p>
                        </div>
                    </div>
                    <div className="text-sm text-white/40 italic">
                        Last sync: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-white/60 text-[9px] uppercase tracking-wider">
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-semibold`}>Event</th>
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-semibold`}>IP Address</th>
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-semibold`}>Device / Browser</th>
                            <th className={`${mini ? 'px-4 py-2' : 'px-6 py-4'} font-semibold`}>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.length > 0 ? logs.map((log) => (
                            <tr key={log.log_id} className="text-white/80 hover:bg-white/5 transition-all duration-200">
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.action.includes('SUCCESS') ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`}></div>
                                        <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                                    </div>
                                </td>
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-2 text-white/70">
                                        <MapPin className="w-3.5 h-3.5 opacity-50" />
                                        <span className="font-mono text-sm tracking-tight">{log.ip_address}</span>
                                    </div>
                                </td>
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-2 text-white/70 max-w-xs">
                                        <Monitor className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                        <span className="text-xs truncate" title={log.device_info}>{log.device_info}</span>
                                    </div>
                                </td>
                                <td className={mini ? 'px-4 py-3' : 'px-6 py-5'}>
                                    <div className="flex items-center gap-2 text-white/50 text-xs">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(log.created_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-20 text-center text-white/30 italic">
                                    No login events recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!mini && (
                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">End of Audit Trail</p>
                </div>
            )}
        </motion.div>
    );
};

export default LoginAuditTable;
