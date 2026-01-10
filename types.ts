
export interface OnboardedTeacher {
  id: string;
  name: string;
  tscNumber: string;
  role: 'Teacher' | 'HOD' | 'Deputy' | 'Principal';
  onboardedDate: string;
}

export interface UserProfile {
  name: string;
  tscNumber: string;
  school: string;
  avatar?: string;
  isMasterAdmin: boolean;
  onboardedStaff?: OnboardedTeacher[];
  subjects?: string[];
  grades?: string[];
}

export interface TeacherAssignment {
  id: string;
  teacherName: string;
  subject: string;
  grade: string;
  lessonsPerWeek: number;
}

export interface BreakPeriod {
  name: string;
  startTime: string;
  endTime: string;
  type: 'break' | 'activity';
}

export interface TimetableConfig {
  daysToTeach: string[];
  dayStartTime: string;
  dayEndTime: string;
  lessonDuration: number;
  breaks: BreakPeriod[];
  constraints: string;
}

export interface LessonSlot {
  day: string;
  startTime: string;
  endTime: string;
  teacherName: string;
  subject: string;
  grade: string;
  type: 'lesson' | 'break' | 'activity';
}

export interface SOWRow {
  week: number;
  lesson: number;
  date: string;
  selectedDay?: string;
  strand: string;
  subStrand: string;
  learningOutcomes: string;
  learningExperiences: string;
  keyInquiryQuestion: string;
  resources: string;
  assessment: string;
  reflection: string;
  isCompleted?: boolean;
  isBreak?: boolean;
}

export interface SavedSOW {
  id: string;
  dateCreated: string;
  subject: string;
  grade: string;
  term: number;
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
}

export interface LessonStep {
  title: string;
  duration: string;
  content: string;
}

export interface LessonPlan {
  school: string;
  learningArea: string;
  grade: string;
  date: string;
  time: string;
  roll: string;
  strand: string;
  subStrand: string;
  keyInquiryQuestion: string;
  outcomes: string[];
  learningResources: string[];
  introduction: string;
  lessonDevelopment: LessonStep[];
  learnerReflection: string;
  teacherReflection: string[];
}
