import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import OnboardingCarousel from './components/Onboarding/OnboardingCarousel';
import AuthModal from './components/Auth/AuthModal';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AdminPanel from './components/Dashboard/AdminPanel';
import { VaultToast } from './components/common/VaultUI';
import './App.css';

const AppContent = () => {
  const {
    user,
    token,
    isAuthenticated,
    isOnboarded,
    logout,
    completeOnboarding,
    toast,
    setToast
  } = useAuth();

  // Onboarding logic: check sessionStorage to show only once per session
  const [sessionOnboarded, setSessionOnboarded] = React.useState(
    sessionStorage.getItem('stardust_session_onboarded') === 'true'
  );

  const handleCompleteOnboarding = () => {
    sessionStorage.setItem('stardust_session_onboarded', 'true');
    setSessionOnboarded(true);
    if (!isOnboarded) completeOnboarding();
  };

  const shouldBlur = !sessionOnboarded;

  // Admin route interception
  const dashboardUser = React.useMemo(() => (
    isAuthenticated ? { token, user } : { token: null, user: { name: 'Guest', role: 'GUEST' } }
  ), [isAuthenticated, token, user]);

  if (isAuthenticated && user?.role === 'ADMIN') {
    return <AdminPanel user={dashboardUser} onBackToApp={logout} />;
  }

  return (
    <div className="relative">
      {/* 1. Underlying Dashboard */}
      <div className={`transition-all duration-700 ${shouldBlur ? 'filter blur-[12px] scale-[1.02] pointer-events-none select-none brightness-50' : ''}`}>
        <DashboardPage
          user={dashboardUser}
          onLogout={logout}
          isGuest={!isAuthenticated}
        />
      </div>

      {/* 2. Informational Onboarding Carousel Overlay (No Auth Fields) */}
      <AnimatePresence>
        {!sessionOnboarded && (
          <OnboardingCarousel
            key="onboarding"
            onComplete={handleCompleteOnboarding}
          />
        )}
      </AnimatePresence>

      {/* 3. Global Auth Modal (Triggered on action like "Add Asset") */}
      <AuthModal />

      {/* 4. Global Toasts */}
      <VaultToast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;