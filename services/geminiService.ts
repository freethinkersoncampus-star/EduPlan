
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

/**
 * EDUPLAN AI SERVICE - POWERED BY GOOGLE GEMINI
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-pro-preview for advanced reasoning and pedagogical structuring
const MODEL = "gemini-3-pro-preview";

/**
 * Maintains robust retry logic for API stability.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.message?.toLowerCase().includes('429') || 
                        error?.message?.toLowerCase().includes('timeout') ||
                        error?.message?.toLowerCase().includes('quota');
    if (isRetryable && retries > 0) {
      console.warn(`Gemini API busy. Retrying in ${delay}ms...`);
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
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `
        CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
        TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
        Generate exactly ${lessonSlotsCount} lessons starting from Week ${weekOffset}.
      `,
      config: {
        systemInstruction: "You are a KICD Curriculum Specialist. You output valid JSON objects only. Ensure the 'lessons' array contains exactly the number of objects requested.",
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
                required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection"]
              }
            }
          },
          required: ["lessons"]
        }
      },
    });

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
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `
        SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}. 
        CONTEXT: ${knowledgeContext || 'KICD CBE'}
        SCHOOL: ${schoolName}
        TASK: Generate a complete KICD CBE Lesson Plan.
      `,
      config: {
        systemInstruction: "You are a KICD Consultant specializing in CBE Lesson Planning. Output a detailed JSON object following the pedagogical schema.",
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
          required: ["school", "year", "term", "textbook", "week", "lessonNumber", "learningArea", "grade", "date", "time", "roll", "strand", "subStrand", "keyInquiryQuestions", "outcomes", "learningResources", "introduction", "lessonDevelopment", "conclusion", "extendedActivities", "teacherSelfEvaluation"]
        }
      },
    });

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
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. 
      KNOWLEDGE: ${knowledgeContext || 'Standard CBE'}
      CUSTOM CONTEXT: ${customContext || 'None'}
      Generate comprehensive study notes for learners. Use Markdown headings, bullet points, and tables where necessary.`,
      config: {
        systemInstruction: "You are a specialized subject teacher. Generate detailed, accurate study notes in Markdown format."
      },
    });

    return response.text || "Failed to generate notes.";
  });
};
