import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Heart, Lock, Globe, Zap, CheckCircle2, Menu, X, ChevronRight } from 'lucide-react';

const StardustBackground = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 20}%`,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 10
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="stardust-particle bg-blue-400 group-hover:bg-white"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: p.bottom,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.3
          }}
        />
      ))}
    </div>
  );
};

const Navbar = ({ onGetStarted }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.onChange((latest) => setIsScrolled(latest > 50));
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${isScrolled ? 'bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border)] py-3' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stardust</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          {['Vaults', 'Inheritance', 'Security', 'Pricing'].map((item) => (
            <a key={item} href="#" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={onGetStarted} className="hidden sm:block text-sm font-bold text-[var(--text-primary)] hover:opacity-70 transition-opacity px-4">
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

const WelcomePage = ({ onClickGetStarted, onAdminClick }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-x-hidden relative">
      <Navbar onGetStarted={onClickGetStarted} />

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute shadow-[0_0_100px_rgba(59,130,246,0.1)] bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <StardustBackground />
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[var(--surface-glass)] border border-[var(--border)] mb-8 shadow-inner"
            >
              <Zap size={14} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Next-Gen Heritage Architecture
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-[7rem] font-black tracking-tighter leading-[0.9] mb-8"
            >
              Protect what <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 italic">matters most.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-2xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Zero-knowledge asset vaulting for elite families. Secure your documents, keys, and legacy with military-grade protocols.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <button
                onClick={onClickGetStarted}
                className="group relative px-10 py-5 bg-[var(--primary)] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all flex items-center space-x-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span>Initialize Vault</span>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="flex items-center space-x-3 px-8 py-5 text-[var(--text-primary)] font-bold hover:text-[var(--primary)] transition-colors group">
                <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary)] transition-colors">
                  <Globe size={20} />
                </div>
                <span>Watch Protocol Demo</span>
              </button>
            </motion.div>
          </div>

          {/* Floating Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-24 py-8 border-y border-[var(--border)] w-full max-w-5xl flex flex-wrap justify-center items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default"
          >
            {['AES-256 BIT', 'FIPS 140-2', 'SOC 2 TYPE II', 'ISO 27001'].map(text => (
              <span key={text} className="text-[10px] font-black tracking-[0.3em]">{text}</span>
            ))}
          </motion.div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Engineered for Permanence</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg font-medium">Built on the principles of cryptographic sovereignty and family longevity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
              {[
                {
                  icon: <Lock className="text-blue-400" />,
                  title: "Sovereign Control",
                  desc: "Only you hold the private keys. Not even our engineers can see what's inside your vault.",
                  delay: 0.1
                },
                {
                  icon: <Heart className="text-rose-400" />,
                  title: "Legacy Relay",
                  desc: "Intelligent inheritance triggers ensure your assets move to your heirs only when needed.",
                  delay: 0.2
                },
                {
                  icon: <Shield className="text-emerald-400" />,
                  title: "Immutable History",
                  desc: "Audit logs that record every access attempt, secured by distributed ledger technology.",
                  delay: 0.3
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  className="group relative p-12 rounded-[3rem] bg-[var(--surface-glass)] border border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--primary)]/30 transition-all perspective-1000 cursor-default"
                >
                  <div className="w-16 h-16 bg-[var(--bg-app)] rounded-2xl flex items-center justify-center mb-8 border border-[var(--border)] group-hover:scale-110 group-hover:border-[var(--primary)] transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed font-medium mb-8">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Security Benchmarks Sub-section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Encryption Strength', value: 'AES-256', sub: 'Post-Quantum Ready' },
                { label: 'Uptime Protocol', value: '99.99%', sub: 'Global Node Mesh' },
                { label: 'Decryption Speed', value: '< 20ms', sub: 'Local Computation' },
                { label: 'Data Sovereignty', value: '100%', sub: 'Zero-Knowledge' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-glass)] text-center group hover:bg-[var(--primary)]/5 transition-all"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4">{stat.label}</p>
                  <p className="text-4xl font-black mb-1 group-hover:text-[var(--primary)] transition-colors">{stat.value}</p>
                  <p className="text-xs font-bold text-[var(--text-secondary)] opacity-60">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Heritage Timeline Section */}
        <section className="py-32 px-6 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">The Continuity Protocol</h2>
              <p className="text-[var(--text-secondary)] text-lg font-medium">A multi-generational shield for your family's digital existence.</p>
            </div>

            <div className="relative border-l-2 border-[var(--border)] ml-4 md:ml-0 md:left-1/2 md:-translate-x-1/2">
              {[
                { step: '01', title: 'Vault Initialization', desc: 'Generate your master key on a secured, air-gapped environment. No data leaves your device unencrypted.' },
                { step: '02', title: 'Asset Cataloging', desc: 'Securely link real estate, digital assets, and sensitive documents into your zero-knowledge architecture.' },
                { step: '03', title: 'Heir Designation', desc: 'Define your legacy relay. Assign nominees and set tiered access permissions for the next generation.' },
                { step: '04', title: 'Pulse Monitoring', desc: 'Our system monitors your activity pulse. If a lapse is detected, the continuity protocol automatically triggers.' },
                { step: '05', title: 'Legacy Transfer', desc: 'Secured data is decrypted specifically for your heirs, ensuring a seamless transition of your lifetime’s work.' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`relative mb-20 md:w-1/2 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:left-1/2 md:text-left'}`}
                >
                  <div className={`absolute top-0 w-8 h-8 rounded-full bg-[var(--primary)] border-4 border-[var(--bg-app)] shadow-lg ${i % 2 === 0 ? '-left-[17px] md:-right-[17px] md:left-auto' : '-left-[17px]'}`} />
                  <div className="bg-[var(--surface-glass)] p-8 rounded-[2rem] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
                    <span className="text-4xl font-black text-[var(--primary)]/20 mb-4 block leading-none">{item.step}</span>
                    <h3 className="text-2xl font-black mb-3 tracking-tight">{item.title}</h3>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-32 px-6 bg-[var(--surface-glass)] border-y border-[var(--border)] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter">Start your legacy journey today.</h2>
            <p className="text-xl text-[var(--text-secondary)] mb-12 font-medium">Join thousands of families securing their future with Stardust.</p>
            <button
              onClick={onClickGetStarted}
              className="px-12 py-6 bg-white text-black rounded-[2.5rem] font-black text-2xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl"
            >
              Get Private Access
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-12 opacity-50">
              <Shield size={24} />
              <span className="text-xl font-bold tracking-tight">Stardust</span>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mb-12 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em]">
              <a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Charter</a>
              <a href="#" className="hover:text-[var(--primary)] transition-colors">Security Roadmap</a>
              <a href="#" className="hover:text-[var(--primary)] transition-colors">Legal Framework</a>
              <a href="#" className="hover:text-[var(--primary)] transition-colors">Status: Pulse 100%</a>
            </div>

            <button
              onClick={onAdminClick}
              className="text-[var(--text-secondary)] opacity-20 hover:opacity-100 hover:text-[var(--primary)] font-black tracking-[0.4em] uppercase text-[9px] transition-all"
            >
              System Terminal Access
            </button>

            <p className="mt-12 text-[10px] text-[var(--text-secondary)] opacity-30 font-bold uppercase tracking-widest">
              © 2026 Stardust Zero-Knowledge Labs. All Rights Reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default WelcomePage;