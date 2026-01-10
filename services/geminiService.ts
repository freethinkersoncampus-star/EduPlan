
import { GoogleGenAI, Type } from "@google/genai";
import { SOWRow, LessonPlan, TimetableConfig, TeacherAssignment, LessonSlot } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSOW = async (
  subject: string, 
  grade: string, 
  term: number,
  lessonSlotsCount: number,
  knowledgeContext?: string
): Promise<SOWRow[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    ${knowledgeContext ? `CONTEXT FROM TEACHER'S DOCUMENTS: \n${knowledgeContext}\n\n` : ''}
    Generate a CBC-compliant "Rationalized" Scheme of Work for ${subject} Grade ${grade} for Term ${term}. 
    Total lessons: ${lessonSlotsCount}. 
    
    MUST INCLUDE ALL THESE COLUMNS:
    - week: integer
    - lesson: integer
    - strand: string
    - subStrand: string
    - learningOutcomes: string (Bullets, concise)
    - learningExperiences: string (Classroom activities)
    - keyInquiryQuestion: string (At least one)
    - resources: string (Locally available materials & KICD approved books)
    - assessment: string (Methods like observation, oral, etc.)
    - reflection: Always return empty string ""

    Ensure CBC Kenya rationalized syllabus standards are strictly followed.`,
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
          required: ["week", "lesson", "strand", "subStrand", "learningOutcomes", "learningExperiences", "keyInquiryQuestion", "resources", "assessment", "reflection"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as SOWRow[];
};

export const generateMasterTimetable = async (
  config: TimetableConfig,
  assignments: TeacherAssignment[]
): Promise<LessonSlot[]> => {
  const prompt = `
    TASK: Generate a conflict-free school master timetable matching the reference photo structure.
    
    SCHOOL DAY STRUCTURE:
    - Start: ${config.dayStartTime} (Assembly/Morning Activities)
    - End: ${config.dayEndTime} (Games/Departure)
    - Lesson Duration: ${config.lessonDuration} minutes
    - Breaks/Fixed Activities: ${config.breaks.map(b => `${b.name}: ${b.startTime}-${b.endTime}`).join(', ')}
    
    TEACHER LOADS:
    ${assignments.map(a => `- ${a.teacherName}: ${a.subject} for ${a.grade} (${a.lessonsPerWeek} lessons/week)`).join('\n')}
    
    STRICT PEDAGOGICAL CONSTRAINTS:
    ${config.constraints}
    - If a subject has a "Double" period, append "DOUBLE" to the subject name (e.g., "MATH DOUBLE").
    - No teacher conflict.
    - No grade conflict.
    - Ensure lessons are exactly ${config.lessonDuration} mins.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            teacherName: { type: Type.STRING },
            subject: { type: Type.STRING },
            grade: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['lesson', 'break', 'activity'] }
          },
          required: ["day", "startTime", "endTime", "teacherName", "subject", "grade", "type"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as LessonSlot[];
};

export const generateLessonPlan = async (
  subject: string,
  grade: string,
  strand: string,
  subStrand: string,
  schoolName: string,
  knowledgeContext?: string
): Promise<LessonPlan> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    ${knowledgeContext ? `CONTEXT FROM TEACHER DOCUMENTS: \n${knowledgeContext}\n\n` : ''}
    Task: Create a highly detailed CBC Kenya lesson plan for ${subject} Grade ${grade}. 
    Topic: ${strand} -> ${subStrand}.
    
    FORMAT REQUIREMENT: Follow the provided text sample format exactly.
    
    JSON Fields to fill:
    - school: ${schoolName}
    - learningArea: ${subject}
    - grade: ${grade}
    - date: Use a placeholder like "9/06/2025" or similar.
    - time: "40MINS"
    - roll: "28" (typical class size)
    - strand: string
    - subStrand: string
    - keyInquiryQuestion: A "How" or "Why" question.
    - outcomes: Array of 3 specific measurable goals.
    - learningResources: Array of physical items needed.
    - introduction: A short text with a question for learners.
    - lessonDevelopment: Array of 4 steps (Hook, Input, Experiment/Activity, Discussion) each with duration and content.
    - learnerReflection: A reflection question for students.
    - teacherReflection: Array of 3 evaluative questions for the teacher.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          learningArea: { type: Type.STRING },
          grade: { type: Type.STRING },
          date: { type: Type.STRING },
          time: { type: Type.STRING },
          roll: { type: Type.STRING },
          strand: { type: Type.STRING },
          subStrand: { type: Type.STRING },
          keyInquiryQuestion: { type: Type.STRING },
          outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
          learningResources: { type: Type.ARRAY, items: { type: Type.STRING } },
          introduction: { type: Type.STRING },
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
          learnerReflection: { type: Type.STRING },
          teacherReflection: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["school", "learningArea", "grade", "strand", "subStrand", "outcomes", "introduction", "lessonDevelopment"]
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    ${knowledgeContext ? `REFERENCE: \n${knowledgeContext}\n\n` : ''}
    Task: Generate comprehensive student notes for ${subject} Grade ${grade} on topic: ${topic}. 
    Style: Clear, exam-oriented, using Kenya CBC standards. 
    Format: Markdown. Include headings, bullet points, and a summary section.`,
  });

  return response.text || "Failed to generate notes.";
};
