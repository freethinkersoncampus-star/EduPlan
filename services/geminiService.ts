
import { SOWRow, LessonPlan } from "../types";

/**
 * EDUPLAN AI SERVICE - POWERED BY OPENROUTER
 * Optimized for Long-Form Curriculum Generation.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001"; 

/**
 * Robust JSON extraction with "Self-Repair" for truncated AI responses.
 */
function extractJSON(text: string) {
  let cleaned = text.trim();
  
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch (e) {}

  // Try regex extraction
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // SELF-REPAIR: If the JSON is truncated, try to force close the brackets.
    // This often happens with 12-week generations.
    try {
      let repaired = jsonString;
      if (!repaired.endsWith('}')) {
        // Count unclosed brackets
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;

        // Add missing array closer if needed
        if (openBrackets > closeBrackets) repaired += ' ]';
        // Add missing object closer
        if (openBraces > closeBraces) repaired += ' }';
        
        return JSON.parse(repaired);
      }
    } catch (innerE) {
      console.error("Self-repair failed:", innerE);
    }
    throw new Error("The curriculum data was too large and arrived incomplete. Try generating for fewer weeks or a shorter term.");
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
      // Set a higher limit for long curriculum tables
      max_tokens: 4000 
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.message?.toLowerCase().includes('429') || 
                        error?.message?.toLowerCase().includes('timeout') ||
                        error?.message?.toLowerCase().includes('busy');
    if (isRetryable && retries > 0) {
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
  const systemPrompt = `You are a Senior KICD Curriculum Specialist. 
  TASK: Generate a CBE Rationalized SOW for ${subject}, ${grade}.
  STYLE: Be CONCISE and SURGICAL. Use short sentences (max 10 words per cell).
  
  SCHEMA:
  {
    "lessons": [
      {
        "week": number,
        "lesson": number,
        "strand": "Short Name",
        "subStrand": "Short Name",
        "learningOutcomes": "1-2 short outcomes",
        "teachingExperiences": "2-3 quick activities",
        "keyInquiryQuestions": "1 question",
        "learningResources": "Resources list",
        "assessmentMethods": "Methods",
        "reflection": "Brief note"
      }
    ]
  }

  CRITICAL: Every field is REQUIRED. Do not leave any empty.`;

  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}.
  GENERATE EXACTLY ${lessonSlotsCount} LESSONS.
  CONTEXT: ${knowledgeContext || 'KICD Rationalized'}`;

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
  const systemPrompt = `You are a KICD Consultant. Generate a detailed CBE Lesson Plan JSON.`;
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${subStrand}. SCHOOL: ${schoolName}`;

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
  const systemPrompt = "Subject Teacher. Generate concise Markdown study notes with definitions and examples.";
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}.`;

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
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  });
};
