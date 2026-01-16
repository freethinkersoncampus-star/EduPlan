import { SOWRow, LessonPlan } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.API_KEY;
const MODEL = "qwen/qwen-2.5-72b-instruct";

/**
 * Robustly extracts JSON from AI-generated text blocks.
 */
function extractJSON(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;
  try { 
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    console.error("JSON Parse failed", e);
    throw new Error("AI data integrity check failed. Please try again.");
  }
}

/**
 * Generic fetcher for OpenRouter to handle the API connection correctly.
 */
async function callOpenRouter(systemPrompt: string, userPrompt: string, responseFormat?: string) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "EduPlan CBC Master"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: responseFormat ? { type: "json_object" } : undefined,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData?.error?.message || "Connection to API failed. Please verify your API key.");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export const generateSOWChunk = async (
  subject: string, 
  grade: string, 
  term: number,
  startWeek: number,
  endWeek: number,
  lessonsPerWeek: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  const systemPrompt = `You are a Senior KICD Curriculum Specialist. 
  TASK: Generate a high-fidelity, detailed CBE Rationalized Scheme of Work (SOW). 
  RULES: 
  1. DO NOT use placeholders like "-", "TBD", or empty strings.
  2. PROVIDE rich, pedagogical content for EVERY field.
  3. Return ONLY a valid JSON object with a "lessons" array. 
  Context: ${knowledgeContext || 'Standard CBE'}`;

  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}. 
  Weeks ${startWeek} through ${endWeek}. 
  Lessons per week: ${lessonsPerWeek}. 
  Populate the SOW with professional pedagogical entries for learning outcomes, experiences, and assessment.`;

  const textResponse = await callOpenRouter(systemPrompt, userPrompt, "json_object");
  const parsed = extractJSON(textResponse || '{}');
  return (parsed.lessons || []) as SOWRow[];
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemPrompt = `You are a Senior KICD CBE Pedagogy Expert. 
  TASK: Architect a COMPLETE, HIGH-CONTENT Lesson Plan. 
  RULES: 
  1. No placeholders. Use specific activities, inquiry questions, and detailed steps.
  2. Return ONLY JSON matching the requested schema. 
  Context: ${knowledgeContext || 'Standard CBE'}`;

  const userPrompt = `Detailed Lesson Plan for ${subject} Grade ${grade}. 
  Strand: ${strand} | Sub-Strand: ${subStrand}. 
  School: ${schoolName}. 
  Ensure the "lessonDevelopment" steps are substantive and actionable.`;

  const textResponse = await callOpenRouter(systemPrompt, userPrompt, "json_object");
  return extractJSON(textResponse || '{}') as LessonPlan;
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const systemPrompt = `You are a Subject Matter Expert. Provide clear, detailed educational notes in Markdown format. 
  Structure the notes with headers, bullet points, and clear explanations. No placeholders. 
  Context: ${knowledgeContext || ''}`;
  
  const userPrompt = `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} on the topic of ${topic}.`;
  
  return await callOpenRouter(systemPrompt, userPrompt);
};