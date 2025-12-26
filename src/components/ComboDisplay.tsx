// Combo and Score display with animated effects
import React, { useEffect, useState } from 'react';

interface ComboDisplayProps {
    combo: number;
    score: number;
    lastMatchPoints: number | null;
}

export const ComboDisplay: React.FC<ComboDisplayProps> = ({ combo, score, lastMatchPoints }) => {
    const [showPoints, setShowPoints] = useState(false);
    const [displayCombo, setDisplayCombo] = useState(0);
    const [comboScale, setComboScale] = useState(1);

    // Animate combo changes
    useEffect(() => {
        if (combo > 0) {
            setDisplayCombo(combo);
            setComboScale(1.8);
            setTimeout(() => setComboScale(1), 200);
        } else {
            const timer = setTimeout(() => setDisplayCombo(0), 1000);
            return () => clearTimeout(timer);
        }
    }, [combo]);

    useEffect(() => {
        if (lastMatchPoints) {
            setShowPoints(true);
            const timer = setTimeout(() => setShowPoints(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [lastMatchPoints]);

    const getComboColor = () => {
        if (combo >= 5) return 'linear-gradient(135deg, #c5a059 0%, #d4af37 50%, #fff 100%)';
        if (combo >= 3) return 'linear-gradient(135deg, #c5a059 0%, #ffd700 100%)';
        return 'var(--color-royal-gold)';
    };

    const getComboText = () => {
        if (combo >= 10) return 'MAJESTIC';
        if (combo >= 7) return 'UNSTOPPABLE';
        if (combo >= 5) return 'BOUTIQUE';
        if (combo >= 3) return 'IMPERIAL';
        return 'STREAK';
    };

    return (
        <>
            {/* Prestige Score display - non-interactive overlay */}
            <div className="fixed top-12 right-6 z-40 text-right pointer-events-none">
                <div className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold mb-1">BOUTIQUE SCORE</div>
                <div
                    className="text-4xl font-black italic tracking-tighter tabular-nums"
                    style={{
                        background: 'linear-gradient(135deg, #c5a059 0%, #ffffff 50%, #c5a059 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 4px 12px rgba(197, 160, 89, 0.3))',
                    }}
                >
                    {score.toLocaleString()}
                </div>

                {/* Floating points */}
                {showPoints && lastMatchPoints && (
                    <div
                        className="absolute right-0 text-xl font-bold italic"
                        style={{
                            color: '#c5a059',
                            animation: 'floatUpGold 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards',
                            textShadow: '0 0 20px rgba(197, 160, 89, 0.5)'
                        }}
                    >
                        +{lastMatchPoints}
                    </div>
                )}
            </div>


            {/* Prestige Combo display */}
            {displayCombo >= 2 && (
                <div
                    className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none"
                    style={{ animation: 'comboPrestigeAppear 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                >
                    <div
                        className={`text-8xl font-black italic tracking-tighter shimmer-gold`}
                        style={{
                            background: getComboColor(),
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            transform: `scale(${comboScale})`,
                            transition: 'transform 0.2s cubic-bezier(0.2, 1, 0.2, 1)',
                            filter: 'drop-shadow(0 10px 30px rgba(197, 160, 89, 0.6))',
                        }}
                    >
                        {combo}x
                    </div>
                    <div className="text-sm font-bold tracking-[0.5em] text-white/60 uppercase mt-[-10px]">
                        {getComboText()}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes floatUpGold {
                    0% { opacity: 0; transform: translateY(0) scale(0.8); }
                    20% { opacity: 1; transform: translateY(-10px) scale(1.1); }
                    100% { opacity: 0; transform: translateY(-60px) scale(1); }
                }
                @keyframes comboPrestigeAppear {
                    0% { opacity: 0; transform: translate(-50%, 20px) scale(0.8); }
                    100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
                .shimmer-gold {
                    background-size: 200% auto !important;
                    animation: goldShimmer 3s linear infinite;
                }
                @keyframes goldShimmer {
                    to { background-position: 200% center; }
                }
            `}</style>
        </>
    );
};

export default ComboDisplay;
