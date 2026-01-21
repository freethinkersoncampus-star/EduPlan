import { SOWRow, LessonPlan } from "../types";

/**
 * QWEN AI ENGINE (Alibaba Cloud DashScope)
 * Re-implemented as requested to reduce hallucinations and utilize preferred token allocations.
 */
async function callQwen(systemPrompt: string, userPrompt: string, isJson: boolean = false) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "qwen-plus",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: isJson ? { type: "json_object" } : undefined,
      temperature: 0.1, 
      max_tokens: 4000 
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Qwen Engine Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * FAIL-SAFE JSON EXTRACTOR
 * Locates valid JSON blocks within conversational output.
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
    WORKLOAD RULE: This is Term ${term}. Strictly follow the distribution where Term 1 is 40%, Term 2 is 40%, and Term 3 is 20%.
    REFERENCING: Align exactly with the provided Knowledge Base documents. DO NOT hallucinate details not found in context.
    MANDATORY: Return ONLY a JSON object: { "lessons": [{ "week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection" }] }`;

  const userPrompt = `Subject: ${subject}, Grade: ${grade}, Term: ${term}, Lessons/Week: ${lessonsPerWeek}. Content Context: ${knowledgeContext || 'Standard CBE'}`;

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
    CBE DESIGN: Focus on core competencies and values integration.
    CRITICAL: "lessonDevelopment" MUST be an array of 3-4 steps with titles, durations, and content actions.
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
  const sys = `Expert Subject Pedagogue. Generate detailed Markdown study notes for Grade ${grd} students following KICD guidelines. Use bold headers. No conversational filler.`;
  const usr = `Notes for ${subj} - ${topic}.`;
  return await callQwen(sys, usr, false);
};