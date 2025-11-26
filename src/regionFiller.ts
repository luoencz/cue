import p5 from 'p5';
import { DistanceField, calculateDistanceField, extractBoundaries, getMaxDistance } from './sdf';

const LINE_THRESHOLD = 50; // Pixels darker than this are considered lines

/**
 * Region data containing pixels and color information
 */
export interface Region {
    id: number;
    pixels: number[]; // Flat array of pixel indices
    baseColor: { h: number; s: number; b: number };
}

/**
 * Configuration for SDF-based shading
 */
export interface ShadingConfig {
    /** How much the edge affects color (0-1) */
    edgeIntensity: number;
    /** Maximum distance (in pixels) for edge effect */
    edgeFalloff: number;
    /** Whether to darken or lighten near edges */
    edgeMode: 'darken' | 'lighten' | 'saturate';
}

const DEFAULT_SHADING: ShadingConfig = {
    edgeIntensity: 0.4,
    edgeFalloff: 80,
    edgeMode: 'darken',
};

/**
 * Span-based flood fill entry - much more efficient than pixel-based
 */
interface Span {
    y: number;
    xLeft: number;
    xRight: number;
}

/**
 * Fill regions with SDF-based shading.
 * Uses efficient scanline flood fill combined with distance field for gradient effects.
 */
export function fillRegions(
    p: p5,
    lineBuffer: p5.Graphics,
    shading: ShadingConfig = DEFAULT_SHADING
): void {
    const width = p.width;
    const height = p.height;
    const totalPixels = width * height;
    
    // Load pixels from line buffer for reading
    lineBuffer.loadPixels();
    const linePixels = lineBuffer.pixels;
    
    // Extract boundaries and calculate distance field
    const boundaries = extractBoundaries(linePixels as unknown as number[], width, height, LINE_THRESHOLD);
    const distanceField = calculateDistanceField(boundaries, width, height);
    
    // Load main canvas pixels for writing
    p.loadPixels();
    const canvasPixels = p.pixels;
    
    // Track visited pixels - Uint8Array is fastest for this
    const visited = new Uint8Array(totalPixels);
    
    // Mark boundary pixels as visited (they won't be filled)
    for (let i = 0; i < totalPixels; i++) {
        if (boundaries[i]) {
            visited[i] = 1;
        }
    }
    
    let regionId = 0;
    
    // Scan for unfilled regions
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            
            if (visited[idx]) continue;
            
            // Found a new region - generate color and fill with SDF shading
            const baseColor = generateRegionColorHSB(p, regionId);
            fillRegionWithSDF(
                p,
                canvasPixels as unknown as number[],
                visited,
                distanceField,
                width,
                height,
                x,
                y,
                baseColor,
                shading
            );
            regionId++;
        }
    }
    
    p.updatePixels();
}

/**
 * Fill a single region using SDF-based color gradients.
 * Combines scanline flood fill with distance-based color modulation.
 */
function fillRegionWithSDF(
    p: p5,
    pixels: number[],
    visited: Uint8Array,
    distanceField: DistanceField,
    width: number,
    height: number,
    startX: number,
    startY: number,
    baseColor: { h: number; s: number; b: number },
    shading: ShadingConfig
): void {
    const stack: Span[] = [];
    
    // Find initial span
    const [left, right] = findSpan(visited, width, startX, startY);
    stack.push({ y: startY, xLeft: left, xRight: right });
    
    // Pre-compute maximum falloff squared for efficiency
    const falloffSq = shading.edgeFalloff * shading.edgeFalloff;
    
    while (stack.length > 0) {
        const span = stack.pop()!;
        const { y, xLeft, xRight } = span;
        
        // Fill this span with SDF-based coloring
        for (let x = xLeft; x <= xRight; x++) {
            const idx = y * width + x;
            if (visited[idx]) continue;
            
            visited[idx] = 1;
            
            // Get distance to edge (squared distance from SDF)
            const distSq = distanceField.data[idx];
            
            // Calculate edge factor (0 at edge, 1 at falloff distance)
            const edgeFactor = Math.min(1, distSq / falloffSq);
            
            // Apply shading based on edge distance
            const color = applyEdgeShading(p, baseColor, edgeFactor, shading);
            
            const pixelIndex = idx * 4;
            pixels[pixelIndex] = color.r;
            pixels[pixelIndex + 1] = color.g;
            pixels[pixelIndex + 2] = color.b;
            pixels[pixelIndex + 3] = color.a;
        }
        
        // Check line above
        if (y > 0) {
            addSpansForLine(visited, width, y - 1, xLeft, xRight, stack);
        }
        
        // Check line below
        if (y < height - 1) {
            addSpansForLine(visited, width, y + 1, xLeft, xRight, stack);
        }
    }
}

/**
 * Apply edge-based shading to a color
 */
function applyEdgeShading(
    p: p5,
    baseColor: { h: number; s: number; b: number },
    edgeFactor: number, // 0 = at edge, 1 = far from edge
    shading: ShadingConfig
): { r: number; g: number; b: number; a: number } {
    // Calculate modification based on edge proximity
    const edgeEffect = (1 - edgeFactor) * shading.edgeIntensity;
    
    let h = baseColor.h;
    let s = baseColor.s;
    let b = baseColor.b;
    
    switch (shading.edgeMode) {
        case 'darken':
            // Darken near edges
            b = b * (1 - edgeEffect * 0.6);
            s = Math.min(1, s * (1 + edgeEffect * 0.3));
            break;
        case 'lighten':
            // Lighten near edges
            b = Math.min(1, b + edgeEffect * 0.3);
            s = s * (1 - edgeEffect * 0.3);
            break;
        case 'saturate':
            // Increase saturation near edges
            s = Math.min(1, s + edgeEffect * 0.4);
            break;
    }
    
    // Convert HSB to RGB
    p.colorMode(p.HSB, 1);
    const c = p.color(h, s, b);
    p.colorMode(p.RGB, 255);
    
    return {
        r: p.red(c),
        g: p.green(c),
        b: p.blue(c),
        a: 200, // Semi-transparent
    };
}

/**
 * Find the horizontal extent of an unfilled span starting at (x, y)
 */
function findSpan(
    visited: Uint8Array,
    width: number,
    startX: number,
    y: number
): [number, number] {
    const rowStart = y * width;
    
    // Scan left
    let left = startX;
    while (left > 0 && !visited[rowStart + left - 1]) {
        left--;
    }
    
    // Scan right
    let right = startX;
    while (right < width - 1 && !visited[rowStart + right + 1]) {
        right++;
    }
    
    return [left, right];
}

/**
 * Scan a line for unfilled spans within the given x range and add to stack
 */
function addSpansForLine(
    visited: Uint8Array,
    width: number,
    y: number,
    xLeft: number,
    xRight: number,
    stack: Span[]
): void {
    const rowStart = y * width;
    let x = xLeft;
    
    while (x <= xRight) {
        // Skip visited pixels
        while (x <= xRight && visited[rowStart + x]) {
            x++;
        }
        
        if (x > xRight) break;
        
        // Found start of unfilled span
        const spanLeft = x;
        
        // Find end of unfilled span
        while (x <= xRight && !visited[rowStart + x]) {
            x++;
        }
        
        // Extend span to natural boundaries
        const [extLeft, extRight] = findSpan(visited, width, spanLeft, y);
        stack.push({ y, xLeft: extLeft, xRight: extRight });
    }
}

/**
 * Generate a visually distinct HSB color for a region
 */
function generateRegionColorHSB(p: p5, regionId: number): { h: number; s: number; b: number } {
    // Use golden ratio for hue distribution - ensures distinct colors
    const goldenRatio = 0.618033988749895;
    const hue = (regionId * goldenRatio) % 1;
    
    return {
        h: hue,
        s: 0.6 + p.random(0.2),
        b: 0.7 + p.random(0.25),
    };
}
