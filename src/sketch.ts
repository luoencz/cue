import p5 from 'p5';
import { generateLines, drawLine, drawLineToBuffer, LineConfig } from './generators';
import { fillRegions, ShadingConfig } from './regionFiller';

// Landscape aspect ratio for the artwork
const WIDTH = 1920;
const HEIGHT = 1080;

// SDF shading configuration - tweak these for different effects
const SHADING_CONFIG: ShadingConfig = {
    edgeIntensity: 0.5,    // How strong the edge effect is (0-1)
    edgeFalloff: 100,      // Distance in pixels over which the effect fades
    edgeMode: 'darken',    // 'darken' | 'lighten' | 'saturate'
};

const sketch = (p: p5) => {
    let lineBuffer: p5.Graphics;
    let isGenerating = false;

    function generateArt() {
        if (isGenerating) return;
        isGenerating = true;

        // Clear line buffer with white background
        lineBuffer.background(255);

        // Generate lines
        const numLines = Math.floor(p.random(15, 40));
        const lines: LineConfig[] = generateLines(p, numLines);

        // Draw lines to buffer (black lines for detection)
        for (const line of lines) {
            drawLineToBuffer(lineBuffer, line);
        }

        // Fill regions based on line buffer with SDF shading
        p.background(255);
        fillRegions(p, lineBuffer, SHADING_CONFIG);

        // Draw colored lines on top
        for (const line of lines) {
            drawLine(p, line);
        }

        isGenerating = false;
    }

    p.setup = () => {
        p.createCanvas(WIDTH, HEIGHT);
        p.pixelDensity(1);
        
        // Create off-screen buffer for line detection
        lineBuffer = p.createGraphics(WIDTH, HEIGHT);
        lineBuffer.pixelDensity(1);
        
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
