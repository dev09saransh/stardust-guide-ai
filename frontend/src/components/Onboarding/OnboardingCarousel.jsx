import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
    {
        emoji: '🛡️',
        title: 'Your Digital Asset Vault',
        subtitle: 'ONE SECURE PLACE FOR EVERYTHING',
        description: 'Store bank accounts, insurance policies, passwords, property documents, and more \u2014 all encrypted with military-grade security.',
        gradient: 'from-blue-600 via-indigo-600 to-violet-700',
        glowColor: 'rgba(99, 102, 241, 0.3)',
    },
    {
        emoji: '🔐',
        title: 'Zero-Knowledge Encryption',
        subtitle: 'YOUR DATA. YOUR EYES ONLY.',
        description: 'Your data is encrypted before it ever leaves your device. Not even we can read it. Complete privacy, always.',
        gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
        glowColor: 'rgba(20, 184, 166, 0.3)',
    },
    {
        emoji: '👨‍👩‍👧',
        title: 'Protect Your Family\'s Future',
        subtitle: 'SMART LEGACY PLANNING',
        description: 'Designate trusted nominees who can access your vault when needed. Smart inheritance protocols keep your family safe.',
        gradient: 'from-purple-600 via-fuchsia-600 to-pink-700',
        glowColor: 'rgba(168, 85, 247, 0.3)',
    },
    {
        emoji: '⚡',
        title: 'Ready in Under 4 Minutes',
        subtitle: 'SIMPLE. SECURE. FUTURE-PROOF.',
        description: 'Add your first asset in just 3 steps. No complex setup, no lengthy forms. Your digital legacy starts right now.',
        gradient: 'from-amber-500 via-orange-500 to-red-600',
        glowColor: 'rgba(245, 158, 11, 0.3)',
    },
];

const OnboardingCarousel = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    const isLastSlide = currentSlide === slides.length - 1;

    const goNext = useCallback(() => {
        if (isLastSlide) {
            onComplete();
            return;
        }
        setDirection(1);
        setCurrentSlide((prev) => prev + 1);
    }, [isLastSlide, onComplete]);

    const goPrev = useCallback(() => {
        if (currentSlide === 0) return;
        setDirection(-1);
        setCurrentSlide((prev) => prev - 1);
    }, [currentSlide]);

    const goToSlide = (index) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [goNext, goPrev]);

    const slide = slides[currentSlide];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Floating particles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${4 + Math.random() * 8}px`,
                            height: `${4 + Math.random() * 8}px`,
                            background: `rgba(255, 255, 255, ${0.03 + Math.random() * 0.08})`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30 - Math.random() * 60, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>

            {/* Carousel Container */}
            <motion.div
                initial={{ scale: 0.85, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 180, delay: 0.15 }}
                className="relative z-10 w-full max-w-[500px] mx-4"
            >
                <div
                    className="rounded-[2.5rem] overflow-hidden"
                    style={{
                        background: 'rgba(20, 20, 35, 0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: `0 40px 100px rgba(0,0,0,0.5), 0 0 80px ${slide.glowColor}`,
                    }}
                >
                    {/* Slide Content */}
                    <div className="relative" style={{ minHeight: '400px' }}>
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentSlide}
                                custom={direction}
                                initial={{ x: direction > 0 ? 200 : -200, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: direction < 0 ? 200 : -200, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="flex flex-col items-center justify-center p-10 pt-12 text-center"
                            >
                                {/* Gradient glow behind icon */}
                                <div
                                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-gradient-to-b ${slide.gradient} opacity-20 blur-[80px] rounded-full pointer-events-none`}
                                />

                                {/* Emoji Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                                    className="relative mb-8"
                                >
                                    <div
                                        className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl`}
                                        style={{ boxShadow: `0 16px 48px ${slide.glowColor}` }}
                                    >
                                        <span className="text-5xl">{slide.emoji}</span>
                                    </div>
                                </motion.div>

                                {/* Subtitle badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-4 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}
                                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    {slide.subtitle}
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-[28px] md:text-[32px] font-black text-white tracking-tight mb-5 leading-[1.15]"
                                >
                                    {slide.title}
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="text-[15px] text-gray-400 leading-relaxed max-w-sm mx-auto font-medium"
                                >
                                    {slide.description}
                                </motion.p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    <div className="px-8 pb-8 pt-2 relative z-10">
                        {/* Dot Indicators */}
                        <div className="flex justify-center space-x-2 mb-6">
                            {slides.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToSlide(i)}
                                    className="transition-all duration-400 rounded-full"
                                    style={{
                                        width: i === currentSlide ? '32px' : '8px',
                                        height: '8px',
                                        background: i === currentSlide
                                            ? `linear-gradient(90deg, ${i === 0 ? '#6366f1' : i === 1 ? '#14b8a6' : i === 2 ? '#a855f7' : '#f59e0b'}, ${i === 0 ? '#8b5cf6' : i === 1 ? '#06b6d4' : i === 2 ? '#ec4899' : '#ef4444'})`
                                            : 'rgba(255,255,255,0.15)',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={goPrev}
                                disabled={currentSlide === 0}
                                className="p-3 rounded-xl transition-all"
                                style={{
                                    background: currentSlide === 0 ? 'transparent' : 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: currentSlide === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
                                    cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <button
                                onClick={goNext}
                                className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03]"
                                style={{
                                    background: isLastSlide
                                        ? `linear-gradient(135deg, #6366f1, #8b5cf6)`
                                        : 'rgba(255,255,255,0.08)',
                                    border: `1px solid ${isLastSlide ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.12)'}`,
                                    color: 'white',
                                    boxShadow: isLastSlide ? '0 8px 32px rgba(99, 102, 241, 0.4)' : 'none',
                                }}
                            >
                                <span>{isLastSlide ? "Let's Get Started" : 'Next'}</span>
                                <ArrowRight size={16} className={isLastSlide ? 'animate-bounce-x' : ''} />
                            </button>
                        </div>

                        {/* Skip link */}
                        {!isLastSlide && (
                            <button
                                onClick={onComplete}
                                className="w-full mt-5 text-[11px] font-bold hover:text-white transition-colors uppercase tracking-[0.2em]"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                            >
                                Skip Introduction
                            </button>
                        )}
                    </div>
                </div>

                {/* Brand watermark */}
                <p className="text-center mt-5 text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    STARDUST
                </p>
            </motion.div>
        </motion.div>
    );
};

export default OnboardingCarousel;
