/**
 * Config Resolver - Resolves ConfigTemplate to AppConfig
 * 
 * Uses beta distribution sampling and sentiment dimensions to generate final values.
 * Now uses a generic recursive resolver that automatically handles any config structure.
 */

import { PromptDimensions, DEFAULT_DIMENSIONS, ConfigValueType } from './types';
import { 
    ConfigTemplate, 
    AppConfig, 
    SeededValue,
    Resolved,
} from './types';
import { CONFIG_TEMPLATE } from './config';
import { sampleBeta, lerp } from '../utility/math';

/**
 * Resolve a single SeededValue to a number.
 * 
 * The process:
 * 1. Sample from Beta distribution → t in [0, 1]
 * 2. If seeded, shift t based on dimension value (0.5 = no shift, preserves beta distribution)
 * 3. Map final t to range
 */
export function resolveValue(value: SeededValue, dimensions: PromptDimensions): number {
    const [alpha, beta] = value.beta;
    const [low, high] = value.range;
    
    let t = sampleBeta(alpha, beta);
    
    if (value.seed) {
        const dimensionValue = dimensions[value.seed.dimension];
        const influence = value.seed.influence;
        
        t = t + (dimensionValue - 0.5) * influence * 2;
        t = Math.max(0, Math.min(1, t));
    }
    
    return lerp(low, high, t);
}

/**
 * Generic recursive resolver that walks the config tree and resolves SeededValues
 * 
 * This automatically handles any structure depth without manual mapping.
 */
function resolveDeep<T>(template: T, dimensions: PromptDimensions): Resolved<T> {
    if (typeof template === 'object' && template !== null && !Array.isArray(template)) {
        if ((template as any).type === ConfigValueType.SEEDED) {
            return resolveValue(template as unknown as SeededValue, dimensions) as any;
        }
        
        const result: any = {};
        for (const key in template) {
            if (template.hasOwnProperty(key)) {
                result[key] = resolveDeep(template[key], dimensions);
            }
        }
        return result;
    }
    
    return template as any;
}

/**
 * Convert density (shapes per megapixel) to count based on target resolution
 */
export function densityToCount(density: number, width: number, height: number): number {
    const megapixels = (width * height) / 1_000_000;
    return Math.max(0, Math.round(density * megapixels));
}

/**
 * Generate a resolved AppConfig from the template and dimensions.
 * 
 * If template is not provided, uses CONFIG_TEMPLATE.
 * If dimensions are not provided, uses default neutral dimensions (0.5 for all).
 * 
 */
export function resolveConfig(
    template: ConfigTemplate = CONFIG_TEMPLATE,
    dimensions?: PromptDimensions
): AppConfig {
    const dims = dimensions ?? DEFAULT_DIMENSIONS;
    return resolveDeep(template, dims);
}
