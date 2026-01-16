import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

// Initialize the Google GenAI SDK with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a chunk of the Scheme of Work (SOW) using the gemini-3-flash-preview model.
 * Employs JSON response mode with a strict schema to ensure structural correctness.
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
  const systemInstruction = `You are a Senior KICD Curriculum Specialist. Generate a CBE Rationalized SOW for ${subject}, ${grade}. 
  Context: ${knowledgeContext || 'Standard CBE'}`;
  
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TERM: ${term}. Weeks ${startWeek}-${endWeek}. ${lessonsPerWeek} lessons/wk.`;

  // Use ai.models.generateContent to call the GenAI model directly.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
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
                reflection: { type: Type.STRING }
              },
              required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "teachingExperiences", "keyInquiryQuestions", "learningResources", "assessmentMethods", "reflection"]
            }
          }
        },
        required: ["lessons"]
      }
    }
  });

  // Extract text content using the .text property (not a method).
  const text = response.text || '{"lessons": []}';
  try {
    const parsed = JSON.parse(text);
    return (parsed.lessons || []) as SOWRow[];
  } catch (e) {
    console.error("Failed to parse SOW JSON output", e);
    throw new Error("AI data integrity check failed. Please retry.");
  }
};

/**
 * Generates a comprehensive lesson plan using the gemini-3-pro-preview model for high-quality pedagogical output.
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
  TASK: Generate a COMPLETE, HIGH-CONTENT Lesson Plan for ${schoolName}. 
  
  MANDATORY RULES:
  1. NO PLACEHOLDERS. Do not use "-", "Step 1...", or empty strings.
  2. TEACHER & LEARNER ACTIONS: Explicitly describe exactly what the teacher says/does AND exactly what the learners do.
  3. CBE COMPLIANT: Use measurable outcomes and inquiry-based activities.
  4. FULL CONTENT: The "introduction", "lessonDevelopment", and "conclusion" must be packed with specific instructional details.`;
  
  const userPrompt = `Architect a high-quality lesson for ${subject} Grade ${grade} on the topic of ${subStrand} (Strand: ${strand}). Context: ${knowledgeContext || 'Standard CBE'}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: userPrompt,
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
              }
            }
          },
          conclusion: { type: Type.ARRAY, items: { type: Type.STRING } },
          extendedActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
          teacherSelfEvaluation: { type: Type.STRING }
        }
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as LessonPlan;
  } catch (e) {
    console.error("Failed to parse Lesson Plan JSON output", e);
    throw new Error("AI output integrity failed. Please try again.");
  }
};

/**
 * Generates detailed Markdown study notes for a specific topic using gemini-3-flash-preview.
 */
export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const systemInstruction = "Subject Teacher. Generate comprehensive Markdown study notes.";
  const userPrompt = `SUBJECT: ${subject} | GRADE: ${grade} | TOPIC: ${topic}. ${knowledgeContext ? `Extra Context: ${knowledgeContext}` : ''}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction
    }
  });

  return response.text || '';
};
