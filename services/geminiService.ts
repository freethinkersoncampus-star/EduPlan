import { SOWRow, LessonPlan } from "../types";

/**
 * Helper to call Deepseek API using fetch.
 * This ensures we are NOT using the Google Gemini SDK.
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
      temperature: 0.5,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Deepseek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

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
 * Generates a Scheme of Work (SOW) chunk with strict 40/40/20 partitioning using DeepSeek.
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
    ? "SYLLABUS PARTITION: This is TERM 1. Strictly focus on the FIRST 40% of the annual syllabus content provided in the documents."
    : term === 2
    ? "SYLLABUS PARTITION: This is TERM 2. Strictly focus on the MIDDLE 40% (the segment from 40% to 80%) of the annual syllabus content provided in the documents."
    : "SYLLABUS PARTITION: This is TERM 3. Strictly focus on the FINAL 20% (the segment from 80% to 100%) of the annual syllabus content provided in the documents.";

  const systemInstruction = `You are a Senior KICD Curriculum Specialist. 
    TASK: Generate a high-fidelity CBE Rationalized Scheme of Work (SOW) in JSON format.
    PARTITION RULE: ${partitionInstruction}
    STRUCTURE: Return a JSON object with a "lessons" array. 
    QUALITY: Provide substantive pedagogical content. No placeholders.
    Context: ${knowledgeContext || 'Standard CBE'}`;

  const userPrompt = `Generate JSON SOW for ${subject} Grade ${grade} Term ${term}, Weeks ${startWeek} to ${endWeek}. ${lessonsPerWeek} lessons/week.`;

  try {
    const textResponse = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = JSON.parse(textResponse || '{}');
    return (parsed.lessons || []) as SOWRow[];
  } catch (error: any) {
    throw error;
  }
};

/**
 * Generates a high-content Lesson Plan using DeepSeek.
 * Mandatory CBE Competencies, Values, and PCIs included.
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
    TASK: Architect a COMPLETE, PROFESSIONAL Lesson Plan in JSON format.
    CONTENT MANDATE:
    1. Core Competencies: 3+ relevant competencies.
    2. Values: 3+ relevant values.
    3. PCIs: Relevant contemporary issues.
    4. Substantive Development: Detailed, step-by-step teacher and learner activities.
    NO SHELLS. NO PLACEHOLDERS.
    STRUCTURE: JSON matching the LessonPlan type.
    Context: ${knowledgeContext || 'Standard CBE'}`;

  const userPrompt = `Generate a comprehensive CBE Lesson Plan for ${subject} Grade ${grade} on the topic: ${strand} -> ${subStrand}. School: ${schoolName}.`;

  try {
    const textResponse = await callDeepseek(systemInstruction, userPrompt, true);
    return extractJSON(textResponse || '{}') as LessonPlan;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Generates educational notes in Markdown format using DeepSeek.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const systemInstruction = `You are a Subject Matter Expert. Provide clear, detailed educational notes in Markdown. 
    Context: ${knowledgeContext || ''}`;

  const userPrompt = `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} topic: ${topic}.`;

  try {
    return await callDeepseek(systemInstruction, userPrompt, false);
  } catch (error: any) {
    throw error;
  }
};