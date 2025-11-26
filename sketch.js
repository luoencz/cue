function setup() {
    createCanvas(800, 600);
    generateArt();
}

function draw() {
    // Static image - no animation needed
    noLoop();
}

function generateArt() {
    // Random background color
    let bgColor = color(random(255), random(255), random(255));
    background(bgColor);
    
    // Number of lines to draw
    let numLines = int(random(15, 30));
    
    // Draw intersecting lines
    for (let i = 0; i < numLines; i++) {
        // Random stroke properties
        stroke(random(255), random(255), random(255));
        strokeWeight(random(1, 4));
        
        // Random line endpoints
        let x1 = random(width);
        let y1 = random(height);
        let x2 = random(width);
        let y2 = random(height);
        
        line(x1, y1, x2, y2);
    }
    
    // Draw instructions
    noStroke();
    fill(255, 255, 255, 200);
    rect(0, 0, width, 40);
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text('Click anywhere to generate new artwork', width / 2, 20);
}

function mousePressed() {
    generateArt();
}

