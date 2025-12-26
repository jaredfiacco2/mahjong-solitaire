// Particle effect system for match celebrations
import React, { useEffect, useState, useCallback } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    rotation: number;
    rotationSpeed: number;
    type: 'shard' | 'dust';
}

interface MatchEffect {
    id: number;
    x: number;
    y: number;
    scale: number;
    opacity: number;
}

interface ParticleSystemProps {
    trigger: { x: number; y: number; combo: number } | null;
    onComplete?: () => void;
}

const COLORS = [
    '#c5a059', '#d4af37', '#ffffff', '#248a3d', '#006400', '#f5f5f7'
];

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ trigger, onComplete }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [matchEffects, setMatchEffects] = useState<MatchEffect[]>([]);

    // Create explosion of particles at position
    const createExplosion = useCallback((x: number, y: number, combo: number) => {
        const particleCount = 24 + combo * 12;
        const newParticles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 4 + Math.random() * 8 + combo * 0.5;

            newParticles.push({
                id: Math.random(),
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 2 + Math.random() * 4 + combo * 0.2,
                life: 90 + combo * 10,
                maxLife: 90 + combo * 10,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 30,
                type: Math.random() > 0.3 ? 'shard' : 'dust',
            });
        }

        setParticles(prev => [...prev, ...newParticles]);

        // Add match ring effect
        setMatchEffects(prev => [...prev, {
            id: Date.now(),
            x,
            y,
            scale: 0,
            opacity: 1,
        }]);
    }, []);

    // Trigger explosion when position changes
    useEffect(() => {
        if (trigger) {
            createExplosion(trigger.x, trigger.y, trigger.combo);
        }
    }, [trigger, createExplosion]);

    // Animate particles
    useEffect(() => {
        if (particles.length === 0 && matchEffects.length === 0) return;

        const animate = () => {
            setParticles(prev =>
                prev
                    .map(p => {
                        const age = 1 - (p.life / p.maxLife);
                        // Vortex spiraling effect
                        const vortexForce = age * 0.1;

                        return {
                            ...p,
                            x: p.x + p.vx + (p.vy * vortexForce),
                            y: p.y + p.vy - (p.vx * vortexForce) + 0.15,
                            vy: p.vy + 0.08,
                            vx: p.vx * 0.96,
                            life: p.life - 1,
                            rotation: p.rotation + p.rotationSpeed,
                        };
                    })
                    .filter(p => p.life > 0)
            );

            setMatchEffects(prev =>
                prev
                    .map(e => ({
                        ...e,
                        scale: e.scale + 0.1,
                        opacity: e.opacity - 0.02,
                    }))
                    .filter(e => e.opacity > 0)
            );
        };

        const interval = setInterval(animate, 16);
        return () => clearInterval(interval);
    }, [particles.length, matchEffects.length]);

    // Notify complete
    useEffect(() => {
        if (particles.length === 0 && matchEffects.length === 0 && trigger) {
            onComplete?.();
        }
    }, [particles.length, matchEffects.length, trigger, onComplete]);

    if (particles.length === 0 && matchEffects.length === 0) return null;

    return (
        <svg
            className="fixed inset-0 pointer-events-none z-[200]"
            style={{ width: '100%', height: '100%' }}
        >
            <defs>
                <filter id="boutiqueGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Match ring effects */}
            {matchEffects.map(effect => (
                <circle
                    key={effect.id}
                    cx={effect.x}
                    cy={effect.y}
                    r={20 + effect.scale * 80}
                    fill="none"
                    stroke="var(--color-imperial-gold)"
                    strokeWidth={5 - effect.scale * 4}
                    opacity={effect.opacity}
                    filter="url(#boutiqueGlow)"
                />
            ))}

            {/* Shards & Dust */}
            {particles.map(p => {
                const opacity = p.life / p.maxLife;

                if (p.type === 'shard') {
                    const points = [];
                    const sides = 3 + (Math.floor(p.id * 10) % 3);
                    for (let i = 0; i < sides; i++) {
                        const angle = (Math.PI * 2 * i) / sides + (p.rotation * Math.PI / 180);
                        const r = p.size * (0.6 + (Math.sin(p.id * 100) * 0.4));
                        points.push(`${p.x + Math.cos(angle) * r},${p.y + Math.sin(angle) * r}`);
                    }
                    return (
                        <polygon
                            key={p.id}
                            points={points.join(' ')}
                            fill={p.color}
                            opacity={opacity}
                            filter="url(#boutiqueGlow)"
                        />
                    );
                }

                return (
                    <circle
                        key={p.id}
                        cx={p.x}
                        cy={p.y}
                        r={p.size / 2}
                        fill={p.color}
                        opacity={opacity * 0.8}
                        filter="url(#boutiqueGlow)"
                    />
                );
            })}
        </svg>
    );
};

export default ParticleSystem;
