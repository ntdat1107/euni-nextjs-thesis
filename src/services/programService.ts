import { apiClient as api } from './api';
import {
  Program,
  ProgramStructure,
  ProgramElectiveGroup,
  ProgramObeMatrixData
} from '@/types/academic';

export const programService = {
  getAll: async (signal?: AbortSignal): Promise<Program[]> => {
    return api.get('/programs', { signal });
  },

  getById: async (id: number | string, signal?: AbortSignal): Promise<Program> => {
    return api.get(`/programs/${id}`, { signal });
  },

  create: async (data: Partial<Program>): Promise<Program> => {
    return api.post('/programs', data);
  },

  update: async (id: number | string, data: Partial<Program>): Promise<Program> => {
    return api.put(`/programs/${id}`, data);
  },

  delete: async (id: number | string): Promise<void> => {
    return api.delete(`/programs/${id}`);
  },
  
  assignCourses: async (id: number | string, payload: (number | string)[] | { courseIds?: (number | string)[]; items?: any[] }): Promise<void> => {
    const data = Array.isArray(payload) ? { courseIds: payload } : payload;
    return api.post(`/programs/${id}/courses`, data);
  },

  getCourses: async (id: number | string): Promise<(number | string)[]> => {
    return api.get(`/programs/${id}/courses`);
  },

  getCoursesDetail: async (id: number | string): Promise<any[]> => {
    return api.get(`/programs/${id}/courses/detail`);
  },

  // Structures (Cây khối kiến thức)
  getStructures: async (id: number | string): Promise<ProgramStructure[]> => {
    return api.get(`/programs/${id}/structures`);
  },

  createStructure: async (id: number | string, data: { parentId?: number | null; code: string; name: string; creditRequired: number; orderIndex?: number }): Promise<ProgramStructure> => {
    return api.post(`/programs/${id}/structures`, data);
  },

  updateStructure: async (structureId: number | string, data: { parentId?: number | null; code: string; name: string; creditRequired: number; orderIndex?: number }): Promise<ProgramStructure> => {
    return api.put(`/programs/structures/${structureId}`, data);
  },

  deleteStructure: async (structureId: number | string): Promise<void> => {
    return api.delete(`/programs/structures/${structureId}`);
  },

  reorderStructures: async (programId: number | string, orderedIds: (number | string)[]): Promise<void> => {
    return api.put(`/programs/${programId}/structures/reorder`, orderedIds);
  },

  addElectiveGroup: async (structureId: number | string, data: { name: string; minCredits: number; minCourses: number }): Promise<ProgramElectiveGroup> => {
    return api.post(`/programs/structures/${structureId}/elective-groups`, data);
  },

  updateElectiveGroup: async (groupId: number | string, data: { name: string; minCredits: number; minCourses: number }): Promise<ProgramElectiveGroup> => {
    return api.put(`/programs/structures/elective-groups/${groupId}`, data);
  },

  deleteElectiveGroup: async (groupId: number | string): Promise<void> => {
    return api.delete(`/programs/structures/elective-groups/${groupId}`);
  },

  // OBE & Course Matrix
  getObeMatrix: async (id: number | string): Promise<ProgramObeMatrixData> => {
    return api.get(`/programs/${id}/obe`);
  },

  updateCoursePiMatrix: async (id: number | string, payload: { programCourseId: number; mappings: { piId: number; level: number | null }[] }): Promise<void> => {
    return api.put(`/programs/${id}/obe/course-matrix`, payload);
  },

  batchUpdateCoursePiMatrix: async (id: number | string, payload: { programCourseId: number; mappings: { piId: number; level: number | null }[] }[]): Promise<void> => {
    return api.put(`/programs/${id}/obe/course-matrix/batch`, payload);
  },

  autoDeriveMatrix: async (id: number | string): Promise<ProgramObeMatrixData> => {
    return api.post(`/programs/${id}/obe/auto-derive`);
  }
};
