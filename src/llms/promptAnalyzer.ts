/**
 * Prompt Analyzer - Uses Claude to extract emotional dimensions from text
 * 
 * Analyzes prompts on three dimensions:
 * - Valence: Emotional tone (0 = negative/dark, 1 = positive/bright)
 * - Arousal: Energy level (0 = calm/minimal, 1 = energetic/complex)
 * - Focus: Clarity/sharpness (0 = diffuse/dreamy, 1 = sharp/precise)
 */

export interface PromptDimensions {
    valence: number;  // 0-1: negative to positive
    arousal: number;  // 0-1: calm to energetic
    focus: number;    // 0-1: diffuse to sharp
}

const ANALYSIS_PROMPT = `Analyze the following text and rate it on three psychological dimensions. Return ONLY a JSON object with three numbers between 0 and 1.

Dimensions:
1. VALENCE (emotional tone): 0 = dark, melancholic, negative → 1 = bright, joyful, positive
2. AROUSAL (energy level): 0 = calm, peaceful, minimal → 1 = intense, energetic, dynamic  
3. FOCUS (clarity): 0 = dreamy, soft, diffuse → 1 = sharp, precise, detailed

Text to analyze:
"""
{PROMPT}
"""

Respond with ONLY valid JSON in this exact format, no other text:
{"valence": 0.X, "arousal": 0.X, "focus": 0.X}`;

/**
 * Analyze a prompt using Claude API
 */
export async function analyzePrompt(
    prompt: string,
    apiKey: string
): Promise<PromptDimensions> {
    if (!prompt.trim()) {
        return getDefaultDimensions();
    }

    const requestBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
            {
                role: 'user',
                content: ANALYSIS_PROMPT.replace('{PROMPT}', prompt)
            }
        ]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
        throw new Error('No response content from API');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    return {
        valence: clamp(parsed.valence ?? 0.5),
        arousal: clamp(parsed.arousal ?? 0.5),
        focus: clamp(parsed.focus ?? 0.5)
    };
}

/**
 * Get default dimensions (neutral values)
 */
export function getDefaultDimensions(): PromptDimensions {
    return {
        valence: 0.5,
        arousal: 0.5,
        focus: 0.5
    };
}

function clamp(value: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, value));
}

