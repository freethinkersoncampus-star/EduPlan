import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

/**
 * Robustly extracts JSON from AI-generated text blocks.
 */
function extractJSON(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;
  try { 
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    console.error("JSON Parse failed", e);
    throw new Error("AI data integrity check failed. Please try again.");
  }
}

/**
 * Generates a Scheme of Work (SOW) chunk using Gemini 3.0 Pro.
 */
export const generateSOWChunk = async (
  subject: string, 
  grade: string, 
  term: number,
  startWeek: number,
  endWeek: number,
  lessonsPerWeek: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  // Create a new instance right before the call to ensure the latest API Key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}. 
      Weeks ${startWeek} through ${endWeek}. 
      Lessons per week: ${lessonsPerWeek}. 
      Populate the SOW with professional pedagogical entries for learning outcomes, experiences, and assessment.`,
      config: {
        systemInstruction: `You are a Senior KICD Curriculum Specialist. 
        TASK: Generate a high-fidelity, detailed CBE Rationalized Scheme of Work (SOW). 
        RULES: 
        1. DO NOT use placeholders like "-", "TBD", or empty strings. 
        2. PROVIDE rich, pedagogical content for EVERY field.
        3. Return ONLY a valid JSON object with a "lessons" array. 
        Context: ${knowledgeContext || 'Standard CBE'}`,
        responseMimeType: "application/json",
        // Increase reasoning depth for complex curriculum planning
        thinkingConfig: { thinkingBudget: 4000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.INTEGER },
                  lesson: { type: Type.INTEGER },
                  strand: { type: Type.STRING },
                  subStrand: { type: Type.STRING },
                  learningOutcomes: { type: Type.STRING },
                  teachingExperiences: { type: Type.STRING },
                  keyInquiryQuestions: { type: Type.STRING },
                  learningResources: { type: Type.STRING },
                  assessmentMethods: { type: Type.STRING },
                  reflection: { type: Type.STRING }
                },
                required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences"]
              }
            }
          },
          required: ["lessons"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return (parsed.lessons || []) as SOWRow[];
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_RESET_REQUIRED");
    }
    throw error;
  }
};

/**
 * Generates a high-content Lesson Plan using Gemini 3.0 Pro.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Detailed Lesson Plan for ${subject} Grade ${grade}. 
      Strand: ${strand} | Sub-Strand: ${subStrand}. 
      School: ${schoolName}. 
      Ensure the "lessonDevelopment" steps are substantive and actionable.`,
      config: {
        systemInstruction: `You are a Senior KICD CBE Pedagogy Expert. 
        TASK: Architect a COMPLETE, HIGH-CONTENT Lesson Plan in JSON format. 
        RULES: 
        1. No placeholders. Use specific activities, inquiry questions, and detailed steps.
        2. Return ONLY JSON matching the requested schema. 
        Context: ${knowledgeContext || 'Standard CBE'}`,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return extractJSON(response.text || '{}') as LessonPlan;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_RESET_REQUIRED");
    }
    throw error;
  }
};

/**
 * Generates educational notes in Markdown format using Gemini 3.0 Pro.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} on the topic of ${topic}.`,
      config: {
        systemInstruction: `You are a Subject Matter Expert. Provide clear, detailed educational notes in Markdown format. 
        Structure the notes with headers, bullet points, and clear explanations. No placeholders. 
        Context: ${knowledgeContext || ''}`,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    
    return response.text || "";
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_RESET_REQUIRED");
    }
    throw error;
  }
};
