import p5 from 'p5';
import { generateLines, drawLine, drawLineToBuffer, LineConfig } from './generators';
import { detectRegions } from './regionFiller';
import { ShaderRenderer, ShadingConfig } from './shaderRenderer';

// Canvas dimensions
const WIDTH = 3456;
const HEIGHT = 2234;

// Generation parameters
// Note: More lines = more regions. Keep under ~25 lines to stay within 254 region limit.
const LINE_COUNT = { min: 8, max: 20 };

// SDF shading configuration
const SHADING_CONFIG: ShadingConfig = {
    edgeIntensity: 0.5,
    edgeFalloff: 100,
    edgeMode: 'darken',
};

const sketch = (p: p5) => {
    let lineBuffer: p5.Graphics;
    let shaderRenderer: ShaderRenderer;
    let isGenerating = false;

    function generateArt() {
        if (isGenerating) return;
        isGenerating = true;

        // Clear line buffer with white background
        lineBuffer.background(255);

        // Generate lines
        const numLines = Math.floor(p.random(LINE_COUNT.min, LINE_COUNT.max));
        const lines: LineConfig[] = generateLines(p, numLines, WIDTH, HEIGHT);

        // Draw lines to buffer (black lines for boundary detection)
        for (const line of lines) {
            drawLineToBuffer(lineBuffer, line);
        }

        // Detect regions from line buffer (CPU)
        lineBuffer.loadPixels();
        // p5's type definitions incorrectly type pixels as number[], but it's actually Uint8ClampedArray
        const regionData = detectRegions(lineBuffer.pixels as unknown as Uint8ClampedArray, WIDTH, HEIGHT);

        // Render regions with SDF shading (GPU)
        p.background(255);
        shaderRenderer.render(regionData, SHADING_CONFIG);

        // Draw colored lines on top
        for (const line of lines) {
            drawLine(p, line);
        }

        isGenerating = false;
    }

    p.setup = () => {
        p.createCanvas(WIDTH, HEIGHT, p.WEBGL);
        p.pixelDensity(1);

        // Create off-screen buffer for line detection
        lineBuffer = p.createGraphics(WIDTH, HEIGHT);
        lineBuffer.pixelDensity(1);

        // Initialize shader renderer
        shaderRenderer = new ShaderRenderer(p);
        shaderRenderer.init();

        generateArt();
    };

    p.draw = () => {
        p.noLoop();
    };

    p.mousePressed = () => {
        generateArt();
    };
};

new p5(sketch);
