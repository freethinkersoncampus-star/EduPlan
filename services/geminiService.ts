import { GoogleGenAI } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

// Initialize the Google GenAI SDK using the mandatory named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Robustly extracts JSON from AI-generated text blocks.
 */
function extractJSON(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;
  try { 
    return JSON.parse(jsonString); 
  } catch (e) {
    console.error("JSON Parse failed", e);
    throw new Error("AI data integrity check failed. Please try again.");
  }
}

/**
 * Generates a chunk of the Schemes of Work using gemini-flash-latest.
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
  const prompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}. Weeks ${startWeek}-${endWeek}. ${lessonsPerWeek} lessons/wk. Generate SOW data in JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      systemInstruction: `You are a Senior KICD Curriculum Specialist. Generate a CBE Rationalized SOW. Context: ${knowledgeContext || 'Standard CBE'}`,
      responseMimeType: "application/json"
    }
  });

  const parsed = extractJSON(response.text || '{}');
  return (parsed.lessons || []) as SOWRow[];
};

/**
 * Generates a comprehensive Lesson Plan using gemini-3-pro-preview for deep reasoning.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const prompt = `Architect a high-quality lesson for ${subject} Grade ${grade} on the topic of ${subStrand} (Strand: ${strand}). School: ${schoolName}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: `You are a Senior KICD CBE Pedagogy Expert. Generate a COMPLETE, HIGH-CONTENT Lesson Plan with detailed teacher and learner activities. No placeholders. Context: ${knowledgeContext || 'Standard CBE'}`,
      responseMimeType: "application/json"
    }
  });

  return extractJSON(response.text || '{}') as LessonPlan;
};

/**
 * Generates detailed Markdown study notes using gemini-flash-latest.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const prompt = `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} on the topic of ${topic}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      systemInstruction: `You are a Subject Matter Expert. Provide clear, detailed educational notes. Context: ${knowledgeContext || ''}`
    }
  });

  return response.text || '';
};
