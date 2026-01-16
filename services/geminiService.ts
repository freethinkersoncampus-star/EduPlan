
import { SOWRow, LessonPlan } from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001"; 

function extractJSON(text: string) {
  let cleaned = text.trim();
  try { return JSON.parse(cleaned); } catch (e) {}

  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // Basic repair if closing brackets are missing
    try {
      let repaired = jsonString;
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      if (openBrackets > closeBrackets) repaired += ' ]';
      if (openBraces > closeBraces) repaired += ' }';
      return JSON.parse(repaired);
    } catch (innerE) {
      console.error("JSON Repair failed", innerE);
    }
    throw new Error("AI data integrity check failed. Retrying chunk...");
  }
}

async function callOpenRouter(systemPrompt: string, userPrompt: string) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin, 
      "X-Title": "EduPlan Pro"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt } 
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000 
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
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
  TASK: Generate a CBE Rationalized SOW for ${subject}, ${grade} for Weeks ${startWeek} to ${endWeek}.
  
  MANDATORY JSON SCHEMA:
  {
    "lessons": [
      {
        "week": number,
        "lesson": number,
        "strand": "Strand Name",
        "subStrand": "Sub-Strand Name",
        "learningOutcomes": "Measurable outcomes",
        "teachingExperiences": "Step-by-step activities",
        "keyInquiryQuestions": "1-2 questions",
        "learningResources": "Resources",
        "assessmentMethods": "Methods",
        "reflection": "Brief pedagogical note"
      }
    ]
  }

  CRITICAL: You are generating only for weeks ${startWeek} to ${endWeek}. 
  Provide exactly ${lessonsPerWeek} lessons for each week. Total lessons to generate: ${((endWeek - startWeek) + 1) * lessonsPerWeek}.`;

  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}.
  RANGE: Weeks ${startWeek}-${endWeek}.
  CONTEXT: ${knowledgeContext || 'KICD Rationalized'}`;

  const content = await callOpenRouter(systemPrompt, userPrompt);
  const parsed = extractJSON(content);
  return (parsed.lessons || []) as SOWRow[];
};

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  // This is kept for backward compatibility if needed, but the component should call chunks.
  throw new Error("Use generateSOWChunk for sequential generation.");
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemPrompt = `KICD Lesson Plan Specialist. Output detailed JSON following KICD schema.`;
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${subStrand}. SCHOOL: ${schoolName}`;
  const content = await callOpenRouter(systemPrompt, userPrompt);
  return extractJSON(content) as LessonPlan;
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const systemPrompt = "Subject Teacher. Generate concise Markdown study notes.";
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "EduPlan Pro"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
};
