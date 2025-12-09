import { GoogleGenAI } from "@google/genai";
import { GestureResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHandGesture = async (base64Image: string): Promise<GestureResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
            },
          },
          {
            text: `Analyze the hand gesture in this image. 
            If you see an open palm or spread fingers, return "OPEN_PALM".
            If you see a closed fist or gripping motion, return "CLOSED_FIST".
            If no hand is clearly visible or the gesture is ambiguous, return "NONE".
            Return ONLY JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return { gesture: 'NONE' };
    
    // Parse slightly loose JSON just in case
    try {
        const json = JSON.parse(text);
        if (json.gesture) return json as GestureResponse;
        // Fallback for simple string match if JSON structure varies
        if (text.includes('OPEN_PALM')) return { gesture: 'OPEN_PALM' };
        if (text.includes('CLOSED_FIST')) return { gesture: 'CLOSED_FIST' };
    } catch (e) {
        console.warn("Gemini JSON parse failed, falling back to string match");
        if (text.includes('OPEN_PALM')) return { gesture: 'OPEN_PALM' };
        if (text.includes('CLOSED_FIST')) return { gesture: 'CLOSED_FIST' };
    }

    return { gesture: 'NONE' };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { gesture: 'NONE' };
  }
};
