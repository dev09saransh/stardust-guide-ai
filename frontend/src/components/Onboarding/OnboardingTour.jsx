import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, PlusCircle, Bell, Settings, UserCircle, PartyPopper, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * OnboardingTour — Guided product walkthrough for first-time users.
 * Uses react-joyride with a custom purple-themed tooltip.
 *
 * Props:
 *   user   — { token, user: { id, has_completed_onboarding } }
 *   onComplete — optional callback after tour finishes
 */

const API = process.env.REACT_APP_API_URL || 'http://13.126.194.9:5001/api';

const TOUR_STEPS = [
    {
        target: '#dashboard-section',
        title: 'Your Dashboard',
        content: 'Welcome! This is your command center — see all your assets, security status, and activity at a glance.',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        target: '#asset-list-container',
        title: 'Your Asset Vault',
        content: 'This is where all your secured items live. You can see their encryption status and manage them individually.',
        placement: 'top',
    },
    {
        target: '#add-resource-btn',
        title: 'Add Your First Asset',
        content: 'Tap here to securely store credit cards, bank accounts, insurance, documents, and more.',
        placement: 'bottom',
    },
    {
        target: '#profile-menu',
        title: 'Your Profile & Menu',
        content: 'Sign in, manage settings, and view your identity from this menu.',
        placement: 'top',
    },
];

// Custom tooltip component with purple accent
const CustomTooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    size,
    isLastStep,
    skipProps,
}) => (
    <div
        {...tooltipProps}
        style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '16px 14px 12px',
            maxWidth: '320px',
            width: 'calc(100vw - 32px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)',
            fontFamily: "'Inter', sans-serif",
            margin: '0 8px',
        }}
    >
        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
                {Array.from({ length: size }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            width: i === index ? '20px' : '6px',
                            height: '6px',
                            borderRadius: '3px',
                            background: i === index ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.6 }}>
                Step {index + 1} / {size}
            </span>
        </div>

        {/* Title */}
        {step.title && (
            <h3 style={{
                fontSize: '16px',
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: '0 0 6px 0',
                lineHeight: 1.3,
            }}>
                {step.title}
            </h3>
        )}

        {/* Description */}
        <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0 0 16px 0',
            fontWeight: 500,
        }}>
            {step.content}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
                {...skipProps}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '6px 0',
                }}
            >
                Skip Tour
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
                {index > 0 && (
                    <button
                        {...backProps}
                        style={{
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            color: '#374151',
                            fontSize: '13px',
                            fontWeight: 700,
                            padding: '10px 18px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        Back
                    </button>
                )}
                <button
                    {...primaryProps}
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: '10px 22px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                        transition: 'all 0.2s',
                    }}
                >
                    {isLastStep ? <><CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Finish</> : <>Next <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
                </button>
            </div>
        </div>
    </div>
);

const OnboardingTour = ({ user, isSessionOnboarded, onComplete, onStepChange }) => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const { openAuthModal, isAuthenticated } = useAuth();

    useEffect(() => {
        const carouselComplete = localStorage.getItem('stardust_onboarded') === 'true' || isSessionOnboarded;
        const sessionTourSeen = localStorage.getItem('stardust_tour_seen') === 'true';

        // Auto-start tour ONLY IF carousel is complete AND tour hasn't been seen yet
        if (carouselComplete && !sessionTourSeen && (!user?.user || !user.user.has_completed_onboarding)) {
            const timer = setTimeout(() => setRun(true), 800);
            return () => clearTimeout(timer);
        }
    }, [user, isSessionOnboarded]);

    const markOnboardingComplete = useCallback(async () => {
        localStorage.setItem('stardust_onboarded', 'true');
        localStorage.setItem('stardust_tour_seen', 'true');
        if (user?.token) {
            try {
                await axios.post(
                    `${API}/auth/complete-onboarding`,
                    {},
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
            } catch (err) {
                console.error('Failed to update onboarding status:', err);
            }
        }
    }, [user]);

    const handleJoyrideCallback = useCallback((data) => {
        const { action, index, status, type } = data;

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);

            // If we're moving to or from Assets, we need to handle the tab switch
            if (onStepChange) onStepChange(nextIndex);

            // SPECIAL FIX: If we're moving from Step 0 (Dashboard) to Step 1 (Asset Vault),
            // or Step 1 (Asset Vault) to Step 2 (Add Resource), we need to wait for the Dashboard to mount.
            if ((index === 0 && action === ACTIONS.NEXT) || (index === 1 && action === ACTIONS.NEXT) || (index === 2 && action === ACTIONS.PREV) || (index === 1 && action === ACTIONS.PREV)) {
                setRun(false);
                setTimeout(() => {
                    setStepIndex(nextIndex);
                    setRun(true);
                }, 800); // Increased delay to ensure mounting
                return;
            }
        }

        // Tour finished or skipped
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            markOnboardingComplete();
            if (onComplete) onComplete();
            if (!isAuthenticated) openAuthModal('signup');
            return;
        }

        // Step navigation
        if (type === EVENTS.STEP_AFTER) {
            if (action === ACTIONS.NEXT) {
                setStepIndex(index + 1);
            } else if (action === ACTIONS.PREV) {
                setStepIndex(index - 1);
            }
        }

        // Close button or Esc
        if (action === ACTIONS.CLOSE) {
            setRun(false);
            markOnboardingComplete();
            if (onComplete) onComplete();
            if (!isAuthenticated) openAuthModal('signup');
        }
    }, [markOnboardingComplete, onComplete, onStepChange, isAuthenticated, openAuthModal]);

    // Method to restart tour (called from Settings)
    const restartTour = useCallback(() => {
        setStepIndex(0);
        setRun(true);
    }, []);

    // Expose restart method via ref if needed
    OnboardingTour.restartTour = restartTour;

    return (
        <Joyride
            steps={TOUR_STEPS}
            run={run}
            stepIndex={stepIndex}
            continuous
            showSkipButton
            showProgress
            scrollToFirstStep
            disableOverlayClose
            spotlightClicks={true}
            disableScrolling={false}
            tooltipComponent={CustomTooltip}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    arrowColor: '#ffffff',
                    overlayColor: 'rgba(15, 23, 42, 0.65)',
                },
                spotlight: {
                    borderRadius: '20px',
                    boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.4)',
                },
                overlay: {
                    mixBlendMode: 'soft-light',
                }
            }}
            floaterProps={{
                disableAnimation: false,
                offset: 20
            }}
        />
    );
};

export default OnboardingTour;
