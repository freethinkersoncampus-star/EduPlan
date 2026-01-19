import { SOWRow, LessonPlan } from "../types";

/**
 * DEEPSEEK-V3 CORE ENGINE
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
      temperature: 0.2, // Higher precision for curriculum data
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Service Interruption: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;
  try { return JSON.parse(jsonString); } catch (e) { throw new Error("Pedagogical data integrity check failed."); }
}

/**
 * Generates Term-Specific SOW (40/40/20 partitioning).
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
  const partitionRange = term === 1 
    ? "SYLLABUS SEGMENT: Strictly use ONLY the first 40% of the annual topics provided in the curriculum documents."
    : term === 2
    ? "SYLLABUS SEGMENT: Strictly use ONLY the middle 40% (segment from 40% to 80%) of the annual topics."
    : "SYLLABUS SEGMENT: Strictly use ONLY the final 20% (segment from 80% to 100%) of the annual topics.";

  const systemInstruction = `You are a Senior KICD Curriculum Specialist for CBE.
    MANDATE:
    1. ${partitionRange} DO NOT generate topics from the whole year.
    2. ZERO PLACEHOLDERS: Every outcome and experience must be SUBSTANTIVE and specific. No generic text.
    3. WEEKLY FLOW: Respect the ${lessonsPerWeek} lessons per week requirement.
    Return JSON: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }
    
    CURRICULUM CONTEXT: ${knowledgeContext || 'Standard KICD CBE Guidelines'}`;

  const userPrompt = `Architect SOW for ${subject} Grade ${grade}, Term ${term}, Weeks ${startWeek} to ${endWeek}.`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = JSON.parse(result || '{}');
    return (parsed.lessons || []) as SOWRow[];
  } catch (error: any) { throw error; }
};

/**
 * Generates high-fidelity CBE Lesson Plans.
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
    MANDATE:
    - NO SHELLS. NO PLACEHOLDERS like 'Teacher explains'. Provide EXACT content.
    - CORE COMPETENCIES: Provide at least 3 specific CCs relevant to ${subStrand}.
    - VALUES: Provide at least 3 specific Values.
    - PCIs: Provide 2 relevant Pertinent Contemporary Issues.
    - LESSON DEVELOPMENT: Describe specific step-by-step teacher actions and learner actions.
    Return JSON matching the LessonPlan type.
    Context: ${knowledgeContext || ''}`;

  const userPrompt = `Architect a complete CBE Lesson Plan for ${subject} Grade ${grade} - ${subStrand} at ${schoolName}.`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    return extractJSON(result || '{}') as LessonPlan;
  } catch (error: any) { throw error; }
};

export const generateLessonNotes = async (subj: string, grd: string, topic: string, context?: string, docs?: string): Promise<string> => {
  const sys = `Expert Pedagogue. Provide clear, comprehensive Markdown study notes for Grade ${grd}.`;
  const usr = `Generate study notes for ${subj} - ${topic}. Docs: ${docs || ''}`;
  return await callDeepseek(sys, usr, false);
};