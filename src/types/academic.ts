import { Faculty } from '@/services/facultyService';

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Major {
  id: string;
  name: string;
  code: string;
  description?: string;
  facultyId?: string;
  facultyName?: string;
  programCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  majorId: string;
  majorName?: string;
  status: ProgramStatus;
  generalObjective?: string;
  specificObjectives?: string;
  learningOutcomes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramCourse {
  id: string;
  programId: string;
  courseId: string;
  semester?: number;
  isRequired: boolean;
  courseName?: string;
  courseCode?: string;
  credits?: number;
}
