// Mahjong Solitaire layout definitions
// Each layout defines positions for 144 tiles in a 3D grid (x, y, z)

export interface LayoutPosition {
    x: number;
    y: number;
    z: number;
}

export interface Layout {
    id: string;
    name: string;
    description: string;
    positions: LayoutPosition[];
}

// Classic Turtle layout - the most iconic Mahjong Solitaire layout
// 5 layers, pyramid shape with a cap on top
const turtleLayout: Layout = {
    id: 'turtle',
    name: 'Turtle',
    description: 'The classic Mahjong Solitaire layout',
    positions: generateTurtlePositions(),
};

function generateTurtlePositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Layer 0 (bottom) - 12x8 grid with some gaps
    // Row pattern for classic turtle
    const layer0 = [
        // Left wing
        [0, 3], [0, 4],
        // Main body rows
        ...generateRow(1, 1, 12),
        ...generateRow(2, 0, 14),
        ...generateRow(3, 0, 14),
        ...generateRow(4, 0, 14),
        ...generateRow(5, 0, 14),
        ...generateRow(6, 1, 12),
        // Right wing
        [7, 3], [7, 4],
    ];

    layer0.forEach(([y, x]) => positions.push({ x, y, z: 0 }));

    // Layer 1 - 10x6 centered
    for (let y = 1; y < 7; y++) {
        for (let x = 2; x < 12; x++) {
            positions.push({ x, y, z: 1 });
        }
    }

    // Layer 2 - 8x4 centered
    for (let y = 2; y < 6; y++) {
        for (let x = 4; x < 10; x++) {
            positions.push({ x, y, z: 2 });
        }
    }

    // Layer 3 - 6x2 centered
    for (let y = 3; y < 5; y++) {
        for (let x = 5; x < 9; x++) {
            positions.push({ x, y, z: 3 });
        }
    }

    // Layer 4 (top) - 4 tiles
    positions.push({ x: 6, y: 3, z: 4 });
    positions.push({ x: 7, y: 3, z: 4 });
    positions.push({ x: 6, y: 4, z: 4 });
    positions.push({ x: 7, y: 4, z: 4 });

    // Cap (single tile on very top)
    positions.push({ x: 6.5, y: 3.5, z: 5 });

    return positions.slice(0, 144); // Ensure we have exactly 144 positions
}

function generateRow(y: number, startX: number, count: number): [number, number][] {
    const row: [number, number][] = [];
    for (let i = 0; i < count; i++) {
        row.push([y, startX + i]);
    }
    return row;
}

// Pyramid layout - simple triangular structure
const pyramidLayout: Layout = {
    id: 'pyramid',
    name: 'Pyramid',
    description: 'A simple triangular pyramid',
    positions: generatePyramidPositions(),
};

function generatePyramidPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // 5 layers building up
    const layerSizes = [
        { w: 12, h: 12 },
        { w: 10, h: 10 },
        { w: 8, h: 8 },
        { w: 6, h: 6 },
        { w: 4, h: 4 },
    ];

    layerSizes.forEach((size, z) => {
        const offsetX = z;
        const offsetY = z;
        for (let y = 0; y < size.h; y++) {
            for (let x = 0; x < size.w; x++) {
                positions.push({ x: x + offsetX, y: y + offsetY, z });
            }
        }
    });

    return positions.slice(0, 144);
}

// Dragon layout - S-shaped serpentine
const dragonLayout: Layout = {
    id: 'dragon',
    name: 'Dragon',
    description: 'A serpentine dragon shape',
    positions: generateDragonPositions(),
};

function generateDragonPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Create S-shaped dragon on multiple layers
    // Layer 0 - dragon body
    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 3; y++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Curve sections
    for (let y = 3; y < 6; y++) {
        for (let x = 13; x < 16; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    for (let x = 0; x < 16; x++) {
        for (let y = 6; y < 9; y++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Layer 1
    for (let x = 2; x < 14; x++) {
        for (let y = 1; y < 2; y++) {
            positions.push({ x, y, z: 1 });
        }
    }

    for (let x = 2; x < 14; x++) {
        for (let y = 7; y < 8; y++) {
            positions.push({ x, y, z: 1 });
        }
    }

    // Layer 2 - spine
    for (let x = 4; x < 12; x++) {
        positions.push({ x, y: 1, z: 2 });
        positions.push({ x, y: 7, z: 2 });
    }

    return positions.slice(0, 144);
}

// Fortress layout - castle-like structure
const fortressLayout: Layout = {
    id: 'fortress',
    name: 'Fortress',
    description: 'A castle with towers',
    positions: generateFortressPositions(),
};

function generateFortressPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Base layer - large rectangle
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 14; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Corner towers - layer 1
    const towers = [[0, 0], [0, 7], [12, 0], [12, 7]];
    towers.forEach(([tx, ty]) => {
        for (let dx = 0; dx < 2; dx++) {
            for (let dy = 0; dy < 1; dy++) {
                positions.push({ x: tx + dx, y: ty + dy, z: 1 });
            }
        }
    });

    // Center structure - layer 1
    for (let y = 2; y < 6; y++) {
        for (let x = 4; x < 10; x++) {
            positions.push({ x, y, z: 1 });
        }
    }

    // Center top - layer 2
    for (let y = 3; y < 5; y++) {
        for (let x = 5; x < 9; x++) {
            positions.push({ x, y, z: 2 });
        }
    }

    // Tower tops - layer 2
    towers.forEach(([tx, ty]) => {
        positions.push({ x: tx + 0.5, y: ty + 0.5, z: 2 });
    });

    return positions.slice(0, 144);
}

// Bridge layout - horizontal bridge structure
const bridgeLayout: Layout = {
    id: 'bridge',
    name: 'Bridge',
    description: 'A horizontal bridge with arches',
    positions: generateBridgePositions(),
};

function generateBridgePositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Road surface - long horizontal
    for (let x = 0; x < 18; x++) {
        for (let y = 2; y < 6; y++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Support pillars
    const pillars = [1, 5, 9, 13, 17];
    pillars.forEach(px => {
        for (let y = 0; y < 2; y++) {
            positions.push({ x: px, y: 0, z: 0 });
            positions.push({ x: px, y: 7, z: 0 });
        }
    });

    // Top layer - railings
    for (let x = 1; x < 17; x += 2) {
        positions.push({ x, y: 2, z: 1 });
        positions.push({ x, y: 5, z: 1 });
    }

    // Center tower
    for (let y = 3; y < 5; y++) {
        for (let x = 8; x < 10; x++) {
            positions.push({ x, y, z: 1 });
            positions.push({ x, y, z: 2 });
        }
    }

    return positions.slice(0, 144);
}

// Spiral layout - tiles arranged in a spiral pattern
const spiralLayout: Layout = {
    id: 'spiral',
    name: 'Spiral',
    description: 'A mesmerizing spiral pattern',
    positions: generateSpiralPositions(),
};

function generateSpiralPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Create spiral on layer 0
    const centerX = 8;
    const centerY = 4;
    let angle = 0;
    let radius = 0.5;

    for (let i = 0; i < 100; i++) {
        const x = Math.round(centerX + Math.cos(angle) * radius);
        const y = Math.round(centerY + Math.sin(angle) * radius * 0.6);

        if (x >= 0 && x < 18 && y >= 0 && y < 9) {
            const exists = positions.some(p => p.x === x && p.y === y && p.z === 0);
            if (!exists) {
                positions.push({ x, y, z: 0 });
            }
        }

        angle += 0.4;
        radius += 0.15;
    }

    // Layer 1 - inner spiral
    for (let i = 0; i < 30; i++) {
        const x = Math.round(centerX + Math.cos(i * 0.5) * (2 + i * 0.08));
        const y = Math.round(centerY + Math.sin(i * 0.5) * (1.2 + i * 0.05));

        if (x >= 2 && x < 14 && y >= 1 && y < 7) {
            const exists = positions.some(p => p.x === x && p.y === y && p.z === 1);
            if (!exists) {
                positions.push({ x, y, z: 1 });
            }
        }
    }

    // Layer 2 - center cluster
    for (let y = 3; y < 6; y++) {
        for (let x = 6; x < 10; x++) {
            positions.push({ x, y, z: 2 });
        }
    }

    // Top center
    positions.push({ x: 7, y: 4, z: 3 });
    positions.push({ x: 8, y: 4, z: 3 });

    return positions.slice(0, 144);
}

// Staircase layout - ascending steps
const staircaseLayout: Layout = {
    id: 'staircase',
    name: 'Staircase',
    description: 'Ascending steps pattern',
    positions: generateStaircasePositions(),
};

function generateStaircasePositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Create stair steps
    for (let step = 0; step < 8; step++) {
        const width = 16 - step * 2;
        const startX = step;
        const y = step;

        for (let x = 0; x < width; x++) {
            positions.push({ x: startX + x, y, z: 0 });
        }
    }

    // Layer 1 - alternating rows
    for (let step = 1; step < 7; step += 2) {
        const width = 12 - step * 1.5;
        const startX = step + 1;
        const y = step;

        for (let x = 0; x < Math.floor(width); x++) {
            positions.push({ x: startX + x, y, z: 1 });
        }
    }

    // Layer 2 - center steps
    for (let step = 2; step < 6; step++) {
        const width = 8 - step;
        const startX = step + 2;
        const y = step;

        for (let x = 0; x < Math.max(2, width); x++) {
            positions.push({ x: startX + x, y, z: 2 });
        }
    }

    return positions.slice(0, 144);
}

// Diamond layout - tiles in a diamond shape
const diamondLayout: Layout = {
    id: 'diamond',
    name: 'Diamond',
    description: 'A sparkling diamond shape',
    positions: generateDiamondPositions(),
};

function generateDiamondPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];
    const centerX = 8;
    const centerY = 4;

    // Layer 0 - large diamond
    for (let y = 0; y < 9; y++) {
        const distY = Math.abs(y - centerY);
        const width = Math.max(1, 9 - distY * 2);
        const startX = centerX - Math.floor(width / 2);

        for (let x = 0; x < width; x++) {
            positions.push({ x: startX + x, y, z: 0 });
        }
    }

    // Layer 1 - medium diamond
    for (let y = 1; y < 8; y++) {
        const distY = Math.abs(y - centerY);
        const width = Math.max(1, 7 - distY * 2);
        const startX = centerX - Math.floor(width / 2);

        for (let x = 0; x < width; x++) {
            positions.push({ x: startX + x, y, z: 1 });
        }
    }

    // Layer 2 - small diamond
    for (let y = 2; y < 7; y++) {
        const distY = Math.abs(y - centerY);
        const width = Math.max(1, 5 - distY * 2);
        const startX = centerX - Math.floor(width / 2);

        for (let x = 0; x < width; x++) {
            positions.push({ x: startX + x, y, z: 2 });
        }
    }

    // Layer 3 - tiny diamond
    positions.push({ x: centerX, y: 3, z: 3 });
    positions.push({ x: centerX - 1, y: 4, z: 3 });
    positions.push({ x: centerX, y: 4, z: 3 });
    positions.push({ x: centerX + 1, y: 4, z: 3 });
    positions.push({ x: centerX, y: 5, z: 3 });

    // Top
    positions.push({ x: centerX, y: 4, z: 4 });

    return positions.slice(0, 144);
}

// Temple layout - pagoda-like structure
const templeLayout: Layout = {
    id: 'temple',
    name: 'Temple',
    description: 'An ancient temple structure',
    positions: generateTemplePositions(),
};

function generateTemplePositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Base - wide foundation
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 16; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Middle section
    for (let y = 2; y < 5; y++) {
        for (let x = 2; x < 14; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Top section
    for (let y = 5; y < 7; y++) {
        for (let x = 4; x < 12; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Roof edge
    for (let x = 5; x < 11; x++) {
        positions.push({ x, y: 7, z: 0 });
    }

    // Layer 1 - inner structure
    for (let y = 2; y < 5; y++) {
        for (let x = 4; x < 12; x++) {
            positions.push({ x, y, z: 1 });
        }
    }

    // Layer 2 - upper floor
    for (let y = 3; y < 5; y++) {
        for (let x = 5; x < 11; x++) {
            positions.push({ x, y, z: 2 });
        }
    }

    // Layer 3 - roof
    for (let x = 6; x < 10; x++) {
        positions.push({ x, y: 3.5, z: 3 });
    }

    // Spire
    positions.push({ x: 7.5, y: 3.5, z: 4 });

    return positions.slice(0, 144);
}

// Scatter layout - randomly distributed with some clustering
const scatterLayout: Layout = {
    id: 'scatter',
    name: 'Scatter',
    description: 'A unique scattered pattern',
    positions: generateScatterPositions(),
};

function generateScatterPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Create clusters
    const clusters = [
        { cx: 3, cy: 2, size: 4 },
        { cx: 12, cy: 2, size: 4 },
        { cx: 3, cy: 6, size: 4 },
        { cx: 12, cy: 6, size: 4 },
        { cx: 8, cy: 4, size: 6 },
    ];

    // Layer 0 - create clusters
    clusters.forEach(cluster => {
        for (let dy = -cluster.size / 2; dy < cluster.size / 2; dy++) {
            for (let dx = -cluster.size / 2; dx < cluster.size / 2; dx++) {
                const x = Math.round(cluster.cx + dx);
                const y = Math.round(cluster.cy + dy);
                if (x >= 0 && x < 16 && y >= 0 && y < 8) {
                    positions.push({ x, y, z: 0 });
                }
            }
        }
    });

    // Fill gaps
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 16; x++) {
            if ((x + y) % 3 === 0) {
                const exists = positions.some(p => p.x === x && p.y === y && p.z === 0);
                if (!exists) {
                    positions.push({ x, y, z: 0 });
                }
            }
        }
    }

    // Layer 1 - smaller clusters
    clusters.forEach(cluster => {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = Math.round(cluster.cx + dx);
                const y = Math.round(cluster.cy + dy);
                if (x >= 2 && x < 14 && y >= 1 && y < 7) {
                    positions.push({ x, y, z: 1 });
                }
            }
        }
    });

    // Layer 2 - center only
    for (let y = 3; y < 6; y++) {
        for (let x = 6; x < 10; x++) {
            positions.push({ x, y, z: 2 });
        }
    }

    // Top
    positions.push({ x: 7.5, y: 4, z: 3 });
    positions.push({ x: 8.5, y: 4, z: 3 });

    return positions.slice(0, 144);
}

// Flat layout - mobile-friendly, single layer only for easy visibility
const flatLayout: Layout = {
    id: 'flat',
    name: 'Flat (Mobile)',
    description: 'Single layer - perfect for mobile',
    positions: generateFlatPositions(),
};

function generateFlatPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Wide grid, all on layer 0 - 18x8 = 144 tiles
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 18; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    return positions.slice(0, 144);
}

// Imperial Tower layout - portrait-optimized for luxury mobile devices
const imperialTowerLayout: Layout = {
    id: 'tower',
    name: 'Imperial Tower (Mobile)',
    description: 'A tall, stately tower optimized for mobile portrait view',
    positions: generateTowerPositions(),
};

function generateTowerPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Base Layer 0 - 6x12 rectangle (72 tiles)
    for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 6; x++) {
            positions.push({ x: x + 6, y, z: 0 });
        }
    }

    // Layer 1 - 4x10 centered (40 tiles)
    for (let y = 1; y < 11; y++) {
        for (let x = 1; x < 5; x++) {
            positions.push({ x: x + 6, y, z: 1 });
        }
    }

    // Layer 2 - 4x6 centered (24 tiles)
    for (let y = 3; y < 9; y++) {
        for (let x = 1; x < 5; x++) {
            positions.push({ x: x + 6, y, z: 2 });
        }
    }

    // Layer 3 - 2x4 centered (8 tiles)
    for (let y = 4; y < 8; y++) {
        for (let x = 2; x < 4; x++) {
            positions.push({ x: x + 6, y, z: 3 });
        }
    }

    return positions.slice(0, 144);
}


const simpleLayout: Layout = {
    id: 'simple',
    name: 'Simple (Mobile)',
    description: 'Two layers - compact and easy play',
    positions: generateSimplePositions(),
};

function generateSimplePositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Layer 0 - 12x10 grid
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 12; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Layer 1 - small center cluster 4x6
    for (let y = 2; y < 8; y++) {
        for (let x = 4; x < 8; x++) {
            positions.push({ x, y, z: 1 });
        }
    }

    return positions.slice(0, 144);
}

// Large layout - accessibility-focused, more vertical stacking, fewer tiles per layer
const largeLayout: Layout = {
    id: 'large',
    name: 'Large (Easy View)',
    description: 'Fewer tiles per layer, more stacking - easier to see',
    positions: generateLargePositions(),
};

function generateLargePositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Layer 0 - 6x6 grid = 36 tiles
    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Layer 1 - 6x6 grid offset = 36 tiles
    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
            positions.push({ x: x + 0.5, y: y + 0.5, z: 1 });
        }
    }

    // Layer 2 - 6x6 grid = 36 tiles
    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
            positions.push({ x, y, z: 2 });
        }
    }

    // Layer 3 - 4x4 center = 16 tiles
    for (let y = 1; y < 5; y++) {
        for (let x = 1; x < 5; x++) {
            positions.push({ x: x + 0.5, y: y + 0.5, z: 3 });
        }
    }

    // Layer 4 - 4x4 center = 16 tiles
    for (let y = 1; y < 5; y++) {
        for (let x = 1; x < 5; x++) {
            positions.push({ x, y, z: 4 });
        }
    }

    // Top layers - 2x2 = 4 tiles
    for (let y = 2; y < 4; y++) {
        for (let x = 2; x < 4; x++) {
            positions.push({ x: x + 0.5, y: y + 0.5, z: 5 });
        }
    }

    return positions.slice(0, 144);
}

// Mobile Pyramid - Heavily stacked pyramid designed for mobile portrait
// 6 tiles wide, 6 layers deep - classic pyramid feel with big tiles
const mobilePyramidLayout: Layout = {
    id: 'mobile-pyramid',
    name: 'Mobile Pyramid',
    description: 'Classic pyramid with big tiles - perfect for mobile',
    positions: generateMobilePyramidPositions(),
};

function generateMobilePyramidPositions(): LayoutPosition[] {
    const positions: LayoutPosition[] = [];

    // Layer 0 (bottom) - 6x8 = 48 tiles
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 6; x++) {
            positions.push({ x, y, z: 0 });
        }
    }

    // Layer 1 - 5x7 = 35 tiles (offset by 0.5 for stacking effect)
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 5; x++) {
            positions.push({ x: x + 0.5, y: y + 0.5, z: 1 });
        }
    }

    // Layer 2 - 4x6 = 24 tiles
    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 4; x++) {
            positions.push({ x: x + 1, y: y + 1, z: 2 });
        }
    }

    // Layer 3 - 3x5 = 15 tiles
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 3; x++) {
            positions.push({ x: x + 1.5, y: y + 1.5, z: 3 });
        }
    }

    // Layer 4 - 2x4 = 8 tiles
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 2; x++) {
            positions.push({ x: x + 2, y: y + 2, z: 4 });
        }
    }

    // Layer 5 (top) - 2x3 = 6 tiles
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 2; x++) {
            positions.push({ x: x + 2, y: y + 2.5, z: 5 });
        }
    }

    // Layer 6 (peak) - 1x4 = 4 tiles
    for (let y = 0; y < 4; y++) {
        positions.push({ x: 2.5, y: y + 2, z: 6 });
    }

    // Fill remaining to 144 with additional stacking
    while (positions.length < 144) {
        const layer = Math.floor((positions.length - 136) / 4) + 7;
        positions.push({ x: 2.5, y: 3, z: layer });
        if (positions.length < 144) positions.push({ x: 2.5, y: 4, z: layer });
        if (positions.length < 144) positions.push({ x: 3, y: 3.5, z: layer });
        if (positions.length < 144) positions.push({ x: 2, y: 3.5, z: layer });
    }

    return positions.slice(0, 144);
}

// All available layouts - mobile-friendly layouts first
export const LAYOUTS: Layout[] = [
    mobilePyramidLayout,  // NEW: Classic pyramid for mobile
    imperialTowerLayout,  // Tower for mobile portrait

    flatLayout,           // Simple mobile option  
    simpleLayout,         // Easy mobile option
    turtleLayout,         // Classic desktop
    largeLayout,          // Easy view
    pyramidLayout,
    dragonLayout,
    fortressLayout,
    bridgeLayout,
    spiralLayout,
    staircaseLayout,
    diamondLayout,
    templeLayout,
    scatterLayout,
];

export function getLayoutById(id: string): Layout | undefined {
    return LAYOUTS.find(l => l.id === id);
}

// Check if a layout has exactly 144 positions (or close to it)
export function validateLayout(layout: Layout): boolean {
    // Should have 144 positions for a complete game
    // Some layouts might have 142-144 due to centering
    return layout.positions.length >= 140 && layout.positions.length <= 144;
}

