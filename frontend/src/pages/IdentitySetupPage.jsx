import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';

const IdentitySetupPage = ({ onSetupComplete }) => {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [statusText, setStatusText] = useState('Securing Quantum Architecture...');

  const radius = 85;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const statuses = [
      'Securing Quantum Architecture...',
      'Generating Vault Keys...',
      'Configuring Zero-Knowledge Protocols...',
      'Isolating Primary Workspace...',
      'Finalizing Neural Link...'
    ];

    let frame;
    const start = Date.now();
    const duration = 2500; // 2.5 seconds for a more premium feel

    const animate = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);

      // Eased progress (cubic ease-in-out)
      const eased = pct < 0.5
        ? 4 * pct * pct * pct
        : 1 - Math.pow(-2 * pct + 2, 3) / 2;

      setProgress(eased * 100);

      // Update status text at thresholds
      const idx = Math.min(Math.floor(eased * statuses.length), statuses.length - 1);
      setStatusText(statuses[idx]);

      if (pct < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setReady(true);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">

      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">

        {/* Loader Visualization */}
        <div className="relative w-64 h-64 mx-auto mb-12">
          {/* Animated Glow Ring */}
          <motion.div
            animate={{
              rotate: 360,
              boxShadow: [
                "0 0 40px var(--primary)",
                "0 0 80px var(--primary)",
                "0 0 40px var(--primary)"
              ]
            }}
            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 2, repeat: Infinity } }}
            style={{ boxShadow: "0 0 40px var(--primary)" }}
            className="absolute inset-4 rounded-full border border-[var(--border)] opacity-10"
          />

          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--surface-glass)" strokeWidth="8" />
            <motion.circle
              cx="100" cy="100" r={radius} fill="none"
              stroke="url(#setupGradient)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-100 ease-out"
            />
            <defs>
              <linearGradient id="setupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Core Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {!ready ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 border-[var(--border)] shadow-2xl">
                    <Shield size={32} className="text-[var(--primary)]" />
                  </div>
                  <span className="text-3xl font-black tabular-nums tracking-tighter">
                    {Math.round(progress)}<span className="text-sm opacity-50 ml-1">%</span>
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                    <Sparkles size={40} className="text-emerald-400" />
                  </div>
                  <span className="text-lg font-bold text-emerald-400 uppercase tracking-widest">Active</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Narrative Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-bold tracking-tight">
            {ready ? 'Vault Initialized' : 'Calibrating Security'}
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-lg h-6">
            {ready ? 'Your secure environment is fully provisioned.' : statusText}
          </p>
        </motion.div>

        {/* Interaction Layer */}
        <div className="mt-16 h-16">
          <AnimatePresence>
            {ready && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSetupComplete}
                className="btn-primary w-full py-5 text-xl relative group glow-on-hover"
              >
                <span>Enter Protected Workspace</span>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-0 right-0 opacity-20 flex items-center justify-center space-x-2">
        <Shield size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">Distributed Ledger Node Alpha</span>
      </div>
    </div>
  );
};

export default IdentitySetupPage;