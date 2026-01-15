import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

// Always initialize the Google GenAI client using the API key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhanced retry logic with exponential backoff for handling API rate limits.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Waiting ${delay}ms before retry... (${retries} left)`);
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
      
      CBE REQUIREMENTS:
      - Outcomes: measurable
      - Experiences: learner-centered activities.
      - Resources: Kenyan textbooks and local materials.
      - Assessment: formative methods.
    `;

    // Using gemini-3-pro-preview for complex curriculum logic and reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a KICD Curriculum Specialist. Output a JSON object with a key 'lessons' containing an array of SOWRow objects.",
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

    const text = response.text;
    if (!text) throw new Error("AI returned empty content.");

    try {
      const parsed = JSON.parse(text);
      return (parsed.lessons || []) as SOWRow[];
    } catch (e) {
      console.error("JSON Parse Error:", text);
      throw new Error("Curriculum Architect returned malformed data. Please try again.");
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
    const prompt = `
      SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}. 
      CONTEXT: ${knowledgeContext || 'KICD CBE'}
      SCHOOL: ${schoolName}
      TASK: Generate a complete KICD CBE Lesson Plan. 
    `;

    // Using gemini-3-pro-preview for structured pedagogical content generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Act as a KICD Consultant. Output a STRICTLY valid JSON object matching the LessonPlan schema.",
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
            'school', 'year', 'term', 'textbook', 'week', 'lessonNumber', 
            'learningArea', 'grade', 'strand', 'subStrand', 'keyInquiryQuestions', 
            'outcomes', 'learningResources', 'introduction', 'lessonDevelopment', 
            'conclusion', 'extendedActivities', 'teacherSelfEvaluation'
          ]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty plan response from AI.");
    return JSON.parse(text) as LessonPlan;
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

    // Using gemini-3-flash-preview for general text generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a specialized subject teacher. Generate detailed, accurate study notes in Markdown."
      }
    });

    return response.text || "";
  });
};