
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (str: string): string => {
  if (!str) return "";
  
  // Try to find the first JSON structure start
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  // Try to find the last JSON structure end
  const lastBrace = str.lastIndexOf('}');
  const lastBracket = str.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  
  if (start !== -1 && end !== -1 && end > start) {
    let json = str.substring(start, end + 1);
    // Basic recovery for common AI truncation (closing brackets)
    if (json.startsWith('[') && !json.endsWith(']')) json += ']';
    if (json.startsWith('{') && !json.endsWith('}')) json += '}';
    return json;
  }
  
  return str.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string,
  weekOffset: number = 1
): Promise<SOWRow[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
      TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
      Generate exactly ${lessonSlotsCount} lessons starting from Week ${weekOffset}.
      
      CBE REQUIREMENTS:
      - Outcomes: measurable (By the end of the lesson, the learner should be able to...)
      - Experiences: learner-centered activities.
      - Resources: Kenyan textbooks and local materials.
      - Assessment: formative methods.
      `,
      config: {
        maxOutputTokens: 8000,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "You are a KICD Curriculum Specialist. Output STRICTLY a valid JSON array of objects. No conversational text. No markdown formatting. Follow Kenyan CBE 2024/2025 standards.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.INTEGER },
              lesson: { type: Type.INTEGER },
              strand: { type: Type.STRING },
              subStrand: { type: Type.STRING },
              learningOutcomes: { type: Type.STRING },
              teachingExperiences: { type: Type.STRING },
              keyInquiryQuestions: { type: Type.STRING },
              learningResources: { type: Type.STRING },
              assessmentMethods: { type: Type.STRING },
              reflection: { type: Type.STRING }
            },
            required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection"]
          }
        }
      }
    });

    const jsonStr = cleanJsonString(response.text || "");
    try {
        return JSON.parse(jsonStr) as SOWRow[];
    } catch (parseError) {
        console.error("JSON Parse Error. String was:", jsonStr);
        throw new Error("AI data was too large for one request. Please try again; the system will auto-batch next time.");
    }
  } catch (error) {
    console.error("SOW Generation Failed:", error);
    throw error;
  }
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `
      SUBJECT: ${subject} | LEVEL: ${grade} | TOPIC: ${subStrand}
      CONTEXT: ${knowledgeContext || 'Standard KICD CBE'}
      
      GENERATE A DETAILED CBE LESSON PLAN:
      1. OUTCOMES (Measurable)
      2. INQUIRY QUESTIONS (Open-ended)
      3. RESOURCES (Kenyan Context)
      4. ORGANIZATION: Intro, Development, Conclusion.
      `,
      config: {
        maxOutputTokens: 6000,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "Act as a Senior KICD Consultant. Output STRICTLY valid JSON. No text outside the JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            school: { type: Type.STRING },
            year: { type: Type.INTEGER },
            term: { type: Type.STRING },
            textbook: { type: Type.STRING },
            week: { type: Type.INTEGER },
            lessonNumber: { type: Type.INTEGER },
            learningArea: { type: Type.STRING },
            grade: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            roll: { type: Type.STRING },
            strand: { type: Type.STRING },
            subStrand: { type: Type.STRING },
            keyInquiryQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
            learningResources: { type: Type.ARRAY, items: { type: Type.STRING } },
            introduction: { type: Type.ARRAY, items: { type: Type.STRING } },
            lessonDevelopment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  content: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "duration", "content"]
              }
            },
            conclusion: { type: Type.ARRAY, items: { type: Type.STRING } },
            extendedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
            teacherSelfEvaluation: { type: Type.STRING }
          },
          required: [
            "school", "year", "term", "learningArea", "grade", "strand", "subStrand", 
            "outcomes", "introduction", "lessonDevelopment", "conclusion", 
            "extendedActivities", "keyInquiryQuestions", "learningResources", "textbook", "roll"
          ]
        }
      }
    });

    const jsonStr = cleanJsonString(response.text || "");
    try {
        return JSON.parse(jsonStr) as LessonPlan;
    } catch (parseError) {
        throw new Error("Invalid Lesson Plan format received.");
    }
  } catch (error) {
    throw error;
  }
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. Generate Markdown notes following Kenyan CBE guidelines.`,
      config: {
        maxOutputTokens: 6000,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Notes generation failed.";
  } catch (error) {
    throw error;
  }
};
