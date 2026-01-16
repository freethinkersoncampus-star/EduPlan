
import { GoogleGenAI } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

// Initialize the Google GenAI SDK using the correct named parameter and the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Robustly extracts JSON from AI-generated text.
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
 * Generates a chunk of the Schemes of Work using the gemini-3-flash-preview model.
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
  const prompt = `Generate a KICD Rationalized Schemes of Work for ${subject}, ${grade}, Term ${term}, Weeks ${startWeek} to ${endWeek}.
  Context: ${knowledgeContext || 'Standard CBE'}
  Respond ONLY with JSON matching: { "lessons": [{ "week": number, "lesson": number, "strand": "str", "subStrand": "str", "learningOutcomes": "str", "teachingExperiences": "str", "keyInquiryQuestions": "str", "learningResources": "str", "assessmentMethods": "str", "reflection": "str" }] }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  const parsed = extractJSON(response.text || '{}');
  return (parsed.lessons || []) as SOWRow[];
};

/**
 * Generates a comprehensive Lesson Plan using the gemini-3-pro-preview model.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const prompt = `Generate a high-content, DETAILED CBE Lesson Plan for:
  Subject: ${subject} | Grade: ${grade} | Strand: ${strand} | Topic: ${subStrand}.
  School: ${schoolName}
  Context: ${knowledgeContext || 'Standard CBE'}
  
  MANDATORY: Provide detailed teacher and learner activities for Introduction, 3 Development steps, and Conclusion. No placeholders.
  Respond ONLY with JSON matching the LessonPlan schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });

  return extractJSON(response.text || '{}') as LessonPlan;
};

/**
 * Generates detailed Markdown study notes using the gemini-3-flash-preview model.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const prompt = `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} on the topic of ${topic}. Context: ${knowledgeContext || ''}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || '';
};
