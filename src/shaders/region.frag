precision highp float;

varying vec2 vTexCoord;

// Textures
uniform sampler2D uRegionTex;    // R channel = region ID (0-255)
uniform sampler2D uDistanceTex;  // R channel = normalized distance (0-1)
uniform sampler2D uColorsTex;    // 256x1 texture with region colors

// Shading parameters
uniform float uEdgeIntensity;    // How strong the edge effect is (0-1)
uniform float uEdgeFalloff;      // Distance for full falloff (in normalized coords)
uniform int uEdgeMode;           // 0 = darken, 1 = lighten, 2 = saturate

// Convert RGB to HSB
vec3 rgb2hsb(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Convert HSB to RGB
vec3 hsb2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
    // Sample region ID (stored in R channel, 0-255 mapped to 0-1)
    float regionId = texture2D(uRegionTex, vTexCoord).r;
    
    // If region ID is 1.0 (255), it's a boundary - render as black line
    if (regionId > 0.99) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Look up base color from color palette texture
    // Region ID 0-254 maps to texture coordinates 0-254/255
    vec3 baseColor = texture2D(uColorsTex, vec2(regionId, 0.5)).rgb;
    
    // Sample distance field (normalized 0-1)
    float dist = texture2D(uDistanceTex, vTexCoord).r;
    
    // Calculate edge factor (0 at edge, 1 far from edge)
    float edgeFactor = clamp(dist / uEdgeFalloff, 0.0, 1.0);
    
    // Calculate edge effect strength
    float edgeEffect = (1.0 - edgeFactor) * uEdgeIntensity;
    
    // Convert to HSB for manipulation
    vec3 hsb = rgb2hsb(baseColor);
    
    // Apply shading based on mode
    if (uEdgeMode == 0) {
        // Darken near edges
        hsb.z *= (1.0 - edgeEffect * 0.6);
        hsb.y = min(1.0, hsb.y * (1.0 + edgeEffect * 0.3));
    } else if (uEdgeMode == 1) {
        // Lighten near edges
        hsb.z = min(1.0, hsb.z + edgeEffect * 0.3);
        hsb.y *= (1.0 - edgeEffect * 0.3);
    } else {
        // Saturate near edges
        hsb.y = min(1.0, hsb.y + edgeEffect * 0.4);
    }
    
    // Convert back to RGB
    vec3 finalColor = hsb2rgb(hsb);
    
    gl_FragColor = vec4(finalColor, 1.0);
}

