import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, X, Check, RotateCcw, Image, Type, Save, Loader2, Sparkles, Sliders, Plus } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const CameraModule = ({ user, onClose, onComplete }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [step, setStep] = useState('capture'); // 'capture', 'crop', 'edit', 'upload'
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [filter, setFilter] = useState('none');
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const isSecure = window.isSecureContext;

    const capture = useCallback(() => {
        if (cameraError) return;
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) throw new Error("Could not capture frame");
            setImgSrc(imageSrc);
            setStep('crop');
        } catch (err) {
            setCameraError("Capture failed. Please try again.");
        }
    }, [webcamRef, cameraError]);

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 4 / 3, width, height),
            width,
            height
        );
        setCrop(crop);
    };

    const applyFilter = (f) => setFilter(f);

    const getFilterStyle = () => {
        switch (filter) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(100%)';
            case 'high-contrast': return 'contrast(150%) brightness(110%)';
            case 'vibrant': return 'saturate(200%)';
            default: return 'none';
        }
    };

    const handleUpload = async () => {
        if (!imgSrc) return;
        setUploading(true);
        
        try {
            // First, we need to convert the base64/blob to a file after cropping and filtering
            // For now, I'll send the raw captured/cropped as a blob
            const response = await fetch(imgSrc);
            const blob = await response.blob();
            const file = new File([blob], `${title || 'scanned-doc'}.jpg`, { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'legal-documents');

            const token = user?.token || localStorage.getItem('stardust_token');
            console.log('[CAMERA UPLOAD] Using token:', token ? `${token.substring(0, 10)}...` : 'MISSING');
            await axios.post(`${API}/uploads`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (onComplete) onComplete();
        } catch (error) {
            console.error('S3 Camera Upload Error:', error);
            alert('Failed to save to S3. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-5xl bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Viewport Area */}
                    <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
                        {!isSecure ? (
                            <div className="absolute inset-0 z-50 bg-[var(--surface)] flex flex-col items-center justify-center p-8 text-center bg-red-500/5">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                                    <X size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Camera Blocked</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    The camera needs a secure connection (HTTPS) to work.
                                </p>
                                <button onClick={onClose} className="btn-secondary px-8">Dismiss</button>
                            </div>
                        ) : (
                            <>
                                {step === 'capture' && (
                                    <div className="w-full h-full relative">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={{ facingMode: "environment" }}
                                            className="w-full h-full object-cover opacity-80"
                                            onUserMediaError={(err) => setCameraError(err.message || "Camera access denied.")}
                                        />
                                        <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-[2rem] m-12 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
                                        </div>
                                        {cameraError && (
                                            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center text-white">
                                                <Camera size={40} className="text-red-500 mb-4" />
                                                <h4 className="text-lg font-bold mb-2">Camera Error</h4>
                                                <p className="text-xs opacity-60 mb-6 max-w-xs">{cameraError}</p>
                                                <button onClick={() => window.location.reload()} className="btn-primary py-2 px-6">Retry</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 'crop' && imgSrc && (
                                    <div className="w-full h-full flex items-center justify-center p-8">
                                        <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                                            <img src={imgSrc} onLoad={onImageLoad} alt="Capture" className="max-h-[60vh] rounded-xl" />
                                        </ReactCrop>
                                    </div>
                                )}

                                {(step === 'edit' || step === 'upload') && imgSrc && (
                                    <div className="w-full h-full flex items-center justify-center p-8">
                                        <img 
                                            src={imgSrc} 
                                            style={{ filter: getFilterStyle() }} 
                                            className="max-h-[60vh] rounded-2xl shadow-2xl transition-all" 
                                            alt="Filtered" 
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sidebar Controls */}
                    <div className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-l border-[var(--border)] bg-[var(--surface)]">
                        <div className="p-8 border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Scanner</h2>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-60">
                                        Step {step === 'capture' ? 1 : step === 'crop' ? 2 : 3}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-app)] rounded-xl text-[var(--text-secondary)] transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            {step === 'capture' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                        <p className="text-xs font-medium text-indigo-500/80 leading-relaxed">
                                            Center the document in the frame.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={capture}
                                        className="btn-primary w-full h-16 rounded-2xl gap-3 shadow-indigo-500/20"
                                    >
                                        <Camera size={20} />
                                        <span className="uppercase tracking-widest text-xs">Take Picture</span>
                                    </button>
                                </div>
                            )}

                            {step === 'crop' && (
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Check Edges</h4>
                                    <button 
                                        onClick={() => setStep('edit')}
                                        className="btn-primary w-full h-14 rounded-2xl gap-3"
                                    >
                                        <Check size={18} />
                                        <span className="uppercase tracking-widest text-xs">Next</span>
                                    </button>
                                    <button onClick={() => setStep('capture')} className="btn-secondary w-full py-4 text-[10px] uppercase tracking-widest">
                                        <RotateCcw size={14} className="mr-2" /> Retake
                                    </button>
                                </div>
                            )}

                            {(step === 'edit' || step === 'upload') && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Filters</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['none', 'grayscale', 'sepia', 'vibrant'].map(f => (
                                                <button 
                                                    key={f} 
                                                    onClick={() => setFilter(f)}
                                                    className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase border transition-all ${filter === f ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border)]'}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Document Title</label>
                                        <input 
                                            type="text" 
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Identity Document"
                                            className="input-field py-3 text-sm font-bold"
                                        />
                                    </div>

                                    <button 
                                        onClick={handleUpload}
                                        disabled={uploading || !title}
                                        className="btn-primary w-full h-16 rounded-2xl gap-3 shadow-emerald-500/20"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                        <span className="uppercase tracking-widest text-xs">{uploading ? 'Saving...' : 'Save'}</span>
                                    </button>

                                    <button onClick={() => setStep('crop')} className="btn-secondary w-full py-4 text-[10px] uppercase tracking-widest">
                                        <RotateCcw size={14} className="mr-2" /> Back
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-[var(--border)] flex items-center justify-center gap-2">
                            <Sparkles size={14} className="text-indigo-500 opacity-40" />
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-40">Secure Storage</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CameraModule;
