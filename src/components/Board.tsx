// Game board component - renders all tiles with auto-scaling and match animations
import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import type { TileInstance } from '../game/tiles';
import Tile from './Tile';

interface BoardProps {
    tiles: TileInstance[];
    selectedTileId: string | null;
    hintPair: [string, string] | null;
    freeTiles: Set<string>;
    onTileClick: (tileId: string) => void;
    userZoom?: number;
}

export const Board: React.FC<BoardProps> = ({
    tiles,
    selectedTileId,
    hintPair,
    freeTiles,
    onTileClick,
    userZoom = 1,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [matchingTiles, _setMatchingTiles] = useState<Set<string>>(new Set());
    const previousTilesRef = useRef<TileInstance[]>(tiles);

    // Detect matched tiles and trigger animation
    useEffect(() => {
        const previousIds = new Set(previousTilesRef.current.filter(t => !t.isRemoved).map(t => t.id));
        const currentIds = new Set(tiles.filter(t => !t.isRemoved).map(t => t.id));

        // Find tiles that were just removed
        const removedIds = new Set<string>();
        previousIds.forEach(id => {
            if (!currentIds.has(id)) {
                removedIds.add(id);
            }
        });

        if (removedIds.size > 0) {
            // Briefly show the matching animation before they disappear
            // (In a more complex setup, we'd delay the actual removal)
        }

        previousTilesRef.current = tiles;
    }, [tiles]);

    // Calculate board dimensions for centering
    const { width, height, offsetX, offsetY, baseWidth, baseHeight } = useMemo(() => {
        const activeTiles = tiles.filter(t => !t.isRemoved);
        if (activeTiles.length === 0) {
            return { width: 0, height: 0, offsetX: 0, offsetY: 0, baseWidth: 0, baseHeight: 0 };
        }

        const minX = Math.min(...activeTiles.map(t => t.x));
        const maxX = Math.max(...activeTiles.map(t => t.x));
        const minY = Math.min(...activeTiles.map(t => t.y));
        const maxY = Math.max(...activeTiles.map(t => t.y));

        const bWidth = (maxX - minX + 1) * 46 + 60; // tile width + spacing + padding
        const bHeight = (maxY - minY + 1) * 62 + 80; // tile height + spacing + padding

        return {
            width: bWidth,
            height: bHeight,
            offsetX: -minX * 46 + 20,
            offsetY: -minY * 62 + 20,
            baseWidth: bWidth,
            baseHeight: bHeight,
        };
    }, [tiles]);

    // Auto-scale the board to fit the viewport
    const updateScale = useCallback(() => {
        if (!containerRef.current || baseWidth === 0 || baseHeight === 0) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 32; // padding
        const containerHeight = container.clientHeight - 32;

        const scaleX = containerWidth / baseWidth;
        const scaleY = containerHeight / baseHeight;
        const autoScale = Math.min(scaleX, scaleY, 1.2); // Max auto scale 1.2x

        // Apply user zoom on top of auto scale
        const finalScale = Math.max(0.4, autoScale) * userZoom;
        setScale(finalScale);
    }, [baseWidth, baseHeight, userZoom]);

    // Use ResizeObserver for smooth scaling
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            updateScale();
        });

        observer.observe(containerRef.current);
        updateScale(); // Initial call

        return () => observer.disconnect();
    }, [updateScale]);

    // Also update when tiles change (layout change)
    useEffect(() => {
        updateScale();
    }, [tiles, updateScale]);

    // Active Materiality: Dynamic 3D Tilt
    useEffect(() => {
        // Desktop: Subtle mouse-reactive tilt (disabled on touch to prevent friction)
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (containerRef.current && !('ontouchstart' in window)) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                containerRef.current.style.setProperty('--mouse-px', `${x}%`);
                containerRef.current.style.setProperty('--mouse-py', `${y}%`);

                const tiltX = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 0.75;
                const tiltY = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * -0.75;
                containerRef.current.style.setProperty('--tilt-rx', `${tiltY}deg`);
                containerRef.current.style.setProperty('--tilt-ry', `${tiltX}deg`);
            }
        };

        // Mobile: Extremely subtle gyro tilt for "Physical Asset" feel
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (containerRef.current && e.beta !== null && e.gamma !== null) {
                // beta (-180 to 180): front-back tilt
                // gamma (-90 to 90): left-right tilt
                // Map to very subtle degrees (max 1.5deg)
                const rx = Math.max(-1.5, Math.min(1.5, (e.beta - 45) / 10)); // Assume ~45deg holding angle
                const ry = Math.max(-1.5, Math.min(1.5, e.gamma / 10));

                containerRef.current.style.setProperty('--tilt-rx', `${rx}deg`);
                containerRef.current.style.setProperty('--tilt-ry', `${ry}deg`);
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    const hintSet = useMemo(() => {
        if (!hintPair) return new Set<string>();
        return new Set(hintPair);
    }, [hintPair]);

    // Calculate hint line coordinates
    const hintLine = useMemo(() => {
        if (!hintPair) return null;
        const tile1 = tiles.find(t => t.id === hintPair[0]);
        const tile2 = tiles.find(t => t.id === hintPair[1]);
        if (!tile1 || !tile2) return null;

        return {
            x1: tile1.x * 46 + 23 + offsetX,
            y1: tile1.y * 62 + 31 + offsetY,
            x2: tile2.x * 46 + 23 + offsetX,
            y2: tile2.y * 62 + 31 + offsetY,
        };
    }, [hintPair, tiles, offsetX, offsetY]);

    return (
        <div
            ref={containerRef}
            className="board-container"
            style={{
                perspective: '1200px',
                '--tilt-rx': '0deg',
                '--tilt-ry': '0deg',
                '--mouse-px': '50%',
                '--mouse-py': '50%',
            } as React.CSSProperties}
        >
            <div
                className="board-wrapper relative"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `scale(${scale}) rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry))`,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
            >
                <div
                    className="board-inner relative"
                    style={{
                        transform: `translate(${offsetX}px, ${offsetY}px)`,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* Golden Thread Hint System */}
                    {hintLine && (
                        <svg className="absolute inset-0 pointer-events-none z-[1000] overflow-visible">
                            <defs>
                                <filter id="goldGlow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-imperial-gold)" stopOpacity="0" />
                                    <stop offset="50%" stopColor="var(--color-imperial-gold)" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="var(--color-imperial-gold)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <line
                                x1={hintLine.x1 - offsetX}
                                y1={hintLine.y1 - offsetY}
                                x2={hintLine.x2 - offsetX}
                                y2={hintLine.y2 - offsetY}
                                stroke="url(#threadGrad)"
                                strokeWidth="3"
                                strokeDasharray="10 5"
                                filter="url(#goldGlow)"
                                className="hint-line-pulse"
                            />
                        </svg>
                    )}

                    {tiles
                        .filter(t => !t.isRemoved)
                        .map(tile => (
                            <Tile
                                key={tile.id}
                                tile={tile}
                                isSelected={tile.id === selectedTileId}
                                isFree={freeTiles.has(tile.id)}
                                isHint={hintSet.has(tile.id)}
                                isMatching={matchingTiles.has(tile.id)}
                                onClick={() => onTileClick(tile.id)}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Board;
