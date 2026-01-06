
export interface LessonSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  grade: string;
}

export interface UserProfile {
  name: string;
  tscNumber: string;
  school: string;
  avatar?: string;
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
  reflection: string;
}

export interface SavedSOW {
  id: string;
  dateCreated: string;
  subject: string;
  grade: string;
  term: number;
  data: SOWRow[];
}

export interface SavedLessonPlan {
  id: string;
  dateCreated: string;
  title: string;
  plan: LessonPlan;
}

export interface SavedLessonNote {
  id: string;
  dateCreated: string;
  title: string;
  content: string;
  subject: string;
  grade: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  size: string;
  date: string;
  category: string;
  isActiveContext: boolean;
}

export interface LessonStep {
  title: string;
  duration: string;
  content: string;
}

export interface LessonPlan {
  grade: string;
  subject: string;
  strand: string;
  subStrand: string;
  week?: string;
  lessonNumber?: string;
  term?: string;
  referenceBook?: string;
  outcomes: string[];
  keyInquiryQuestions: string[];
  learningResources: string[];
  introduction: {
    duration: string;
    content: string;
  };
  lessonDevelopment: LessonStep[];
  conclusion: {
    duration: string;
    content: string;
  };
  extendedActivities: string[];
}

export interface SchoolCalendar {
  term: number;
  startDate: string;
  endDate: string;
  halfTermStart: string;
  halfTermEnd: string;
}
