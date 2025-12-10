/**
 * Prompt Analyzer - Uses Claude to extract emotional dimensions from text
 * 
 * Analyzes prompts on three dimensions:
 * - Valence: Emotional tone (0 = negative/dark, 1 = positive/bright)
 * - Arousal: Energy level (0 = calm/minimal, 1 = energetic/complex)
 * - Focus: Clarity/sharpness (0 = diffuse/dreamy, 1 = sharp/precise)
 */

import { PromptDimensions, DEFAULT_DIMENSIONS } from '../config/types';
import { clamp } from '../utility/math';
// @ts-ignore
import ANALYSIS_PROMPT_TEMPLATE from '../config/prompt.txt' with { type: 'text' };

/**
 * Analyze a prompt using Claude API
 */
export async function analyzePrompt(
    prompt: string,
    apiKey: string
): Promise<PromptDimensions> {
    const requestBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
            {
                role: 'user',
                content: ANALYSIS_PROMPT_TEMPLATE.replace('{PROMPT}', prompt)
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

