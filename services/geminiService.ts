
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

// Always initialize the client with process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a chunk of the Schemes of Work.
 * Uses gemini-3-pro-preview for complex reasoning required for curriculum generation.
 */
export const generateSOWChunk = async (
  subject: string, 
  grade: string, 
  term: number,
  startWeek: number,
  endWeek: number,
  lessonsPerWeek: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  const systemInstruction = `You are a Senior KICD Curriculum Specialist. Generate a CBE Rationalized Schemes of Work (SOW). 
  Context: ${knowledgeContext || 'Standard CBE'}. 
  Return the response in JSON format containing a "lessons" array.`;
  
  const prompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}. Weeks ${startWeek}-${endWeek}. ${lessonsPerWeek} lessons per week. 
  Generate SOW data. Each lesson object should be detailed and relevant to the Kenyan CBE curriculum.`;

  // Use ai.models.generateContent to query GenAI with both the model name and prompt.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lessons: {
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
                reflection: { type: Type.STRING },
              },
              required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection"]
            }
          }
        },
        required: ["lessons"]
      }
    }
  });

  try {
    // The response object features a .text property that directly returns the string output.
    const text = response.text || '{"lessons":[]}';
    const parsed = JSON.parse(text);
    return (parsed.lessons || []) as SOWRow[];
  } catch (e) {
    console.error("Failed to parse SOW chunk", e);
    return [];
  }
};

/**
 * Generates a comprehensive Lesson Plan.
 */
export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const systemInstruction = `You are a Senior KICD CBE Pedagogy Expert. Generate a COMPLETE, HIGH-CONTENT Lesson Plan with detailed teacher and learner activities. No placeholders. 
  Context: ${knowledgeContext || 'Standard CBE'}. 
  Return the response in JSON format matching the requested schema.`;
  
  const prompt = `Architect a high-quality lesson for ${subject} Grade ${grade} on the topic of ${subStrand} (Strand: ${strand}). School: ${schoolName}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction,
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
        required: ["school", "year", "term", "textbook", "week", "lessonNumber", "learningArea", "grade", "date", "time", "roll", "strand", "subStrand", "keyInquiryQuestions", "outcomes", "learningResources", "introduction", "lessonDevelopment", "conclusion", "extendedActivities", "teacherSelfEvaluation"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as LessonPlan;
  } catch (e) {
    console.error("Failed to parse Lesson Plan", e);
    throw new Error("Failed to generate a valid lesson plan from AI response.");
  }
};

/**
 * Generates detailed Markdown study notes.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const systemInstruction = `You are a Subject Matter Expert in the Kenyan curriculum. Provide clear, detailed educational notes in Markdown format. 
  Context: ${knowledgeContext || ''}`;
  
  const prompt = `Generate comprehensive Markdown study notes for ${subject} Grade ${grade} on the topic of ${topic}. 
  Include key definitions, concepts, and illustrative examples.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { systemInstruction }
  });

  return response.text || '';
};
