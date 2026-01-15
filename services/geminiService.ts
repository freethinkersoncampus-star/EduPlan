
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Enhanced retry logic with longer backoff to satisfy Free Tier constraints.
 * This directly mitigates the 429 "Quota Exceeded" error by being more patient.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 5000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Waiting ${delay}ms before retry... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff: increase delay for next attempt
      return callWithRetry(fn, retries - 1, delay * 2.5);
    }
    throw error;
  }
}

/**
 * Robust JSON cleaner to prevent "Unexpected end of JSON input" crashes.
 */
const cleanJsonString = (str: string): string => {
  if (!str || typeof str !== 'string') return "";
  
  // Find the boundaries of the JSON payload
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let start = -1;
  
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }
  
  const lastBrace = str.lastIndexOf('}');
  const lastBracket = str.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  
  if (start !== -1 && end !== -1 && end > start) {
    return str.substring(start, end + 1);
  }
  
  // Fallback cleanup
  return str.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string,
  weekOffset: number = 1
): Promise<SOWRow[]> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
      TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
      Generate exactly ${lessonSlotsCount} lessons starting from Week ${weekOffset}.
      
      CBE REQUIREMENTS:
      - Outcomes: measurable
      - Experiences: learner-centered activities.
      - Resources: Kenyan textbooks and local materials.
      - Assessment: formative methods.
      `,
      config: {
        maxOutputTokens: 15000, // Increased for larger single-pass term generations
        systemInstruction: "You are a KICD Curriculum Specialist. Output ONLY valid JSON array. No conversational text.",
        responseMimeType: "application/json",
        responseSchema: {
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
            required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection"]
          }
        }
      }
    });

    const rawText = response.text || "";
    const jsonStr = cleanJsonString(rawText);
    
    if (!jsonStr) {
      throw new Error("AI returned an empty or invalid format. Please try again.");
    }

    try {
      return JSON.parse(jsonStr) as SOWRow[];
    } catch (e) {
      console.error("JSON Parse Error on:", jsonStr);
      throw new Error("Curriculum Architect returned malformed data. Retrying may fix this.");
    }
  });
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}. CONTEXT: ${knowledgeContext || 'KICD CBE'}`,
      config: {
        maxOutputTokens: 8000,
        systemInstruction: "Act as a KICD Consultant. Output STRICTLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            school: { type: Type.STRING },
            year: { type: Type.INTEGER },
            term: { type: Type.STRING },
            textbook: { type: Type.STRING },
            week: { type: Type.INTEGER },
            lessonNumber: { type: Type.INTEGER },
            learningArea: { type: Type.STRING },
            grade: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            roll: { type: Type.STRING },
            strand: { type: Type.STRING },
            subStrand: { type: Type.STRING },
            keyInquiryQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
            learningResources: { type: Type.ARRAY, items: { type: Type.STRING } },
            introduction: { type: Type.ARRAY, items: { type: Type.STRING } },
            lessonDevelopment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  content: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "duration", "content"]
              }
            },
            conclusion: { type: Type.ARRAY, items: { type: Type.STRING } },
            extendedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
            teacherSelfEvaluation: { type: Type.STRING }
          },
          required: ["school", "year", "term", "learningArea", "grade", "strand", "subStrand", "outcomes", "introduction", "lessonDevelopment", "conclusion", "extendedActivities", "keyInquiryQuestions", "learningResources", "textbook", "roll"]
        }
      }
    });
    
    const jsonStr = cleanJsonString(response.text || "");
    if (!jsonStr) throw new Error("Empty plan response from AI.");
    return JSON.parse(jsonStr) as LessonPlan;
  });
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. Markdown output.`,
      config: { maxOutputTokens: 6000 }
    });
    return response.text || "Notes generation failed.";
  });
};
