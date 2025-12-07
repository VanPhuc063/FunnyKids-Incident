import { GoogleGenAI, Type } from "@google/genai";
import { Severity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AnalysisResult {
  severity: Severity;
  summary: string;
  recommendation: string;
}

export const analyzeIncident = async (
  description: string,
  base64Image?: string
): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [];
    
    if (base64Image) {
      // Remove data URL prefix if present for the API call
      const cleanBase64 = base64Image.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    parts.push({
      text: `Analyze this incident report for a children's play center (FunnyKids).
      Description provided: "${description}".
      
      Determine the severity based on safety risks:
      - HIGH: Immediate danger to children, structural failure, fire, injury.
      - MEDIUM: Broken equipment that needs repair but area is safe if closed, hygiene issues.
      - LOW: Cosmetic damage, minor complaints, missing small items.
      
      Provide a professional summary and a quick action recommendation.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, enum: [Severity.HIGH, Severity.MEDIUM, Severity.LOW] },
            summary: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["severity", "summary", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if AI fails
    return {
      severity: Severity.MEDIUM,
      summary: description,
      recommendation: "Please review manually."
    };
  }
};