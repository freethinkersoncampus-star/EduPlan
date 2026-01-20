import { SOWRow, LessonPlan } from "../types";

/**
 * DEEPSEEK-V3 ENGINE
 * Optimized for cost-efficiency and KICD CBE Consistency
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
      temperature: 0.1, // Minimal randomness for curriculum accuracy
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `DeepSeek Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Robust JSON cleaner to prevent "Blank Screen" crashes caused by Markdown wrappers
 */
function extractJSON(text: string) {
  let cleaned = text.trim();
  // Remove markdown JSON code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Raw text that failed parsing:", text);
    throw new Error("AI output was not valid JSON. Please try again.");
  }
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
  const systemInstruction = `You are a Senior KICD Curriculum Specialist. 
    TASK: Architect a CBE SOW for Weeks ${startWeek}-${endWeek}.
    Return ONLY a JSON object: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`;

  const userPrompt = `Subject: ${subject}, Grade: ${grade}, Term: ${term}, Lessons/Week: ${lessonsPerWeek}. Context: ${knowledgeContext || ''}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = extractJSON(result);
    return (parsed.lessons || []).map((lsn: any, idx: number) => ({
      ...lsn,
      week: Math.floor(idx / lessonsPerWeek) + startWeek
    })) as SOWRow[];
  } catch (error: any) { throw error; }
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemInstruction = `You are a Senior KICD CBE Pedagogy Expert.
    TASK: Architect a SUBSTANTIVE Lesson Plan for the subject: ${subject}.
    CRITICAL: You MUST include the key "lessonDevelopment" as an array of objects.
    CRITICAL: You MUST set "learningArea" to "${subject}".
    
    JSON SCHEMA:
    {
      "learningArea": "${subject}",
      "strand": "${strand}",
      "subStrand": "${subStrand}",
      "grade": "${grade}",
      "term": "ONE",
      "year": 2026,
      "textbook": "Spark KICD Approved Text",
      "coreCompetencies": ["string"],
      "values": ["string"],
      "pcis": ["string"],
      "keyInquiryQuestions": ["string"],
      "outcomes": ["string"],
      "learningResources": ["string"],
      "introduction": ["string"],
      "lessonDevelopment": [
        { "title": "Step 1: Introduction", "duration": "10m", "content": ["Teacher does X", "Learners do Y"] },
        { "title": "Step 2: Exploration", "duration": "10m", "content": ["Teacher explains...", "Group activity..."] }
      ],
      "conclusion": ["string"],
      "extendedActivities": ["string"],
      "teacherSelfEvaluation": "string"
    }
    Return ONLY the raw JSON object.`;

  const userPrompt = `Generate Lesson Plan for ${subject} Grade ${grade}. Topic: ${subStrand}. School: ${schoolName}. Context: ${knowledgeContext || ''}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = extractJSON(result);
    // Force set learning area if AI misses it
    if (!parsed.learningArea || parsed.learningArea === '-') {
      parsed.learningArea = subject;
    }
    return parsed as LessonPlan;
  } catch (error: any) { throw error; }
};

export const generateLessonNotes = async (subj: string, grd: string, topic: string): Promise<string> => {
  const sys = `Expert Subject Pedagogue. Generate detailed Markdown study notes for Grade ${grd} students. Use bold headers and lists.`;
  const usr = `Generate comprehensive study notes for ${subj} - ${topic}.`;
  return await callDeepseek(sys, usr, false);
};