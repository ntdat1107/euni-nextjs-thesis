import { Faculty } from '@/services/facultyService';

export type ProgramStatus = 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  facultyId?: number;
  facultyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Major {
  id: number;
  name: string;
  code: string;
  description?: string;
  facultyId?: number;
  facultyName?: string;
  departmentId?: number;
  departmentName?: string;
  programCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: number;
  parentId?: number;
  parentCode?: string;
  name: string;
  code: string;
  description?: string;
  majorId: number;
  majorName?: string;
  status: ProgramStatus;
  effectiveYear?: number;
  totalCredits?: number;
  degreeLevel?: string;
  trainingMode?: string;
  generalObjective?: string;
  specificObjectives?: string;
  learningOutcomes?: string;
  data?: string; // Synced metadata JSON
  hasUncompletedCampaign?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramStructure {
  id: number;
  programId: number;
  parentId?: number | null;
  code: string;
  name: string;
  creditRequired: number;
  orderIndex: number;
  calculatedCredits: number;
  children: ProgramStructure[];
  electiveGroups: ProgramElectiveGroup[];
}

export interface ProgramElectiveGroup {
  id: number;
  structureId: number;
  name: string;
  minCredits: number;
  minCourses: number;
}

export interface ProgramObjective {
  id: number;
  code: string;
  content: string;
  orderIndex: number;
}

export type DomainType = 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY' | 'ATTITUDE';
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export interface PerformanceIndicator {
  id: number;
  outcomeId: number;
  outcomeCode: string;
  code: string;
  content: string;
  bloomLevel?: BloomLevel;
  orderIndex: number;
}

export interface ProgramLearningOutcome {
  id: number;
  code: string;
  name?: string;
  content: string;
  domain: DomainType;
  orderIndex: number;
  indicators: PerformanceIndicator[];
}

export interface ObjectivePiMap {
  id: number;
  objectiveId: number;
  objectiveCode: string;
  piId: number;
  piCode: string;
  note?: string;
}

export interface CoursePiCell {
  piId: number;
  level: number; // 1, 2, 3
}

export interface CoursePiMatrixRow {
  programCourseId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  semester?: number;
  structureId?: number;
  structureName?: string;
  cells: CoursePiCell[];
}

export interface ProgramObeMatrixData {
  programId: number;
  programCode: string;
  programName: string;
  objectives: ProgramObjective[];
  learningOutcomes: ProgramLearningOutcome[];
  objectivePiMaps: ObjectivePiMap[];
  courseMatrixRows: CoursePiMatrixRow[];
  uncoveredPiCodes: string[];
}

export interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramCourse {
  id: number;
  programId: number;
  courseId: number;
  semester?: number;
  isRequired?: boolean;
  required?: boolean;
  structureId?: number;
  structureName?: string;
  electiveGroupId?: number;
  electiveGroupName?: string;
  groupName?: string;
  courseName?: string;
  courseCode?: string;
  credits?: number;
  data?: string; // Synced metadata JSON
}
