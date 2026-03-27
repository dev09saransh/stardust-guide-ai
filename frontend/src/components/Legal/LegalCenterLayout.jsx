import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Search, SlidersHorizontal, Plus, FileText } from 'lucide-react';
import DocumentUploadZone from './DocumentUploadZone';
import CameraModule from './CameraModule';
import DocumentGallery from './DocumentGallery';

const LegalCenterLayout = ({ user, assets, onRefresh }) => {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showCamera, setShowCamera] = useState(false);

    const filteredAssets = assets
        .filter(asset => 
            asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'name') return a.asset_name.localeCompare(b.asset_name);
            return 0;
        });

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-[var(--bg-app)] text-[var(--text-primary)] font-sans overflow-hidden">
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-6 p-6">
                
                {/* Left Column: Capture & Archive */}
                <div className="w-full md:w-80 lg:w-96 flex flex-col gap-6 shrink-0">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">All Documents</h1>
                                <p className="text-sm font-medium text-[var(--text-secondary)] opacity-60">Scan and save your documents safely.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={() => setShowCamera(true)}
                                className="w-full group relative aspect-[16/9] rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center gap-3 shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] overflow-hidden"
                            >
                                <Plus size={24} />
                                <div className="text-center">
                                    <p className="text-sm font-bold">Open Camera</p>
                                    <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Scanner</p>
                                </div>
                            </button>
                            
                            <DocumentUploadZone user={user} onComplete={onRefresh} />
                        </div>
                    </div>

                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/50 mb-4 flex items-center gap-2">
                            <Plus size={12} className="text-indigo-500" />
                            Secure Storage
                        </h4>
                        <div className="flex items-center justify-between mb-3 text-[11px] font-bold">
                            <span className="text-[var(--text-primary)]">AWS S3 Cloud</span>
                            <span className="text-emerald-500 uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Active</span>
                        </div>
                        <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-indigo-500" />
                        </div>
                        <p className="text-[9px] font-medium text-[var(--text-secondary)] mt-3 leading-tight">
                            Your documents are encrypted and stored in the AP-SOUTH-1 region.
                        </p>
                    </div>
                </div>

                {/* Right Column: Gallery & Search */}
                <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                            <input 
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-[var(--bg-app)] p-1 rounded-xl border border-[var(--border)]">
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--surface)] text-indigo-600 shadow-sm' : 'text-[var(--text-secondary)]'}`}>
                                    <LayoutGrid size={16} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--surface)] text-indigo-600 shadow-sm' : 'text-[var(--text-secondary)]'}`}>
                                    <List size={16} />
                                </button>
                            </div>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-primary)] text-[11px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <DocumentGallery 
                            assets={filteredAssets} 
                            viewMode={viewMode} 
                            onRefresh={onRefresh} 
                        />
                    </div>
                </div>
            </div>

            {showCamera && (
                <CameraModule 
                    user={user} 
                    onClose={() => setShowCamera(false)} 
                    onComplete={() => {
                        setShowCamera(false);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
};

export default LegalCenterLayout;
