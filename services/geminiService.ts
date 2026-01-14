import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJSONResponse = (text: string) => {
  // Handles cases where the model might still wrap JSON in markdown despite the mimeType setting
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      ${knowledgeContext ? `KNOWLEDGE SOURCES: \n${knowledgeContext}\n\n` : ''}
      ACT AS A KICD CURRICULUM SPECIALIST.
      Generate a CBE-compliant Rationalized Scheme of Work for: ${subject}, Level: ${grade}, Term: ${term}.
      Generate ${lessonSlotsCount} lessons.
      
      MANDATORY FORMATTING FOR CBE GUIDELINES:
      - learningOutcomes: Must be a lettered list (a, b, c) starting with "By the end of the lesson, the learner should be able to:".
      - teachingExperiences: Must be detailed learner-centered activities starting with "Learners are guided in pairs, groups or individually to:".
      - keyInquiryQuestions: Stimulating questions related to the topic.
      - learningResources: Specific citations (e.g., 'Spotlight Integrated Science Learner's Book Grade 7 pg. 66-67').
      - assessmentMethods: Multiple methods (e.g., Written Test, Rubrics, Oral Questions).

      RETURN JSON ARRAY:
      - week: integer
      - lesson: integer
      - strand: string (UPPERCASE)
      - subStrand: string
      - learningOutcomes: string
      - teachingExperiences: string
      - keyInquiryQuestions: string
      - learningResources: string
      - assessmentMethods: string
      - reflection: ""
      `,
      config: {
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

    const jsonStr = cleanJSONResponse(response.text || '[]');
    return JSON.parse(jsonStr) as SOWRow[];
  } catch (error) {
    console.error("Error generating SOW:", error);
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded to Pro for more reliable complex JSON generation
      contents: `
      ${knowledgeContext ? `REFERENCE MATERIALS: \n${knowledgeContext}\n\n` : ''}
      ACT AS A KICD PEDAGOGICAL EXPERT.
      GENERATE A KENYAN CBE (COMPETENCY BASED EDUCATION) LESSON PLAN.
      
      CONTEXT:
      - Learning Area: ${subject}
      - Grade: ${grade}
      - Topic (Strand): ${strand}
      - Sub-Topic (Sub-Strand): ${subStrand}
      - School: ${schoolName}

      MANDATORY CBE STRUCTURE:
      1. Specific Learning Outcomes: Must be actionable and learner-centered.
      2. Key Inquiry Questions: Must stimulate critical thinking.
      3. Learning Resources: Suggest relevant materials/textbooks.
      4. Organization of Learning:
         - Introduction (5 mins): Engagement activity.
         - Lesson Development (30 mins): Precisely 4 steps with specific learner-centered activities.
         - Conclusion (5 mins): Summary and reflection.
      5. Extended Activities: Community service learning or home-based activities.
      `,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 }, // Allow model to reason through the complex pedagogical structure
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
            "extendedActivities", "keyInquiryQuestions", "learningResources"
          ]
        }
      }
    });

    const jsonStr = cleanJSONResponse(response.text || '{}');
    return JSON.parse(jsonStr) as LessonPlan;
  } catch (error) {
    console.error("Error generating lesson plan:", error);
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      ${knowledgeContext ? `BASE CONTENT: \n${knowledgeContext}\n\n` : ''}
      WRITE COMPREHENSIVE STUDY NOTES.
      Subject: ${subject} Grade ${grade}. Topic: ${topic}. Markdown format.`,
    });

    return response.text || "Notes generation failed.";
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};