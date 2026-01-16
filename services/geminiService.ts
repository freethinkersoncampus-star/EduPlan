
import { SOWRow, LessonPlan } from "../types";

/**
 * EDUPLAN AI SERVICE - POWERED BY OPENROUTER
 * Strict Instruction Engine for KICD/CBE Rationalized Content.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001"; 

/**
 * Robust JSON extraction to handle model chatter or markdown formatting.
 */
function extractJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
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
      response_format: { type: "json_object" } 
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
  TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
  
  MANDATORY JSON SCHEMA:
  {
    "lessons": [
      {
        "week": number,
        "lesson": number,
        "strand": "Detailed Name of the Main Strand",
        "subStrand": "Detailed Specific Sub-Strand Name",
        "learningOutcomes": "Clear, measurable outcomes (e.g., 'By the end of the lesson, the learner should...')",
        "teachingExperiences": "Step-by-step learner activities and teaching methods",
        "keyInquiryQuestions": "2-3 thought-provoking questions for the lesson",
        "learningResources": "Textbooks, digital tools, and physical materials",
        "assessmentMethods": "Observations, oral questions, written work, etc.",
        "reflection": "Anticipated learner progress and pedagogical strategy"
      }
    ]
  }

  RULES:
  1. EVERY field must be populated with detailed educational content.
  2. Follow the KICD 2024/2025 Rationalized Curriculum guidelines strictly.
  3. Ensure the 'lessons' key is present.
  4. Generate exactly ${lessonSlotsCount} lesson entries.`;

  const userPrompt = `CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum'}
  GRADE: ${grade}
  SUBJECT: ${subject}
  STARTING WEEK: ${weekOffset}
  TOTAL LESSONS TO ARCHITECT: ${lessonSlotsCount}`;

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
  
  MANDATORY SCHEMA:
  {
    "school": "${schoolName}",
    "year": 2025,
    "term": "I",
    "textbook": "Standard approved text",
    "week": 1,
    "lessonNumber": 1,
    "learningArea": "${subject}",
    "grade": "${grade}",
    "date": "",
    "time": "",
    "roll": "",
    "strand": "${strand}",
    "subStrand": "${subStrand}",
    "keyInquiryQuestions": ["?", "?"],
    "outcomes": ["...", "..."],
    "learningResources": ["...", "..."],
    "introduction": ["Step 1", "Step 2"],
    "lessonDevelopment": [
      { "title": "Step 1: Activity Name", "duration": "10 mins", "content": ["Step a", "Step b"] }
    ],
    "conclusion": ["Summary", "Exit task"],
    "extendedActivities": ["Homework/Project"],
    "teacherSelfEvaluation": ""
  }`;

  const userPrompt = `SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}. 
  CONTEXT: ${knowledgeContext || 'KICD CBE'}`;

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
  const systemPrompt = "You are a specialized subject teacher. Generate detailed, accurate study notes in Markdown format. Include definitions, examples, and tables.";
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. 
            KNOWLEDGE: ${knowledgeContext || 'Standard CBE'}
            CUSTOM CONTEXT: ${customContext || 'None'}`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) throw new Error("API Connection Failed");
    const data = await response.json();
    return data.choices[0].message.content;
  });
};
