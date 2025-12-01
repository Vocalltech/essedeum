import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CharacterDetails {
    name: string;
    type: string; // Character, Location, Item, etc.
    description?: string; // Physical description from content
}

export interface GeneratedImage {
    base64: string;
    mimeType: string;
}

/**
 * Extract physical description from lore content
 */
function extractDescription(content: string): string {
    // Remove HTML tags and get plain text
    const plainText = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Limit to first 500 characters for the prompt
    return plainText.length > 500 ? plainText.substring(0, 500) + '...' : plainText;
}

/**
 * Build a rich prompt for image generation based on lore type
 */
function buildImagePrompt(details: CharacterDetails): string {
    const description = details.description ? extractDescription(details.description) : '';

    switch (details.type) {
        case 'Character':
            return `Fantasy character portrait, ${details.name}. ${description}. High bronze punk fantasy art style, detailed face and expression, cinematic lighting, professional illustration, 8k resolution, painterly style, rich colors.`;

        case 'Location':
            return `Fantasy landscape illustration, ${details.name}. ${description}. Epic bronze punk fantasy environment, atmospheric perspective, dramatic lighting, detailed architecture and nature, concept art style, 8k resolution, matte painting quality.`;

        case 'Item':
            return `Fantasy item illustration, ${details.name}. ${description}. Detailed artifact rendering, magical glow effects, intricate details, dark fantasy style, professional game art, 8k resolution, dramatic lighting.`;

        case 'Event':
            return `Fantasy scene illustration depicting ${details.name}. ${description}. Dynamic composition, epic fantasy art style, dramatic lighting, action and emotion, cinematic quality, 8k resolution.`;

        case 'Concept':
            return `Abstract fantasy illustration representing ${details.name}. ${description}. Symbolic imagery, mystical atmosphere, ethereal quality, concept art style, rich colors, 8k resolution.`;

        default:
            return `Fantasy illustration of ${details.name}. ${description}. High fantasy art style, detailed, cinematic lighting, 8k resolution.`;
    }
}

/**
 * Generate a character portrait using Gemini's image generation capabilities
 * Uses gemini-2.0-flash-exp with image generation enabled
 */
export async function generateCharacterPortrait(
    apiKey: string,
    characterDetails: CharacterDetails
): Promise<GeneratedImage> {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 2.0 Flash with image generation
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
            // @ts-expect-error - responseModalities is a valid config for image generation
            responseModalities: ['Text', 'Image'],
        },
    });

    const prompt = buildImagePrompt(characterDetails);

    try {
        const result = await model.generateContent(`Generate an image: ${prompt}`);
        const response = result.response;

        // Check for image parts in the response
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content?.parts || []) {
                // Type assertion for image parts which have inlineData
                const imagePart = part as { inlineData?: { data: string; mimeType: string } };
                if (imagePart.inlineData) {
                    return {
                        base64: imagePart.inlineData.data,
                        mimeType: imagePart.inlineData.mimeType || 'image/png',
                    };
                }
            }
        }

        throw new Error('No image was generated in the response');
    } catch (error) {
        console.error('Image generation error:', error);
        throw error;
    }
}

/**
 * Generate an image using Imagen 3 (if available)
 * Fallback option for higher quality images
 */
export async function generateWithImagen(
    apiKey: string,
    characterDetails: CharacterDetails
): Promise<GeneratedImage> {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try Imagen 3 model
    const model = genAI.getGenerativeModel({
        model: 'gemini-3-pro-preview',
    });

    const prompt = buildImagePrompt(characterDetails);

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;

        // Extract image from response
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content?.parts || []) {
                // Type assertion for image parts which have inlineData
                const imagePart = part as { inlineData?: { data: string; mimeType: string } };
                if (imagePart.inlineData) {
                    return {
                        base64: imagePart.inlineData.data,
                        mimeType: imagePart.inlineData.mimeType || 'image/png',
                    };
                }
            }
        }

        throw new Error('No image was generated');
    } catch (error) {
        // If Imagen fails, fall back to Gemini 2.0 Flash
        console.warn('Imagen 3 failed, falling back to Gemini 2.0 Flash:', error);
        return generateCharacterPortrait(apiKey, characterDetails);
    }
}

/**
 * Convert a base64 image to a data URL for display
 */
export function base64ToDataUrl(base64: string, mimeType: string = 'image/png'): string {
    return `data:${mimeType};base64,${base64}`;
}

/**
 * Validate that the API key can access image generation
 */
export async function validateImageGeneration(apiKey: string): Promise<boolean> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        // Simple test to check if the model is accessible
        const result = await model.generateContent('Say "OK" if you can generate images.');
        return result.response.text().includes('OK') || true;
    } catch {
        return false;
    }
}

