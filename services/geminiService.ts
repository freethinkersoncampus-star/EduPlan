import { SOWRow, LessonPlan } from "../types";

/**
 * RESTORED DEEPSEEK ENGINE
 * Using the paid DeepSeek-V3 model to prevent Google API Key errors.
 */
async function callDeepseek(systemPrompt: string, userPrompt: string, isJson: boolean = false) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: isJson ? { type: "json_object" } : undefined,
      temperature: 0.3, // Lower temperature for more factual pedagogical content
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;
  try { return JSON.parse(jsonString); } catch (e) { throw new Error("Data integrity check failed."); }
}

/**
 * Generates substantive SOW content (40/40/20 rule).
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
  const partition = term === 1 ? "FIRST 40%" : term === 2 ? "MIDDLE 40%" : "FINAL 20%";
  
  const systemInstruction = `You are a KICD Curriculum Specialist.
    TASK: Generate a DETAILED CBE Rationalized SOW for ${subject} ${grade}, Term ${term}.
    PARTITION: Focus exclusively on the ${partition} of the syllabus.
    QUALITY: NO EMPTY SHELLS. Every cell must contain specific, high-quality pedagogical content.
    Return JSON: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`;

  const userPrompt = `Generate weeks ${startWeek}-${endWeek} for ${subject} ${grade}. Context: ${knowledgeContext || 'Standard KICD'}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = JSON.parse(result || '{}');
    return (parsed.lessons || []) as SOWRow[];
  } catch (error: any) { throw error; }
};

/**
 * Generates a full-content CBE Lesson Plan.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemInstruction = `You are a Senior KICD CBE Expert. 
    TASK: Create a substantive, professional Lesson Plan.
    STRICT CBE MANDATE:
    1. Core Competencies: Identify 3 specific ones.
    2. Values: Identify 3 specific ones.
    3. PCIs: Identify 2 pertinent contemporary issues.
    4. Organization: Step-by-step teacher and learner activities. 
    NO PLACEHOLDERS. NO DASHES. Provide real classroom examples.
    Return JSON matching the LessonPlan type.`;

  const userPrompt = `Subject: ${subject}, Grade: ${grade}, Strand: ${strand}, Sub-Strand: ${subStrand}, School: ${schoolName}. Use context: ${knowledgeContext || ''}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    return extractJSON(result || '{}') as LessonPlan;
  } catch (error: any) { throw error; }
};

export const generateLessonNotes = async (subj: string, grd: string, topic: string, context?: string, docs?: string): Promise<string> => {
  const sys = `Subject Matter Expert for Grade ${grd}. Provide clear, comprehensive notes in Markdown.`;
  const usr = `Generate study notes for ${subj} - ${topic}. Docs: ${docs || ''}`;
  return await callDeepseek(sys, usr, false);
};