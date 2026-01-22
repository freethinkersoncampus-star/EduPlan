
import { SOWRow, LessonPlan } from "../types";

/**
 * QWEN AI ENGINE (Alibaba Cloud DashScope - International)
 * Optimized for Qwen3-Max for high-precision curriculum alignment.
 */
async function callQwen(systemPrompt: string, userPrompt: string, isJson: boolean = false) {
  const apiKey = (process.env.API_KEY || "").trim();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const endpoint = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen3-max", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: isJson ? { type: "json_object" } : undefined,
        temperature: 0.1, 
        max_tokens: 3500 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `Error ${response.status}`;
      console.error("AI AUTH DIAGNOSTIC:", errorData);
      throw new Error(msg);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Fetch Exception:", error);
    throw error;
  }
}

/**
 * FAIL-SAFE JSON EXTRACTOR
 */
function extractJSON(text: string) {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (innerError) {
        console.error("Qwen extraction failure:", innerError);
      }
    }
    let mdClean = cleaned
      .replace(/^```json\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "");
    try {
      return JSON.parse(mdClean);
    } catch (finalError) {
      throw new Error("The AI response was fragmented. Please try again.");
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
  const systemInstruction = `You are a Senior KICD Curriculum Specialist. 
    TASK: Architect a CBE SOW for Weeks ${startWeek}-${endWeek} based on RATIONALIZED DESIGNS.
    
    SOURCE OF TRUTH RULES:
    1. If the context contains [OFFICIAL KICD DESIGN], you MUST follow its Strand/Sub-Strand sequence exactly. 
    2. DO NOT skip to a later Strand until the current one is completed according to the KICD timeline.
    3. If [TEACHER NOTES] are present, use them for specific learning activities and resources.
    4. If no notes are present, use the [OFFICIAL KICD DESIGN] to derive outcomes and inquiry questions.
    
    WORKLOAD RULE: This is Term ${term}. Strictly follow the 40/40/20 Term distribution.
    MANDATORY: Return ONLY a JSON object: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`;

  const userPrompt = `Subject: ${subject}, Grade: ${grade}, Term: ${term}, Weeks ${startWeek}-${endWeek}. Context: ${knowledgeContext || 'Standard CBE'}`;

  try {
    const result = await callQwen(systemInstruction, userPrompt, true);
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
    ALIGNMENT: Follow the [OFFICIAL KICD DESIGN] for learning outcomes and core competencies.
    DETAIL: Use [TEACHER NOTES] for the body of the lesson if available; otherwise, generate best-practice CBE steps.
    CRITICAL: "learningArea" MUST be set to "${subject}".
    Return ONLY a JSON object following the LessonPlan interface structure precisely.`;

  const userPrompt = `Subject: ${subject} Grade ${grade}. Topic: ${subStrand}. Strand: ${strand}. School: ${schoolName}. Context: ${knowledgeContext || ''}`;

  try {
    const result = await callQwen(systemInstruction, userPrompt, true);
    const parsed = extractJSON(result);
    if (!parsed.learningArea || parsed.learningArea === '-' || parsed.learningArea === 'Lesson') {
      parsed.learningArea = subject;
    }
    return parsed as LessonPlan;
  } catch (error: any) { throw error; }
};

export const generateLessonNotes = async (subj: string, grd: string, topic: string): Promise<string> => {
  const sys = `Expert Subject Pedagogue. Generate detailed Markdown study notes for Grade ${grd} students following KICD guidelines. Focus on clarity and accuracy.`;
  const usr = `Notes for ${subj} - ${topic}.`;
  return await callQwen(sys, usr, false);
};
