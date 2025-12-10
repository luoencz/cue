/**
 * Universal Configuration Types
 * 
 * Defines the complete state required to generate an artwork.
 * This structure is used for both default configuration and seeded/LLM-generated configuration.
 */

export interface ShapeConfig {
    /** Minimum number of shapes per generation */
    min: number;
    /** Maximum number of shapes per generation */
    max: number;
    /** Stroke weight range */
    weightMin: number;
    weightMax: number;
    /** Radius range (for circles only) */
    radiusMin?: number;
    radiusMax?: number;
}

export interface ColorConfig {
    /** Base hue (0-1), 0.5 is neutral */
    hueBase: number;
    /** Hue variation range (0-1), 1.0 is full rainbow */
    hueRange: number;
    /** Saturation range */
    saturationMin: number;
    saturationMax: number;
    /** Brightness range */
    brightnessMin: number;
    brightnessMax: number;
}

export interface StainedGlassEffect {
    /** How much brighter the center of each pane is (0-1) */
    centerGlow: number;
    /** Subtle darkening at edges near the leading (0-1) */
    edgeDarken: number;
    /** Distance for glow falloff in pixels */
    glowFalloff: number;
    /** Scale of noise features */
    noiseScale: number;
    /** How much noise affects the surface appearance (0-1) */
    noiseIntensity: number;
}

export interface WatercolorEffect {
    /** Intensity of visible grain texture */
    grainIntensity: number;
    /** How much the leading lines wobble in pixels */
    wobbleAmount: number;
    /** Scale of the wobble pattern */
    wobbleScale: number;
    /** How much hue shifts within regions */
    colorBleed: number;
    /** How much saturation varies within regions */
    saturationBleed: number;
    /** Scale of the color bleeding pattern */
    bleedScale: number;
    /** How much the edge darkening varies */
    edgeIrregularity: number;
}

export interface LeadingConfig {
    /** Color of the boundary lines in the shader (RGB 0-1) */
    color: { r: number; g: number; b: number };
    /** Corner rounding radius in pixels */
    roundingRadius: number;
    /** Base thickness of the leading in pixels */
    thickness: number;
}

export interface ReferenceResolution {
    width: number;
    height: number;
}

/**
 * The Master Config Object
 * Contains all parameters needed to render an image.
 */
export interface AppConfig {
    lines: ShapeConfig;
    circles: ShapeConfig;
    colors: ColorConfig;
    stainedGlass: StainedGlassEffect;
    watercolor: WatercolorEffect;
    leading: LeadingConfig;
    referenceResolution: ReferenceResolution;
}
