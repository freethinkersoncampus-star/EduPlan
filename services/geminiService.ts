
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    ${knowledgeContext ? `CONTEXT FROM TEACHER'S DOCUMENTS: \n${knowledgeContext}\n\n` : ''}
    Generate a CBC-compliant "Rationalized" Scheme of Work for ${subject} Grade ${grade} for Term ${term}. 
    There are ${lessonSlotsCount} lessons in total. 
    
    COLUMNS TO FILL:
    - week: integer
    - lesson: integer
    - strand: string
    - subStrand: string
    - learningOutcomes: string (detailed bullets)
    - learningExperiences: string (detailed classroom activities)
    - keyInquiryQuestion: string (thought-provoking questions)
    - resources: string (specific books like 'Mentor', 'Spark', digital devices, realia)
    - assessment: string (Oral questions, Observation, etc.)
    - reflection: Always return an empty string "" (for teacher to fill manually later)

    Ensure it aligns perfectly with the KICD rationalized curriculum guidelines.`,
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
            learningExperiences: { type: Type.STRING },
            keyInquiryQuestion: { type: Type.STRING },
            resources: { type: Type.STRING },
            assessment: { type: Type.STRING },
            reflection: { type: Type.STRING }
          },
          required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "learningExperiences", "keyInquiryQuestion", "resources", "assessment"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as SOWRow[];
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    ${knowledgeContext ? `CONTEXT FROM TEACHER'S DOCUMENTS: \n${knowledgeContext}\n\n` : ''}
    Generate a highly professional "Rationalized" CBC lesson plan for ${subject} Grade ${grade}. 
    Strand: ${strand}. Sub-strand: ${subStrand}.
    
    The output must follow this professional CBE document structure:
    1. Header info (Grade, Subject, reference books e.g., 'Spark Integrated Science' or 'Mentor').
    2. Specific Learning Outcomes (State, Use, Appreciate format).
    3. Key Inquiry Questions (e.g., 'What is digestion?').
    4. Learning Resources (mention specific page numbers).
    5. Organisation of Learning:
       - Introduction (5 mins)
       - Lesson Development (Step 1-4 with timings totaling ~30 mins)
       - Conclusion (5 mins)
    6. Extended Activities (Assignments, Projects, Debates).`,
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grade: { type: Type.STRING },
          subject: { type: Type.STRING },
          strand: { type: Type.STRING },
          subStrand: { type: Type.STRING },
          week: { type: Type.STRING },
          lessonNumber: { type: Type.STRING },
          term: { type: Type.STRING },
          referenceBook: { type: Type.STRING },
          outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyInquiryQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          learningResources: { type: Type.ARRAY, items: { type: Type.STRING } },
          introduction: {
            type: Type.OBJECT,
            properties: {
              duration: { type: Type.STRING },
              content: { type: Type.STRING }
            }
          },
          lessonDevelopment: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                duration: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          },
          conclusion: {
            type: Type.OBJECT,
            properties: {
              duration: { type: Type.STRING },
              content: { type: Type.STRING }
            }
          },
          extendedActivities: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}') as LessonPlan;
};

export const generateLessonNotes = async (
  subject: string,
  grade: string,
  topic: string,
  customContext?: string,
  knowledgeContext?: string
): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    ${knowledgeContext ? `REFERENCE MATERIAL: \n${knowledgeContext}\n\n` : ''}
    Generate comprehensive student notes for ${subject} Grade ${grade} on the topic: ${topic}. 
    ${customContext ? `Additional Instructions: ${customContext}` : ''}
    Use Markdown. Include clear headings, definitions, and tables for data where relevant.`,
  });

  return response.text || "Failed to generate notes.";
};
