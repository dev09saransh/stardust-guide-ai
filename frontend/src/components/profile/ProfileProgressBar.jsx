import React from 'react';
import { motion } from 'framer-motion';

const ProfileProgressBar = ({ percentage, completedFields, totalFields }) => {
    const getColorStop = () => {
        if (percentage >= 80) return ['#10b981', '#059669'];   // green
        if (percentage >= 50) return ['#6366f1', '#8b5cf6'];   // indigo/purple
        return ['#f59e0b', '#ef4444'];                          // amber/red
    };
    const [from, to] = getColorStop();

    return (
        <div style={{ padding: '0 32px 20px' }}>
            {/* Label Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)',
                }}>
                    Profile Completion
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '15px', fontWeight: 900,
                        background: `linear-gradient(135deg, ${from}, ${to})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        {percentage}%
                    </span>
                </div>
            </div>

            {/* Track */}
            <div style={{
                height: '6px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                        height: '100%', borderRadius: '100px',
                        background: `linear-gradient(90deg, ${from}, ${to})`,
                        boxShadow: `0 0 12px ${from}60`,
                    }}
                />
            </div>
        </div>
    );
};

export default ProfileProgressBar;
