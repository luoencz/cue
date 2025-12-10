/**
 * Seed Configuration - Maps prompt dimensions to generation parameters
 * 
 * This module translates the three analyzed dimensions (valence, arousal, focus)
 * into a complete AppConfig.
 */

import { PromptDimensions } from '../llms/promptAnalyzer';
import { AppConfig, ColorConfig, ShapeConfig, StainedGlassEffect, WatercolorEffect } from './types';
import { CONFIG } from './config';

/**
 * Map valence to color palette
 * Low valence = cool, desaturated, darker
 * High valence = warm, saturated, brighter
 */
function mapValenceToColors(valence: number): Partial<ColorConfig> {
    // Hue: low valence → blues/purples (0.55-0.75), high valence → oranges/yellows (0.05-0.15)
    const hueBase = lerp(0.6, 0.08, valence);
    const hueRange = lerp(0.15, 0.25, valence); // More variety when positive
    
    // Saturation: increases with valence
    const saturationMin = lerp(0.35, 0.6, valence);
    const saturationMax = lerp(0.55, 0.85, valence);
    
    // Brightness: increases with valence
    const brightnessMin = lerp(0.5, 0.7, valence);
    const brightnessMax = lerp(0.7, 0.95, valence);
    
    return {
        hueBase,
        hueRange,
        saturationMin,
        saturationMax,
        brightnessMin,
        brightnessMax
    };
}

/**
 * Map arousal to shape counts
 * Low arousal = fewer, simpler shapes
 * High arousal = more, complex composition
 */
function mapArousalToShapes(arousal: number): { lines: Partial<ShapeConfig>, circles: Partial<ShapeConfig> } {
    // Lines: 2-3 at low arousal, 5-8 at high arousal
    const linesMin = Math.round(lerp(2, 5, arousal));
    const linesMax = Math.round(lerp(3, 8, arousal));
    
    // Circles: 0-1 at low arousal, 2-4 at high arousal
    const circlesMin = Math.round(lerp(0, 2, arousal));
    const circlesMax = Math.round(lerp(1, 4, arousal));
    
    return {
        lines: {
            min: linesMin,
            max: linesMax
        },
        circles: {
            min: circlesMin,
            max: circlesMax
        }
    };
}

/**
 * Map focus to effect parameters
 * Low focus = more blur, wobble, diffuse effects
 * High focus = sharp, precise, minimal distortion
 */
function mapFocusToEffects(focus: number): { stainedGlass: Partial<StainedGlassEffect>, watercolor: Partial<WatercolorEffect> } {
    // Wobble: high at low focus, low at high focus
    const wobbleAmount = lerp(8, 1, focus);
    const wobbleScale = lerp(0.004, 0.002, focus);
    
    // Color bleeding: high at low focus
    const colorBleed = lerp(0.2, 0.03, focus);
    const saturationBleed = lerp(0.2, 0.05, focus);
    
    // Noise: higher at low focus (more texture)
    const noiseIntensity = lerp(0.25, 0.08, focus);
    
    // Grain: higher at low focus
    const grainIntensity = lerp(0.04, 0.01, focus);
    
    // Edge effects: softer at low focus
    const edgeDarken = lerp(0.15, 0.05, focus);
    const centerGlow = lerp(0.4, 0.2, focus);
    
    return {
        stainedGlass: {
            noiseIntensity,
            edgeDarken,
            centerGlow
        },
        watercolor: {
            wobbleAmount,
            wobbleScale,
            colorBleed,
            saturationBleed,
            grainIntensity
        }
    };
}

/**
 * Generate a complete seeded configuration from prompt dimensions
 */
export function generateSeededConfig(dimensions: PromptDimensions): AppConfig {
    const colors = mapValenceToColors(dimensions.valence);
    const shapes = mapArousalToShapes(dimensions.arousal);
    const effects = mapFocusToEffects(dimensions.focus);

    return {
        ...CONFIG,
        colors: {
            ...CONFIG.colors,
            ...colors
        },
        lines: {
            ...CONFIG.lines,
            ...shapes.lines
        },
        circles: {
            ...CONFIG.circles,
            ...shapes.circles
        },
        stainedGlass: {
            ...CONFIG.stainedGlass,
            ...effects.stainedGlass
        },
        watercolor: {
            ...CONFIG.watercolor,
            ...effects.watercolor
        }
    };
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
