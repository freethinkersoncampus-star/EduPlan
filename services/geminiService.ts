
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Helper to handle 429 Rate Limit errors with exponential backoff.
 * This directly addresses the "Quota Exceeded" errors seen in the user's screenshots.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const cleanJsonString = (str: string): string => {
  if (!str) return "";
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
    let json = str.substring(start, end + 1);
    if (json.startsWith('[') && !json.endsWith(']')) json += ']';
    if (json.startsWith('{') && !json.endsWith('}')) json += '}';
    return json;
  }
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
      model: 'gemini-2.5-flash',
      contents: `
      CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
      TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
      Generate exactly ${lessonSlotsCount} lessons starting from Week ${weekOffset}.
      
      CBE REQUIREMENTS:
      - Outcomes: measurable (By the end of the lesson, the learner should be able to...)
      - Experiences: learner-centered activities.
      - Resources: Kenyan textbooks and local materials.
      - Assessment: formative methods.
      `,
      config: {
        maxOutputTokens: 8000,
        systemInstruction: "You are a KICD Curriculum Specialist. Output STRICTLY a valid JSON array. No markdown. No conversational text.",
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
    const jsonStr = cleanJsonString(response.text || "");
    return JSON.parse(jsonStr) as SOWRow[];
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
      model: 'gemini-2.5-flash', 
      contents: `
      SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}
      CONTEXT: ${knowledgeContext || 'Standard KICD CBE'}
      TASK: Generate a DETAILED CBE LESSON PLAN. You MUST provide real values for all fields including 'roll', 'textbook', and 'time'.
      `,
      config: {
        maxOutputTokens: 6000,
        systemInstruction: "Act as a Senior KICD Consultant. Output STRICTLY valid JSON. Do not omit roll, textbook, or year.",
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
          required: [
            "school", "year", "term", "learningArea", "grade", "strand", "subStrand", 
            "outcomes", "introduction", "lessonDevelopment", "conclusion", 
            "extendedActivities", "keyInquiryQuestions", "learningResources", "textbook", "roll"
          ]
        }
      }
    });
    const jsonStr = cleanJsonString(response.text || "");
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
      model: 'gemini-2.5-flash',
      contents: `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. Generate detailed pedagogical study notes following Kenyan CBE guidelines. Use Markdown.`,
      config: {
        maxOutputTokens: 6000
      }
    });
    return response.text || "Notes generation failed.";
  });
};
