import p5 from 'p5';
import { HSB, generateDistinctColor } from '../utility/color';
import { LineShapeConfig, CircleShapeConfig, ColorConfig, SeededValue, PromptDimensions } from '../config/types';
import { resolveValue } from '../config/seedConfig';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface Point {
    x: number;
    y: number;
}

export interface LineConfig {
    start: Point;
    end: Point;
    color: HSB;
    weight: number;
}

export interface CircleConfig {
    center: Point;
    radius: number;
    color: HSB;
    weight: number;
}

/**
 * Get a random point on a specified edge in normalized [0,1] coordinates
 */
function getPointOnEdge(p: p5, edge: Edge): Point {
    switch (edge) {
        case 'top':
            return { x: p.random(1), y: 0 };
        case 'bottom':
            return { x: p.random(1), y: 1 };
        case 'left':
            return { x: 0, y: p.random(1) };
        case 'right':
            return { x: 1, y: p.random(1) };
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
 * Generate a line that stretches from one edge to another.
 */
export function generateEdgeToEdgeLine(
    p: p5, 
    index: number, 
    config: LineShapeConfig,
    colors: ColorConfig
): LineConfig {
    const startEdge = getRandomEdge(p);
    let endEdge = getRandomEdge(p);

    // Ensure we pick a different edge for more interesting lines
    while (endEdge === startEdge) {
        endEdge = getRandomEdge(p);
    }

    // Use the resolved saturation/brightness values with small random variation
    const satVariance = 0.1;
    const briVariance = 0.1;
    const saturation = colors.saturation + p.random(-satVariance, satVariance);
    const brightness = colors.brightness + p.random(-briVariance, briVariance);

    return {
        start: getPointOnEdge(p, startEdge),
        end: getPointOnEdge(p, endEdge),
        color: generateDistinctColor(index, saturation, brightness),
        weight: config.weight,
    };
}

/**
 * Generate multiple edge-to-edge lines.
 * Positions are in normalized [0,1] coordinates; weight is absolute pixels.
 */
export function generateLines(
    p: p5, 
    count: number, 
    config: LineShapeConfig,
    colors: ColorConfig
): LineConfig[] {
    const lines: LineConfig[] = [];
    for (let i = 0; i < count; i++) {
        lines.push(generateEdgeToEdgeLine(p, i, config, colors));
    }
    return lines;
}

/**
 * Draw a line to a buffer using black color (for boundary detection).
 * Denormalizes positions from [0,1] to buffer dimensions.
 * @param weightScale - Scale factor for weight (1.0 for export, previewScale for preview)
 */
export function drawLineToBuffer(buffer: p5.Graphics, line: LineConfig, width: number, height: number, weightScale: number = 1.0): void {
    buffer.stroke(0);
    buffer.strokeWeight(line.weight * weightScale);
    buffer.line(
        line.start.x * width, line.start.y * height,
        line.end.x * width, line.end.y * height
    );
}

/**
 * Generate a random circle within the canvas bounds.
 * Center is in normalized [0,1] coordinates; radius is fraction of smaller dimension; weight is absolute pixels.
 * Radius is sampled from the distribution each time (not resolved once).
 */
export function generateCircle(
    p: p5,
    index: number,
    config: CircleShapeConfig,
    colors: ColorConfig,
    radiusTemplate: SeededValue,
    dimensions: PromptDimensions
): CircleConfig {
    const radius = resolveValue(radiusTemplate, dimensions);

    // Keep center within canvas with some margin (in normalized coords)
    // Margin is half the radius as a fraction
    const margin = radius * 0.5;
    const center: Point = {
        x: p.random(margin, 1 - margin),
        y: p.random(margin, 1 - margin),
    };

    // Use the resolved saturation/brightness values with small random variation
    const satVariance = 0.1;
    const briVariance = 0.1;
    const saturation = colors.saturation + p.random(-satVariance, satVariance);
    const brightness = colors.brightness + p.random(-briVariance, briVariance);

    return {
        center,
        radius,
        color: generateDistinctColor(index + 100, saturation, brightness),  // Offset index for different hues
        weight: config.weight,
    };
}

/**
 * Generate multiple circles.
 * Centers are in normalized [0,1] coordinates; radius is fraction of smaller dimension; weight is absolute pixels.
 * Radius is sampled from the distribution for each circle.
 */
export function generateCircles(
    p: p5,
    count: number,
    config: CircleShapeConfig,
    colors: ColorConfig,
    radiusTemplate: SeededValue,
    dimensions: PromptDimensions
): CircleConfig[] {
    const circles: CircleConfig[] = [];
    for (let i = 0; i < count; i++) {
        circles.push(generateCircle(p, i, config, colors, radiusTemplate, dimensions));
    }
    return circles;
}

/**
 * Draw a circle to a buffer using black color (for boundary detection).
 * Denormalizes positions from [0,1] to buffer dimensions.
 * @param weightScale - Scale factor for weight (1.0 for export, previewScale for preview)
 */
export function drawCircleToBuffer(buffer: p5.Graphics, circle: CircleConfig, width: number, height: number, weightScale: number = 1.0): void {
    buffer.noFill();
    buffer.stroke(0);
    buffer.strokeWeight(circle.weight * weightScale);
    const smallerDimension = Math.min(width, height);
    buffer.circle(
        circle.center.x * width,
        circle.center.y * height,
        circle.radius * smallerDimension * 2
    );
}
