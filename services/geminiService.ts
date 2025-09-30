import { GoogleGenAI, Type } from "@google/genai";
import { StoryPart } from '../types';

interface StoryScene {
    paragraph: string;
    imagePrompt: string;
}

export class ImageGenerationError extends Error {
    public readonly storyParts: StoryPart[];

    constructor(message: string, storyParts: StoryPart[]) {
        super(message);
        this.name = "ImageGenerationError";
        this.storyParts = storyParts;
    }
}

const generateImage = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '4:3' },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("API returned a response with no image data.");
        }
    } catch (error) {
        console.error("Error generating image from Gemini API:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
             throw new Error("The daily limit for creating images has been reached. Please try again tomorrow.");
        }
        throw new Error(`The image generator is busy or encountered an error. Please try again in a few moments.`);
    }
};


export const generateStoryAndImages = async (topic: string, language: string, storyLength: number, includeImages: boolean): Promise<StoryPart[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not configured. Story generation is disabled.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const storyPrompt = `
        You are a world-class, creative, and kid-friendly story writer.
        Your task is to create a short, engaging moral story for children (ages 3-7).
        **Instructions:**
        1.  Write a story based on the provided topic and language.
        2.  The story must be simple, cheerful, and under 800 words.
        3.  Break the story into ${storyLength} key chronological scenes.
        4.  For EACH scene, provide:
            a) A "paragraph" for the story.
            b) A concise, visually rich, one-sentence "imagePrompt" for an illustration. Focus on concrete visual elements (e.g., "A small, fluffy bunny hops through a field of bright yellow flowers.").
        5.  Ensure all content is child-safe and positive.
        **Story Details:**
        -   **Topic/Moral:** ${topic}
        -   **Language:** ${language}
        **Output Format:**
        Your output MUST be a valid JSON array of objects.
    `;

    let storyScenes: StoryScene[] = [];
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: storyPrompt,
            config: {
                temperature: 0.8,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            paragraph: { type: Type.STRING },
                            imagePrompt: { type: Type.STRING },
                        },
                        required: ["paragraph", "imagePrompt"],
                    },
                },
            },
        });

        storyScenes = JSON.parse(response.text.trim());
        if (!Array.isArray(storyScenes) || storyScenes.length === 0) {
             throw new Error("AI did not return a valid story structure.");
        }
    } catch (error) {
        console.error("Error generating story text from Gemini API:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
             throw new Error("The daily limit for creating stories has been reached. Please try again tomorrow.");
        }
        throw new Error("I had a little trouble dreaming up a story. Could you try a different topic?");
    }

    if (!includeImages) {
        return storyScenes.map(scene => ({ paragraph: scene.paragraph, imageUrl: '' }));
    }

    const illustratedParts: StoryPart[] = [];
    let imageError: Error | null = null;

    for (const [index, scene] of storyScenes.entries()) {
        try {
            const finalImagePrompt = `A cute and vibrant children's book illustration of ${scene.imagePrompt}. Whimsical, colorful, friendly, storybook style, high quality.`;
            const imageUrl = await generateImage(finalImagePrompt);
            illustratedParts.push({ paragraph: scene.paragraph, imageUrl: imageUrl });
        } catch (error) {
            console.error(`Failed to generate image for scene ${index + 1}:`, error);
            imageError = error instanceof Error ? error : new Error(String(error));
            illustratedParts.push({ paragraph: scene.paragraph, imageUrl: '' }); // Add part without image
        }
    }

    if (imageError) {
        throw new ImageGenerationError(
            `We created the story text, but had trouble with the pictures. ${imageError.message}`,
            illustratedParts
        );
    }
    
    return illustratedParts;
};
