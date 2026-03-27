import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const DocumentUploadZone = ({ user, onComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        
        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'legal-documents');

        setUploading(true);
        setStatus(null);
        setProgress(0);

        try {
            const token = user?.token || localStorage.getItem('stardust_token');
            console.log('[UPLOAD] Using token:', token ? `${token.substring(0, 10)}...` : 'MISSING');
            await axios.post(`${API}/uploads`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            setStatus('success');
            setTimeout(() => {
                setStatus(null);
                setUploading(false);
                if (onComplete) onComplete();
            }, 2000);
        } catch (error) {
            console.error('Upload Error:', error);
            setStatus('error');
            setTimeout(() => setStatus(null), 3000);
        } finally {
            if (status !== 'success') setUploading(false);
        }
    }, [user, onComplete, status]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        multiple: false
    });

    return (
        <div className="space-y-4">
            <div 
                {...getRootProps()} 
                className={`relative group cursor-pointer h-[180px] rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center overflow-hidden
                    ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-[var(--border)] bg-[var(--bg-app)] hover:bg-[var(--surface)] hover:border-indigo-500/30'}`}
            >
                <input {...getInputProps()} />
                
                {uploading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-12 h-12">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[var(--text-primary)]">{progress}%</span>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Saving...</span>
                    </div>
                ) : status === 'success' ? (
                    <div className="flex flex-col items-center space-y-2 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Saved</span>
                    </div>
                ) : status === 'error' ? (
                    <div className="flex flex-col items-center space-y-2 text-red-500">
                        <AlertTriangle className="w-12 h-12" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Failed</span>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                            <Upload size={24} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] transition-colors">
                            {isDragActive ? "Drop files" : "Upload"}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] mt-1 uppercase tracking-widest opacity-40">Files up to 10MB</span>
                    </>
                )}
                
                {/* Visual Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 transition-all"></div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl">
                <FileText className="text-indigo-500" size={16} />
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Saved Safely</span>
            </div>
        </div>
    );
};

export default DocumentUploadZone;
