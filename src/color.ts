/**
 * Color utilities - pure math, no p5 dependency
 */

export interface HSB {
    h: number;  // 0-1
    s: number;  // 0-1
    b: number;  // 0-1
}

export interface RGB {
    r: number;  // 0-255
    g: number;  // 0-255
    b: number;  // 0-255
}

export interface RGBA extends RGB {
    a: number;  // 0-255
}

/**
 * Convert HSB to RGB
 * All inputs in 0-1 range, outputs in 0-255 range
 */
export function hsbToRgb(h: number, s: number, b: number): RGB {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = b * (1 - s);
    const q = b * (1 - f * s);
    const t = b * (1 - (1 - f) * s);

    let r: number, g: number, bl: number;
    switch (i % 6) {
        case 0: r = b; g = t; bl = p; break;
        case 1: r = q; g = b; bl = p; break;
        case 2: r = p; g = b; bl = t; break;
        case 3: r = p; g = q; bl = b; break;
        case 4: r = t; g = p; bl = b; break;
        case 5: r = b; g = p; bl = q; break;
        default: r = 0; g = 0; bl = 0;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(bl * 255),
    };
}

/**
 * Convert HSB object to RGB
 */
export function hsbObjToRgb(hsb: HSB): RGB {
    return hsbToRgb(hsb.h, hsb.s, hsb.b);
}

/**
 * Generate a visually distinct HSB color using golden ratio distribution
 */
export function generateDistinctColor(index: number, saturation = 0.7, brightness = 0.85): HSB {
    const goldenRatio = 0.618033988749895;
    return {
        h: (index * goldenRatio) % 1,
        s: saturation,
        b: brightness,
    };
}

