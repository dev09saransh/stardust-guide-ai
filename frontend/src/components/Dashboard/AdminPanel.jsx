import React, { useState } from 'react';
import {
    Users,
    ShieldAlert,
    Activity,
    Search,
    Lock,
    AlertTriangle,
    FileSearch,
    CheckCircle,
    Clock,
    Mail
} from 'lucide-react';
import { StatusBadge } from '../common/DisplayComponents';
import { VaultToast } from '../common/VaultUI';
import axios from 'axios';

const AdminPanel = ({ user, onBackToApp }) => {
    const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total_users: 0, total_customers: 0, total_assets: 0, recent_signups: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ isVisible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000);
    };

    const fetchUsers = async () => {
        const storedToken = localStorage.getItem('stardust_token');
        const activeToken = user?.token || storedToken;

        console.log('🔄 [ADMIN]: Accessing user repository...');
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5001/api/admin/users', {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            console.log('✅ [ADMIN]: Repository data received:', res.data.length);
            setUsers(res.data);
            setError('');
        } catch (err) {
            console.error('❌ [ADMIN]: Repository access failed:', err.response?.data || err.message);
            setError(`Repository Access Denied: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const storedToken = localStorage.getItem('stardust_token');
        const activeToken = user?.token || storedToken;

        console.log('🔄 [ADMIN]: Syncing stats... Token present:', !!activeToken);

        if (!activeToken) {
            console.error('❌ [ADMIN]: No auth token found in session.');
            setError('Cloud Session Expired. Please re-authenticate.');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5001/api/admin/stats', {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            console.log('✅ [ADMIN]: Stats received:', res.data);
            setStats(res.data);
            setError('');
        } catch (err) {
            console.error('❌ [ADMIN]: Stats fetch failed:', err.response?.data || err.message);
            setError(`Sync Failure: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (activeAdminTab === 'users') fetchUsers();
        if (activeAdminTab === 'dashboard') fetchStats();
    }, [activeAdminTab]);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this user and all their vault assets? This cannot be undone.')) return;

        const storedToken = localStorage.getItem('stardust_token');
        const activeToken = user?.token || storedToken;

        try {
            await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            fetchUsers();
            fetchStats();
            showToast('User purged successfully from vault.', 'success');
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to delete user.';
            showToast(errMsg, 'error');
        }
    };

    const renderAdminContent = () => {
        switch (activeAdminTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
                            <button
                                onClick={fetchStats}
                                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center"
                            >
                                {loading ? <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mr-2" /> : null}
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
                            <button
                                onClick={() => setActiveAdminTab('users')}
                                className="card p-6 border-l-4 border-l-blue-500 text-left hover:bg-blue-50/50 transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Identified Customers</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.total_customers}</p>
                                    </div>
                                    <Users className="text-gray-200 group-hover:text-blue-100 transition-colors" size={32} />
                                </div>
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
                                    <Activity className="text-blue-500 mr-2" size={16} />
                                    Latest Onboardings
                                </h3>
                                <div className="space-y-3">
                                    {stats.recent_signups.length > 0 ? stats.recent_signups.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold ring-1 ring-blue-500/20">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{s.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{s.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{new Date(s.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 italic">No recent customer activity</p>}
                                </div>
                            </div>

                            <div className="card p-6">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                                    <ShieldAlert className="text-red-500 mr-2" size={18} />
                                    Security Monitoring
                                </h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-xs text-red-600 font-bold italic">No active threats detected. Encryption nodes are healthy.</p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-4">Active Database Clusters</p>
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'users': {
                const filteredUsers = users.filter(u => {
                    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.id.toString() === searchTerm;
                    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
                    return matchesSearch && matchesRole;
                });

                return (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Customer Repository</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Found {filteredUsers.length} matched records</p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search SID, Name, or Email..."
                                        className="bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-64 shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="bg-white border border-gray-200 rounded-xl py-2 px-4 text-xs outline-none shadow-sm"
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="CUSTOMER">Customers Only</option>
                                    <option value="ADMIN">Administrators</option>
                                </select>
                                <button
                                    onClick={fetchUsers}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    title="Synchronize Database"
                                >
                                    <Activity size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="card overflow-hidden border-none shadow-xl">
                            <table className="w-full text-left">
                                <thead className="bg-[#1a1a1a] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Status</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Identity & Role</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Contact Nodes</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Vault Assets</th>
                                        <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${u.role === 'ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Active</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{u.name}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-[9px] font-mono text-gray-400">ID-{u.id}</span>
                                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                                {u.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center space-x-2 text-xs text-gray-700">
                                                        <Mail size={12} className="text-gray-400" />
                                                        <span>{u.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                                                        <Activity size={12} className="text-gray-400" />
                                                        <span>{u.mobile}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-900">{u.asset_count} Objects</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase">Onboarded: {new Date(u.joined).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => showToast(`Viewing details for ${u.name}...`, 'success')}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View Vault Details"
                                                    >
                                                        <FileSearch size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Purge User Account"
                                                    >
                                                        <AlertTriangle size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                        <Users className="text-gray-200" size={32} />
                                                    </div>
                                                    <p className="text-gray-400 text-sm italic">No customer records matching your current filter.</p>
                                                    <button onClick={() => { setSearchTerm(''); setFilterRole('ALL'); }} className="mt-4 text-xs font-bold text-blue-600 hover:underline uppercase">Clear Filters</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            default:
                return (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <p className="text-gray-400 italic">This sector is restricted or currently under maintenance.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <aside className="w-64 bg-slate-900 text-gray-300 flex flex-col p-6 space-y-8">
                <div className="flex items-center space-x-3 text-white">
                    <ShieldAlert size={24} className="text-red-500" />
                    <span className="text-xl font-bold tracking-tight uppercase">Admin OS</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Monitor Dashboard', icon: <Activity size={18} /> },
                        { id: 'users', label: 'User Directory', icon: <Users size={18} /> },
                        { id: 'audit', label: 'System Logs', icon: <FileSearch size={18} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveAdminTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeAdminTab === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'hover:bg-slate-800'}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <button
                        onClick={onBackToApp}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-950/50 transition-all"
                    >
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Restricted Access Block</p>
                            <h1 className="text-sm font-bold text-gray-500 underline decoration-red-200 decoration-2">Verified Administrator Identity</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-900">
                                {user?.user?.full_name || user?.user?.name || user?.full_name || 'System Administrator'}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Auth Level: Layer-7</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-300 rounded-xl flex items-center justify-center text-gray-600 font-bold">
                            {user?.user?.full_name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {renderAdminContent()}
            </main>

            <VaultToast
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

export default AdminPanel;
