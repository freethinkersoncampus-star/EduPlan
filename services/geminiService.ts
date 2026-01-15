
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (str: string): string => {
  // Removes markdown code blocks and finds the outermost JSON structure
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
  
  const firstArray = cleaned.indexOf('[');
  const lastArray = cleaned.lastIndexOf(']');
  const firstObject = cleaned.indexOf('{');
  const lastObject = cleaned.lastIndexOf('}');

  const arrayStart = firstArray !== -1 ? firstArray : Infinity;
  const objectStart = firstObject !== -1 ? firstObject : Infinity;

  // Extract the true JSON part to avoid errors from model "chatter"
  if (arrayStart < objectStart && lastArray !== -1) {
    return cleaned.substring(firstArray, lastArray + 1);
  } else if (lastObject !== -1 && firstObject !== -1) {
    return cleaned.substring(firstObject, lastObject + 1);
  }
  
  return cleaned;
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
      model: 'gemini-3-pro-preview',
      contents: `
      CONTEXT: ${knowledgeContext || 'KICD Rationalized Curriculum 2024/2025'}
      TASK: Generate a CBE Rationalized Scheme of Work for ${subject}, ${grade}, Term ${term}.
      Generate exactly ${lessonSlotsCount} lessons.
      
      STRICT CBE REQUIREMENTS:
      - Outcomes must be measurable (e.g., "By the end of the lesson, the learner should be able to...")
      - Teaching Experiences must be learner-centered.
      - Resources must cite Kenyan textbooks and local materials.
      - Assessment must be formative.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "You are a KICD Curriculum Specialist. You must only output valid JSON matching the provided schema. Follow the Kenyan CBE 2024/2025 rationalized standards strictly.",
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
    return JSON.parse(jsonStr) as SOWRow[];
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
      model: 'gemini-3-pro-preview', 
      contents: `
      CONTEXT: ${knowledgeContext || 'KICD Standards'}
      SUBJECT: ${subject}
      LEVEL: ${grade}
      TOPIC: ${subStrand}
      
      GENERATE A DETAILED CBE LESSON PLAN FOLLOWING THESE SECTIONS:
      1. SPECIFIC LEARNING OUTCOMES (Measurable)
      2. KEY INQUIRY QUESTIONS (Open-ended)
      3. LEARNING RESOURCES (Kenyan context)
      4. ORGANIZATION OF LEARNING:
         - Introduction (5 min): Catchy start
         - Lesson Development (30 min): Steps 1, 2, 3 (Learner Activities)
         - Conclusion (5 min): Summary & Reflection
      `,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "Act as a Senior Pedagogy Consultant for the Kenyan Ministry of Education. Output MUST be valid JSON. Ensure pedagogical depth in the 'lessonDevelopment' section.",
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
    return JSON.parse(jsonStr) as LessonPlan;
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
      model: 'gemini-3-pro-preview',
      contents: `
      GENERATE DETAILED STUDY NOTES
      Subject: ${subject}
      Level: ${grade}
      Topic: ${topic}
      
      ${knowledgeContext ? `REFERENCE: ${knowledgeContext}` : ''}
      Format: Markdown with clear headers, bullet points, and a summary section.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "Create educational, engaging study notes for Kenyan learners. Use Kenyan English and terminology. Follow CBE competency guidelines.",
      }
    });

    return response.text || "Notes generation failed.";
  } catch (error) {
    console.error("Notes Generation Failed:", error);
    throw error;
  }
};
