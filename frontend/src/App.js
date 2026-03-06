import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import OnboardingCarousel from './components/Onboarding/OnboardingCarousel';
import AuthModal from './components/Auth/AuthModal';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AdminPanel from './components/Dashboard/AdminPanel';
import './App.css';

const AppContent = () => {
  const {
    user,
    token,
    isAuthenticated,
    isOnboarded,
    login,
    logout,
    completeOnboarding,
  } = useAuth();

  // Admin route interception
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <AdminPanel user={{ token, user }} onBackToApp={logout} />;
  }

  // Dashboard blur logic
  // If not onboarded (first visit), blur the dashboard behind the carousel.
  const shouldBlur = !isOnboarded;

  return (
    <div className="relative">
      {/* 1. Underlying Dashboard */}
      <div className={`transition-all duration-700 ${shouldBlur ? 'filter blur-[12px] scale-[1.02] pointer-events-none select-none brightness-50' : ''}`}>
        <DashboardPage
          user={isAuthenticated ? { token, user } : { token: null, user: { name: 'Guest', role: 'GUEST' } }}
          onLogout={logout}
          isGuest={!isAuthenticated}
        />
      </div>

      {/* 2. Informational Onboarding Carousel Overlay (No Auth Fields) */}
      <AnimatePresence>
        {!isOnboarded && (
          <OnboardingCarousel
            key="onboarding"
            onComplete={completeOnboarding}
          />
        )}
      </AnimatePresence>

      {/* 3. Global Auth Modal (Triggered on action like "Add Asset") */}
      <AuthModal />
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