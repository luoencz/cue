/**
 * Default Configuration
 * 
 * Configurable parameters for the generative art application.
 * These values can be seeded/overridden by the LLM prompt analyzer.
 */

import { AppConfig } from './types';
import { REFERENCE_RESOLUTION } from './constants';

export const CONFIG: AppConfig = {
    lines: {
        min: 4,
        max: 6,
        weightMin: 8,
        weightMax: 10,
    },

    circles: {
        min: 1,
        max: 2,
        radiusMin: 200,
        radiusMax: 600,
        weightMin: 8,
        weightMax: 10,
    },

    colors: {
        hueBase: 0.5,
        hueRange: 1.0,
        saturationMin: 0.6,
        saturationMax: 0.8,
        brightnessMin: 0.7,
        brightnessMax: 0.95,
    },

    stainedGlass: {
        centerGlow: 0.3,
        edgeDarken: 0.1,
        glowFalloff: 100,
        noiseScale: 2.5,
        noiseIntensity: 0.15,
    },

    leading: {
        color: { r: 0.08, g: 0.06, b: 0.04 },
        roundingRadius: 15,
        thickness: 4,
    },

    watercolor: {
        grainIntensity: 0.02,
        wobbleAmount: 4,
        wobbleScale: 0.003,
        colorBleed: 0.1,
        saturationBleed: 0.1,
        bleedScale: 0.0005,
        edgeIrregularity: 0.0,
    },

    referenceResolution: REFERENCE_RESOLUTION,
};
