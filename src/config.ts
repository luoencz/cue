/**
 * Central configuration for the generative art application.
 * Tweak these values to adjust the output.
 */

//=============================================================================
// RESOLUTION PRESETS
//=============================================================================

export interface Resolution {
    name: string;
    width: number;
    height: number;
    description: string;
}

export const RESOLUTION_PRESETS: Resolution[] = [
    { name: '4K Ultra HD', width: 3840, height: 2160, description: 'Desktop wallpaper, prints' },
    { name: '2K QHD', width: 2560, height: 1440, description: 'High-res desktop' },
    { name: 'Full HD', width: 1920, height: 1080, description: 'Standard desktop' },
    { name: 'Phone Portrait', width: 1170, height: 2532, description: 'iPhone 14/15' },
    { name: 'Phone Landscape', width: 2532, height: 1170, description: 'iPhone 14/15' },
    { name: 'Tablet', width: 2048, height: 2732, description: 'iPad Pro' },
    { name: 'Square', width: 2048, height: 2048, description: 'Social media' },
    { name: 'Instagram Story', width: 1080, height: 1920, description: '9:16 vertical' },
];

/** Maximum tile size for mobile-safe rendering */
export const MAX_TILE_SIZE = 1024;

//=============================================================================
// LINE GENERATION
//=============================================================================

export const LINES = {
    /** Minimum number of lines per generation */
    min: 4,
    /** Maximum number of lines per generation */
    max: 6,
    /** Line weight range */
    weightMin: 8,
    weightMax: 10,
};

//=============================================================================
// CIRCLE GENERATION
//=============================================================================

export const CIRCLES = {
    /** Minimum number of circles per generation */
    min: 1,
    /** Maximum number of circles per generation */
    max: 2,
    /** Circle radius range (in pixels) */
    radiusMin: 200,
    radiusMax: 600,
    /** Stroke weight range */
    weightMin: 8,
    weightMax: 10,
};

// Note: More shapes = more regions. Keep total under ~25 to stay within 254 region limit.

//=============================================================================
// STAINED GLASS EFFECT
//=============================================================================

/** 
 * Reference resolution for shape scaling.
 * Shape counts and sizes are defined for this resolution,
 * then scaled based on target canvas area/dimensions.
 */
export const REFERENCE_RESOLUTION = { width: 1920, height: 1080 };

export const STAINED_GLASS = {
    //-------------------------------------------------------------------------
    // Light Transmission
    //-------------------------------------------------------------------------

    /** How much brighter the center of each pane is (0-1) */
    centerGlow: 0.3,

    /** Subtle darkening at edges near the leading (0-1) */
    edgeDarken: 0.1,

    /** Distance for glow falloff in pixels (fixed visual quality) */
    glowFalloff: 100,

    //-------------------------------------------------------------------------
    // Glass Texture (Noise)
    //-------------------------------------------------------------------------

    /** Scale of noise features (higher = smaller/finer details) */
    noiseScale: 2.5,

    /** How much noise affects the surface appearance (0-1) */
    noiseIntensity: 0.15,
};

//=============================================================================
// REGION COLORS
//=============================================================================

export const COLORS = {
    /** Base saturation range for region colors */
    saturationMin: 0.6,
    saturationMax: 0.8,

    /** Base brightness range for region colors */
    brightnessMin: 0.7,
    brightnessMax: 0.95,
};

//=============================================================================
// LEADING (Lines on top)
//=============================================================================

export const LEADING = {
    /** Color of the boundary lines in the shader (RGB 0-1) */
    color: { r: 0.08, g: 0.06, b: 0.04 },  // Dark brown like lead came

    /** Corner rounding radius in pixels (fixed visual quality) */
    roundingRadius: 15,

    /** Base thickness of the leading in pixels (fixed visual quality) */
    thickness: 4,
};

//=============================================================================
// WATERCOLOR TEXTURE
//=============================================================================

export const WATERCOLOR = {
    //-------------------------------------------------------------------------
    // Film Grain
    //-------------------------------------------------------------------------

    /** Intensity of visible grain texture (0-0.1 typical) */
    grainIntensity: 0.02,

    //-------------------------------------------------------------------------
    // Wavy Leading (organic hand-drawn look)
    //-------------------------------------------------------------------------

    /** How much the leading lines wobble in pixels (fixed visual quality) */
    wobbleAmount: 4,

    /** Scale of the wobble pattern (lower = larger waves) */
    wobbleScale: 0.003,

    //-------------------------------------------------------------------------
    // Color Bleeding (watercolor effect)
    //-------------------------------------------------------------------------

    /** How much hue shifts within regions (0-0.3 typical) */
    colorBleed: 0.1,

    /** How much saturation varies within regions */
    saturationBleed: 0.1,

    /** Scale of the color bleeding pattern */
    bleedScale: 0.0005,

    //-------------------------------------------------------------------------
    // Edge Irregularity
    //-------------------------------------------------------------------------

    /** How much the edge darkening varies (organic borders) */
    edgeIrregularity: 0.00,
};
