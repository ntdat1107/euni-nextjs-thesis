export type CODomain = 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY';

export interface COItem {
  id: string;
  code: string;
  domain: CODomain;
  content: string;
}

export interface CLOItem {
  id: string;
  code: string;
  content: string;
  mappedPlos: string[];
  bloomLevel: string;
  masteryLevel: string;
}

export interface SyllabusTopic {
  id: string;
  title: string;
  lectureHours: number;
  practiceHours: number;
  selfStudyHours: number;
  mappedClos: string[];
}

export interface SyllabusChapter {
  id: string;
  title: string;
  topics: SyllabusTopic[];
}

export interface AssessmentComponent {
  id: string;
  name: string;
  weight: number;
  method: string;
  criteria?: string;
  description: string;
  mappedClos: string[];
}

export interface PiMetaItem {
  code: string;
  title: string;
  ploCode?: string;
  domain?: string;
}

export interface PloGroupItem {
  code: string;
  domain: string;
  title: string;
  pis: PiMetaItem[];
}

export interface PloDomainGroup {
  domain: string;
  domainLabel: string;
  shortLabel: string;
  plos: PloGroupItem[];
  allPis: PiMetaItem[];
}

export interface MaterialItem {
  id: string;
  type: 'main' | 'reference';
  title: string;
  author: string;
  publisher: string;
  year: string;
  url?: string;
}

export interface SelfStudyGuide {
  id: string;
  chapterRef: string;
  content: string;
  materials: string;
}

export interface CourseSyllabusData {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  courseNameEn?: string;
  theoryCredits?: number;
  practiceCredits?: number;
  lectureHours?: number;
  practiceHours?: number;
  selfStudyHours?: number;
  lecturers?: string;
  department?: string;
  faculty?: string;
  prerequisites?: string;
  corequisites?: string;
  courseDescription?: string;
  knowledgeObjective?: string;
  skillsObjective?: string;
  attitudesObjective?: string;
  cos?: COItem[];
  clos: CLOItem[];
  chapters?: SyllabusChapter[];
  assessmentComponents?: AssessmentComponent[];
  materials?: MaterialItem[];
  selfStudyGuides?: SelfStudyGuide[];
  facilitiesRequirements?: string;
  status?: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CourseMetaItem {
  id: number | string;
  courseId: number | string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string;
  credits: number;
  theoryCredits?: number;
  practiceCredits?: number;
  selfStudyHours?: number;
  semester?: number;
  structureName?: string;
  departmentName?: string;
  status?: string;
  reviewNote?: string;
}

export interface S5RendererRef {
  validate: () => boolean;
  saveCurrent: () => Promise<boolean>;
}
