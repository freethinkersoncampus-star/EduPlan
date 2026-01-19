import { SOWRow, LessonPlan } from "../types";

/**
 * DEEPSEEK-V3 CORE ENGINE
 * Specialized for high-fidelity KICD CBE Lesson Planning
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
      temperature: 0.15, // High precision for educational content
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```json\n([\s\S]*?)\n```/) || cleaned.match(/{[\s\S]*}/);
  let jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : cleaned;
  try { return JSON.parse(jsonString); } catch (e) { throw new Error("Pedagogical data integrity check failed."); }
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
  const partitionRange = term === 1 
    ? "SYLLABUS BOUNDARY: Strictly the FIRST 40% of the syllabus. Start from the VERY FIRST topic in the document."
    : term === 2
    ? "SYLLABUS BOUNDARY: Strictly the MIDDLE 40% (40% to 80%). Start exactly where Term 1 ended."
    : "SYLLABUS BOUNDARY: Strictly the FINAL 20% (80% to 100%).";

  const systemInstruction = `You are a Senior KICD Curriculum Specialist. 
    YEAR: 2026.
    RULES:
    1. ${partitionRange}
    2. LINEAR FLOW: Topics must follow the textbook order. DO NOT mix strands.
    3. WEEK FENCING: Weeks ${startWeek} to ${endWeek}.
    Return JSON: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`;

  const userPrompt = `Architect SOW for Weeks ${startWeek}-${endWeek}. Current Term: ${term}. Subject: ${subject} Grade: ${grade}.`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    const parsed = JSON.parse(result || '{}');
    const normalized = (parsed.lessons || []).map((lsn: any, idx: number) => {
      const weekCount = Math.floor(idx / lessonsPerWeek) + startWeek;
      return { ...lsn, week: weekCount > endWeek ? endWeek : weekCount };
    });
    return normalized as SOWRow[];
  } catch (error: any) { throw error; }
};

/**
 * HIGH-FIDELITY LESSON PLAN GENERATION
 * Mandates the 5-30-5 structure and specific content.
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
    TASK: Architect a SUBSTANTIVE Lesson Plan for 2026.
    STRICT FORMATTING RULES:
    1. ORGANIZATION OF LEARNING: Must include:
       - Introduction (5 mins): Specific hook and review of previous lesson.
       - Lesson Development (30 mins): Divided into 4 distinct steps with specific timings (e.g., Step 1: 10m, Step 2: 10m, Step 3: 5m, Step 4: 5m).
       - Conclusion (5 mins): Summary and prep for next lesson.
    2. NO PLACEHOLDERS: DO NOT say "Teacher explains". Instead, say "Teacher demonstrates the concept of [X] by doing [Y] and asking learners to [Z]".
    3. TEXTBOOK REFERENCES: Reference specific page numbers from KICD approved texts (e.g., 'Spark Integrated Science pg 77').
    4. EXTENDED ACTIVITIES: Provide 3 concrete activities (Research, Creative, Debate/Community).
    5. CORE ELEMENTS: Substantive descriptions for CCs, Values, and PCIs.
    
    Return JSON matching the LessonPlan type.`;

  const userPrompt = `Subject: ${subject}, Grade: ${grade}, Strand: ${strand}, Sub-Strand: ${subStrand}, School: ${schoolName}. Context: ${knowledgeContext || ''}`;

  try {
    const result = await callDeepseek(systemInstruction, userPrompt, true);
    return extractJSON(result || '{}') as LessonPlan;
  } catch (error: any) { throw error; }
};

export const generateLessonNotes = async (subj: string, grd: string, topic: string, context?: string, docs?: string): Promise<string> => {
  const sys = `Expert Subject Pedagogue. Provide clear Markdown study notes for Grade ${grd} students.`;
  const usr = `Generate study notes for ${subj} - ${topic}.`;
  return await callDeepseek(sys, usr, false);
};