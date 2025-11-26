import p5 from 'p5';
import { generateLines, drawLine, generateBackgroundColor } from './generators';

const sketch = (p: p5) => {
    function generateArt() {
        // Random background color
        const bgColor = generateBackgroundColor(p);
        p.background(bgColor);
        
        // Generate and draw edge-to-edge lines
        const numLines = Math.floor(p.random(15, 30));
        const lines = generateLines(p, numLines);
        
        for (const line of lines) {
            drawLine(p, line);
        }
        
        // Draw instructions
        p.noStroke();
        p.fill(255, 255, 255, 200);
        p.rect(0, 0, p.width, 40);
        p.fill(0);
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Click anywhere to generate new artwork', p.width / 2, 20);
    }

    p.setup = () => {
        p.createCanvas(800, 600);
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

