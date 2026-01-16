
import { SOWRow, LessonPlan } from "../types";

/**
 * EDUPLAN AI SERVICE - POWERED BY OPENROUTER (QWEN)
 * This service bypasses the Google SDK to allow sk-or-... keys.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen-turbo"; // High-speed, high-context model optimized for structured tasks

/**
 * Utility to extract JSON from markdown code blocks if the AI wraps its response.
 */
function extractJSON(text: string) {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // If it fails, try to find a JSON block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (innerE) {
        throw new Error("AI returned malformed JSON content.");
      }
    }
    throw new Error("AI response did not contain valid JSON.");
  }
}

/**
 * Core fetch function to talk to OpenRouter
 */
async function callOpenRouter(systemPrompt: string, userPrompt: string) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin, // Required by OpenRouter
      "X-Title": "EduPlan Pro"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "role", content: userPrompt }
      ],
      response_format: { type: "json_object" } // Enforce JSON for models that support it
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Maintains robust retry logic for API stability.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.message?.toLowerCase().includes('429') || 
                        error?.message?.toLowerCase().includes('timeout') ||
                        error?.message?.toLowerCase().includes('busy');
    if (isRetryable && retries > 0) {
      console.warn(`Service busy. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string,
  weekOffset: number = 1
): Promise<SOWRow[]> => {
  const systemPrompt = `You are a KICD Curriculum Specialist. 
  Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
  OUTPUT FORMAT: Return a JSON object with a 'lessons' key containing exactly ${lessonSlotsCount} objects.
  SCHEMA: {
    "lessons": [
      {
        "week": number,
        "lesson": number,
        "strand": string,
        "subStrand": string,
        "learningOutcomes": string,
        "teachingExperiences": string,
        "keyInquiryQuestions": string,
        "learningResources": string,
        "assessmentMethods": string,
        "reflection": string
      }
    ]
  }`;

  const userPrompt = `CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
  TASK: Generate exactly ${lessonSlotsCount} lessons starting from Week ${weekOffset}. 
  Ensure data follows KICD rationalization guidelines.`;

  return callWithRetry(async () => {
    const content = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = extractJSON(content);
    return (parsed.lessons || []) as SOWRow[];
  });
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemPrompt = `You are a KICD Consultant specializing in CBE Lesson Planning. 
  Output a detailed JSON object following the pedagogical schema for KICD.
  SCHEMA: {
    "school": string, "year": number, "term": string, "textbook": string, "week": number, "lessonNumber": number,
    "learningArea": string, "grade": string, "date": string, "time": string, "roll": string, "strand": string, "subStrand": string,
    "keyInquiryQuestions": string[], "outcomes": string[], "learningResources": string[],
    "introduction": string[], "lessonDevelopment": [{ "title": string, "duration": string, "content": string[] }],
    "conclusion": string[], "extendedActivities": string[], "teacherSelfEvaluation": string
  }`;

  const userPrompt = `SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}. 
  CONTEXT: ${knowledgeContext || 'KICD CBE'}
  SCHOOL: ${schoolName}
  TASK: Generate a complete KICD CBE Lesson Plan.`;

  return callWithRetry(async () => {
    const content = await callOpenRouter(systemPrompt, userPrompt);
    return extractJSON(content) as LessonPlan;
  });
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  // Notes are markdown, not JSON, so we don't use extractJSON here
  return callWithRetry(async () => {
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
          { role: "system", content: "You are a specialized subject teacher. Generate detailed, accurate study notes in Markdown format." },
          { 
            role: "user", 
            content: `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. 
            KNOWLEDGE: ${knowledgeContext || 'Standard CBE'}
            CUSTOM CONTEXT: ${customContext || 'None'}
            Generate comprehensive study notes for learners. Use Markdown headings, bullet points, and tables where necessary.`
          }
        ]
      })
    });

    if (!response.ok) throw new Error("API Connection Failed");
    const data = await response.json();
    return data.choices[0].message.content;
  });
};
