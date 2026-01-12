
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJSONResponse = (text: string) => {
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
      model: 'gemini-3-flash-preview',
      contents: `
      ${knowledgeContext ? `REFERENCE MATERIALS: \n${knowledgeContext}\n\n` : ''}
      GENERATE A KENYAN CBE LESSON PLAN FOLLOWING THIS PRECISE KICD FORMAT:
      
      Learning Area: ${subject}, Grade: ${grade}. Topic: ${strand} -> ${subStrand}.
      
      MANDATORY SECTIONS:
      1. Outcomes: List starting with "By the end of the lesson, learners should be able to:".
      2. Organization of Learning:
         - Introduction (5 mins): Specific activities.
         - Lesson Development (30 mins): 4 distinct steps with titles and durations.
         - Conclusion (5 mins): Brief summary activities.
      3. Extended Activities: Creative or research-based follow-ups.
      4. Key Inquiry Questions: Specific questions for the lesson.
      `,
      config: {
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
          },
          required: ["learningArea", "grade", "strand", "subStrand", "outcomes", "introduction", "lessonDevelopment", "conclusion", "extendedActivities"]
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
