
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
    return str.substring(start, end + 1);
  }
  
  return str.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
      TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
      Generate exactly ${lessonSlotsCount} lessons.
      
      CBE REQUIREMENTS:
      - Outcomes: measurable (By the end of the lesson, the learner should be able to...)
      - Experiences: learner-centered activities.
      - Resources: Kenyan textbooks and local materials.
      - Assessment: formative methods.
      `,
      config: {
        maxOutputTokens: 8000,
        // Disable thinking budget to stay within the 10-second server timeout limit
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "You are a KICD Curriculum Specialist. Output strictly valid JSON arrays only. No preamble. No conversational text. Follow Kenyan CBE 2024/2025 rationalized standards exactly.",
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
        console.error("JSON Parse Error. Raw string was:", jsonStr);
        throw new Error("The AI provided a response in an incorrect format. Please try again.");
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
      4. ORGANIZATION:
         - Intro (5 min): Stimulate interest
         - Development (30 min): Learner-centered steps
         - Conclusion (5 min): Reflection
      `,
      config: {
        maxOutputTokens: 6000,
        // Disable thinking budget to stay within the 10-second server timeout limit
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "Act as a Senior KICD Consultant. Output MUST be valid JSON only. No text outside the JSON. Ensure deep pedagogical detail in activities.",
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
        console.error("JSON Parse Error. Raw string was:", jsonStr);
        throw new Error("The AI provided a response in an incorrect format. Please try again.");
    }
  } catch (error) {
    console.error("Lesson Plan Generation Failed:", error);
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
      contents: `
      SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}
      ${knowledgeContext ? `REFERENCE DATA: ${knowledgeContext}` : ''}
      
      Generate comprehensive, learner-friendly study notes in Markdown format. Use Kenyan terminology.
      `,
      config: {
        maxOutputTokens: 6000,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "Create educational study notes following Kenyan CBE guidelines. Use clear headers and formatting.",
      }
    });

    return response.text || "Notes generation failed.";
  } catch (error) {
    console.error("Notes Generation Failed:", error);
    throw error;
  }
};
