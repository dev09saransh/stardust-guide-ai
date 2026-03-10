import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileText, Eye, Trash2, RefreshCw } from 'lucide-react';

export const FormLayoutWrapper = ({ title, description, children, onSave, onCancel, isSaving, disableSave, shake, glow }) => (
    <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto space-y-8 pb-20"
    >
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{title}</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">{description}</p>
            </div>
            <div className="flex space-x-3">
                <motion.button
                    animate={glow ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                            "0 0 0px rgba(239, 68, 68, 0)",
                            "0 0 20px rgba(239, 68, 68, 0.4)",
                            "0 0 0px rgba(239, 68, 68, 0)"
                        ]
                    } : {}}
                    transition={{ repeat: glow ? Infinity : 0, duration: 1.5 }}
                    onClick={onCancel}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${glow ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                >
                    Cancel
                </motion.button>
                <motion.button
                    animate={glow ? {
                        scale: [1, 1.05, 1],
                        boxShadow: [
                            "0 0 0px rgba(59, 130, 246, 0)",
                            "0 0 30px rgba(59, 130, 246, 0.6)",
                            "0 0 0px rgba(59, 130, 246, 0)"
                        ]
                    } : {}}
                    transition={{ repeat: glow ? Infinity : 0, duration: 1.5 }}
                    onClick={onSave}
                    disabled={isSaving || disableSave}
                    className={`btn-primary px-8 py-2.5 ${(isSaving || disableSave) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSaving ? 'Processing...' : 'Save Vault Entry'}
                </motion.button>
            </div>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </motion.div >
);

export const UploadComponent = ({ label, file, onUpload, onRemove, onView, uploading, existingFile }) => {
    const inputRef = useRef(null);

    const handleClick = () => {
        if (inputRef.current) inputRef.current.click();
    };

    const displayFile = file || existingFile;

    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">{label}</label>}
            {!displayFile ? (
                <div
                    onClick={handleClick}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-[var(--primary)]/50 hover:bg-white/[0.02] transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--primary)] group-hover:bg-white/10 mb-3 transition-all">
                        {uploading ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
                    </div>
                    <p className="text-sm font-bold text-white">{uploading ? 'Uploading...' : 'Click or drag to upload'}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-widest font-bold opacity-50">PDF, JPEG or PNG (Max 5MB)</p>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files[0]) onUpload(e.target.files[0]);
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-[var(--primary)]/10 rounded-2xl border border-[var(--primary)]/20">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                            <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{displayFile.originalname || displayFile.name}</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                {existingFile && !file ? 'Stored in vault' : 'Ready for upload'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                        {onView && existingFile && (
                            <button
                                type="button"
                                onClick={onView}
                                className="p-2 text-[var(--primary)] hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5"
                                title="View file"
                            >
                                <Eye size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (onRemove) onRemove();
                                if (inputRef.current) inputRef.current.value = '';
                            }}
                            className="p-2 text-[var(--text-secondary)] hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                            title="Remove file"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClick}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors rounded-lg hover:bg-white/5"
                            title="Replace file"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files[0]) onUpload(e.target.files[0]);
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                    </div>
                </div>
            )}
            <p className="text-[10px] text-[var(--text-secondary)] mt-2 flex items-center font-medium opacity-60">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                End-to-end encrypted protocol active
            </p>
        </div>
    );
};
