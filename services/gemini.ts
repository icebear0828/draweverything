
import { GoogleGenAI } from "@google/genai";

const AI_MODEL = 'gemini-2.5-flash-image';

export const generateCharacterImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We request a solid silhouette because the contour tracer (Moore-Neighbor)
  // works best on the boundary of a solid shape. 
  // Line drawings often result in "double lines" (tracing the thickness of the stroke).
  const enhancedPrompt = `
    Generate an image.
    Create a high-contrast solid black silhouette of ${prompt} on a pure white background.
    Style: Vector art, flat, minimal, no internal details, no shading.
    The shape should be centered and clearly defined.
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // The model (flash-image) usually returns inlineData (base64) or sometimes text depending on config.
    // We scan parts.
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        // Check if text was returned instead (e.g. safety refusal or misunderstanding)
        const textPart = response.candidates[0].content.parts.find(p => p.text);
        if (textPart?.text) {
            throw new Error(`Gemini returned text instead of image: ${textPart.text.slice(0, 100)}...`);
        }
    }
    
    throw new Error("No image data returned from Gemini.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
