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
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px 24px 20px',
            maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(88, 28, 135, 0.18), 0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid rgba(147, 51, 234, 0.15)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}
    >
        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
                {Array.from({ length: size }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            width: i === index ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            background: i === index ? '#7c3aed' : i < index ? '#c4b5fd' : '#e5e7eb',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Step {index + 1} of {size}
            </span>
        </div>

        {/* Title */}
        {step.title && (
            <h3 style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#1f2937',
                margin: '0 0 8px 0',
                lineHeight: 1.3,
            }}>
                {step.title}
            </h3>
        )}

        {/* Description */}
        <p style={{
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: 1.6,
            margin: '0 0 20px 0',
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

const OnboardingTour = ({ user, onComplete, onStepChange }) => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const { openAuthModal, isAuthenticated } = useAuth();

    useEffect(() => {
        const carouselComplete = sessionStorage.getItem('stardust_session_onboarded') === 'true';
        const sessionTourSeen = sessionStorage.getItem('stardust_tour_seen') === 'true';

        // Auto-start tour ONLY IF carousel is complete AND tour hasn't been seen in this session
        if (carouselComplete && !sessionTourSeen && (!user?.user || !user.user.has_completed_onboarding)) {
            const timer = setTimeout(() => setRun(true), 800);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const markOnboardingComplete = useCallback(async () => {
        localStorage.setItem('stardust_onboarded', 'true');
        sessionStorage.setItem('stardust_tour_seen', 'true');
        if (user?.token) {
            try {
                await axios.post(
                    'http://16.170.248.196:5001/api/auth/complete-onboarding',
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
