
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number
): Promise<SOWRow[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a CBC-compliant Scheme of Work for ${subject} Grade ${grade} for Term ${term}. 
    There are ${lessonSlotsCount} lessons in total for this term based on the timetable. 
    Ensure it aligns with KICD curriculum guidelines.`,
    config: {
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
            learningExperiences: { type: Type.STRING },
            keyInquiryQuestion: { type: Type.STRING },
            resources: { type: Type.STRING },
            assessment: { type: Type.STRING }
          },
          required: ["week", "lesson", "strand", "subStrand", "learningOutcomes"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as SOWRow[];
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string
): Promise<LessonPlan> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a detailed CBC lesson plan for ${subject} Grade ${grade}. 
    Strand: ${strand}. Sub-strand: ${subStrand}.
    Include introduction, development steps, and conclusion.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grade: { type: Type.STRING },
          subject: { type: Type.STRING },
          strand: { type: Type.STRING },
          subStrand: { type: Type.STRING },
          outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
          introduction: { type: Type.STRING },
          lessonDevelopment: { type: Type.ARRAY, items: { type: Type.STRING } },
          conclusion: { type: Type.STRING },
          extendedLearning: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}') as LessonPlan;
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate comprehensive student notes for ${subject} Grade ${grade} on the topic: ${topic}. 
    ${customContext ? `Additional Instructions: ${customContext}` : ''}
    Follow CBC standards. Format in clear Markdown with headings and bullet points.`,
  });

  return response.text || "Failed to generate notes.";
};

export const generateNoteSummary = async (notes: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-lite-latest',
    contents: `Provide a concise 3-4 bullet point summary for these teacher notes: \n\n ${notes}`,
  });
  return response.text || "Summary unavailable.";
};
