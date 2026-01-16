
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
  const systemPrompt = `You are a Senior KICD Curriculum Specialist and CBE Pedagogy Expert.
  TASK: Generate a COMPLETE, FULLY-LOADED, AND HIGHLY DETAILED Lesson Plan following the official Kenyan CBE schema.

  CRITICAL RULES:
  1. DO NOT return empty fields or placeholders. Every section must have professional, complete sentences.
  2. Use the provided Subject, Grade, Strand, and Sub-Strand values exactly.
  3. 'introduction': Detail exactly how the teacher greets the class, what specific prior knowledge is reviewed, and the precise "hook" story or activity used to start the lesson.
  4. 'lessonDevelopment': Provide 3 distinct steps. For EACH step, you MUST include:
     - Teacher Actions: Exactly what the teacher explains, shows, or demonstrates.
     - Learner Actions: Exactly what the learners do (discussing, drawing, observing, recording).
  5. 'conclusion': Detail the specific summary activity and how the teacher checks for understanding (Exit ticket, quiz, etc.).

  REQUIRED JSON STRUCTURE:
  {
    "school": "${schoolName}",
    "year": 2025,
    "term": "TWO",
    "textbook": "SPARK INTEGRATED SCIENCE (OR RELEVANT APPROVED TEXT)",
    "week": 1,
    "lessonNumber": 1,
    "learningArea": "${subject}",
    "grade": "${grade}",
    "date": "",
    "time": "",
    "roll": "",
    "strand": "${strand}",
    "subStrand": "${subStrand}",
    "keyInquiryQuestions": ["Specifically phrased question 1?", "Specifically phrased question 2?"],
    "outcomes": ["Learners should be able to [Action Verb] [Content]...", "Learners should be able to..."],
    "learningResources": ["Textbook page X", "Chart showing Y", "Real objects like Z"],
    "introduction": [
      "Teacher greets learners and reviews previous lesson on [Topic].",
      "Teacher presents [Resource] as a hook to spark curiosity.",
      "Learners respond to initial questions regarding [Topic]."
    ],
    "lessonDevelopment": [
      {
        "title": "Discovery & Observation",
        "duration": "10m",
        "content": [
          "Teacher displays [Chart/Object] and explains the concept of [X].",
          "Learners observe in pairs and identify [Specific Features].",
          "Teacher facilitates a whole-class discussion on findings."
        ]
      },
      {
        "title": "Guided Practice",
        "duration": "10m",
        "content": [
          "Teacher demonstrates how to [Process/Task] step-by-step.",
          "Learners follow instructions to perform [Specific Task] in their notebooks.",
          "Teacher moves around providing individual feedback."
        ]
      },
      {
        "title": "Synthesis & Collaboration",
        "duration": "10m",
        "content": [
          "Teacher organizes groups to discuss [Application of learning].",
          "Learners collaborate to create a brief summary or diagram of [Topic].",
          "Teacher prompts learners to share group insights."
        ]
      }
    ],
    "conclusion": [
      "Teacher summarizes key points of the lesson.",
      "Learners reflect on the lesson outcomes and ask clarifying questions.",
      "Teacher assigns a brief exit activity to assess comprehension."
    ],
    "extendedActivities": ["Home activity: ...", "Remedial activity: ..."],
    "teacherSelfEvaluation": ""
  }`;
  
  const userPrompt = `ARCHITECT LESSON PLAN FOR:
  SUBJECT: ${subject}
  GRADE: ${grade}
  STRAND: ${strand}
  SUB-STRAND: ${subStrand}
  
  CONTEXT: ${knowledgeContext || 'KICD Rationalized Design'}`;

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
