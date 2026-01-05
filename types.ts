
export interface LessonSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  grade: string;
}

export interface SchoolCalendar {
  term: number;
  startDate: string;
  endDate: string;
  halfTermStart: string;
  halfTermEnd: string;
}

export interface SOWRow {
  week: number;
  lesson: number;
  date: string;
  strand: string;
  subStrand: string;
  learningOutcomes: string;
  learningExperiences: string;
  keyInquiryQuestion: string;
  resources: string;
  assessment: string;
}

export interface LessonPlan {
  grade: string;
  subject: string;
  strand: string;
  subStrand: string;
  outcomes: string[];
  introduction: string;
  lessonDevelopment: string[];
  conclusion: string;
  extendedLearning: string;
}

export interface SubjectNote {
  id: string;
  title: string;
  content: string;
  grade: string;
  subject: string;
}
