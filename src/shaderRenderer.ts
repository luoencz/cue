import p5 from 'p5';
import { DistanceField, getMaxDistance } from './sdf';
import { HSB, hsbObjToRgb } from './color';

// Import shaders as raw strings (Vite handles this with ?raw)
import vertShader from './shaders/region.vert?raw';
import fragShader from './shaders/region.frag?raw';
export type EdgeMode = 'darken' | 'lighten' | 'saturate';

export interface ShadingConfig {
    edgeIntensity: number;
    edgeFalloff: number;
    edgeMode: EdgeMode;
}

interface RegionData {
    ids: Uint8Array;           // Region ID per pixel (0-254 = regions, 255 = boundary)
    colors: HSB[];             // Color for each region
    distanceField: DistanceField;
}

/**
 * Manages GPU-accelerated region rendering via shaders
 */
export class ShaderRenderer {
    private shader: p5.Shader | null = null;
    private regionTex: p5.Graphics | null = null;
    private distanceTex: p5.Graphics | null = null;
    private colorsTex: p5.Graphics | null = null;

    constructor(private p: p5) {}

    /**
     * Initialize shader - call once in setup()
     */
    init(): void {
        this.shader = this.p.createShader(vertShader, fragShader);
    }

    /**
     * Render regions using GPU shader
     */
    render(data: RegionData, config: ShadingConfig): void {
        if (!this.shader) {
            throw new Error('ShaderRenderer not initialized. Call init() first.');
        }

        const { width, height } = this.p;

        // Create/update textures
        this.updateRegionTexture(data.ids, width, height);
        this.updateDistanceTexture(data.distanceField);
        this.updateColorsTexture(data.colors);

        // Apply shader
        this.p.shader(this.shader);

        // Set uniforms
        this.shader.setUniform('uRegionTex', this.regionTex!);
        this.shader.setUniform('uDistanceTex', this.distanceTex!);
        this.shader.setUniform('uColorsTex', this.colorsTex!);
        this.shader.setUniform('uEdgeIntensity', config.edgeIntensity);
        // Normalize falloff to 0-1 range based on canvas size
        this.shader.setUniform('uEdgeFalloff', config.edgeFalloff / Math.max(width, height));
        this.shader.setUniform('uEdgeMode', this.edgeModeToInt(config.edgeMode));

        // Draw full-screen quad to trigger fragment shader
        this.p.rect(0, 0, width, height);

        // Reset to default shader
        this.p.resetShader();
    }

    /**
     * Create texture with region IDs
     */
    private updateRegionTexture(ids: Uint8Array, width: number, height: number): void {
        if (!this.regionTex || this.regionTex.width !== width || this.regionTex.height !== height) {
            this.regionTex = this.p.createGraphics(width, height);
            this.regionTex.pixelDensity(1);
        }

        this.regionTex.loadPixels();
        const pixels = this.regionTex.pixels;

        for (let i = 0; i < ids.length; i++) {
            const idx = i * 4;
            const regionId = ids[i];
            // Store region ID in R channel (normalized to 0-255)
            pixels[idx] = regionId;
            pixels[idx + 1] = 0;
            pixels[idx + 2] = 0;
            pixels[idx + 3] = 255;
        }

        this.regionTex.updatePixels();
    }

    /**
     * Create texture with normalized distance values
     */
    private updateDistanceTexture(field: DistanceField): void {
        const { width, height, data } = field;

        if (!this.distanceTex || this.distanceTex.width !== width || this.distanceTex.height !== height) {
            this.distanceTex = this.p.createGraphics(width, height);
            this.distanceTex.pixelDensity(1);
        }

        const maxDist = getMaxDistance(field);

        this.distanceTex.loadPixels();
        const pixels = this.distanceTex.pixels;

        for (let i = 0; i < data.length; i++) {
            const idx = i * 4;
            // Normalize distance to 0-255 range
            const normalizedDist = maxDist > 0 ? Math.sqrt(data[i]) / maxDist : 0;
            const distByte = Math.min(255, Math.floor(normalizedDist * 255));
            pixels[idx] = distByte;
            pixels[idx + 1] = 0;
            pixels[idx + 2] = 0;
            pixels[idx + 3] = 255;
        }

        this.distanceTex.updatePixels();
    }

    /**
     * Create 256x1 texture with region colors
     */
    private updateColorsTexture(colors: HSB[]): void {
        if (!this.colorsTex) {
            this.colorsTex = this.p.createGraphics(256, 1);
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

    private edgeModeToInt(mode: EdgeMode): number {
        switch (mode) {
            case 'darken': return 0;
            case 'lighten': return 1;
            case 'saturate': return 2;
        }
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.regionTex?.remove();
        this.distanceTex?.remove();
        this.colorsTex?.remove();
    }
}

