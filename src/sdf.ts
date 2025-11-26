/**
 * Signed Distance Field calculation using Meijster's algorithm (2000)
 * 
 * This provides O(n) exact Euclidean distance transform for 2D images.
 * The algorithm works in two separable passes, making it highly cache-efficient.
 */

/**
 * A 2D distance field storing squared distances for each pixel
 */
export interface DistanceField {
    /** Squared distance values (use Math.sqrt for actual distance) */
    data: Float32Array;
    width: number;
    height: number;
}

/** Infinity constant for distance calculations */
const INF = 1e10;

/**
 * Calculate Euclidean distance transform using Meijster's algorithm.
 * 
 * @param boundaries - Uint8Array where 1 = boundary pixel, 0 = interior
 * @param width - Image width
 * @param height - Image height
 * @returns DistanceField with squared distances to nearest boundary
 * 
 * Time complexity: O(width * height)
 * Space complexity: O(width * height) for output + O(max(width, height)) working space
 */
export function calculateDistanceField(
    boundaries: Uint8Array,
    width: number,
    height: number
): DistanceField {
    const size = width * height;
    
    // Phase 1: Process columns - compute vertical distances
    const g = new Float32Array(size);
    processColumns(boundaries, g, width, height);
    
    // Phase 2: Process rows using parabola envelope technique
    const dt = new Float32Array(size);
    processRows(g, dt, width, height);
    
    return { data: dt, width, height };
}

/**
 * Phase 1: Process each column independently.
 * Computes squared vertical distance to nearest boundary in column.
 */
function processColumns(
    boundaries: Uint8Array,
    g: Float32Array,
    width: number,
    height: number
): void {
    for (let x = 0; x < width; x++) {
        // Forward pass: top to bottom
        let dist = boundaries[x] ? 0 : INF;
        g[x] = dist;
        
        for (let y = 1; y < height; y++) {
            const idx = y * width + x;
            if (boundaries[idx]) {
                dist = 0;
            } else {
                dist = dist + 1;
            }
            g[idx] = dist;
        }
        
        // Backward pass: bottom to top
        for (let y = height - 2; y >= 0; y--) {
            const idx = y * width + x;
            const idxBelow = (y + 1) * width + x;
            if (g[idxBelow] < g[idx]) {
                g[idx] = g[idxBelow] + 1;
            }
        }
        
        // Square the vertical distances
        for (let y = 0; y < height; y++) {
            const idx = y * width + x;
            g[idx] = g[idx] * g[idx];
        }
    }
}

/**
 * Phase 2: Process each row using parabola envelope technique.
 * Combines vertical distances with horizontal to get true Euclidean distance.
 * 
 * Uses the lower envelope of parabolas to efficiently find minimum distance.
 */
function processRows(
    g: Float32Array,
    dt: Float32Array,
    width: number,
    height: number
): void {
    // Working arrays for parabola envelope computation
    const s = new Int32Array(width); // Parabola positions
    const t = new Float32Array(width + 1); // Intersection points
    
    for (let y = 0; y < height; y++) {
        const rowStart = y * width;
        
        // Build lower envelope of parabolas
        let q = 0; // Number of parabolas in envelope
        s[0] = 0;
        t[0] = -INF;
        t[1] = INF;
        
        for (let u = 1; u < width; u++) {
            // Parabola at position u with apex g[rowStart + u]
            // f(x) = (x - u)² + g[rowStart + u]
            
            // Find intersection with current rightmost parabola
            let intersection = computeIntersection(
                s[q], g[rowStart + s[q]],
                u, g[rowStart + u]
            );
            
            // Remove parabolas that are completely dominated
            while (q > 0 && intersection <= t[q]) {
                q--;
                intersection = computeIntersection(
                    s[q], g[rowStart + s[q]],
                    u, g[rowStart + u]
                );
            }
            
            // Add new parabola to envelope
            q++;
            s[q] = u;
            t[q] = intersection;
            t[q + 1] = INF;
        }
        
        // Scan through row and compute distances
        let k = 0;
        for (let u = 0; u < width; u++) {
            // Move to the parabola that covers position u
            while (t[k + 1] < u) {
                k++;
            }
            
            // Distance squared = horizontal² + vertical²
            const dx = u - s[k];
            dt[rowStart + u] = dx * dx + g[rowStart + s[k]];
        }
    }
}

/**
 * Compute intersection point of two parabolas.
 * Parabola 1: f1(x) = (x - p1)² + v1
 * Parabola 2: f2(x) = (x - p2)² + v2
 * 
 * Solving f1(x) = f2(x):
 * (x - p1)² + v1 = (x - p2)² + v2
 * x² - 2p1x + p1² + v1 = x² - 2p2x + p2² + v2
 * 2(p2 - p1)x = p2² - p1² + v2 - v1
 * x = (p2² - p1² + v2 - v1) / (2(p2 - p1))
 */
function computeIntersection(p1: number, v1: number, p2: number, v2: number): number {
    return (p2 * p2 - p1 * p1 + v2 - v1) / (2 * (p2 - p1));
}

/**
 * Get distance at a specific pixel (returns actual distance, not squared)
 */
export function getDistance(field: DistanceField, x: number, y: number): number {
    if (x < 0 || x >= field.width || y < 0 || y >= field.height) {
        return 0;
    }
    return Math.sqrt(field.data[y * field.width + x]);
}

/**
 * Get squared distance at a specific pixel (faster, avoids sqrt)
 */
export function getDistanceSquared(field: DistanceField, x: number, y: number): number {
    if (x < 0 || x >= field.width || y < 0 || y >= field.height) {
        return 0;
    }
    return field.data[y * field.width + x];
}

/**
 * Find the maximum distance in the field
 */
export function getMaxDistance(field: DistanceField): number {
    let max = 0;
    for (let i = 0; i < field.data.length; i++) {
        if (field.data[i] > max && field.data[i] < INF) {
            max = field.data[i];
        }
    }
    return Math.sqrt(max);
}

/**
 * Create a normalized version of the distance field (0-1 range)
 */
export function normalizeDistanceField(field: DistanceField): DistanceField {
    const maxDist = getMaxDistance(field);
    const normalized = new Float32Array(field.data.length);
    
    if (maxDist > 0) {
        for (let i = 0; i < field.data.length; i++) {
            normalized[i] = Math.sqrt(field.data[i]) / maxDist;
        }
    }
    
    return { data: normalized, width: field.width, height: field.height };
}

/**
 * Extract boundary pixels from a line buffer
 * @param linePixels - p5 pixel array (RGBA format)
 * @param width - Image width
 * @param height - Image height
 * @param threshold - Brightness threshold for detecting lines (0-255)
 */
export function extractBoundaries(
    linePixels: number[],
    width: number,
    height: number,
    threshold: number = 50
): Uint8Array {
    const totalPixels = width * height;
    const boundaries = new Uint8Array(totalPixels);
    
    for (let i = 0; i < totalPixels; i++) {
        const pixelIndex = i * 4;
        const r = linePixels[pixelIndex];
        const g = linePixels[pixelIndex + 1];
        const b = linePixels[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < threshold) {
            boundaries[i] = 1;
        }
    }
    
    return boundaries;
}

