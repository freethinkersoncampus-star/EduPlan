import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

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
    throw new Error("AI data integrity check failed. The response might have been too long.");
  }
}

/**
 * Generates a Scheme of Work (SOW) chunk with strict 40/40/20 partitioning.
 * Uses gemini-3-flash-preview for speed and batch processing.
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
  const partitionInstruction = term === 1 
    ? "SYLLABUS PARTITION: This is TERM 1. Strictly focus on the FIRST 40% of the annual syllabus content provided."
    : term === 2
    ? "SYLLABUS PARTITION: This is TERM 2. Strictly focus on the MIDDLE 40% (the segment from 40% to 80%) of the annual syllabus content provided."
    : "SYLLABUS PARTITION: This is TERM 3. Strictly focus on the FINAL 20% (the segment from 80% to 100%) of the annual syllabus content provided.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a detailed KICD-aligned SOW in JSON for ${subject} ${grade}, Term ${term}, Weeks ${startWeek}-${endWeek}.
      ${partitionInstruction}
      Lessons/week: ${lessonsPerWeek}.
      
      Context from Documents: ${knowledgeContext || 'Standard CBE'}
      
      Return JSON: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return (parsed.lessons || []) as SOWRow[];
};

/**
 * Generates a high-content Lesson Plan using Gemini 3 Pro.
 * Strictly avoids "shells" and placeholders.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemInstruction = `You are a Senior KICD CBE Pedagogy Expert.
    MANDATE: Generate a COMPLETE, READY-TO-USE Lesson Plan.
    CONTENT QUALITY RULES:
    - NO PLACEHOLDERS like 'Teacher explains' or 'Learners do activities'.
    - DO NOT leave fields empty or use generic dashes.
    - Provide at least 3 SPECIFIC Core Competencies, 3 Values, and 2 PCIs relevant to this topic.
    - Detailed Lesson Development: Describe EXACT steps the teacher takes and EXACT actions the learners perform.
    
    Context: ${knowledgeContext || 'Standard KICD CBE Guidelines'}`;

  const userPrompt = `Architect a highly detailed CBE Lesson Plan for ${subject} Grade ${grade}. 
    Topic: ${strand} -> ${subStrand}. 
    School: ${schoolName}.
    Include specific assessment questions and engaging learner-centered activities.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json"
    }
  });

  return extractJSON(response.text || '{}') as LessonPlan;
};

/**
 * Generates educational notes in Markdown format.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate comprehensive student study notes for ${subject} Grade ${grade} on the topic: ${topic}. 
      Use clear headers, definitions, and Grade ${grade} appropriate examples.
      Context: ${knowledgeContext || ''}`,
  });

  return response.text || "No notes generated.";
};