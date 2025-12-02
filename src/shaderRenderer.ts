import p5 from 'p5';
import { HSB, hsbObjToRgb } from './color';
import { LEADING, WATERCOLOR, STAINED_GLASS } from './config';
import { LineConfig, CircleConfig } from './generators';

// Import shaders as raw strings (Vite handles this with ?raw)
import vertShader from './shaders/region.vert?raw';
import fragShader from './shaders/region.frag?raw';

// Maximum shapes supported by uniform arrays (GLSL limit)
const MAX_LINES = 40;
const MAX_CIRCLES = 10;

/**
 * Stained glass effect configuration
 */
export interface StainedGlassConfig {
    centerGlow: number;
    edgeDarken: number;
    noiseScale: number;
    noiseIntensity: number;
    noiseSeed: number;
}

/**
 * Tile rendering configuration for high-res export
 */
export interface TileConfig {
    tileOffset: { x: number; y: number };
    fullResolution: { width: number; height: number };
}

export interface RegionData {
    ids: Uint8Array;
    colors: HSB[];
}

/**
 * Pack line endpoints into array of vec4 for shader uniforms.
 * Each vec4 = [x1, y1, x2, y2] in pixel coordinates
 */
function packLinesForShader(lines: LineConfig[]): number[] {
    const data: number[] = [];
    const count = Math.min(lines.length, MAX_LINES);

    for (let i = 0; i < count; i++) {
        const line = lines[i];
        data.push(line.start.x, line.start.y, line.end.x, line.end.y);
    }

    // Pad to MAX_LINES vec4s (4 floats each)
    while (data.length < MAX_LINES * 4) {
        data.push(0, 0, 0, 0);
    }

    return data;
}

/**
 * Pack circles into array of vec3 for shader uniforms.
 * Each vec3 = [centerX, centerY, radius] in pixel coordinates
 */
function packCirclesForShader(circles: CircleConfig[]): number[] {
    const data: number[] = [];
    const count = Math.min(circles.length, MAX_CIRCLES);

    for (let i = 0; i < count; i++) {
        const circle = circles[i];
        data.push(circle.center.x, circle.center.y, circle.radius);
    }

    // Pad to MAX_CIRCLES vec3s (3 floats each)
    while (data.length < MAX_CIRCLES * 3) {
        data.push(0, 0, 0);
    }

    return data;
}

/**
 * Manages GPU-accelerated region rendering via shaders
 */
export class ShaderRenderer {
    private shader: p5.Shader | null = null;
    private regionTex: p5.Graphics | null = null;
    private colorsTex: p5.Graphics | null = null;
    
    /** The WebGL renderer to draw to */
    private renderer: p5 | p5.Graphics;
    /** The p5 instance for creating 2D graphics (textures) */
    private p5Instance: p5;

    /**
     * @param renderer - The WebGL renderer to draw to (can be p5 or p5.Graphics)
     * @param p5Instance - Optional separate p5 instance for creating 2D textures.
     *                     Required when renderer is a p5.Graphics object.
     */
    constructor(renderer: p5 | p5.Graphics, p5Instance?: p5) {
        this.renderer = renderer;
        this.p5Instance = p5Instance || (renderer as p5);
    }

    /**
     * Initialize shader - call once in setup()
     */
    init(): void {
        this.shader = this.renderer.createShader(vertShader, fragShader);
    }

    /**
     * Render regions with stained glass effect and rounded leading.
     * Uses analytical SDF for distance calculations (no distance texture needed).
     * 
     * @param previewScale - Scale factor for preview rendering (1.0 = full export resolution).
     *                       Effect parameters are multiplied by this to show accurate preview.
     * @param tileConfig - Optional tile configuration for high-res tiled rendering
     */
    render(
        data: RegionData,
        config: StainedGlassConfig,
        lines: LineConfig[],
        circles: CircleConfig[] = [],
        previewScale: number = 1.0,
        tileConfig?: TileConfig
    ): void {
        if (!this.shader) {
            throw new Error('ShaderRenderer not initialized. Call init() first.');
        }

        const { width, height } = this.renderer;
        
        // Determine full resolution for tile offset
        const fullWidth = tileConfig?.fullResolution.width ?? width;
        const fullHeight = tileConfig?.fullResolution.height ?? height;

        // Create/update textures
        this.updateRegionTexture(data.ids, width, height);
        this.updateColorsTexture(data.colors);

        // Apply shader
        this.renderer.shader(this.shader);

        // Set texture uniforms
        this.shader.setUniform('uRegionTex', this.regionTex!);
        this.shader.setUniform('uColorsTex', this.colorsTex!);

        // Resolution for pixel-space calculations
        this.shader.setUniform('uResolution', [width, height]);
        
        // Tile configuration for consistent rendering across tiles
        if (tileConfig) {
            this.shader.setUniform('uFullResolution', [fullWidth, fullHeight]);
            this.shader.setUniform('uTileOffset', [tileConfig.tileOffset.x, tileConfig.tileOffset.y]);
        } else {
            // Non-tiled rendering: full resolution equals tile resolution, no offset
            this.shader.setUniform('uFullResolution', [width, height]);
            this.shader.setUniform('uTileOffset', [0, 0]);
        }

        // Stained glass uniforms (scaled for preview)
        this.shader.setUniform('uCenterGlow', config.centerGlow);
        this.shader.setUniform('uEdgeDarken', config.edgeDarken);
        this.shader.setUniform('uGlowFalloff', STAINED_GLASS.glowFalloff * previewScale);

        // Noise uniforms (scale inversely for consistent visual density)
        this.shader.setUniform('uNoiseScale', config.noiseScale);
        this.shader.setUniform('uNoiseIntensity', config.noiseIntensity);
        this.shader.setUniform('uNoiseSeed', config.noiseSeed);

        // Line uniforms for analytical SDF
        const lineData = packLinesForShader(lines);
        this.shader.setUniform('uLines', lineData);
        this.shader.setUniform('uLineCount', Math.min(lines.length, MAX_LINES));

        // Circle uniforms for analytical SDF
        const circleData = packCirclesForShader(circles);
        this.shader.setUniform('uCircles', circleData);
        this.shader.setUniform('uCircleCount', Math.min(circles.length, MAX_CIRCLES));

        // Leading appearance (scaled for preview to match final appearance)
        this.shader.setUniform('uLeadingThickness', LEADING.thickness * previewScale);
        this.shader.setUniform('uRoundingRadius', LEADING.roundingRadius * previewScale);
        this.shader.setUniform('uLeadingColor', [LEADING.color.r, LEADING.color.g, LEADING.color.b]);

        // Watercolor effect uniforms (scaled for preview)
        this.shader.setUniform('uGrainIntensity', WATERCOLOR.grainIntensity);
        this.shader.setUniform('uWobbleAmount', WATERCOLOR.wobbleAmount * previewScale);
        this.shader.setUniform('uWobbleScale', WATERCOLOR.wobbleScale / previewScale);  // Inverse scale for pattern size
        this.shader.setUniform('uColorBleed', WATERCOLOR.colorBleed);
        this.shader.setUniform('uSaturationBleed', WATERCOLOR.saturationBleed);
        this.shader.setUniform('uBleedScale', WATERCOLOR.bleedScale / previewScale);  // Inverse scale for pattern size
        this.shader.setUniform('uEdgeIrregularity', WATERCOLOR.edgeIrregularity);

        // Draw full-screen quad to trigger fragment shader
        this.renderer.rect(0, 0, width, height);

        // Reset to default shader
        this.renderer.resetShader();
    }

    /**
     * Create texture with region IDs
     */
    private updateRegionTexture(ids: Uint8Array, width: number, height: number): void {
        if (!this.regionTex || this.regionTex.width !== width || this.regionTex.height !== height) {
            this.regionTex?.remove();
            this.regionTex = this.p5Instance.createGraphics(width, height);
            this.regionTex.pixelDensity(1);
        }

        this.regionTex.loadPixels();
        const pixels = this.regionTex.pixels;

        for (let i = 0; i < ids.length; i++) {
            const idx = i * 4;
            const regionId = ids[i];
            pixels[idx] = regionId;
            pixels[idx + 1] = 0;
            pixels[idx + 2] = 0;
            pixels[idx + 3] = 255;
        }

        this.regionTex.updatePixels();
    }

    /**
     * Create 256x1 texture with region colors
     */
    private updateColorsTexture(colors: HSB[]): void {
        if (!this.colorsTex) {
            this.colorsTex = this.p5Instance.createGraphics(256, 1);
            this.colorsTex.pixelDensity(1);
        }

        this.colorsTex.loadPixels();
        const pixels = this.colorsTex.pixels;

        // Initialize all to black
        for (let i = 0; i < 256 * 4; i++) {
            pixels[i] = 0;
        }

        // Set colors for each region
        for (let i = 0; i < colors.length && i < 255; i++) {
            const rgb = hsbObjToRgb(colors[i]);
            const idx = i * 4;
            pixels[idx] = rgb.r;
            pixels[idx + 1] = rgb.g;
            pixels[idx + 2] = rgb.b;
            pixels[idx + 3] = 255;
        }

        this.colorsTex.updatePixels();
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.regionTex?.remove();
        this.colorsTex?.remove();
    }
}
