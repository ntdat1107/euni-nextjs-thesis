import { Faculty } from '@/services/facultyService';

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Major {
  id: number;
  name: string;
  code: string;
  description?: string;
  facultyId?: number;
  facultyName?: string;
  programCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  description?: string;
  majorId: number;
  majorName?: string;
  status: ProgramStatus;
  generalObjective?: string;
  specificObjectives?: string;
  learningOutcomes?: string;
  data?: string; // Synced metadata JSON
  hasUncompletedCampaign?: boolean;
  createdAt: string;
  updatedAt: string;
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
  groupName?: string;
  courseName?: string;
  courseCode?: string;
  credits?: number;
  data?: string; // Synced metadata JSON
}
