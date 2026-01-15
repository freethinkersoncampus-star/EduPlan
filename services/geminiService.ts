import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

/**
 * EDUPLAN AI SERVICE - POWERED BY GEMINI 3 PRO
 * Implementation using the official @google/genai SDK.
 */

// Initialize the Gemini API client using the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Maintains the existing retry signature for platform stability.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.toLowerCase().includes('429') || 
                        error?.message?.toLowerCase().includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`AI busy. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string,
  weekOffset: number = 1
): Promise<SOWRow[]> => {
  return callWithRetry(async () => {
    const prompt = `
      CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
      TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
      Generate exactly ${lessonSlotsCount} lessons starting from Week ${weekOffset}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a KICD Curriculum Specialist. You output valid JSON objects matching the provided schema.",
        responseMimeType: "application/json",
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
                required: ['week', 'lesson', 'strand', 'subStrand', 'learningOutcomes', 'teachingExperiences', 'keyInquiryQuestions', 'learningResources', 'assessmentMethods', 'reflection']
              }
            }
          },
          required: ['lessons']
        }
      }
    });

    // The .text property directly returns the extracted string output.
    const parsed = JSON.parse(response.text || '{}');
    return (parsed.lessons || []) as SOWRow[];
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
    const prompt = `
      SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}. 
      CONTEXT: ${knowledgeContext || 'KICD CBE'}
      SCHOOL: ${schoolName}
      TASK: Generate a complete KICD CBE Lesson Plan in JSON format matching the standard pedagogical schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a KICD Consultant specializing in CBE Lesson Planning. Output a detailed JSON object.",
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
                required: ['title', 'duration', 'content']
              }
            },
            conclusion: { type: Type.ARRAY, items: { type: Type.STRING } },
            extendedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
            teacherSelfEvaluation: { type: Type.STRING }
          },
          required: [
            'school', 'year', 'term', 'textbook', 'week', 'lessonNumber', 'learningArea', 'grade', 
            'strand', 'subStrand', 'keyInquiryQuestions', 'outcomes', 'learningResources', 
            'introduction', 'lessonDevelopment', 'conclusion', 'extendedActivities', 'teacherSelfEvaluation'
          ]
        }
      }
    });
    
    // The .text property directly returns the extracted string output.
    return JSON.parse(response.text || '{}') as LessonPlan;
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
    const prompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. 
    KNOWLEDGE: ${knowledgeContext || 'Standard CBE'}
    Generate comprehensive study notes for learners. Use Markdown for formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized subject teacher. Generate detailed, accurate study notes in Markdown."
      }
    });

    // The .text property directly returns the extracted string output.
    return response.text || "Failed to generate notes.";
  });
};