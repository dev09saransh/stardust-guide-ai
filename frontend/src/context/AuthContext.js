import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [profileCompletion, setProfileCompletion] = useState({ percentage: 0, is_complete: false });
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalTab, setAuthModalTab] = useState('login');

    // Initialize from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('stardust_token');
        const storedUser = localStorage.getItem('stardust_user');
        const onboarded = localStorage.getItem('stardust_onboarded');

        if (storedToken && storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsed);
                setIsAuthenticated(true);
            } catch (e) {
                localStorage.removeItem('stardust_token');
                localStorage.removeItem('stardust_user');
            }
        }

        if (onboarded === 'true') {
            setIsOnboarded(true);
        }

        setLoading(false);
    }, []);

    // Fetch profile completion when authenticated
    const fetchProfileCompletion = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API}/auth/profile-completion`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileCompletion(res.data);
        } catch (err) {
            console.error('Error fetching profile completion');
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchProfileCompletion();
        }
    }, [isAuthenticated, token, fetchProfileCompletion]);

    const login = (userData) => {
        localStorage.setItem('stardust_token', userData.token);
        localStorage.setItem('stardust_user', JSON.stringify(userData.user));
        setToken(userData.token);
        setUser(userData.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
    };

    const register = (userData) => {
        localStorage.setItem('stardust_token', userData.token);
        localStorage.setItem('stardust_user', JSON.stringify(userData.user));
        setToken(userData.token);
        setUser(userData.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
    };

    const logout = () => {
        localStorage.removeItem('stardust_token');
        localStorage.removeItem('stardust_user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setProfileCompletion({ percentage: 0, is_complete: false });
    };

    const completeOnboarding = () => {
        localStorage.setItem('stardust_onboarded', 'true');
        setIsOnboarded(true);
    };

    const openAuthModal = (tab = 'login') => {
        setAuthModalTab(tab);
        setShowAuthModal(true);
    };

    const closeAuthModal = () => {
        setShowAuthModal(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isOnboarded,
            profileCompletion,
            loading,
            showAuthModal,
            authModalTab,
            login,
            register,
            logout,
            completeOnboarding,
            openAuthModal,
            closeAuthModal,
            fetchProfileCompletion,
            setAuthModalTab,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;
