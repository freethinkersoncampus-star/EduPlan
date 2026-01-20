import { SOWRow, LessonPlan } from "../types";

/**
 * DEEPSEEK-V3 ENGINE
 * Re-implemented with robust JSON extraction and KICD workload balancing.
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
      temperature: 0.1, 
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
 * ROBUST JSON EXTRACTOR
 * Prevents "Malformed Output" crashes by locating JSON structures within text.
 */
function extractJSON(text: string) {
  let cleaned = text.trim();
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // If that fails, look for the first '{' and last '}'
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (innerError) {
        console.error("DeepSeek Deep JSON Parse Error:", jsonStr);
      }
    }
    
    // Fallback: Remove markdown wrappers if present and try again
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    
    try {
      return JSON.parse(cleaned);
    } catch (finalError) {
      console.error("DeepSeek Final JSON Parse Error:", text);
      throw new Error("The AI output was malformed. This usually happens if the response is too long. Please try again.");
    }
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
  // WORKLOAD DISTRIBUTION LOGIC (KICD/CBE Standard)
  const workloadTarget = term === 1 ? "40% (Term One content)" : term === 2 ? "40% (Term Two content)" : "20% (Term Three content)";

  const systemInstruction = `You are a Senior KICD Curriculum Specialist. 
    TASK: Architect a CBE SOW for Weeks ${startWeek}-${endWeek} based on RATIONALIZED DESIGNS.
    WORKLOAD DISTRIBUTION: This is Term ${term}. You must cover approximately ${workloadTarget} of the yearly workload.
    REFERENCING: Use the provided Knowledge Base documents to align exactly with KICD Rationalized Designs.
    CBE STANDARDS: Outcomes must be observable. Experiences must be learner-centered.
    MANDATORY: Return ONLY a JSON object: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`;

  const userPrompt = `Subject: ${subject}, Grade: ${grade}, Term: ${term}, Lessons/Week: ${lessonsPerWeek}. Knowledge Context: ${knowledgeContext || 'Standard KICD Guidelines'}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = extractJSON(result);
    return (parsed.lessons || []).map((lsn: any, idx: number) => ({
      ...lsn,
      week: lsn.week || Math.floor(idx / lessonsPerWeek) + startWeek
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
    TASK: Architect a SUBSTANTIVE Lesson Plan for ${subject}.
    CBE DESIGN: Focus on core competencies and values integration.
    CRITICAL: You MUST include the "lessonDevelopment" key as an array of 3-4 distinct steps.
    EACH STEP MUST HAVE: "title" (e.g. Step 1: Introduction), "duration" (e.g. 10m), and "content" (array of teacher/learner actions).
    CRITICAL: "learningArea" MUST be strictly set to "${subject}".
    Return ONLY a JSON object following the LessonPlan interface structure precisely.`;

  const userPrompt = `Generate a Lesson Plan for ${subject} Grade ${grade}. Topic: ${subStrand}. Strand: ${strand}. School: ${schoolName}. Knowledge Context: ${knowledgeContext || ''}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = extractJSON(result);
    if (!parsed.learningArea || parsed.learningArea === '-' || parsed.learningArea === 'Lesson') {
      parsed.learningArea = subject;
    }
    return parsed as LessonPlan;
  } catch (error: any) { throw error; }
};

export const generateLessonNotes = async (subj: string, grd: string, topic: string): Promise<string> => {
  const sys = `Expert Subject Pedagogue. Generate detailed Markdown study notes for Grade ${grd} students following KICD guidelines. Use bold headers.`;
  const usr = `Generate study notes for ${subj} - ${topic}.`;
  return await callDeepseek(sys, usr, false);
};