import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, MoreVertical, Download, Eye, Trash2, Calendar, HardDrive, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const DocumentGallery = ({ assets, viewMode, onRefresh }) => {
    const [selectedAsset, setSelectedAsset] = useState(null);

    const handleDelete = async (assetId, filename) => {
        if (!window.confirm('Are you sure you want to permanently delete this document from S3?')) return;
        try {
            const token = localStorage.getItem('stardust_token');
            // Delete from S3 via upload API
            await axios.delete(`${API}/uploads/${filename}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Delete asset metadata from DB (handled by asset API or combined)
            await axios.delete(`${API}/assets/${assetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
        } catch (error) {
            console.error('Delete Error:', error);
            alert('Failed to delete asset.');
        }
    };

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center text-indigo-500/20 mb-6 border border-[var(--border)]">
                    <HardDrive size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] opacity-40">No Documents</h3>
                <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest mt-2 opacity-30">None found</p>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50 border-b border-[var(--border)]">
                    <div className="col-span-6">Document Name</div>
                    <div className="col-span-3 text-center">Date</div>
                    <div className="col-span-2 text-center">Type</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
                {assets.map((asset) => (
                    <div key={asset.asset_id} className="group grid grid-cols-12 gap-4 items-center px-6 py-4 bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface)] hover:border-indigo-500/30 transition-all shadow-sm">
                        <div className="col-span-6 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{asset.asset_name}</h4>
                                <p className="text-[10px] font-medium text-[var(--text-secondary)] opacity-50 truncate">{asset.metadata?.uploadedFile?.originalname || 'S3 Object'}</p>
                            </div>
                        </div>
                        <div className="col-span-3 text-center text-[11px] font-medium text-[var(--text-secondary)]">
                            {new Date(asset.created_at).toLocaleDateString()}
                        </div>
                        <div className="col-span-2 text-center">
                            <span className="px-2 py-1 rounded-lg bg-[var(--surface)] text-[9px] font-bold uppercase text-indigo-500 border border-[var(--border)]">{asset.asset_type.split('/').pop() || 'DOC'}</span>
                        </div>
                        <div className="col-span-1 flex justify-end gap-2">
                            <a 
                                href={`${API}/uploads/${asset.metadata?.uploadedFile?.filename}?token=${localStorage.getItem('stardust_token')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 text-[var(--text-secondary)] hover:text-indigo-600 transition-all bg-[var(--surface)] rounded-lg border border-[var(--border)]"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8">
            {assets.map((asset) => (
                <div key={asset.asset_id} className="group relative bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl overflow-hidden hover:translate-y-[-4px] hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300">
                    {/* Preview / Icon Area */}
                    <div className="aspect-[4/3] bg-black/5 flex items-center justify-center relative overflow-hidden">
                        {asset.asset_type.startsWith('image/') ? (
                            <img 
                                src={`${API}/uploads/${asset.metadata?.uploadedFile?.filename}?token=${localStorage.getItem('stardust_token')}`} 
                                alt={asset.asset_name}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <FileText size={64} strokeWidth={1} className="text-[var(--text-secondary)] opacity-20 group-hover:text-indigo-500/40 transition-all" />
                        )}
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                            <a 
                                href={`${API}/uploads/${asset.metadata?.uploadedFile?.filename}?token=${localStorage.getItem('stardust_token')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                            >
                                <Eye size={18} />
                            </a>
                            <button 
                                onClick={() => handleDelete(asset.asset_id, asset.metadata?.uploadedFile?.filename)}
                                className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Metadata Area */}
                    <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="min-w-0 flex-1 pr-2">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate leading-none mb-2">{asset.asset_name}</h4>
                                <p className="text-[9px] font-bold text-indigo-500/60 uppercase tracking-widest">{asset.asset_type.split('/').pop() || 'DOCUMENT'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] group-hover:text-indigo-500 transition-colors">
                                <Download size={14} />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[var(--text-secondary)]">
                                <Calendar size={12} className="opacity-40" />
                                {new Date(asset.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                Safe
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DocumentGallery;
