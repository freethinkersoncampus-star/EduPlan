import { SOWRow, LessonPlan } from "../types";

/**
 * Helper to call Deepseek API using fetch
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
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 404) {
      throw new Error("API_KEY_RESET_REQUIRED");
    }
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
    console.error("JSON Parse failed", e);
    throw new Error("AI data integrity check failed. Please try again.");
  }
}

/**
 * Generates a Scheme of Work (SOW) chunk using Deepseek Chat.
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
  const systemInstruction = `You are a Senior KICD Curriculum Specialist. 
    TASK: Generate a high-fidelity, detailed CBE Rationalized Scheme of Work (SOW) in JSON format.
    STRUCTURE: Return a JSON object with a "lessons" array. Each lesson must have:
    "week" (int), "lesson" (int), "strand" (string), "subStrand" (string), "learningOutcomes" (string), 
    "teachingExperiences" (string), "keyInquiryQuestions" (string), "learningResources" (string), 
    "assessmentMethods" (string), "reflection" (string).
    RULES: 
    1. DO NOT use placeholders like "-", "TBD", or empty strings. 
    2. PROVIDE rich, pedagogical content for EVERY field.
    Context: ${knowledgeContext || 'Standard CBE'}`;

  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}. 
    Weeks ${startWeek} through ${endWeek}. 
    Lessons per week: ${lessonsPerWeek}. 
    Populate the SOW with professional pedagogical entries.`;

  try {
    const textResponse = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = JSON.parse(textResponse || '{}');
    return (parsed.lessons || []) as SOWRow[];
  } catch (error: any) {
    if (error.message === "API_KEY_RESET_REQUIRED") throw error;
    throw error;
  }
};

/**
 * Generates a high-content Lesson Plan using Deepseek Chat.
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
    TASK: Architect a COMPLETE, HIGH-CONTENT Lesson Plan in JSON format. 
    STRUCTURE: Return a JSON object matching this schema:
    {
      "school": string, "year": number, "term": string, "textbook": string, "week": number, "lessonNumber": number,
      "learningArea": string, "grade": string, "date": string, "time": string, "roll": string, "strand": string, "subStrand": string,
      "keyInquiryQuestions": string[], "outcomes": string[], "learningResources": string[], "introduction": string[],
      "lessonDevelopment": [{"title": string, "duration": string, "content": string[]}],
      "conclusion": string[], "extendedActivities": string[], "teacherSelfEvaluation": string
    }
    RULES: 
    1. No placeholders. Use specific activities and detailed steps.
    Context: ${knowledgeContext || 'Standard CBE'}`;

  const userPrompt = `Detailed Lesson Plan for ${subject} Grade ${grade}. 
    Strand: ${strand} | Sub-Strand: ${subStrand}. 
    School: ${schoolName}.`;

  try {
    const textResponse = await callDeepseek(systemInstruction, userPrompt, true);
    return extractJSON(textResponse || '{}') as LessonPlan;
  } catch (error: any) {
    if (error.message === "API_KEY_RESET_REQUIRED") throw error;
    throw error;
  }
};

/**
 * Generates educational notes in Markdown format using Deepseek Chat.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const systemInstruction = `You are a Subject Matter Expert. Provide clear, detailed educational notes in Markdown format. 
    Structure the notes with headers, bullet points, and clear explanations. No placeholders. 
    Context: ${knowledgeContext || ''}`;

  const userPrompt = `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} on the topic of ${topic}.`;

  try {
    return await callDeepseek(systemInstruction, userPrompt, false);
  } catch (error: any) {
    if (error.message === "API_KEY_RESET_REQUIRED") throw error;
    throw error;
  }
};