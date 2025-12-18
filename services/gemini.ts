import { GoogleGenAI } from "@google/genai";

const AI_MODEL = 'gemini-2.5-flash-image';

export const generateCharacterImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Refine prompt to ensure we get a traceable line drawing
  const enhancedPrompt = `
    Create a single continuous line drawing of ${prompt}.
    Style: Minimalist, high contrast, black lines on pure white background.
    Ensure the shape is closed if possible. 
    No shading, no gradients, no text.
    The image should be centered.
    Aspect ratio 1:1.
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
    });

    // The model (flash-image) usually returns inlineData (base64) or sometimes text depending on config.
    // We scan parts.
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data returned from Gemini.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};