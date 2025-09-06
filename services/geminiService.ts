/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `As an expert photo editor AI, perform a localized edit on the image.
- User Request: "${userPrompt}"
- Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).
- The edit must be realistic and blend seamlessly.
- IMPORTANT: The rest of the image outside the edit area must remain unchanged.
- Skin tone adjustments (e.g., tanning, lightening) are permitted as standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity. Do not perform such edits.
- Output ONLY the final edited image without any text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `As an expert photo editor AI, apply a stylistic filter to the entire image.
- Filter Request: "${filterPrompt}"
- IMPORTANT: Apply only the style. Do not change the image's composition or content.
- Filters must not alter a person's fundamental race or ethnicity. Refuse any such requests.
- Output ONLY the final filtered image without any text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @param referenceImage An optional reference image for style/content transfer.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
    referenceImage: File | null,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`, { hasReference: !!referenceImage });
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [originalImagePart];
    let prompt: string;

    if (referenceImage) {
        const referenceImagePart = await fileToPart(referenceImage);
        parts.push(referenceImagePart);

        prompt = `As an expert photo editor AI, adjust the MAIN image using the second image as a REFERENCE.
- User Request: "${adjustmentPrompt}"
- Use the REFERENCE image for style, lighting, and color palette.
- The adjustment must be photorealistic and apply across the entire MAIN image.
- Skin tone adjustments are permitted. You MUST REFUSE any request to change a person's fundamental race or ethnicity.
- Output ONLY the final adjusted MAIN image without any text.`;
    } else {
        prompt = `As an expert photo editor AI, perform a natural, photorealistic, global adjustment to the entire image.
- User Request: "${adjustmentPrompt}"
- The adjustment must apply across the entire image.
- Skin tone adjustments are permitted. You MUST REFUSE any request to change a person's fundamental race or ethnicity.
- Output ONLY the final adjusted image without any text.`;
    }
    
    const textPart = { text: prompt };
    parts.push(textPart);

    console.log('Sending image(s) and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Generates a creatively transformed image based on a text prompt.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired creative edit.
 * @returns A promise that resolves to the data URL of the creatively edited image.
 */
export const generateAiEditImage = async (
    originalImage: File,
    userPrompt: string,
): Promise<string> => {
    console.log(`Starting creative AI edit: ${userPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    const prompt = `As a master digital artist AI, your task is to creatively transform the entire provided image based on the user's request. Re-imagine the image completely according to the new style, theme, or content described. The changes should be global and significant.

- User Request: "${userPrompt}"

- Perform a comprehensive, artistic transformation of the entire image. This is not a simple filter or minor adjustment; it is a creative re-rendering.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity. Do not perform such edits.
- Output ONLY the final transformed image without any text.`;
    const textPart = { text: prompt };

    console.log('Sending image and creative prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for AI edit.', response);

    return handleApiResponse(response, 'AI edit');
};


/**
 * Generates an image with a face swapped from a source to a target image.
 * @param sourceImage The image containing the face to use.
 * @param targetImage The image where the face should be placed.
 * @returns A promise that resolves to the data URL of the face-swapped image.
 */
export const generateFaceSwapImage = async (
    sourceImage: File,
    targetImage: File,
): Promise<string> => {
    console.log(`Starting face swap...`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const sourceImagePart = await fileToPart(sourceImage);
    const targetImagePart = await fileToPart(targetImage);

    const prompt = `As a photo editing AI, perform a hyper-realistic face swap.
- Task: Take the face from the FIRST image (source) and seamlessly place it onto the person in the SECOND image (target).
- The final image must be photorealistic. Perfectly match the target image's lighting, skin tone, shadows, and angle.
- IMPORTANT: Do not alter any part of the target image other than the face. The background and body must remain identical.
- Output ONLY the final edited image with the swapped face. Do not return text.`;
    const textPart = { text: prompt };

    const parts = [sourceImagePart, targetImagePart, textPart];

    console.log('Sending images and face swap prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for face swap.', response);

    return handleApiResponse(response, 'face swap');
};