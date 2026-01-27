
import { GoogleGenAI } from "@google/genai";
import { AI_API_TIMEOUT_MS } from '../constants/config';

const AI_MODEL = 'gemini-2.5-flash-image';

// Vite 环境变量访问 (需要 VITE_ 前缀)
const getApiKey = (): string => {
  // Vite 标准方式: 使用 VITE_ 前缀的环境变量
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // Node.js 环境 (测试/SSR)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return '';
};

export const generateCharacterImage = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Set VITE_GEMINI_API_KEY in your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // We request a solid silhouette because the contour tracer (Moore-Neighbor)
  // works best on the boundary of a solid shape. 
  // Line drawings often result in "double lines" (tracing the thickness of the stroke).
  const enhancedPrompt = `
    Generate an image.
    Create a high-contrast solid black silhouette of ${prompt} on a pure white background.
    Style: Vector art, flat, minimal, no internal details, no shading.
    The shape should be centered and clearly defined.
  `;

  // 创建超时控制器
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_API_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
        abortSignal: controller.signal,
      }
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI generation timed out after ${AI_API_TIMEOUT_MS / 1000} seconds`);
    }

    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
