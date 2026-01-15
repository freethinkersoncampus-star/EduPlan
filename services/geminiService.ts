
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

// Helper to ensure we have a fresh client with the latest environment variable
// Directly uses process.env.API_KEY as per GenAI SDK guidelines
const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to clean JSON strings from common model formatting errors
const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks if present
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
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
        // Move expert persona to systemInstruction for better model steering
        systemInstruction: "ACT AS A KICD CURRICULUM SPECIALIST. You are an expert in the Kenyan Competency Based Education (CBE) system.",
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
        // Use systemInstruction for defining the specialized persona
        systemInstruction: "ACT AS A KICD PEDAGOGICAL EXPERT. You specialize in creating highly engaging, CBE-aligned lesson plans for Kenyan primary and junior schools.",
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
      Use Markdown with headers, bold text for keywords, and tables where applicable.`,
      config: {
        // Provide the expert persona and task instructions via systemInstruction
        systemInstruction: "WRITE COMPREHENSIVE STUDY NOTES for a Kenyan learner. You are a world-class educator known for making complex concepts simple and clear while maintaining academic rigor.",
      }
    });

    // Access text property directly as per latest SDK guidelines
    return response.text || "Notes generation failed.";
  } catch (error) {
    console.error("Critical error in generateLessonNotes:", error);
    throw error;
  }
};
