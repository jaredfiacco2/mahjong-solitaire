// Game state management hook with combo/score system
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Layout } from '../game/layouts';
import { LAYOUTS } from '../game/layouts';
import type { GameState } from '../game/engine';
import {
    createGameState,
    isFreeTile,
    removeTilePair,
    shuffleBoard,
    checkWin,
    checkStuck,
    getHint,
} from '../game/engine';
import { getTileTypeById, tilesMatch } from '../game/tiles';
import soundManager from '../game/sounds';

const STORAGE_KEY = 'mahjong-game-state';
const COMBO_TIMEOUT = 3000; // 3 seconds to maintain combo

// Extended game state with score/combo
interface ExtendedGameState extends GameState {
    score: number;
    combo: number;
    lastMatchTime: number;
}

// Save game state to localStorage
function saveGameState(state: ExtendedGameState): void {
    try {
        const serialized = JSON.stringify({
            board: state.board,
            selectedTileId: state.selectedTileId,
            history: state.history,
            tilesRemaining: state.tilesRemaining,
            matchesMade: state.matchesMade,
            isComplete: state.isComplete,
            isStuck: state.isStuck,
            startTime: state.startTime,
            hintPair: state.hintPair,
            score: state.score,
            combo: state.combo,
            lastMatchTime: state.lastMatchTime,
        });
        localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
        console.warn('Failed to save game state:', e);
    }
}

// Load game state from localStorage
function loadGameState(): ExtendedGameState | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        const parsed = JSON.parse(saved);
        // Validate the saved state has required fields
        if (!parsed.board || !parsed.board.tiles || !parsed.board.layout) {
            return null;
        }
        return {
            ...parsed,
            score: parsed.score || 0,
            combo: 0, // Reset combo on load
            lastMatchTime: 0,
        } as ExtendedGameState;
    } catch (e) {
        console.warn('Failed to load game state:', e);
        return null;
    }
}

// Clear saved game state
function clearGameState(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear game state:', e);
    }
}

// Calculate points for a match
function calculateMatchPoints(combo: number, elapsedTime: number): number {
    const basePoints = 100;
    const comboMultiplier = Math.max(1, combo);
    const speedBonus = Math.max(0, 50 - Math.floor(elapsedTime / 10)); // Bonus for fast play
    return (basePoints + speedBonus) * comboMultiplier;
}

export interface MatchEvent {
    x: number;
    y: number;
    combo: number;
    points: number;
}

export interface UseGameStateReturn {
    gameState: ExtendedGameState;
    freeTiles: Set<string>;
    selectTile: (tileId: string) => void;
    newGame: (layoutId?: string) => void;
    undo: () => void;
    shuffle: () => void;
    showHint: () => void;
    canUndo: boolean;
    currentLayout: Layout;
    elapsedTime: number;
    lastMatch: MatchEvent | null;
    zoomLevel: number;
    setZoomLevel: (level: number) => void;
}

export function useGameState(initialLayoutId: string = 'turtle'): UseGameStateReturn {
    const [gameState, setGameState] = useState<ExtendedGameState>(() => {
        // Try to restore saved game first
        const saved = loadGameState();
        if (saved) {
            return saved;
        }
        // Otherwise create new game
        const layout = LAYOUTS.find(l => l.id === initialLayoutId) || LAYOUTS[0];
        const base = createGameState(layout);
        return { ...base, score: 0, combo: 0, lastMatchTime: 0 };
    });

    const [elapsedTime, setElapsedTime] = useState(() => {
        // Calculate elapsed time from saved start time
        if (gameState.startTime) {
            return Math.floor((Date.now() - gameState.startTime) / 1000);
        }
        return 0;
    });

    const [lastMatch, setLastMatch] = useState<MatchEvent | null>(null);

    // Zoom level for accessibility (stored in localStorage)
    const [zoomLevel, setZoomLevelState] = useState(() => {
        try {
            const saved = localStorage.getItem('mahjong-zoom');
            return saved ? parseFloat(saved) : 1;
        } catch {
            return 1;
        }
    });

    const setZoomLevel = useCallback((level: number) => {
        const clamped = Math.max(0.5, Math.min(2, level));
        setZoomLevelState(clamped);
        try {
            localStorage.setItem('mahjong-zoom', String(clamped));
        } catch { }
    }, []);

    // Combo timeout ref
    const comboTimeoutRef = useRef<number | null>(null);

    // Save game state whenever it changes
    useEffect(() => {
        if (!gameState.isComplete) {
            saveGameState(gameState);
        }
    }, [gameState]);

    // Calculate free tiles (cached)
    const freeTiles = new Set(
        gameState.board.tiles
            .filter(t => !t.isRemoved && isFreeTile(t, gameState.board.tiles))
            .map(t => t.id)
    );

    // Timer
    useEffect(() => {
        if (gameState.isComplete || gameState.isStuck) return;

        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - gameState.startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState.startTime, gameState.isComplete, gameState.isStuck]);

    // Combo decay
    useEffect(() => {
        if (gameState.combo > 0) {
            if (comboTimeoutRef.current) {
                clearTimeout(comboTimeoutRef.current);
            }
            comboTimeoutRef.current = window.setTimeout(() => {
                setGameState(prev => ({ ...prev, combo: 0 }));
            }, COMBO_TIMEOUT);
        }
        return () => {
            if (comboTimeoutRef.current) {
                clearTimeout(comboTimeoutRef.current);
            }
        };
    }, [gameState.combo, gameState.lastMatchTime]);

    // Select a tile
    const selectTile = useCallback((tileId: string) => {
        setGameState(prev => {
            // Can't select if game is over
            if (prev.isComplete || prev.isStuck) return prev;

            const tile = prev.board.tiles.find(t => t.id === tileId);
            if (!tile || tile.isRemoved) return prev;

            // Check if tile is free
            if (!isFreeTile(tile, prev.board.tiles)) {
                return prev;
            }

            // If no tile selected, select this one
            if (!prev.selectedTileId) {
                soundManager.play('select');
                return {
                    ...prev,
                    selectedTileId: tileId,
                    hintPair: null,
                };
            }

            // If same tile, deselect
            if (prev.selectedTileId === tileId) {
                return {
                    ...prev,
                    selectedTileId: null,
                };
            }

            // Try to match with previously selected tile
            const selectedTile = prev.board.tiles.find(t => t.id === prev.selectedTileId);
            if (!selectedTile) {
                return { ...prev, selectedTileId: tileId };
            }

            const type1 = getTileTypeById(selectedTile.typeId);
            const type2 = getTileTypeById(tile.typeId);

            if (type1 && type2 && tilesMatch(type1, type2)) {
                // Match found!
                const now = Date.now();
                const timeSinceLastMatch = now - prev.lastMatchTime;
                const newCombo = timeSinceLastMatch < COMBO_TIMEOUT ? prev.combo + 1 : 1;

                const pitch = 1.0 + (newCombo * 0.05);

                // Play appropriate sound
                if (newCombo >= 3) {
                    soundManager.play('combo', { pitch });
                } else {
                    soundManager.play('match', { pitch });
                }

                // Haptic feedback for mobile
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    if (newCombo >= 3) {
                        navigator.vibrate([20, 30, 20]); // Combo pulse
                    } else {
                        navigator.vibrate(10); // Subtle match pulse
                    }
                }

                const points = calculateMatchPoints(newCombo, elapsedTime);
                const newTiles = removeTilePair(prev.board.tiles, selectedTile.id, tile.id);
                const isComplete = checkWin(newTiles);
                const isStuck = !isComplete && checkStuck(newTiles);

                if (isComplete) {
                    soundManager.play('win');
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate([50, 100, 50, 100, 50]); // Win celebration vibration
                    }
                }

                // Calculate match position for particles (average of both tiles)
                const matchX = ((selectedTile.x + tile.x) / 2) * 46 + 22;
                const matchY = ((selectedTile.y + tile.y) / 2) * 62 + 30;

                // Set match event for particle system
                setLastMatch({
                    x: matchX,
                    y: matchY,
                    combo: newCombo,
                    points,
                });

                return {
                    ...prev,
                    board: { ...prev.board, tiles: newTiles },
                    selectedTileId: null,
                    history: [...prev.history, prev.board.tiles],
                    tilesRemaining: prev.tilesRemaining - 2,
                    matchesMade: prev.matchesMade + 1,
                    isComplete,
                    isStuck,
                    hintPair: null,
                    score: prev.score + points,
                    combo: newCombo,
                    lastMatchTime: now,
                };
            } else {
                // No match, select new tile instead
                soundManager.play('click');
                return {
                    ...prev,
                    selectedTileId: tileId,
                };
            }
        });
    }, [elapsedTime]);

    // Start new game
    const newGame = useCallback((layoutId?: string) => {
        clearGameState();
        const layout = layoutId
            ? LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0]
            : gameState.board.layout;

        const base = createGameState(layout);
        setGameState({ ...base, score: 0, combo: 0, lastMatchTime: 0 });
        setElapsedTime(0);
        setLastMatch(null);
    }, [gameState.board.layout]);

    // Undo last move
    const undo = useCallback(() => {
        setGameState(prev => {
            if (prev.history.length === 0) return prev;

            soundManager.play('undo');
            const lastTiles = prev.history[prev.history.length - 1];

            return {
                ...prev,
                board: { ...prev.board, tiles: lastTiles },
                selectedTileId: null,
                history: prev.history.slice(0, -1),
                tilesRemaining: prev.tilesRemaining + 2,
                matchesMade: prev.matchesMade - 1,
                isComplete: false,
                isStuck: false,
                hintPair: null,
                score: Math.max(0, prev.score - 100), // Lose points for undo
                combo: 0, // Reset combo on undo
            };
        });
    }, []);

    // Shuffle remaining tiles
    const shuffle = useCallback(() => {
        soundManager.play('shuffle');
        setGameState(prev => ({
            ...prev,
            board: shuffleBoard(prev.board),
            selectedTileId: null,
            isStuck: false,
            hintPair: null,
            combo: 0, // Reset combo on shuffle
        }));
    }, []);

    // Show hint
    const showHint = useCallback(() => {
        soundManager.play('hint');
        setGameState(prev => {
            const hint = getHint(prev.board.tiles);
            return {
                ...prev,
                hintPair: hint,
                selectedTileId: null,
            };
        });
    }, []);

    return {
        gameState,
        freeTiles,
        selectTile,
        newGame,
        undo,
        shuffle,
        showHint,
        canUndo: gameState.history.length > 0,
        currentLayout: gameState.board.layout,
        elapsedTime,
        lastMatch,
        zoomLevel,
        setZoomLevel,
    };
}
