// Win celebration with confetti and fireworks animation
import React, { useEffect, useState, useCallback, useMemo } from 'react';

interface Confetti {
    id: number;
    x: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
    rotation: number;
}

interface Firework {
    id: number;
    x: number;
    y: number;
    particles: {
        angle: number;
        velocity: number;
        color: string;
        size: number;
    }[];
}

interface WinCelebrationProps {
    elapsedTime: number;
    matchesMade: number;
    score: number;
    onPlayAgain: () => void;
    onChangeLayout: () => void;
}

const CONFETTI_COLORS = [
    '#c5a059', '#d4af37', '#ffffff', '#e5e5ea',
    '#b8860b', '#ffd700', '#f5f5f7', '#ffffff'
];

const FIREWORK_COLORS = [
    '#c5a059', '#d4af37', '#ffffff', '#e5e5ea'
];

// SVG Icons
const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
);

export const WinCelebration: React.FC<WinCelebrationProps> = ({
    elapsedTime,
    matchesMade,
    score,
    onPlayAgain,
    onChangeLayout,
}) => {
    const [confetti, setConfetti] = useState<Confetti[]>([]);
    const [fireworks, setFireworks] = useState<Firework[]>([]);
    const [showContent, setShowContent] = useState(false);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate rating based on time
    const rating = useMemo(() => {
        if (elapsedTime < 180) return { stars: 3, text: 'Perfect!' };
        if (elapsedTime < 300) return { stars: 2, text: 'Great!' };
        return { stars: 1, text: 'Good!' };
    }, [elapsedTime]);

    // Create confetti on mount
    useEffect(() => {
        const newConfetti: Confetti[] = [];
        for (let i = 0; i < 150; i++) {
            newConfetti.push({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 3,
                duration: 2 + Math.random() * 3,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                size: 8 + Math.random() * 8,
                rotation: Math.random() * 360,
            });
        }
        setConfetti(newConfetti);

        // Show content with delay for dramatic effect
        setTimeout(() => setShowContent(true), 300);
    }, []);

    // Create periodic fireworks
    const createFirework = useCallback(() => {
        const particles = [];
        const particleCount = 12;
        const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                angle: (Math.PI * 2 * i) / particleCount,
                velocity: 80 + Math.random() * 40,
                color,
                size: 6 + Math.random() * 6,
            });
        }

        const firework: Firework = {
            id: Date.now() + Math.random(),
            x: 15 + Math.random() * 70,
            y: 15 + Math.random() * 40,
            particles,
        };

        setFireworks(prev => [...prev.slice(-5), firework]);
    }, []);

    useEffect(() => {
        // Initial burst of fireworks
        setTimeout(createFirework, 100);
        setTimeout(createFirework, 300);
        setTimeout(createFirework, 500);

        // Periodic fireworks
        const interval = setInterval(createFirework, 1200);
        return () => clearInterval(interval);
    }, [createFirework]);

    // Remove old fireworks
    useEffect(() => {
        const cleanup = setInterval(() => {
            setFireworks(prev => prev.filter(f => Date.now() - f.id < 2000));
        }, 500);
        return () => clearInterval(cleanup);
    }, []);

    return (
        <div className="win-overlay">
            {/* Confetti layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confetti.map(c => (
                    <div
                        key={c.id}
                        className="confetti"
                        style={{
                            left: `${c.x}%`,
                            top: '-20px',
                            width: `${c.size}px`,
                            height: `${c.size * 0.6}px`,
                            backgroundColor: c.color,
                            animationDelay: `${c.delay}s`,
                            animationDuration: `${c.duration}s`,
                            transform: `rotate(${c.rotation}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* Fireworks layer */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {fireworks.map(fw => (
                    <g key={fw.id}>
                        {fw.particles.map((p, i) => {
                            const age = (Date.now() - fw.id) / 1000;
                            const progress = Math.min(age / 1.5, 1);
                            const x = (fw.x / 100) * window.innerWidth + Math.cos(p.angle) * p.velocity * progress;
                            const y = (fw.y / 100) * window.innerHeight + Math.sin(p.angle) * p.velocity * progress + 50 * progress * progress;
                            const opacity = 1 - progress;
                            const scale = 1 - progress * 0.5;

                            return (
                                <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r={p.size * scale}
                                    fill={p.color}
                                    opacity={opacity}
                                    filter="url(#glow)"
                                />
                            );
                        })}
                    </g>
                ))}
            </svg>

            {/* Win message */}
            {showContent && (
                <div className="relative text-center p-8 z-10" style={{ animation: 'modalSlideIn 0.5s ease-out' }}>
                    <h1 className="win-title mb-2 text-6xl tracking-tighter italic font-black text-white">
                        VICTORY
                    </h1>

                    {/* Star rating */}
                    <div className="flex justify-center gap-3 mb-4 text-[var(--color-accent-gold)]">
                        {[1, 2, 3].map(star => (
                            <span
                                key={star}
                                className={`transition-all duration-500 ${star <= rating.stars ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}
                                style={{
                                    animation: star <= rating.stars ? 'winBounce 0.5s ease-out backwards' : 'none',
                                    animationDelay: `${0.3 + star * 0.15}s`
                                }}
                            >
                                <StarIcon filled={star <= rating.stars} />
                            </span>
                        ))}
                    </div>
                    <p className="text-xl text-[var(--color-accent-gold)] font-semibold mb-6">{rating.text}</p>

                    <div className="stats-panel glass-hud mx-auto mb-10 justify-center inline-flex border-none shadow-none bg-transparent">
                        <div className="stat-group">
                            <span className="stat-value text-4xl">{score.toLocaleString()}</span>
                            <span className="stat-label">SCORE</span>
                        </div>
                        <div className="divider-v h-10 mx-6 opacity-10" />
                        <div className="stat-group">
                            <span className="stat-value text-4xl">{formatTime(elapsedTime)}</span>
                            <span className="stat-label">TIME</span>
                        </div>
                        <div className="divider-v h-10 mx-6 opacity-10" />
                        <div className="stat-group">
                            <span className="stat-value text-4xl">{matchesMade}</span>
                            <span className="stat-label">MATCHES</span>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center flex-wrap">
                        <button
                            className="game-button bg-[var(--color-imperial-gold)] text-black border-none font-bold text-lg px-8 py-4 flex items-center gap-2"
                            onClick={onPlayAgain}
                        >
                            <PlayIcon /> PLAY AGAIN
                        </button>
                        <button
                            className="game-button text-white/60 hover:text-white text-lg px-8 py-4 flex items-center gap-2 border-white/10"
                            onClick={onChangeLayout}
                        >
                            <RefreshIcon /> NEW LAYOUT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WinCelebration;

