
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanJsonString = (str: string): string => {
  // Enhanced robust extraction: find the actual start and end of the JSON content
  // First, remove markdown code block markers if they exist
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
  
  const firstArray = cleaned.indexOf('[');
  const lastArray = cleaned.lastIndexOf(']');
  const firstObject = cleaned.indexOf('{');
  const lastObject = cleaned.lastIndexOf('}');

  // Determine if we are looking for an array or an object
  // If it's a SOW, we usually expect an array. If it's a Lesson Plan, an object.
  // We'll return the outermost structure found.
  
  const arrayStart = firstArray !== -1 ? firstArray : Infinity;
  const objectStart = firstObject !== -1 ? firstObject : Infinity;

  if (arrayStart < objectStart && lastArray !== -1) {
    return cleaned.substring(firstArray, lastArray + 1);
  } else if (lastObject !== -1) {
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
      ${knowledgeContext ? `KICD OFFICIAL REFERENCE MATERIALS: \n${knowledgeContext}\n\n` : ''}
      Generate a CBE-compliant Rationalized Scheme of Work for: ${subject}, Level: ${grade}, Term: ${term}.
      Generate exactly ${lessonSlotsCount} lessons for a full term.
      
      MANDATORY CBE GUIDELINES:
      - Use the LATEST 2024/2025 Rationalized Curriculum standards.
      - learningOutcomes: Must start with "By the end of the lesson, the learner should be able to:" followed by a lettered list (a, b, c).
      - teachingExperiences: Must be learner-centered and activity-based.
      - keyInquiryQuestions: Must be relevant to the sub-strand.
      - learningResources: Cite specific Kenyan textbooks and digital tools.
      - assessmentMethods: Include formative and peer assessment.

      RETURN A VALID JSON ARRAY ONLY.
      `,
      config: {
        systemInstruction: "ACT AS A KICD CURRICULUM SPECIALIST. You are an expert in the Kenyan Competency Based Education (CBE) system. Ensure all outputs are strictly valid JSON arrays without conversational filler. Use gemini-3-pro-preview capabilities for high fidelity pedagogical accuracy.",
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
      model: 'gemini-3-pro-preview', 
      contents: `
      ${knowledgeContext ? `OFFICIAL REFERENCE CONTEXT: \n${knowledgeContext}\n\n` : ''}
      GENERATE A COMPREHENSIVE KENYAN CBE LESSON PLAN.
      
      Learning Area: ${subject}
      Grade: ${grade}
      Strand: ${strand}
      Sub-Strand: ${subStrand}
      School: ${schoolName}

      STRICT CBE STRUCTURE REQUIREMENTS:
      1. Specific Learning Outcomes: Must be measurable (e.g., "Learner should be able to...").
      2. Key Inquiry Questions: Relevant open-ended questions.
      3. Learning Resources: Identify relevant textbooks and local materials.
      4. Organization of Learning: 
         - Introduction (5m): Stimulate interest, link to prior knowledge.
         - Lesson Development (30m): Step-by-step learner-centered activities.
         - Conclusion (5m): Summary and reflection.
      5. Assessment: Clear formative strategies.

      OUTPUT MUST BE VALID JSON MATCHING THE SCHEMA PROVIDED.
      `,
      config: {
        systemInstruction: "ACT AS A SENIOR KICD PEDAGOGICAL CONSULTANT. You excel at creating learner-centered, activity-based lesson plans that follow the 2024/2025 Kenyan rationalized curriculum. Your output MUST be strictly structured JSON to be consumed by a web application.",
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
      model: 'gemini-3-pro-preview',
      contents: `
      ${knowledgeContext ? `OFFICIAL KICD BASE CONTENT: \n${knowledgeContext}\n\n` : ''}
      Subject: ${subject} Grade ${grade}. Topic: ${topic}.
      Write detailed study notes in Markdown format for a Kenyan learner. Include clear headers, bullet points, and summaries.`,
      config: {
        systemInstruction: "WRITE COMPREHENSIVE STUDY NOTES for a Kenyan learner following the CBE system. Use clear headers and formatting.",
      }
    });

    return response.text || "Notes generation failed.";
  } catch (error) {
    console.error("Critical error in generateLessonNotes:", error);
    throw error;
  }
};
