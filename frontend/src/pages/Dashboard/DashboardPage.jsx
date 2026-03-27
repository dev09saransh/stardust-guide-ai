import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building,
  Car,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  History,
  Key,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Wallet
} from 'lucide-react';
import UniversalVaultForm from '../../components/common/UniversalVaultForm';
import CategoryPicker from '../../components/common/CategoryPicker';
import OnboardingTour from '../../components/Onboarding/OnboardingTour';
import NomineeSetupModal from '../../components/Onboarding/NomineeSetupModal';
import ProfileCompletionModal from '../../components/profile/ProfileCompletionModal';
import { VaultConfirm } from '../../components/common/VaultUI';
import AuthModal from '../../components/Auth/AuthModal';
import DataSyncModal from '../../components/Dashboard/DataSyncModal';
import FirstAssetWizard, { CelebrationScreen } from '../../components/Onboarding/FirstAssetWizard';
import ManualClaimModal from '../../components/Dashboard/ManualClaimModal';
import LoginAuditTable from '../../components/Dashboard/LoginAuditTable';
import AddAccountModal from '../../components/Dashboard/AddAccountModal';
import MobileNav from '../../components/Navigation/MobileNav';
import FeedbackModal from '../../components/Dashboard/FeedbackModal';
import LegalCenterLayout from '../../components/Legal/LegalCenterLayout';

const SearchOverlay = ({ isOpen, onClose, searchQuery, setSearchQuery }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-[var(--bg-app)]/95 backdrop-blur-xl p-6 md:hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Search Vault</h2>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)]">
            <Plus className="rotate-45" size={28} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Search assets, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-lg font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div className="mt-8">
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">Quick Filters</p>
          <div className="flex flex-wrap gap-2">
            {['Cards', 'Banking', 'Legal', 'Passwords'].map(filter => (
              <button
                key={filter}
                onClick={() => { setSearchQuery(filter); }}
                className="px-4 py-2 rounded-xl bg-[var(--surface-glass)] border border-[var(--border)] text-sm font-bold text-[var(--text-primary)]"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const DigitalCard = ({ card, onClick, userName }) => {
  const bankGradients = {
    'HDFC BANK': 'from-blue-900 via-blue-800 to-indigo-900',
    'ICICI BANK': 'from-orange-700 via-orange-600 to-red-800',
    'SBI': 'from-sky-700 via-sky-600 to-blue-800',
    'AXIS': 'from-rose-900 via-rose-800 to-burgundy-900',
    'AMEX': 'from-slate-800 via-slate-700 to-slate-900',
    'default': 'from-gray-800 via-gray-700 to-gray-900'
  };

  const gradient = bankGradients[card.metadata?.bank?.toUpperCase()] || bankGradients.default;

  return (
    <motion.div
      whileHover={{ y: -10, rotateX: 5, rotateY: -5, scale: 1.02 }}
      onClick={() => onClick && onClick(card)}
      className={`relative w-full aspect-[1.586/1] rounded-[1.25rem] bg-gradient-to-br ${gradient} p-4 md:p-6 shadow-2xl cursor-pointer overflow-hidden group border border-white/10`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="text-white/90">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{card.metadata?.bank || 'Vault Card'}</p>
            <h4 className="text-base md:text-lg font-black tracking-tight leading-none italic uppercase">{card.metadata?.variant || 'Standard'}</h4>
          </div>
          <div className="w-10 h-8 bg-amber-400/20 rounded-md border border-amber-400/30 flex items-center justify-center overflow-hidden">
            <div className="w-6 h-4 bg-amber-400/40 rounded-sm relative">
              <div className="absolute inset-x-0 top-1.5 h-px bg-amber-400/20" />
              <div className="absolute inset-y-0 left-2.5 w-px bg-amber-400/20" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex space-x-4 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex space-x-1">
                {[1, 2, 3, 4].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/40" />)}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-white/80">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase">{userName || 'Authorized Holder'}</p>
            {card.metadata?.network?.toLowerCase() === 'visa' && <div className="text-xl italic font-black text-white/90">VISA</div>}
            {card.metadata?.network?.toLowerCase() === 'mastercard' && (
              <div className="flex -space-x-2">
                <div className="w-5 h-5 rounded-full bg-red-500/80" />
                <div className="w-5 h-5 rounded-full bg-amber-500/80" />
              </div>
            )}
            {(!['visa', 'mastercard'].includes(card.metadata?.network?.toLowerCase())) && <p className="text-[10px] font-black uppercase tracking-widest">{card.metadata?.network}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AssetDetailOverlay = ({ asset: card, onClose, fetchAIStats, benefitsLoading, userName, onDelete, onEdit, isReadOnly }) => {
  useEffect(() => {
    // Only fetch if it's a credit card, benefits aren't loaded, we aren't already loading,
    // AND we haven't already attempted and failed (to avoid infinite error loops)
    const hasError = typeof card?.aiBenefits === 'string' && card.aiBenefits.startsWith('ERROR');
    if (card && card.category === 'Credit Card' && !card.aiBenefits && !benefitsLoading && !hasError) {
      fetchAIStats(card);
    }
  }, [card, benefitsLoading, fetchAIStats]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-end p-6 md:p-10 pointer-events-none"
    >
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl pointer-events-auto flex flex-col p-8 overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <Plus className="rotate-45" size={24} />
        </button>

        {card.category === 'Credit Card' && (
          <div className="mt-8 mb-10">
            <DigitalCard card={card} userName={userName} onClick={() => { }} />
          </div>
        )}

        <div className={`space-y-8 ${card.category !== 'Credit Card' ? 'mt-8' : ''}`}>
          <div>
            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-4">
              {card.category} Metadata
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(card.metadata || {})
                .filter(([key]) => !['last4'].includes(key)) // Hide sensitive internal metadata if you prefer
                .map(([key, value], i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border)] col-span-2 md:col-span-1">
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-black text-[var(--text-primary)]">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || '—')}</p>
                  </div>
                ))}
            </div>
          </div>

          {card.category === 'Credit Card' && (
            <div className="pt-8 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Vault Intelligence</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">AI-powered benefits & coverage analysis</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                  <ShieldCheck size={20} />
                </div>
              </div>

              {benefitsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest animate-pulse">Analyzing Global Benefits...</p>
                </div>
              ) : card.aiBenefits && !card.aiBenefits.startsWith('ERROR:') ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {card.aiBenefits.split('\n').filter(l => l.trim()).map((benefit, i) => (
                    <div key={i} className="flex items-start space-x-3 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1.5 group-hover:scale-150 transition-transform" />
                      <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{benefit.replace(/^[•\-\d.]\s*/, '')}</p>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                  <p className="text-xs font-semibold text-amber-500/80 mb-2">Vault Intelligence Offline</p>
                  <p className="text-[10px] font-medium text-amber-500/60 leading-relaxed">
                    {card.aiBenefits?.startsWith('ERROR:')
                      ? card.aiBenefits.replace('ERROR: ', '')
                      : "AI Service is offline. Please start the service to see card-specific benefits."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-10 flex flex-col space-y-4">
          {isReadOnly ? (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center space-x-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">End-to-End Encrypted | View Only</span>
            </div>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => onEdit(card)}
                className="flex-1 py-4 bg-[var(--primary)] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform"
              >
                Edit Asset Details
              </button>
              <button
                onClick={() => onDelete(card.asset_id)}
                className="p-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
          <button className="w-full py-4 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2">
            <History size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">View Audit History</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardPage = ({ user, onLogout, isGuest = false, isSessionOnboarded }) => {
  const { theme, toggleTheme } = useTheme();
  const { isOnboarded, showToast, profileCompletion: contextProfileCompletion, ...auth } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPassword, setShowPassword] = useState({});
  const [showFirstAssetWizard, setShowFirstAssetWizard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addingCategory, setAddingCategory] = useState(null);
  const [assetFilter, setAssetFilter] = useState('All Assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Onboarding & Profile Completion state
  const [showNomineeModal, setShowNomineeModal] = useState(false);
  const [showManualClaimModal, setShowManualClaimModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [completionStats, setCompletionStats] = useState({ percentage: 0, is_complete: false, fields: {}, missing: [] });
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [settingsEditing, setSettingsEditing] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [nominee, setNominee] = useState(null);
  const [nomineeEditing, setNomineeEditing] = useState(false);
  const [nomineeForm, setNomineeForm] = useState({ full_name: '', email: '', mobile: '', country_code: '+91', relationship: '' });
  const [nomineeSaving, setNomineeSaving] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formShake, setFormShake] = useState(false);
  const [formGlow, setFormGlow] = useState(false);
  const [showMFSync, setShowMFSync] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [inheritedAccounts, setInheritedAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null); // null means own account
  const [showVaultID, setShowVaultID] = useState(false);
  const [vaultPolicyForm, setVaultPolicyForm] = useState({ inactivity_trigger_period: 9, reminder_interval: 3 });
  const [vaultPolicySaving, setVaultPolicySaving] = useState(false);
  const [vaultPolicyEditing, setVaultPolicyEditing] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const renderSidebarContent = (isMobile = false) => (
    <>
      <div className={`flex items-center mb-6 px-2 relative z-10 ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 text-left'}`}>
        <div className={`rounded-xl bg-gradient-to-br from-[var(--primary)] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
          <ShieldCheck size={isSidebarCollapsed ? 18 : 22} />
        </div>
        {!isSidebarCollapsed && (
          <span className="text-xl font-black tracking-tighter text-[var(--text-primary)] transition-all duration-300">STARDUST</span>
        )}
        {isMobile && (
          <button 
            onClick={() => setShowMobileSidebar(false)} 
            className="ml-auto p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <Plus className="rotate-45" size={24} />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto custom-scrollbar relative z-10 ${isSidebarCollapsed ? 'no-scrollbar' : 'pr-2 space-y-3'}`}>
        {!isSidebarCollapsed && <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 ml-4 opacity-50">Core Vault</p>}
        <div className={`flex flex-col ${isSidebarCollapsed ? 'items-center space-y-4' : 'space-y-3'}`}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
          { id: 'assets', label: 'Assets', icon: <Wallet size={20} /> },
          { id: 'insurance', label: 'Insurance', icon: <ShieldCheck size={20} /> },
          { id: 'credentials', label: 'Passwords', icon: <Key size={20} /> },
          { id: 'legal', label: 'Documents', icon: <FileText size={20} /> },
          { id: 'contacts', label: 'Contacts', icon: <Users size={20} /> },
          // { id: 'recover', label: 'Recover Vault', icon: <ShieldAlert size={20} /> },
          { id: 'security', label: 'Security Log', icon: <Shield size={20} /> },
        ].map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => {
              if (item.id === 'recover') {
                setShowManualClaimModal(true);
              } else {
                handleNavClick(item.id);
              }
              setShowMobileSidebar(false);
            }}
            className={`w-full nav-item group flex items-center rounded-2xl transition-all ${activeTab === item.id ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)]'} ${isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'}`}
            title={isSidebarCollapsed ? item.label : ''}
          >
            <span className={`transition-transform group-hover:scale-110 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-inherit opacity-70'}`}>
              {item.icon}
            </span>
            {!isSidebarCollapsed && <span className="font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>}
          </button>
        ))}
        </div>
        {!isSidebarCollapsed && (
          <div className="pt-8 mb-4">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 ml-4 opacity-50">Preferences</p>
          </div>
        )}
          <button
            id="settings-button"
            onClick={() => {
              if (isGuest) {
                auth.openAuthModal('signup');
                return;
              }
              handleNavClick('settings');
              setShowMobileSidebar(false);
            }}
            className={`w-full nav-item group flex items-center rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)]'} ${isSidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'}`}
            title={isSidebarCollapsed ? 'Settings' : ''}
          >
            <SettingsIcon size={20} className={`shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-inherit opacity-70'}`} />
            {!isSidebarCollapsed && <span className="font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300">Settings</span>}
          </button>
      </nav>

      <div id="profile-menu" className="mt-auto pt-8 border-t border-[var(--border)] flex flex-col space-y-4 relative z-10">
        {isGuest ? (
          <div className="space-y-3">
            <button onClick={() => { auth.openAuthModal('login'); setShowMobileSidebar(false); }} className="w-full btn-secondary py-3 flex items-center justify-center space-x-2 text-sm">
              <LogIn size={18} /><span>Sign In</span>
            </button>
            <button onClick={() => { auth.openAuthModal('signup'); setShowMobileSidebar(false); }} className="w-full btn-primary py-3 flex items-center justify-center space-x-2 text-sm">
              <UserPlus size={18} /><span>Create Account</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className={`space-y-4 ${isSidebarCollapsed ? 'px-0' : 'px-2'}`}>
              <div onClick={() => { switchAccount(null); setShowMobileSidebar(false); }} className={`relative overflow-hidden group rounded-2xl border transition-all cursor-pointer ${!activeAccount ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-[var(--surface-glass)] border-[var(--border)] hover:bg-[var(--surface)]'} ${isSidebarCollapsed ? 'p-1.5' : 'p-3'}`}>
                <div className={`flex items-center relative z-10 transition-all ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-inner transition-colors ${!activeAccount ? 'bg-white text-blue-600' : 'bg-[var(--surface-glass)] text-[var(--text-secondary)]'}`}>
                    {user?.user?.name ? user.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'VH'}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 truncate transition-all duration-300">
                      <p className={`text-[13px] font-black truncate ${!activeAccount ? 'text-white' : 'text-[var(--text-primary)]'}`}>My Personal Vault</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${!activeAccount ? 'text-blue-100/60' : 'text-[var(--text-secondary)]'}`}>Main Storage</p>
                    </div>
                  )}
                  {!activeAccount && !isSidebarCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 animate-pulse" />}
                </div>
              </div>

              <div className={`space-y-2 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-40">Inherited Vaults</p>
                    <button
                      onClick={() => setShowAddAccountModal(true)}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                      title="Add Authorized Vault"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}

                {inheritedAccounts.length > 0 ? (
                  inheritedAccounts.map(acc => (
                    <button key={acc.user_id} onClick={() => { switchAccount(acc); setShowMobileSidebar(false); }} className={`group flex items-center transition-all border ${activeAccount?.user_id === acc.user_id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--surface-glass)] border-[var(--border)] hover:bg-[var(--surface)]'} ${isSidebarCollapsed ? 'w-10 h-10 justify-center rounded-xl p-0' : 'w-full space-x-3 p-3 rounded-xl'}`}>
                      <div className={`rounded-lg flex items-center justify-center font-black transition-colors ${activeAccount?.user_id === acc.user_id ? 'bg-emerald-500 text-white' : 'bg-indigo-500/10 text-indigo-400'} ${isSidebarCollapsed ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}`}>{acc.full_name[0]}</div>
                      {!isSidebarCollapsed && (
                        <div className="flex-1 text-left truncate">
                          <p className={`text-xs font-black truncate ${activeAccount?.user_id === acc.user_id ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}>{acc.full_name}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${activeAccount?.user_id === acc.user_id ? 'text-emerald-500/60' : 'text-[var(--text-secondary)]'}`}>Legacy Account</p>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  !isSidebarCollapsed && (
                    <button
                      onClick={() => setShowAddAccountModal(true)}
                      className="w-full p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-glass)] hover:bg-[var(--surface)] transition-all group flex flex-col items-center justify-center space-y-1"
                    >
                      <UserPlus size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--primary)]" />
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Link Vault</span>
                    </button>
                  )
                )}
              </div>
            </div>
            <div className={`pt-6 border-t border-[var(--border)] flex items-center justify-between ${isSidebarCollapsed ? 'flex-col space-y-4 px-0' : 'px-2'}`}>
              <div className={`flex items-center transition-all ${isSidebarCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
                <div className="w-8 h-8 rounded-full bg-[var(--surface-glass)] flex items-center justify-center shrink-0 shadow-inner border border-[var(--border)]"><History size={14} className="text-[var(--text-secondary)]" /></div>
                {!isSidebarCollapsed && (
                  <div>
                    <p className="text-[10px] font-black text-[var(--text-primary)] leading-none">{user?.user?.name?.split(' ')[0]}</p>
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1 text-left">Logged In</p>
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-1 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
                <button onClick={() => { setShowAddAccountModal(true); setShowMobileSidebar(false); }} className={`p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-all ${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`} title="Add Vault"><UserPlus size={16} /></button>
                <button onClick={() => { setShowLogoutConfirm(true); setShowMobileSidebar(false); }} className={`p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all ${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`} title="Logout"><LogOut size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Trigger shake/glow when trying to navigate away with unsaved form
  const triggerFormAlert = () => {
    setFormShake(true);
    setFormGlow(true);
    setTimeout(() => {
      setFormShake(false);
      // Glow stays a bit longer
      setTimeout(() => setFormGlow(false), 2000);
    }, 400);
    showToast('Unsaved changes in progress. Finish or Cancel to navigate.', 'error');
  };

  const handleNavClick = (tabId) => {
    if (tabId === 'vault-access' || tabId === 'settings') {
      setActiveTab(tabId);
      return;
    }
    if (tabId === 'quick-add') {
      setActiveTab('assets');
      guardedStartAdding(null);
      return;
    }
    if (isAdding) {
      triggerFormAlert();
      return;
    }
    setActiveTab(tabId);
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';
  const authHeaders = useMemo(() => {
    const headers = { Authorization: `Bearer ${user?.token || ''}` };
    if (activeAccount?.user_id) {
      headers['x-vault-context'] = activeAccount.user_id.toString();
    }
    return headers;
  }, [user?.token, activeAccount]);

  // Fetch profile completion %
  const fetchProfileCompletion = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/profile-completion`, { headers: authHeaders });
      setCompletionStats(res.data);
    } catch (error) {
      console.error('Error fetching profile completion');
    }
  }, [authHeaders]);

  // Fetch inherited accounts
  const fetchInheritedAccounts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/inherited`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setInheritedAccounts(res.data);
    } catch (err) {
      console.error('Error fetching inherited accounts:', err);
    }
  }, [user?.token]);

  useEffect(() => {
    if (user?.token) {
      fetchInheritedAccounts();
    }
  }, [user?.token, fetchInheritedAccounts]);

  const switchAccount = (account) => {
    // Reset states for clean transition
    setAssets([]);
    setLoading(true);
    // Setting active account triggers authHeaders update -> fetch callbacks update -> main useEffect re-fetch
    setActiveAccount(account);

    if (account) {
      showToast(`Shifting to ${account.full_name}'s Profile`, 'success');
    } else {
      showToast('Back to Personal Vault', 'success');
    }
  };



  // Fetch user profile for settings
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/profile`, { headers: authHeaders });
      setUserProfile(res.data);
      // Only initialize settingsForm if not currently editing to prevent overwriting user input
      setSettingsForm(prev => {
        if (settingsEditing) return prev;
        return {
          full_name: res.data.full_name || '',
          address: res.data.address || '',
          gender: res.data.gender || '',
          dob: res.data.dob ? res.data.dob.split('T')[0] : '',
        };
      });
      setVaultPolicyForm(prev => {
        if (vaultPolicyEditing) return prev;
        return {
          inactivity_trigger_period: res.data.inactivity_trigger_period || 9,
          reminder_interval: res.data.reminder_interval || 3
        };
      });
    } catch (err) {
      console.error('Error fetching user profile');
    }
  }, [authHeaders, settingsEditing, vaultPolicyEditing]);

  // Fetch nominee
  const fetchNominee = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/nominee`, { headers: authHeaders });
      const nom = res.data.nominees && res.data.nominees.length > 0 ? res.data.nominees[0] : null;
      setNominee(nom);
      if (nom) {
        setNomineeForm({
          full_name: nom.full_name || '',
          email: nom.email || '',
          mobile: nom.mobile?.replace(/^\+\d{1,3}/, '') || '',
          country_code: nom.mobile?.match(/^(\+\d{1,3})/)?.[1] || '+91',
          relationship: nom.relationship || '',
        });
      }
    } catch (err) {
      console.error('Error fetching nominee');
    }
  }, [authHeaders]);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/assets`, {
        headers: authHeaders
      });
      setAssets(res.data);
    } catch (err) {
      console.error('Error fetching assets:', err);
      // Suppress vault connection toast during onboarding tour to keep experience clean
      const isIntroDone = sessionStorage.getItem('stardust_tour_seen') === 'true';
      if (isIntroDone) {
        showToast('Vault connection disrupted. Retrying...', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders, showToast]);

  const handleDeleteAsset = async (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    const id = confirmModal.id;
    try {
      await axios.delete(`${API}/assets/${id}`, { headers: authHeaders });
      setSelectedCard(null);
      fetchAssets();
      showToast('Asset permanently removed from vault', 'success');
    } catch (err) {
      showToast('Failed to delete asset', 'error');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleEditAsset = (card) => {
    if (activeAccount) {
      showToast('Permission denied: Account is in view-only mode.', 'error');
      return;
    }
    setEditingAsset(card);
    setIsAdding(true);
    setAddingCategory(card.category);
    setSelectedCard(null);
  };

  useEffect(() => {
    if (!isGuest && user?.token) {
      fetchAssets();
      fetchProfileCompletion();
      fetchUserProfile();
      fetchNominee();
    } else {
      setLoading(false);
    }
  }, [isGuest, user?.token, activeAccount, fetchAssets, fetchProfileCompletion, fetchUserProfile, fetchNominee]);

  // Show first asset wizard for authenticated users with 0 assets and complete profile
  useEffect(() => {
    if (!isGuest && !loading && assets.length === 0 && completionStats.is_complete) {
      const dismissed = localStorage.getItem('stardust_first_asset_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowFirstAssetWizard(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isGuest, loading, assets.length, completionStats.is_complete]);

  // Auto-prompt nominee setup if missing after profile completion
  useEffect(() => {
    if (!isGuest && !loading && completionStats.is_complete && !nominee && !showNomineeModal) {
      const dismissed = localStorage.getItem('stardust_nominee_prompt_dismissed');
      if (!dismissed) {
        // Show prompt after a short delay to give UI time to settle
        const timer = setTimeout(() => setShowNomineeModal(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isGuest, loading, completionStats.is_complete, nominee, showNomineeModal]);

  const stats = [
    { label: 'Total Assets', value: assets.length.toString(), icon: <TrendingUp className="text-blue-400" />, trend: 'Vault Sync', color: 'bg-blue-500/10' },
    { label: 'Insurance', value: assets.filter(a => a.category === 'Insurance').length.toString(), icon: <ShieldCheck className="text-emerald-400" />, trend: 'Protected', color: 'bg-emerald-500/10' },
    { label: 'Bank Accounts', value: assets.filter(a => a.category === 'Bank Account').length.toString(), icon: <Building className="text-purple-400" />, trend: 'Hashed', color: 'bg-purple-500/10' },
    { label: 'Cards', value: assets.filter(a => a.category === 'Credit Card').length.toString(), icon: <CreditCard className="text-rose-400" />, trend: 'Active', color: 'bg-rose-500/10' },
    { label: 'Passwords', value: assets.filter(a => a.category === 'Password').length.toString(), icon: <Key className="text-amber-400" />, trend: 'Encrypted', color: 'bg-amber-500/10' },
  ];

  // Feature guard — blocks adding if profile not complete or unverified
  const guardedStartAdding = (category) => {
    if (isGuest) {
      auth.openAuthModal('signup');
      return;
    }
    /* 
    if (userProfile && !userProfile.is_verified) {
      showToast('Device verification required to add assets.', 'error');
      return;
    }
    */
    if (activeAccount) {
      showToast('View-only access: Document modification restricted.', 'error');
      return;
    }
    // REFINED GUARD: Only block if core personal details are missing.
    // Nominee and Security are recommended but no longer block asset creation.
    const coreMissing = completionStats.missing?.filter(f => ['full_name', 'email', 'mobile'].includes(f)) || [];
    if (coreMissing.length > 0) {
      setShowProfilePrompt(true);
      return;
    }
    
    // Safety Guard: Require nominee if at least one asset exists
    // (Allows the very first asset to be added first, then mandates nominee)
    if (!nominee && assets.length > 0) {
      setShowNomineeModal(true);
      showToast('Action Required: Designate a nominee to continue.', 'warning');
      return;
    }

    setAddingCategory(category);
    setIsAdding(true);
  };



  const cancelAdding = () => {
    setIsAdding(false);
    setAddingCategory(null);
  };

  const togglePassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Tour completed -> show account details modal
  const handleTourComplete = () => {
    fetchProfileCompletion();
    showToast('Tour complete! Let\'s finish setting up your profile.', 'success');
    // Show account details modal if profile not complete
    if (!completionStats.is_complete && !isGuest) {
      setTimeout(() => setShowAccountModal(true), 1200);
    }
  };

  // Save nominee from settings
  const handleNomineeSave = async () => {
    setNomineeSaving(true);
    try {
      await axios.post(`${API}/auth/nominee`, nomineeForm, { headers: authHeaders });
      setNomineeEditing(false);
      fetchNominee();
      showToast('Legacy contact updated successfully', 'success');
    } catch (err) {
      console.error('Failed to save nominee');
    } finally {
      setNomineeSaving(false);
    }
  };

  // Account details completed → show nominee modal
  const handleAccountComplete = () => {
    setShowAccountModal(false);
    fetchProfileCompletion();
    fetchUserProfile();
    // After account details, prompt for nominee if missing
    if (!nominee) {
      setTimeout(() => setShowNomineeModal(true), 800);
    }
  };

  // Nominee modal completed
  const handleNomineeComplete = () => {
    setShowNomineeModal(false);
    fetchNominee();
    fetchProfileCompletion();
    showToast('Nominee successfully registered to vault', 'success');
    // Mark as dismissed so it doesn't auto-popup again immediately if they just closed it
    localStorage.setItem('stardust_nominee_prompt_dismissed', 'true');
  };

  // Save settings
  const handleSettingsSave = async () => {
    setSettingsSaving(true);
    try {
      await axios.put(`${API}/auth/profile`, settingsForm, { headers: authHeaders });
      setSettingsEditing(false);
      fetchUserProfile();
      fetchProfileCompletion();
      showToast('Personal profile synchronized successfully', 'success');
    } catch (err) {
      console.error('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleVaultPolicySave = async () => {
    setVaultPolicySaving(true);
    try {
      await axios.put(`${API}/auth/vault-policy`, vaultPolicyForm, { headers: authHeaders });
      showToast('Vault security protocol updated', 'success');
      setVaultPolicyEditing(false);
      fetchUserProfile();
    } catch (err) {
      console.error('Failed to save vault policy');
      showToast('Failed to update protocol', 'error');
    } finally {
      setVaultPolicySaving(false);
    }
  };

  const fetchAIStats = useCallback(async (card) => {
    if (!card.metadata?.bank && !card.metadata?.network) {
      console.log('Skipping AI benefits call - missing key metadata:', card.metadata);
      return;
    }
    setBenefitsLoading(true);
    try {
      const bank = card.metadata.bank || card.metadata.Bank || '';
      const network = card.metadata.network || card.metadata.Network || '';
      const variant = card.metadata.variant || card.metadata.Variant || '';

      const res = await fetch(`${process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:5005'}/card-benefits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank, network, variant })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'AI Service Error');
      }

      const data = await res.json();
      setSelectedCard(prev => prev ? { ...prev, aiBenefits: data.benefits } : null);
    } catch (err) {
      console.error('AI Benefits service connection failed:', err);
      setSelectedCard(prev => prev ? { ...prev, aiBenefits: "ERROR: " + err.message } : null);
    } finally {
      setBenefitsLoading(false);
    }
  }, []);

  // Components moved outside to prevent infinite remount loops


  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" id="dashboard-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter">Dashboard Overview</h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">Monitor your global asset health and security status.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                if (isGuest) {
                  auth.openAuthModal('signup');
                  return;
                }
                setShowNomineeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center space-x-2 text-xs md:text-sm flex-1 md:flex-none justify-center"
            >
              <UserPlus size={16} className="shrink-0" />
              <span>Add Nominee</span>
            </button>
            {/* Export Report functionality hidden for now
            <button className="px-4 py-2.5 rounded-xl font-bold bg-[var(--surface-glass)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface)] transition-all flex items-center space-x-2 text-xs md:text-sm flex-1 md:flex-none justify-center">
              <FileText size={16} className="shrink-0" />
              <span>Export Report</span>
            </button>
            */}
            <button id="add-resource-btn" onClick={() => guardedStartAdding(null)} className="btn-primary flex items-center space-x-2 px-6 py-3 md:py-2.5 text-sm w-full md:w-auto justify-center shadow-xl shadow-blue-500/20">
              <Plus size={18} className="shrink-0" />
              <span className="font-black">Add New Resource</span>
            </button>
          </div>
        </div>

        <div className="w-full mt-8 text-left space-y-8">
          {assets.length === 0 ? (
            <div className="card glass p-12 relative overflow-hidden flex flex-col items-center border border-[var(--border)] shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

              <div className="w-24 h-24 bg-gradient-to-br from-[var(--primary)] to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-500/20 mb-8 z-10">
                <ShieldCheck size={40} className="text-white" />
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-6 z-10">
                Your Digital Legacy, Secured.
              </h2>

              <p className="text-xl text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed mb-12 z-10">
                Welcome to Stardust. The most private and secure way to catalog your wealth, store your sensitive documents, and ensure your family has everything they need when it matters most.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full z-10">
                <button
                  onClick={() => guardedStartAdding(null)}
                  className="w-full py-4 bg-[var(--primary)] hover:bg-blue-600 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 hover:scale-[1.02]"
                >
                  <Plus size={20} />
                  <span>Add First Asset</span>
                </button>
                <button
                  onClick={() => {
                    if (isGuest) {
                      auth.openAuthModal('signup');
                      return;
                    }
                    setShowNomineeModal(true);
                  }}
                  className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-base font-bold rounded-2xl border border-indigo-500/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.02]"
                >
                  <UserPlus size={20} />
                  <span>Add Nominee</span>
                </button>
                <button
                  onClick={() => setActiveTab('assets')}
                  className="w-full py-4 bg-[var(--surface-glass)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02]"
                >
                  <span>View Catalog</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              {stats.map((stat, i) => (
                <div key={i} className={`card glass p-4 md:p-5 border border-[var(--border)] text-left flex flex-col justify-between min-h-[110px] md:min-h-[130px] transition-all hover:scale-[1.02] ${i === stats.length - 1 && stats.length % 2 !== 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.color} shadow-lg shadow-current/10`}>
                      {React.cloneElement(stat.icon, { size: 18 })}
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider opacity-60">{stat.trend}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-1 select-none">{stat.value}</h3>
                    <p className="text-[10px] md:text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-70 leading-none">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security & Audit Row */}
          {!isGuest && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              {/* Vault Security Code Card */}
              <div className="card glass p-8 border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                      <Shield size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight">Vault Security ID</h3>
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none">Your Private Recovery Access</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVaultID(!showVaultID)}
                    className="p-1.5 rounded-lg bg-[var(--surface-glass)] text-[var(--text-secondary)] hover:text-blue-400 hover:bg-blue-500/10 transition-all border border-[var(--border)]"
                    title={showVaultID ? "Hide Security Code" : "Show Security Code"}
                  >
                    {showVaultID ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="bg-[var(--surface-glass)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center space-y-3">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-2">Active Vault Code</p>
                    <div className="flex items-center space-x-2">
                      {showVaultID ? (
                        <span className="text-3xl font-mono font-black text-blue-400 tracking-[0.15em] drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                          {(() => {
                            const code = userProfile?.security_code || '';
                            if (code.length === 9) {
                              return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
                            }
                            return code || '--------';
                          })()}
                        </span>
                      ) : (
                        <div className="flex space-x-2">
                          {[1, 2, 3].map(group => (
                            <div key={group} className="flex space-x-1.5 items-center">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-3 h-3 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]" />
                              ))}
                              {group < 3 && <div className="w-2 h-0.5 bg-blue-500/20 rounded-full mx-1" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2 text-[9px] text-[var(--text-secondary)] font-medium bg-blue-500/5 p-2.5 rounded-xl border border-blue-500/10">
                  <Lock size={10} className="text-blue-400 shrink-0" />
                  <span className="leading-tight">This code is required for vault recovery and nominee linking. Keep it shared ONLY with trusted legacy contacts.</span>
                </div>
              </div>

              {/* Audit Trail Card */}
              <div className="card glass p-8 border border-[var(--border)] relative overflow-hidden flex flex-col min-h-[320px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                      <History size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight">Security Audit Trail</h3>
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none">Real-time Activity Logging</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live Monitor</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                  <LoginAuditTable mini={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div >
    );
  };

  const renderAssets = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter">Asset Management</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm md:text-base">Full inventory of your global physical and digital wealth.</p>
          </div>
          <div className="flex space-x-3">
            {!activeAccount && (
              <button onClick={() => guardedStartAdding('Credit Card')} className="btn-secondary px-4 md:px-6 py-2.5 md:py-3 flex items-center space-x-2 text-xs md:text-sm whitespace-nowrap">
                <CreditCard size={18} />
                <span>Add Card</span>
              </button>
            )}
            {!activeAccount && (
              <>
                <button onClick={() => guardedStartAdding(null)} className="btn-primary px-4 md:px-6 py-2.5 md:py-3 flex items-center space-x-2 text-xs md:text-sm whitespace-nowrap">
                  <Plus size={20} />
                  <span>Register Asset</span>
                </button>
                {assetFilter === 'Investment' && (
                  <button onClick={() => setShowMFSync(true)} className="px-4 md:px-6 py-2.5 md:py-3 bg-[var(--primary)] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center space-x-2 text-xs md:text-sm whitespace-nowrap">
                    <RefreshCw size={18} />
                    <span>Sync Portfolio</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-px overflow-x-auto custom-scrollbar flex-1 no-scrollbar">
            {[
              { id: 'All Assets', label: 'All Assets' },
              { id: 'Property', label: 'Real Estate' },
              { id: 'Bank Account', label: 'Banking' },
              { id: 'Credit Card', label: 'Cards' },
              { id: 'Investment', label: 'Investments' },
              { id: 'Vehicle', label: 'Vehicles' },
              { id: 'Collectible', label: 'Collectibles' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAssetFilter(tab.id)}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${assetFilter === tab.id ? 'border-[var(--primary)] text-[var(--text-primary)] bg-[var(--surface-glass)] rounded-t-xl' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search assets or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-glass)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] transition-all transition-colors"
            />
          </div>
        </div >

        <div id="asset-list-container" className="card glass overflow-hidden border border-[var(--border)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--surface-glass)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Description</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Category</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Security Check</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {assets.filter(asset => {
                // Category Tab Filter
                let tabMatch = false;
                if (assetFilter === 'All Assets') tabMatch = true;
                else tabMatch = asset.category === assetFilter;

                if (!tabMatch) return false;

                // Search Query Filter
                if (searchQuery.trim().length > 0) {
                  const lowQuery = searchQuery.toLowerCase();
                  const titleMatch = asset.title?.toLowerCase().includes(lowQuery);
                  const catMatch = asset.category?.toLowerCase().includes(lowQuery);
                  const metaVals = Object.values(asset.metadata || {}).map(String).join(' ').toLowerCase();
                  const metaMatch = metaVals.includes(lowQuery);

                  return titleMatch || catMatch || metaMatch;
                }

                return true;
              }).map((asset, i) => (
                <tr
                  key={asset.asset_id}
                  className="hover:bg-[var(--surface-glass)] transition-colors group cursor-pointer"
                  onClick={() => setSelectedCard(asset)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[var(--surface-glass)] rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shadow-inner">
                        {asset.category === 'Credit Card' ? <CreditCard size={18} /> : asset.category === 'Bank Account' ? <Building size={18} /> : asset.category === 'Vehicle' ? <Car size={18} /> : <FileText size={18} />}
                      </div>
                      <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {asset.title?.startsWith('New ') && asset.metadata?.makeModel ? asset.metadata.makeModel : asset.title?.startsWith('New ') && asset.metadata?.itemDescription ? asset.metadata.itemDescription : asset.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start space-y-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{asset.category}</span>
                      <div className="flex flex-wrap gap-2">
                        {asset.category === 'Credit Card' && asset.metadata?.cardType && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-widest border border-[var(--primary)]/20">
                            {asset.metadata.cardType} Card
                          </span>
                        )}
                        {asset.category === 'Credit Card' && asset.metadata?.network && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--surface-glass)] text-[var(--text-secondary)] uppercase tracking-widest border border-[var(--border)]">
                            {asset.metadata.network}
                          </span>
                        )}
                        {asset.category === 'Bank Account' && asset.metadata?.accountType && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-widest border border-[var(--primary)]/20">
                            {asset.metadata.accountType}
                          </span>
                        )}
                        {asset.category === 'Vehicle' && asset.metadata?.vehicleType && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-widest border border-[var(--primary)]/20">
                            {asset.metadata.vehicleType}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 uppercase tracking-widest">
                      {asset.is_encrypted ? 'Encrypted' : 'Secure'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end space-x-2">
                    <div className="flex space-x-2">
                      {!activeAccount && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAsset(asset);
                            }}
                            className="text-[var(--text-secondary)] hover:text-blue-500 transition-all p-2 rounded-lg hover:bg-[var(--surface-glass)]"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAsset(asset.asset_id);
                            }}
                            className="text-[var(--text-secondary)] hover:text-red-500 transition-all p-2 rounded-lg hover:bg-[var(--surface-glass)]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="text-[var(--text-secondary)] opacity-30 group-hover:text-[var(--primary)] transition-all p-2 rounded-lg group-hover:translate-x-1">
                      <ChevronRight size={20} />
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-[var(--text-secondary)] font-medium opacity-50 uppercase tracking-widest text-xs">Your vault is empty.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AnimatePresence>
          {selectedCard && (
            <AssetDetailOverlay
              asset={selectedCard}
              onClose={() => setSelectedCard(null)}
              fetchAIStats={fetchAIStats}
              benefitsLoading={benefitsLoading}
              userName={userProfile?.full_name || user?.user?.name || user?.name}
              onDelete={activeAccount ? null : handleDeleteAsset}
              onEdit={activeAccount ? null : handleEditAsset}
              isReadOnly={!!activeAccount}
            />
          )}
        </AnimatePresence>

        <DataSyncModal
          isOpen={showMFSync}
          onClose={() => setShowMFSync(false)}
          onSyncComplete={() => fetchAssets()}
          userToken={user.token}
          syncCategory={assetFilter}
        />
      </motion.div >
    );
  };

  const renderInsurance = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter">Insurance Policies</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm md:text-base">Consolidated view of all risk management and coverage.</p>
          </div>
          <button onClick={() => guardedStartAdding('Insurance')} className="btn-primary px-6 py-3 flex items-center space-x-2 w-full md:w-auto justify-center">
            <Plus size={20} />
            <span>Add Coverage</span>
          </button>
        </div>

        {assets.filter(a => a.category === 'Insurance').length > 0 && (
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-6 flex items-center justify-between mb-8 shadow-inner overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-full bg-amber-400/5 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-700" />
            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg border border-amber-400/10">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-amber-400 text-lg leading-tight uppercase tracking-tight">Policies Overview</h3>
                <p className="text-amber-400/60 text-sm font-medium">You have {assets.filter(a => a.category === 'Insurance').length} insurance {assets.filter(a => a.category === 'Insurance').length === 1 ? 'policy' : 'policies'} registered.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assets.filter(a => a.category === 'Insurance').map((policy, i) => (
            <motion.div
              key={policy.asset_id}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedCard(policy)}
              className="card glass p-8 border-t-4 border-t-[var(--primary)] relative overflow-hidden group shadow-2xl cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-14 h-14 bg-[var(--surface-glass)] rounded-2xl flex items-center justify-center border border-[var(--border)] text-[var(--primary)] shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <div className="flex space-x-1">
                  {!activeAccount && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEditAsset(policy); }} className="p-2 text-[var(--text-secondary)] hover:text-blue-500 transition-colors rounded-lg hover:bg-[var(--surface-glass)]">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: policy.asset_id }); }} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors rounded-lg hover:bg-[var(--surface-glass)]">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight group-hover:text-[var(--primary)] transition-colors">{policy.title}</h3>
              <p className="text-[10px] uppercase font-black text-[var(--primary)] tracking-[0.2em] mb-8 opacity-80">{policy.metadata?.provider || policy.category}</p>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[var(--border)] relative z-10">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-1 opacity-50">Coverage</p>
                  <p className="text-lg font-black text-[var(--text-primary)] tabular-nums">{policy.metadata?.coverageAmount || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mb-1 opacity-50">Premium</p>
                  <p className="text-lg font-black text-[var(--text-primary)] tabular-nums">{policy.metadata?.premium || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-8 pt-4 bg-[var(--surface-glass)] rounded-xl px-4 py-3 flex justify-between items-center border border-[var(--border)] relative z-10">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-50">Policy No</span>
                <span className="text-xs font-black text-amber-500 tabular-nums uppercase tracking-widest">{policy.metadata?.policyNumber || '••••••••'}</span>
              </div>
            </motion.div>
          ))}
          {assets.filter(a => a.category === 'Insurance').length === 0 && (
            <div className="col-span-full py-20 text-center text-[var(--text-secondary)] font-medium bg-[var(--surface-glass)] rounded-[2rem] border-2 border-dashed border-[var(--border)] uppercase tracking-[0.2em] text-xs">
              No insurance policies found. Secure your foundations today.
            </div>
          )}
        </div>
        <AnimatePresence>
          {selectedCard && (
            <AssetDetailOverlay
              asset={selectedCard}
              onClose={() => setSelectedCard(null)}
              fetchAIStats={fetchAIStats}
              benefitsLoading={benefitsLoading}
              userName={userProfile?.full_name || user?.user?.name || user?.name}
              onDelete={activeAccount ? null : handleDeleteAsset}
              onEdit={activeAccount ? null : handleEditAsset}
              isReadOnly={!!activeAccount}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderCredentials = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter">Login Credentials</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm md:text-base">Secure password vault with zero-knowledge architecture.</p>
          </div>
          <button onClick={() => guardedStartAdding('Password')} className="btn-primary flex items-center space-x-2 px-6 py-3 w-full md:w-auto justify-center">
            <Plus size={20} />
            <span>Add Credential</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.filter(a => a.category === 'Password').map((cred, i) => (
            <div key={cred.asset_id} onClick={() => setSelectedCard(cred)} className="card glass p-6 border-b-4 border-b-[var(--primary)] hover:translate-y-[-4px] transition-all group overflow-hidden relative shadow-2xl cursor-pointer">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center space-x-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-[var(--surface-glass)] text-[var(--primary)] border border-[var(--border)] rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                  {cred.title?.[0] || '?'}
                </div>
                <div className="flex-1 truncate">
                  <h3 className="font-black text-[var(--text-primary)] leading-tight truncate tracking-tight group-hover:text-[var(--primary)] transition-colors">{cred.title}</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest opacity-50">{cred.metadata?.url || cred.metadata?.siteName || 'Saved Credential'}</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
                  <p className="text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-widest mb-1 opacity-50">Identity / Username</p>
                  <span className="font-bold text-sm text-[var(--text-primary)] tracking-tight">{cred.metadata?.username || cred.metadata?.email || '—'}</span>
                </div>

                <div className="bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
                  <p className="text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-widest mb-1 opacity-50">Secure Password</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--text-primary)] tracking-[0.2em]">{showPassword[cred.asset_id] ? (cred.metadata?.password || '••••••••') : '••••••••'}</span>
                    <div className="flex space-x-1">
                      <button onClick={(e) => { e.stopPropagation(); togglePassword(cred.asset_id); }} className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors p-1.5 hover:bg-[var(--surface-glass)] rounded-lg">
                        {showPassword[cred.asset_id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between relative z-10">
                <div className="flex space-x-2">
                  {!activeAccount && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEditAsset(cred); }} className="p-2 text-[var(--text-secondary)] hover:text-blue-500 transition-colors rounded-lg hover:bg-[var(--surface-glass)]">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: cred.asset_id }); }} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors rounded-lg hover:bg-[var(--surface-glass)]">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-80 flex items-center">
                  <ShieldCheck size={10} className="mr-1" />
                  {cred.is_encrypted ? 'Encrypted' : 'Secure'}
                </span>
              </div>
            </div>
          ))}
          {assets.filter(a => a.category === 'Password').length === 0 && (
            <div className="col-span-full py-20 text-center text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] text-xs opacity-50 border-2 border-dashed border-[var(--border)] rounded-[2rem]">
              No credentials saved yet.
            </div>
          )}
        </div>
        <AnimatePresence>
          {selectedCard && (
            <AssetDetailOverlay
              asset={selectedCard}
              onClose={() => setSelectedCard(null)}
              fetchAIStats={fetchAIStats}
              benefitsLoading={benefitsLoading}
              userName={userProfile?.full_name || user?.user?.name || user?.name}
              onDelete={activeAccount ? null : handleDeleteAsset}
              onEdit={activeAccount ? null : handleEditAsset}
              isReadOnly={!!activeAccount}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderLegal = () => {
    return (
      <LegalCenterLayout 
        user={user} 
        assets={assets.filter(a => a.category === 'Legal Document')} 
        onRefresh={fetchAssets} 
      />
    );
  };

  const renderContacts = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Legacy Contacts</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium">Designated heirs, professional advisors, and emergency responders.</p>
          </div>
          <button onClick={() => guardedStartAdding('Contact')} className="btn-primary flex items-center space-x-2 px-6 py-3">
            <Users size={20} />
            <span>Add Contact</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assets.filter(a => a.category === 'Contact' || a.category === 'Nominee').map((contact, i) => (
            <div key={contact.asset_id} className="card glass p-8 group hover:translate-y-[-4px] transition-all relative overflow-hidden shadow-2xl cursor-pointer" onClick={() => setSelectedCard(contact)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  {(contact.metadata?.name || contact.title)?.[0] || '?'}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                    {contact.metadata?.role || contact.category}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleEditAsset(contact); }} className="p-2 text-[var(--text-secondary)] hover:text-blue-500 transition-colors rounded-lg hover:bg-[var(--surface-glass)]">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(contact.asset_id); }} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors rounded-lg hover:bg-[var(--surface-glass)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1 tracking-tight group-hover:text-[var(--primary)] transition-colors">{contact.metadata?.name || contact.title}</h3>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-6 opacity-60">{contact.metadata?.relationship || contact.metadata?.relation || '\u2014'}</p>

              <div className="space-y-3 relative z-10">
                {contact.metadata?.email && (
                  <div className="flex items-center text-sm text-[var(--text-primary)] font-bold tracking-tight">
                    <Mail size={16} className="mr-3 text-[var(--primary)] opacity-70" /> {contact.metadata.email}
                  </div>
                )}
                {contact.metadata?.phone && (
                  <div className="flex items-center text-sm text-[var(--text-primary)] font-bold tracking-tight">
                    <Smartphone size={16} className="mr-3 text-[var(--primary)] opacity-70" /> {contact.metadata.phone}
                  </div>
                )}
              </div>
            </div>
          ))}
          {assets.filter(a => a.category === 'Contact' || a.category === 'Nominee').length === 0 && (
            <div className="col-span-full py-20 text-center text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] text-xs opacity-50 border-2 border-dashed border-[var(--border)] rounded-[2rem]">
              No contacts added yet.
            </div>
          )}
        </div>
        <AnimatePresence>
          {selectedCard && (
            <AssetDetailOverlay
              asset={selectedCard}
              onClose={() => setSelectedCard(null)}
              fetchAIStats={fetchAIStats}
              benefitsLoading={benefitsLoading}
              userName={userProfile?.full_name || user?.user?.name || user?.name}
              onDelete={activeAccount ? null : handleDeleteAsset}
              onEdit={activeAccount ? null : handleEditAsset}
              isReadOnly={!!activeAccount}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderSettings = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 w-full" id="settings-section">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Vault Settings</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium">Configure your personal security and distribution protocols.</p>
          </div>
          <button
            onClick={() => { if (OnboardingTour.restartTour) OnboardingTour.restartTour(); }}
            className="btn-secondary px-6 py-3 flex items-center space-x-2 text-xs font-black uppercase tracking-widest"
          >
            <RefreshCw size={14} />
            <span>Restart Tour</span>
          </button>
        </div>

        <div className="space-y-8">
          <div className="card glass p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-6 relative z-10">
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Personal Profile</h3>
              {!settingsEditing ? (
                <button onClick={() => setSettingsEditing(true)} className="text-[var(--primary)] font-black text-xs uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-colors">Edit Identity</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setSettingsEditing(false)} className="text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)] transition-colors">Cancel</button>
                  <button onClick={handleSettingsSave} disabled={settingsSaving} className="btn-primary text-xs px-6 py-2 uppercase tracking-widest font-black">
                    {settingsSaving ? 'Syncing...' : 'Save Profile'}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Full Name</label>
                {settingsEditing ? (
                  <input type="text" className="input-field" value={settingsForm.full_name} onChange={e => setSettingsForm({ ...settingsForm, full_name: e.target.value })} />
                ) : (
                  <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{userProfile?.full_name || '—'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Email Address {userProfile?.is_verified && <span className="text-emerald-400 inline-flex items-center gap-1 ml-2"><CheckCircle size={10} className="inline" /> Verified</span>}</label>
                <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl opacity-70 cursor-not-allowed shadow-inner">{userProfile?.email || '—'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Phone {userProfile?.is_verified && <span className="text-emerald-400 inline-flex items-center gap-1 ml-2"><CheckCircle size={10} className="inline" /> Verified</span>}</label>
                <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl opacity-70 cursor-not-allowed shadow-inner">{userProfile?.mobile || '—'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Gender Identity</label>
                {settingsEditing ? (
                  <select className="input-field cursor-pointer" value={settingsForm.gender} onChange={e => setSettingsForm({ ...settingsForm, gender: e.target.value })}>
                    <option value="" className="bg-[var(--surface)]">Select gender</option>
                    <option value="Male" className="bg-[var(--surface)]">Male</option>
                    <option value="Female" className="bg-[var(--surface)]">Female</option>
                    <option value="Non-Binary" className="bg-[var(--surface)]">Non-Binary</option>
                    <option value="Prefer Not to Say" className="bg-[var(--surface)]">Prefer Not to Say</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{userProfile?.gender || <span className="text-amber-400 opacity-60">Not set</span>}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Date of Birth</label>
                {settingsEditing ? (
                  <input type="date" className="input-field invert-calendar-icon" value={settingsForm.dob} onChange={e => setSettingsForm({ ...settingsForm, dob: e.target.value })} max={new Date().toISOString().split('T')[0]} />
                ) : (
                  <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-amber-400 opacity-60">Not set</span>}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Global Address</label>
                {settingsEditing ? (
                  <textarea className="input-field" rows={2} value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                ) : (
                  <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{userProfile?.address || <span className="text-amber-400 opacity-60">Not set</span>}</p>
                )}
              </div>
            </div>
          </div>

          {/* Nominee Card */}
          <div className="card glass p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-6 relative z-10">
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Legacy Contact / Nominee</h3>
              {nominee ? (
                !nomineeEditing ? (
                  <button onClick={() => setNomineeEditing(true)} className="text-[var(--primary)] font-black text-xs uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-colors">Edit Contact</button>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={() => setNomineeEditing(false)} className="text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)] transition-colors">Cancel</button>
                    <button onClick={handleNomineeSave} disabled={nomineeSaving} className="btn-primary text-xs px-6 py-2 uppercase tracking-widest font-black">
                      {nomineeSaving ? 'Syncing...' : 'Save Changes'}
                    </button>
                  </div>
                )
              ) : (
                <button onClick={() => setShowNomineeModal(true)} className="btn-primary text-xs px-6 py-2 flex items-center space-x-2 uppercase tracking-widest font-black">
                  <Plus size={16} /><span>Add Nominee</span>
                </button>
              )}
            </div>
            {nominee ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Legal Full Name</label>
                  {nomineeEditing ? (
                    <input type="text" className="input-field" value={nomineeForm.full_name} onChange={e => setNomineeForm({ ...nomineeForm, full_name: e.target.value })} />
                  ) : (
                    <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{nominee.full_name || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Communication Email</label>
                  {nomineeEditing ? (
                    <input type="email" className="input-field" value={nomineeForm.email} onChange={e => setNomineeForm({ ...nomineeForm, email: e.target.value })} />
                  ) : (
                    <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{nominee.email || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Emergency Phone</label>
                  {nomineeEditing ? (
                    <input type="tel" className="input-field" value={nomineeForm.mobile} onChange={e => setNomineeForm({ ...nomineeForm, mobile: e.target.value })} />
                  ) : (
                    <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{nominee.mobile || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 opacity-50">Relationship Link</label>
                  {nomineeEditing ? (
                    <select className="input-field cursor-pointer" value={nomineeForm.relationship} onChange={e => setNomineeForm({ ...nomineeForm, relationship: e.target.value })}>
                      <option value="" className="bg-[var(--surface)]">Select</option>
                      <option value="Spouse" className="bg-[var(--surface)]">Spouse</option>
                      <option value="Parent" className="bg-[var(--surface)]">Parent</option>
                      <option value="Child" className="bg-[var(--surface)]">Child</option>
                      <option value="Sibling" className="bg-[var(--surface)]">Sibling</option>
                      <option value="Friend" className="bg-[var(--surface)]">Friend</option>
                      <option value="Business Partner" className="bg-[var(--surface)]">Business Partner</option>
                      <option value="Legal Advisor" className="bg-[var(--surface)]">Legal Advisor</option>
                      <option value="Other" className="bg-[var(--surface)]">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-[var(--text-primary)] py-4 px-6 bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl shadow-inner">{nominee.relationship || '—'}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 relative z-10">
                <div className="w-16 h-16 bg-[var(--surface-glass)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border)] shadow-inner">
                  <Users size={28} className="text-[var(--primary)]" />
                </div>
                <p className="text-[var(--text-primary)] font-black uppercase tracking-[0.3em] text-xs opacity-50 mb-2">The empty chair.</p>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Add a trusted person who can access your vault.</p>
              </div>
            )}
          </div>

          <div className="card glass p-8 relative overflow-hidden">
            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8 border-b border-[var(--border)] pb-6">Security Configuration</h3>
            <div className="space-y-8">
              <div className="bg-[var(--surface-glass)] border border-[var(--border)] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between group hover:border-[var(--primary)] transition-all">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className="w-16 h-16 bg-[var(--surface-glass)] rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl border border-[var(--border)]">
                    <Smartphone size={32} />
                  </div>
                  <div>
                    <p className="font-black text-[var(--text-primary)] tracking-tight">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">Currently enabled via Authy App.</p>
                  </div>
                </div>
                <button className="text-[var(--primary)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">Manage</button>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-[var(--border)] mt-6">
                <div>
                  <p className="font-black text-[var(--text-primary)] tracking-tight">Guardian Protocol</p>
                  <p className="text-xs text-[var(--text-secondary)] font-medium whitespace-pre">Require approvals from 2 contacts for sensitive changes.</p>
                </div>
                <div className="w-12 h-6 bg-[var(--primary)] rounded-full relative px-1 flex items-center cursor-pointer shadow-lg shadow-blue-500/20">
                  <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-[var(--border)] mt-2">
                <div>
                  <p className="font-black text-[var(--text-primary)] tracking-tight">Zero-Knowledge Key</p>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Regenerate your master hardware encryption key.</p>
                </div>
                <button className="text-[var(--primary)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">Rotate Keys</button>
              </div>


            </div>
          </div>

          <div className="card glass p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Vault Distribution</h3>
              {!vaultPolicyEditing ? (
                <button onClick={() => setVaultPolicyEditing(true)} className="text-[var(--primary)] font-black text-xs uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-colors">Adjust Protocol</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setVaultPolicyEditing(false)} className="text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)] transition-colors">Cancel</button>
                  <button onClick={handleVaultPolicySave} disabled={vaultPolicySaving} className="btn-primary text-xs px-6 py-2 uppercase tracking-widest font-black">
                    {vaultPolicySaving ? 'Syncing...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed font-medium relative z-10">Define how access is granted to your heirs in the event of an emergency or long-term inactivity.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Inactivity Trigger</label>
                  <span className="text-amber-500 font-extrabold tabular-nums tracking-widest uppercase text-xs">
                    {vaultPolicyForm.inactivity_trigger_period} Months
                  </span>
                </div>
                {vaultPolicyEditing ? (
                  <select
                    className="input-field"
                    value={vaultPolicyForm.inactivity_trigger_period}
                    onChange={e => setVaultPolicyForm({ ...vaultPolicyForm, inactivity_trigger_period: parseInt(e.target.value) })}
                  >
                    <option value={6}>6 Months (High Security)</option>
                    <option value={9}>9 Months (Standard)</option>
                    <option value={12}>12 Months (Extended)</option>
                    <option value={24}>24 Months (Legacy)</option>
                  </select>
                ) : (
                  <div className="w-full h-1.5 bg-[var(--surface-glass)] rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vaultPolicyForm.inactivity_trigger_period / 24) * 100}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Reminder Interval</label>
                  <span className="text-blue-500 font-extrabold tabular-nums tracking-widest uppercase text-xs">
                    Every {vaultPolicyForm.reminder_interval} Months
                  </span>
                </div>
                {vaultPolicyEditing ? (
                  <select
                    className="input-field"
                    value={vaultPolicyForm.reminder_interval}
                    onChange={e => setVaultPolicyForm({ ...vaultPolicyForm, reminder_interval: parseInt(e.target.value) })}
                  >
                    <option value={1}>1 Month (High Frequency)</option>
                    <option value={3}>3 Months (Standard)</option>
                    <option value={6}>6 Months (Low Frequency)</option>
                  </select>
                ) : (
                  <div className="w-full h-1.5 bg-[var(--surface-glass)] rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vaultPolicyForm.reminder_interval / 6) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3 relative z-10">
              <Shield size={16} className="text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed uppercase tracking-wider">
                If you don't login for {vaultPolicyForm.inactivity_trigger_period} months, your nominees will be notified. We will send you reminders every {vaultPolicyForm.reminder_interval} months.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSecurity = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      );
    }
    return <LoginAuditTable />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'assets':
        return renderAssets();
      case 'insurance':
        return renderInsurance();
      case 'credentials':
        return renderCredentials();
      case 'legal':
        return renderLegal();
      case 'contacts':
        return renderContacts();
      case 'settings':
        return renderSettings();
      case 'security':
        return renderSecurity();
      default:
        return null;
    }
  };

  const handleTourStepChange = (stepIndex) => {
    // Joyride step indices (0-3):
    // 0: Dashboard Overview
    // 1: Asset Vault
    // 2: Add Resource
    // 3: Profile Menu

    if (stepIndex === 1) {
      setActiveTab('assets');
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[var(--bg-app)] overflow-hidden">
      <OnboardingTour
        user={user}
        isSessionOnboarded={isSessionOnboarded}
        onComplete={handleTourComplete}
        onStepChange={handleTourStepChange}
      />

      {/* Search Overlay for Mobile */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <AnimatePresence>
        {showFirstAssetWizard && (
          <FirstAssetWizard
            onSelectCategory={(cat) => {
              setShowFirstAssetWizard(false);
              guardedStartAdding(cat);
            }}
            onDismiss={() => {
              setShowFirstAssetWizard(false);
              localStorage.setItem('stardust_first_asset_dismissed', 'true');
            }}
          />
        )}
        {showCelebration && (
          <CelebrationScreen
            onContinue={() => setShowCelebration(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar: Fixed height, no scroll on its own unless needed */}
      <aside
        className={`hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-500 relative z-50 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto custom-scrollbar no-scrollbar min-h-0">
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full bg-[var(--bg-app)] relative overflow-hidden">
        {/* Top Header: Stays fixed at top */}
        <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] rounded-xl"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-[var(--surface-glass)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell Removed as requested */}

            <div className="h-10 w-px bg-[var(--border)] mx-2 hidden md:block" />

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-[var(--text-primary)] leading-none">
                  {user?.user?.name || 'Vault Holder'}
                </p>
                <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest mt-1">
                  {user?.user?.role || 'Customer'}
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--primary)] to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20"
              >
                {user?.user?.name ? user.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'VH'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace Area */}
        <div className={`flex-1 relative min-h-0 ${activeTab === 'legal' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`} >
          {/* Onboarding Banner (Minimalist) */}
          {!isGuest && (!completionStats.is_complete || !nominee) && (
            <div className="bg-[var(--surface)] border-b border-[var(--primary)]/10 px-6 md:px-10 py-2.5 flex items-center justify-between relative z-30 shadow-lg">
              <div className="flex items-center space-x-3 text-[var(--text-primary)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                  <AlertTriangle size={16} />
                </div>
                <span className="text-[11px] font-bold leading-tight opacity-90">
                  Action Required: Please complete your 
                  {!completionStats.is_complete && " profiles"}
                  {!completionStats.is_complete && !nominee && " &"}
                  {!nominee && " nominee onboarding"} 
                </span>
              </div>
              <button 
                onClick={() => !completionStats.is_complete ? setShowProfilePrompt(true) : setShowNomineeModal(true)}
                className="ml-4 px-4 py-1.5 bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-[var(--primary-hover)] transition-all active:scale-95 whitespace-nowrap"
              >
                Finish Now
              </button>
            </div>
          )}

          {/* Status Banners */}
          {
            userProfile && !userProfile.is_verified && !activeAccount && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-10 py-3 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <span className="text-sm font-bold text-amber-500">Security Pulse Required: Verify your device to unlock Vault Asset Creation.</span>
                </div>
                <button
                  onClick={() => {
                    showToast('Please sign out and sign back in to receive your security pulse.', 'success');
                    setTimeout(() => onLogout(), 3000);
                  }}
                  className="px-4 py-1.5 bg-amber-500 text-amber-950 font-black text-xs uppercase tracking-widest rounded-lg"
                >
                  Verify Now
                </button>
              </div>
            )
          }

          {
            activeAccount && (
              <div className="bg-emerald-600 px-10 py-2 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3 text-white">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Viewing Legacy Vault: {activeAccount.full_name}</span>
                </div>
                <button onClick={() => switchAccount(null)} className="px-4 py-1.5 bg-white text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-lg">Return to My Vault</button>
              </div>
            )
          }

          {/* Main Content */}
          <div className="md:px-8 px-4 py-6 mb-20 md:mb-0">
            <AnimatePresence mode="wait">
              {isAdding ? (
                <motion.div key="add-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {addingCategory ? (
                    <UniversalVaultForm
                      category={addingCategory}
                      initialData={editingAsset}
                      showToast={showToast}
                      onCancel={() => { cancelAdding(); setEditingAsset(null); }}
                      onSave={() => { 
                        const isFirstAsset = assets.length === 0 && !editingAsset;
                        fetchAssets(); 
                        cancelAdding(); 
                        setEditingAsset(null); 
                        if (isFirstAsset && !localStorage.getItem('stardust_feedback_shown')) {
                           setShowFeedbackModal(true);
                           localStorage.setItem('stardust_feedback_shown', 'true');
                        }
                      }}
                    />
                  ) : (
                    <CategoryPicker onSelect={(cat) => setAddingCategory(cat)} onCancel={cancelAdding} />
                  )}
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {renderContent()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom spacer for mobile nav */}
          <div className="h-32 md:hidden" />
        </div>
      </main>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[260px] bg-[var(--surface)] border-r border-[var(--border)] z-[120] md:hidden p-6 overflow-y-auto custom-scrollbar min-h-0"
            >
              <div className="flex flex-col h-full">
                {renderSidebarContent(true)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={(tab) => {
        if (tab === 'quick-add') {
          guardedStartAdding();
        } else {
          setActiveTab(tab);
        }
      }} />

      {showNomineeModal && (
        <NomineeSetupModal
          onClose={() => {
            setShowNomineeModal(false);
            localStorage.setItem('stardust_nominee_prompt_dismissed', 'true');
          }}
          onComplete={(newNominee) => {
            setNominee(newNominee);
            setShowNomineeModal(false);
            showToast('Nominee protection protocol active.', 'success');
          }}
          user={user}
        />
      )}

      <VaultConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Delete Asset"
        message="Are you sure you want to permanently delete this asset? This action is IRREVERSIBLE and the encryption keys will be purged."
        confirmText="Purge Asset"
        type="danger"
      />

      <VaultConfirm
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        title="Secure Logout"
        message="Are you sure you want to terminate your current vault session? You will need to re-authenticate to access your secured assets."
        confirmText="Logout Now"
        type="danger"
      />


      <ManualClaimModal
        isOpen={showManualClaimModal}
        onClose={() => setShowManualClaimModal(false)}
        onVerified={(vaultData) => {
          console.log('Nominee verified, vault access granted:', vaultData);
          showToast('Identity confirmed. Vault access granted.', 'success');
          // In a real scenario, this would redirect or refresh the view with the retrieved data
        }}
        user={user}
      />

      {showProfilePrompt && (
        <ProfileCompletionModal
          onClose={() => setShowProfilePrompt(false)}
          onComplete={() => {
            setShowProfilePrompt(false);
            fetchProfileCompletion();
            showToast('Profile security clearance granted. Vault unlocked.', 'success');
          }}
          user={user}
        />
      )}

      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAccountAdded={() => {
          fetchInheritedAccounts();
          setShowAddAccountModal(false);
        }}
      />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </div >
  );
};

export default DashboardPage;