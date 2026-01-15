
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (str: string): string => {
  // Robust extraction: find the first '[' or '{' and the last matching closing character
  const firstArray = str.indexOf('[');
  const lastArray = str.lastIndexOf(']');
  const firstObject = str.indexOf('{');
  const lastObject = str.lastIndexOf('}');

  if (firstArray !== -1 && lastArray !== -1 && (firstObject === -1 || firstArray < firstObject)) {
    return str.substring(firstArray, lastArray + 1);
  }
  if (firstObject !== -1 && lastObject !== -1) {
    return str.substring(firstObject, lastObject + 1);
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
      ${knowledgeContext ? `KICD OFFICIAL REFERENCE MATERIALS: \n${knowledgeContext}\n\n` : ''}
      Generate a CBE-compliant Rationalized Scheme of Work for: ${subject}, Level: ${grade}, Term: ${term}.
      Generate exactly ${lessonSlotsCount} lessons.
      
      MANDATORY CBE GUIDELINES:
      - Use the LATEST 2024/2025 Rationalized Curriculum standards.
      - learningOutcomes: Must start with "By the end of the lesson, the learner should be able to:" followed by a lettered list (a, b, c).
      - teachingExperiences: Must be learner-centered (e.g., "Learners are guided in pairs/groups to...").
      - keyInquiryQuestions: Must be relevant and provocative.
      - learningResources: Cite specific Kenyan textbooks (e.g., Spotlight, Mentor, Moran).
      - assessmentMethods: Include formative assessment (e.g., Checklists, Portfolios, Self-Assessment).

      RETURN A VALID JSON ARRAY ONLY.
      `,
      config: {
        systemInstruction: "ACT AS A KICD CURRICULUM SPECIALIST. You are an expert in the Kenyan Competency Based Education (CBE) system. Ensure all outputs are strictly formatted as JSON.",
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

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");
    
    const jsonStr = cleanJsonString(text);
    return JSON.parse(jsonStr) as SOWRow[];
  } catch (error) {
    console.error("Critical error in generateSOW:", error);
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
      ${knowledgeContext ? `REFERENCE MATERIALS: \n${knowledgeContext}\n\n` : ''}
      GENERATE A KENYAN CBE (COMPETENCY BASED EDUCATION) LESSON PLAN.
      
      Learning Area: ${subject}
      Grade: ${grade}
      Strand: ${strand}
      Sub-Strand: ${subStrand}
      School: ${schoolName}

      STRUCTURE:
      1. Specific Learning Outcomes: Actionable and learner-centered.
      2. Key Inquiry Questions: Critical thinking focus.
      3. Learning Resources: Materials/textbooks.
      4. Organization of Learning:
         - Introduction (5 mins)
         - Lesson Development (30 mins): 4 distinct steps.
         - Conclusion (5 mins)
      5. Extended Activities: Community Service Learning (CSL) or home projects.
      `,
      config: {
        systemInstruction: "ACT AS A KICD PEDAGOGICAL EXPERT. Create highly engaging, CBE-aligned lesson plans for Kenyan primary and junior schools. Output must be valid JSON.",
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

    const text = response.text;
    if (!text) throw new Error("AI returned empty content");
    
    return JSON.parse(cleanJsonString(text)) as LessonPlan;
  } catch (error) {
    console.error("Critical error in generateLessonPlan:", error);
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
      ${knowledgeContext ? `OFFICIAL KICD BASE CONTENT: \n${knowledgeContext}\n\n` : ''}
      Subject: ${subject} Grade ${grade}. Topic: ${topic}.
      Write detailed study notes in Markdown format.`,
      config: {
        systemInstruction: "WRITE COMPREHENSIVE STUDY NOTES for a Kenyan learner. You are a world-class educator. Use clear headers and formatting.",
      }
    });

    return response.text || "Notes generation failed.";
  } catch (error) {
    console.error("Critical error in generateLessonNotes:", error);
    throw error;
  }
};
