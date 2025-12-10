/**
 * Math Utilities
 * 
 * Statistical distribution sampling and interpolation functions.
 */

/**
 * Sample from standard normal distribution using Box-Muller transform.
 * Returns a value from a standard normal distribution (mean=0, stddev=1).
 */
export function randomNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Sample from Gamma distribution using Marsaglia and Tsang's method.
 * 
 * @param shape - Shape parameter (must be > 0)
 * @returns A sample from Gamma(shape, 1)
 */
export function sampleGamma(shape: number): number {
    if (shape < 1) {
        // Boost for shape < 1
        return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
        let x: number;
        let v: number;
        
        do {
            x = randomNormal();
            v = 1 + c * x;
        } while (v <= 0);
        
        v = v * v * v;
        const u = Math.random();
        
        if (u < 1 - 0.0331 * (x * x) * (x * x)) {
            return d * v;
        }
        
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
            return d * v;
        }
    }
}

/**
 * Sample from a Beta distribution.
 * Uses the ratio of gamma variates method.
 * 
 * @param alpha - First shape parameter (must be > 0)
 * @param beta - Second shape parameter (must be > 0)
 * @returns A value in [0, 1] sampled from Beta(alpha, beta)
 */
export function sampleBeta(alpha: number, beta: number): number {
    // Special case: uniform distribution
    if (alpha === 1 && beta === 1) {
        return Math.random();
    }
    
    // Use the ratio of gamma variates method
    const gammaA = sampleGamma(alpha);
    const gammaB = sampleGamma(beta);
    return gammaA / (gammaA + gammaB);
}

/**
 * Linear interpolation between two values.
 * 
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation parameter (0 = a, 1 = b)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Clamp a value between a minimum and maximum.
 * 
 * @param value - Value to clamp
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 1)
 * @returns Clamped value
 */
export function clamp(value: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, value));
}
