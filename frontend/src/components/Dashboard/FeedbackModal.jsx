import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, X, CheckCircle, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const StarRating = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                    <Star
                        size={28}
                        className={`transition-colors duration-200 ${(hover || value) >= star ? 'text-amber-400 fill-amber-400 drop-shadow-md' : 'text-gray-400/30 dark:text-gray-600'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

const FeedbackModal = ({ isOpen, onClose, onSuccess }) => {
    const { user, showToast } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
        q5: 0,
        textFeedback: ''
    });

    const questions = [
        { key: 'q1', text: 'How would you rate your overall experience with our platform?' },
        { key: 'q2', text: 'How easy was it to use the platform and navigate through features?' },
        { key: 'q3', text: 'How would you rate the design and look of the platform?' },
        { key: 'q4', text: 'How confident do you feel about the safety of your data on our platform?' },
        { key: 'q5', text: 'How satisfied are you with features like nominee setup and account access?' }
    ];

    const handleSubmit = async () => {
        // Validate
        if (!feedback.q1 || !feedback.q2 || !feedback.q3 || !feedback.q4 || !feedback.q5) {
            showToast('Please provide a star rating for all questions.', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API}/feedback`, feedback, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            showToast('Thank you for your feedback!', 'success');
            setStep(2); // Show success view
            setTimeout(() => {
                if(onSuccess) onSuccess();
                onClose();
            }, 3000);
        } catch (error) {
            console.error('Feedback error:', error);
            showToast('Failed to submit feedback. Try again later.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--surface-glass)]">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <MessageSquare className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Your Feedback Matters</h2>
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Help us improve Stardust</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-xl hover:bg-[var(--surface-glass)]"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 relative">
                        {step === 1 ? (
                            <div className="space-y-8">
                                <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                                    Congratulations on successfully securing your first asset! We’d love to hear about your experience so far.
                                </p>
                                
                                <div className="space-y-8">
                                    {questions.map((q, i) => (
                                        <div key={q.key} className="space-y-3">
                                            <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                                                <span className="text-indigo-500 mr-2">{i+1}.</span>
                                                {q.text}
                                            </p>
                                            <StarRating 
                                                value={feedback[q.key]} 
                                                onChange={(val) => setFeedback({...feedback, [q.key]: val})} 
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                                    <label className="text-sm font-bold text-[var(--text-primary)]">
                                        Any additional thoughts or suggestions? <span className="text-[var(--text-secondary)] font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        className="w-full h-32 p-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                        placeholder="Tell us what you loved or what we can do better..."
                                        value={feedback.textFeedback}
                                        onChange={(e) => setFeedback({...feedback, textFeedback: e.target.value})}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                                <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }} 
                                    transition={{ type: 'spring', bounce: 0.5 }}
                                    className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4"
                                >
                                    <CheckCircle size={40} className="text-emerald-500" />
                                </motion.div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Feedback Received</h3>
                                <p className="text-sm font-medium text-[var(--text-secondary)] max-w-sm">
                                    Thank you for your valuable insights. Your feedback goes directly to our product team to continually improve your Stardust experience.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {step === 1 && (
                        <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-glass)] flex items-center justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-bold text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all w-40"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span>Submit Feedback</span>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FeedbackModal;
