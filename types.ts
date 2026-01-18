
export interface SubjectGradePair {
  id: string;
  subject: string;
  grade: string;
}

export interface OnboardedTeacher {
  id: string;
  name: string;
  tscNumber: string;
  role: 'Teacher' | 'HOD' | 'Deputy' | 'Principal' | 'Admin';
  onboardedDate: string;
}

export interface UserProfile {
  name: string;
  tscNumber: string;
  school: string;
  avatar?: string;
  subjects: SubjectGradePair[];
  onboardedStaff?: OnboardedTeacher[];
  availableSubjects?: string[];
  grades?: string[];
  role?: string;
}

export interface LessonSlot {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  grade: string;
  type: 'lesson' | 'break' | 'activity';
}

export interface SOWRow {
  week: number;
  lesson: number;
  strand: string;
  subStrand: string;
  learningOutcomes: string;
  teachingExperiences: string;
  keyInquiryQuestions: string;
  learningResources: string;
  assessmentMethods: string;
  reflection: string;
  date?: string;
  selectedDay?: string;
  isCompleted?: boolean;
  isBreak?: boolean;
}

export interface SavedSOW {
  id: string;
  dateCreated: string;
  subject: string;
  grade: string;
  term: number;
  year?: number;
  termStart?: string;
  termEnd?: string;
  halfTermStart?: string;
  halfTermEnd?: string;
  data: SOWRow[];
}

export interface SavedLessonPlan {
  id: string;
  dateCreated: string;
  title: string;
  subject: string;
  grade: string;
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
  isSystemDoc?: boolean;
  officialSourceUrl?: string;
}

export interface LessonStep {
  title: string;
  duration: string;
  content: string[]; 
}

export interface LessonPlan {
  school: string;
  year: number;
  term: string;
  textbook: string;
  week: number;
  lessonNumber: number;
  learningArea: string;
  grade: string;
  date: string;
  time: string;
  roll: string;
  strand: string;
  subStrand: string;
  coreCompetencies: string[];
  values: string[];
  pcis: string[];
  keyInquiryQuestions: string[];
  outcomes: string[];
  learningResources: string[];
  introduction: string[];
  lessonDevelopment: LessonStep[];
  conclusion: string[];
  extendedActivities: string[];
  teacherSelfEvaluation: string;
}
