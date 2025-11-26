import p5 from 'p5';

type Edge = 'top' | 'bottom' | 'left' | 'right';

interface Point {
    x: number;
    y: number;
}

interface LineConfig {
    start: Point;
    end: Point;
    color: p5.Color;
    weight: number;
}

/**
 * Get a random point on a specified edge of the canvas
 */
function getPointOnEdge(p: p5, edge: Edge): Point {
    switch (edge) {
        case 'top':
            return { x: p.random(p.width), y: 0 };
        case 'bottom':
            return { x: p.random(p.width), y: p.height };
        case 'left':
            return { x: 0, y: p.random(p.height) };
        case 'right':
            return { x: p.width, y: p.random(p.height) };
    }
}

/**
 * Get a random edge
 */
function getRandomEdge(p: p5): Edge {
    const edges: Edge[] = ['top', 'bottom', 'left', 'right'];
    return edges[Math.floor(p.random(4))];
}

/**
 * Generate a line that stretches from one edge to another
 */
export function generateEdgeToEdgeLine(p: p5): LineConfig {
    const startEdge = getRandomEdge(p);
    let endEdge = getRandomEdge(p);
    
    // Ensure we pick a different edge for more interesting lines
    while (endEdge === startEdge) {
        endEdge = getRandomEdge(p);
    }
    
    return {
        start: getPointOnEdge(p, startEdge),
        end: getPointOnEdge(p, endEdge),
        color: p.color(p.random(255), p.random(255), p.random(255)),
        weight: p.random(1, 4)
    };
}

/**
 * Generate multiple edge-to-edge lines
 */
export function generateLines(p: p5, count: number): LineConfig[] {
    const lines: LineConfig[] = [];
    for (let i = 0; i < count; i++) {
        lines.push(generateEdgeToEdgeLine(p));
    }
    return lines;
}

/**
 * Draw a line on the canvas
 */
export function drawLine(p: p5, line: LineConfig): void {
    p.stroke(line.color);
    p.strokeWeight(line.weight);
    p.line(line.start.x, line.start.y, line.end.x, line.end.y);
}

/**
 * Generate a random background color
 */
export function generateBackgroundColor(p: p5): p5.Color {
    return p.color(p.random(255), p.random(255), p.random(255));
}

