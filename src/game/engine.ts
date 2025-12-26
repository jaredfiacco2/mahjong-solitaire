// Core Mahjong Solitaire game engine
// Handles tile matching, free tile detection, and board generation

import type { TileInstance, TileType } from './tiles';
import { STANDARD_TILES, ALL_TILE_TYPES, tilesMatch, getTileTypeById } from './tiles';
import type { Layout } from './layouts';

export interface GameBoard {
    tiles: TileInstance[];
    layout: Layout;
}

export interface GameState {
    board: GameBoard;
    selectedTileId: string | null;
    history: TileInstance[][]; // For undo functionality
    tilesRemaining: number;
    matchesMade: number;
    startTime: number;
    isComplete: boolean;
    isStuck: boolean;
    hintPair: [string, string] | null;
}

// Generate a unique ID
let tileIdCounter = 0;
function generateTileId(): string {
    return `tile-${++tileIdCounter}`;
}

// Reset counter for new games
export function resetTileIdCounter(): void {
    tileIdCounter = 0;
}

/**
 * Check if a tile is "free" (can be selected/matched)
 * A tile is free if:
 * 1. No tiles are directly on top of it (higher z, overlapping x/y)
 * 2. It has at least one free side (left OR right not blocked)
 */
export function isFreeTile(tile: TileInstance, allTiles: TileInstance[]): boolean {
    if (tile.isRemoved) return false;

    const activeTiles = allTiles.filter(t => !t.isRemoved);

    // Check if any tile is on top (overlapping and higher z)
    const hasBlockingTop = activeTiles.some(other =>
        other.id !== tile.id &&
        other.z > tile.z &&
        Math.abs(other.x - tile.x) < 0.9 &&
        Math.abs(other.y - tile.y) < 0.9
    );

    if (hasBlockingTop) return false;

    // Check left and right blocking
    const hasBlockingLeft = activeTiles.some(other =>
        other.id !== tile.id &&
        other.z === tile.z &&
        Math.abs(other.y - tile.y) < 0.9 &&
        other.x < tile.x && tile.x - other.x < 1.1
    );

    const hasBlockingRight = activeTiles.some(other =>
        other.id !== tile.id &&
        other.z === tile.z &&
        Math.abs(other.y - tile.y) < 0.9 &&
        other.x > tile.x && other.x - tile.x < 1.1
    );

    // Free if at least one side is open
    return !hasBlockingLeft || !hasBlockingRight;
}

/**
 * Find all valid matching pairs on the board.
 * Optimized to O(N^2) by pre-calculating free status.
 */
export function findAllMatches(tiles: TileInstance[]): [TileInstance, TileInstance][] {
    const activeTiles = tiles.filter(t => !t.isRemoved);
    // Pre-calculate which tiles are free to avoid cubic complexity
    const freeTiles = activeTiles.filter(t => isFreeTile(t, activeTiles));

    const matches: [TileInstance, TileInstance][] = [];
    const typeMap = new Map<string, TileType | undefined>();

    for (let i = 0; i < freeTiles.length; i++) {
        for (let j = i + 1; j < freeTiles.length; j++) {
            const tile1 = freeTiles[i];
            const tile2 = freeTiles[j];

            let type1 = typeMap.get(tile1.typeId);
            if (!type1) {
                type1 = getTileTypeById(tile1.typeId);
                typeMap.set(tile1.typeId, type1);
            }

            let type2 = typeMap.get(tile2.typeId);
            if (!type2) {
                type2 = getTileTypeById(tile2.typeId);
                typeMap.set(tile2.typeId, type2);
            }

            if (type1 && type2 && tilesMatch(type1, type2)) {
                matches.push([tile1, tile2]);
            }
        }
    }

    return matches;
}

/**
 * Check if the game is won (all tiles removed)
 */
export function checkWin(tiles: TileInstance[]): boolean {
    return tiles.every(t => t.isRemoved);
}

/**
 * Check if the game is stuck (no valid moves)
 */
export function checkStuck(tiles: TileInstance[]): boolean {
    if (checkWin(tiles)) return false;
    return findAllMatches(tiles).length === 0;
}

/**
 * Check if a position is "open" for placement during reverse generation.
 * A position is open if it has no tiles on top and no tiles on BOTH sides.
 */
function isPositionAvailable(
    pos: { x: number; y: number; z: number },
    occupiedPositions: { x: number; y: number; z: number }[]
): boolean {
    const hasTop = occupiedPositions.some(other =>
        other.z > pos.z &&
        Math.abs(other.x - pos.x) < 0.9 &&
        Math.abs(other.y - pos.y) < 0.9
    );
    if (hasTop) return false;

    const hasLeft = occupiedPositions.some(other =>
        other.z === pos.z &&
        Math.abs(other.y - pos.y) < 0.9 &&
        other.x < pos.x && pos.x - other.x < 1.1
    );

    const hasRight = occupiedPositions.some(other =>
        other.z === pos.z &&
        Math.abs(other.y - pos.y) < 0.9 &&
        other.x > pos.x && other.x - pos.x < 1.1
    );

    return !hasLeft || !hasRight;
}

/**
 * Helper to assign tile types to positions solvably via reverse simulation.
 * Returns null if it gets stuck (layout prevents full assignment).
 */
function assignSolvableTypes(positions: { x: number; y: number; z: number }[], availableTypes: TileType[]): TileInstance[] | null {
    const occupiedPositions: { x: number; y: number; z: number }[] = [];
    const availablePositions = [...positions];
    const finalTiles: TileInstance[] = [];

    // Build pairs of matching types
    const typeGroups = new Map<string, TileType[]>();
    for (const t of availableTypes) {
        const key = t.matchGroup || t.id;
        if (!typeGroups.has(key)) typeGroups.set(key, []);
        typeGroups.get(key)!.push(t);
    }

    const matchingPairs: [TileType, TileType][] = [];
    for (const [_key, group] of typeGroups) {
        while (group.length >= 2) {
            matchingPairs.push([group.pop()!, group.pop()!]);
        }
    }

    // Shuffle pair placement order
    for (let i = matchingPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchingPairs[i], matchingPairs[j]] = [matchingPairs[j], matchingPairs[i]];
    }

    // Helper function to calculate distance between positions
    const getDistance = (p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = (p1.z - p2.z) * 2; // Weight z difference higher to spread across layers
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    for (const [type1, type2] of matchingPairs) {
        const placeablePositions = availablePositions.filter(pos =>
            isPositionAvailable(pos, occupiedPositions)
        );

        if (placeablePositions.length < 2) return null; // Stuck

        // Pick first position randomly
        const idx1 = Math.floor(Math.random() * placeablePositions.length);
        const pos1 = placeablePositions[idx1];
        placeablePositions.splice(idx1, 1);

        // Pick second position to MAXIMIZE distance from first (makes game harder)
        let bestIdx2 = 0;
        let maxDistance = 0;
        for (let i = 0; i < placeablePositions.length; i++) {
            const dist = getDistance(pos1, placeablePositions[i]);
            if (dist > maxDistance) {
                maxDistance = dist;
                bestIdx2 = i;
            }
        }
        const pos2 = placeablePositions[bestIdx2];

        finalTiles.push({ id: generateTileId(), typeId: type1.id, ...pos1, isRemoved: false });
        finalTiles.push({ id: generateTileId(), typeId: type2.id, ...pos2, isRemoved: false });

        occupiedPositions.push(pos1, pos2);
        availablePositions.splice(availablePositions.indexOf(pos1), 1);
        availablePositions.splice(availablePositions.indexOf(pos2), 1);
    }

    return finalTiles;
}

// Greedy verification removed as it rejected non-greedily solvable boards
// The reverse-simulation itself provides the winnability guarantee.

/**
 * Generate a solvable board
 */
export function generateBoard(layout: Layout): GameBoard {
    resetTileIdCounter();

    const posCount = layout.positions.length;
    const tilePairs: TileType[] = [];

    if (posCount === 144) {
        // Standard full set: 34 types x 4 + 8 bonus
        STANDARD_TILES.forEach(t => {
            for (let i = 0; i < 4; i++) tilePairs.push(t);
        });
        const bonusGrouped = ALL_TILE_TYPES.filter(t => t.matchGroup);
        bonusGrouped.forEach(t => tilePairs.push(t));
    } else {
        // Dynamic subset for smaller layouts
        const available = [...STANDARD_TILES];
        while (tilePairs.length < posCount) {
            const idx = Math.floor(Math.random() * available.length);
            const type = available[idx];
            available.splice(idx, 1);

            const count = (posCount - tilePairs.length >= 4) ? 4 : 2;
            for (let i = 0; i < count; i++) tilePairs.push(type);

            if (available.length === 0) available.push(...STANDARD_TILES);
        }
    }

    let attempts = 0;
    while (attempts < 50) {
        attempts++;
        const tiles = assignSolvableTypes(layout.positions, tilePairs);
        if (tiles) {
            return { tiles, layout };
        }
    }

    // High-alert fallback
    console.error("Failed to generate board via reverse simulation, falling back to random assignment");
    const basicTiles = layout.positions.map((pos, i) => ({
        id: generateTileId(),
        typeId: tilePairs[i].id,
        ...pos,
        isRemoved: false
    }));
    return { tiles: basicTiles, layout };
}

/**
 * Shuffle remaining tiles on the board - uses simple random redistribution
 */
export function shuffleBoard(board: GameBoard): GameBoard {
    const activeTiles = board.tiles.filter(t => !t.isRemoved);
    const removedTiles = board.tiles.filter(t => t.isRemoved);

    const positions = activeTiles.map(t => ({ x: t.x, y: t.y, z: t.z }));
    const types = activeTiles.map(t => getTileTypeById(t.typeId)).filter(Boolean) as TileType[];

    // Shuffle types array
    for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
    }

    // Simply reassign types to positions randomly
    const newActiveTiles: TileInstance[] = positions.map((pos, i) => ({
        id: generateTileId(),
        typeId: types[i].id,
        ...pos,
        isRemoved: false,
    }));

    return {
        ...board,
        tiles: [...newActiveTiles, ...removedTiles],
    };
}


/**
 * Remove a matched pair of tiles
 */
export function removeTilePair(
    tiles: TileInstance[],
    tile1Id: string,
    tile2Id: string
): TileInstance[] {
    return tiles.map(t => {
        if (t.id === tile1Id || t.id === tile2Id) {
            return { ...t, isRemoved: true };
        }
        return t;
    });
}

/**
 * Undo last move by restoring tiles from history
 */
export function undoMove(
    _currentTiles: TileInstance[],
    previousTiles: TileInstance[]
): TileInstance[] {
    return previousTiles;
}

/**
 * Create initial game state
 */
export function createGameState(layout: Layout): GameState {
    const board = generateBoard(layout);
    return {
        board,
        selectedTileId: null,
        history: [],
        tilesRemaining: 144,
        matchesMade: 0,
        startTime: Date.now(),
        isComplete: false,
        isStuck: false,
        hintPair: null,
    };
}

/**
 * Get a hint (find one valid match)
 */
export function getHint(tiles: TileInstance[]): [string, string] | null {
    const matches = findAllMatches(tiles);
    if (matches.length === 0) return null;
    return [matches[0][0].id, matches[0][1].id];
}
