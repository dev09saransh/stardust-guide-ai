import React, { useState, useCallback, useEffect } from 'react';
import {
    Users,
    ShieldAlert,
    Activity,
    Search,
    AlertTriangle,
    FileSearch,
    Mail,
    ShieldCheck,
    ArrowRight,
    RefreshCw,
    MessageSquare,
    Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const AdminPanel = ({ user, onBackToApp }) => {
    const { showToast } = useAuth();
    const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total_users: 0, total_customers: 0, total_assets: 0, recent_signups: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successionRequests, setSuccessionRequests] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);

    const fetchFeedbacks = useCallback(async () => {
        const activeToken = user?.token || localStorage.getItem('stardust_token');
        setLoading(true);
        try {
            const res = await axios.get(`${API}/feedback/admin`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            setFeedbacks(res.data);
            setError('');
        } catch (err) {
            setError(`Failed to fetch feedbacks: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    const handleExportExcel = () => {
        if (feedbacks.length === 0) {
            showToast('No feedback data to export', 'error');
            return;
        }

        const dataToExport = feedbacks.map(f => ({
            'Feedback ID': f.id,
            'User ID': f.user_id,
            'Name': f.full_name,
            'Email': f.email,
            'Mobile': f.mobile,
            'Q1: Overall Exp': f.q1_rating,
            'Q2: Navigation': f.q2_rating,
            'Q3: Design': f.q3_rating,
            'Q4: Safety': f.q4_rating,
            'Q5: Features': f.q5_rating,
            'Additional Comments': f.text_feedback,
            'Submitted At': new Date(f.created_at).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Customer Feedbacks");
        XLSX.writeFile(wb, `Stardust_Feedback_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
        showToast('Feedback exported successfully', 'success');
    };

    const fetchUsers = useCallback(async () => {
        const activeToken = user?.token || localStorage.getItem('stardust_token');
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/users`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            setUsers(res.data);
            setError('');
        } catch (err) {
            setError(`Repository Access Denied: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    const fetchStats = useCallback(async () => {
        const activeToken = user?.token || localStorage.getItem('stardust_token');
        if (!activeToken) {
            setError('Cloud Session Expired. Please re-authenticate.');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/stats`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            setStats(res.data);
            setError('');
        } catch (err) {
            setError(`Sync Failure: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    const fetchSuccessions = useCallback(async () => {
        const activeToken = user?.token || localStorage.getItem('stardust_token');
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/successions/pending`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            setSuccessionRequests(res.data);
        } catch (err) {
            setError('Failed to fetch succession repository.');
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        if (activeAdminTab === 'users') fetchUsers();
        if (activeAdminTab === 'dashboard') fetchStats();
        if (activeAdminTab === 'successions') fetchSuccessions();
        if (activeAdminTab === 'feedback') fetchFeedbacks();
    }, [activeAdminTab, fetchUsers, fetchStats, fetchSuccessions, fetchFeedbacks]);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this user and all their vault assets?')) return;
        const activeToken = user?.token || localStorage.getItem('stardust_token');
        try {
            await axios.delete(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            fetchUsers();
            fetchStats();
            showToast('User purged successfully from vault.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
        }
    };

    const handleSuccessionAction = async (requestId, action) => {
        const activeToken = user?.token || localStorage.getItem('stardust_token');
        try {
            await axios.post(`${API}/admin/successions/handle`, {
                requestId,
                action
            }, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            showToast(`Succession request ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`, 'success');
            fetchSuccessions();
        } catch (err) {
            showToast('Failed to process request', 'error');
        }
    };

    const renderAdminContent = () => {
        switch (activeAdminTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
                            <button onClick={fetchStats} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center">
                                {loading && <RefreshCw size={12} className="animate-spin mr-2" />}
                                Refresh Live Data
                            </button>
                        </div>
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6 flex items-center space-x-3">
                                <AlertTriangle className="text-red-500" size={18} />
                                <p className="text-xs font-bold text-red-600">{error}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <button onClick={() => setActiveAdminTab('users')} className="card p-6 border-l-4 border-l-blue-500 text-left hover:bg-blue-50/50 transition-all group">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Identified Customers</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total_customers}</p>
                            </button>
                            <div className="card p-6 border-l-4 border-l-purple-500">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Secured Assets</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total_assets}</p>
                            </div>
                            <div className="card p-6 border-l-4 border-l-emerald-500">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">System Health</p>
                                <p className="text-3xl font-bold text-emerald-600 uppercase tracking-tighter">Verified_Link</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="card p-6 bg-slate-900 border-none shadow-2xl">
                                <h3 className="font-bold text-white mb-6 flex items-center uppercase tracking-widest text-xs">
                                    <Activity className="text-blue-500 mr-2" size={16} /> Latest Onboardings
                                </h3>
                                <div className="space-y-3">
                                    {stats.recent_signups.length > 0 ? stats.recent_signups.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">{s.name.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{s.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{s.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{new Date(s.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 italic">No recent activity</p>}
                                </div>
                            </div>
                            <div className="card p-6">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                                    <ShieldAlert className="text-red-500 mr-2" size={18} /> Security Monitoring
                                </h3>
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-xs text-red-600 font-bold italic">No active threats detected.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'users': {
                const filteredUsers = users.filter(u =>
                    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.id.toString() === searchTerm) &&
                    (filterRole === 'ALL' || u.role === filterRole)
                );
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Repository</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Found {filteredUsers.length} records</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text" placeholder="Search..."
                                        className="bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none w-64 shadow-sm"
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select className="bg-white border border-gray-200 rounded-xl py-2 px-4 text-xs outline-none shadow-sm"
                                    value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                    <option value="ALL">All Roles</option>
                                    <option value="CUSTOMER">Customers Only</option>
                                    <option value="ADMIN">Administrators</option>
                                </select>
                            </div>
                        </div>
                        <div className="card overflow-hidden border-none shadow-xl">
                            <table className="w-full text-left">
                                <thead className="bg-[#1a1a1a] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Status</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Identity</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Contact Nodes</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Vault Assets</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${u.role === 'ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span className="text-[10px] font-bold uppercase text-gray-400">Active</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{u.name}</span>
                                                        <span className="text-[9px] font-mono text-gray-400">ID-{u.id} | {u.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <p className="flex items-center space-x-2">
                                                    <Mail size={12} className="text-gray-400" /> <span>{u.email}</span>
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-900">{u.asset_count} Objects</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                                                    <AlertTriangle size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            case 'successions':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Succession Claim Center</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pending Identity & Proof Verification</p>
                            </div>
                            <button onClick={fetchSuccessions} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                                <RefreshCw size={16} />
                            </button>
                        </div>
                        {successionRequests.length === 0 ? (
                            <div className="card py-20 bg-gray-50 border-dashed border-2 flex flex-col items-center justify-center text-center">
                                <ShieldCheck size={48} className="text-gray-200 mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No pending claims detected</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {successionRequests.map((req) => (
                                    <div key={req.request_id} className="card bg-white p-6 shadow-xl flex flex-col md:flex-row items-center gap-6 group hover:ring-2 hover:ring-blue-500/20 transition-all">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Users size={20} /></div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">{req.nominee_name}</h3>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Claimant</p>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-gray-300" />
                                                <div className="text-right">
                                                    <h3 className="text-sm font-bold text-gray-900">{req.owner_name}</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Vault</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Claim Reason</p>
                                                <p className="text-xs text-gray-700 leading-relaxed font-medium">{req.reason || 'Transition Protocol Triggered'}</p>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-64 flex flex-col gap-3">
                                            <a href={`${API.replace('/api', '')}${req.proof_url}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-slate-900 text-white rounded-xl flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-widest">
                                                <FileSearch size={16} /> <span>Review Evidence</span>
                                            </a>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSuccessionAction(req.request_id, 'APPROVE')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Approve</button>
                                                <button onClick={() => handleSuccessionAction(req.request_id, 'REJECT')} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Reject</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'feedback':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Feedback</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Found {feedbacks.length} responses</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={handleExportExcel} className="p-2 px-4 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center shadow-sm">
                                    <Download size={14} className="mr-2" /> Download Excel
                                </button>
                                <button onClick={fetchFeedbacks} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:text-blue-600 transition-all font-bold">
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
                                <p className="text-xs font-bold text-red-600">{error}</p>
                            </div>
                        )}
                        {feedbacks.length === 0 && !loading ? (
                            <div className="card py-20 bg-gray-50 border-dashed border-2 flex flex-col items-center justify-center text-center">
                                <MessageSquare size={48} className="text-gray-200 mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No feedback received yet</p>
                            </div>
                        ) : (
                            <div className="card overflow-hidden border-none shadow-xl">
                                <table className="w-full text-left">
                                    <thead className="bg-[#1a1a1a] text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Customer</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Overall</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60">Features</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60 w-1/3">Comments</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest opacity-60 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {feedbacks.map(f => (
                                            <tr key={f.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                            {f.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-900">{f.full_name}</span>
                                                            <span className="text-[9px] font-mono text-gray-400">{f.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-1 text-amber-500">
                                                        <span className="text-sm font-bold text-gray-900 mr-2">{f.q1_rating}/5</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-1 text-amber-500">
                                                        <span className="text-sm font-bold text-gray-900 mr-2">{f.q5_rating}/5</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-600 font-medium truncate max-w-xs" title={f.text_feedback}>
                                                        {f.text_feedback || <span className="text-gray-400 italic">No comments</span>}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {new Date(f.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <p className="text-gray-400 italic font-bold uppercase tracking-widest text-xs">Sector Restricted</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
            <aside className="w-64 bg-slate-900 text-gray-300 flex flex-col p-6 space-y-8">
                <div className="flex items-center space-x-3 text-white">
                    <ShieldAlert size={24} className="text-red-500" />
                    <span className="text-xl font-bold tracking-tight uppercase">Admin OS</span>
                </div>
                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Monitor Dashboard', icon: <Activity size={18} /> },
                        { id: 'users', label: 'User Directory', icon: <Users size={18} /> },
                        { id: 'successions', label: 'Succession Claims', icon: <ShieldAlert size={18} /> },
                        { id: 'feedback', label: 'Customer Feedback', icon: <MessageSquare size={18} /> },
                        { id: 'audit', label: 'System Logs', icon: <FileSearch size={18} /> },
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveAdminTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeAdminTab === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'hover:bg-slate-800'}`}>
                            {item.icon} <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <button onClick={onBackToApp} className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-950/50 transition-all">
                    Terminate Session
                </button>
            </aside>
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Restricted Sector</p>
                            <h1 className="text-sm font-bold text-gray-500 uppercase">Verified Administrator Node</h1>
                        </div>
                    </div>
                </header>
                {renderAdminContent()}
            </main>
        </div>
    );
};

export default AdminPanel;
