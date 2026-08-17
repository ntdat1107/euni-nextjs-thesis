import { apiClient as api } from './api';
import { Program } from '@/types/academic';

export const programService = {
  getAll: async (signal?: AbortSignal): Promise<Program[]> => {
    return api.get('/programs', { signal });
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
  
  assignCourses: async (id: number | string, courseIds: (number | string)[]): Promise<void> => {
    return api.post(`/programs/${id}/courses`, { courseIds });
  },

  getCourses: async (id: number | string): Promise<(number | string)[]> => {
    return api.get(`/programs/${id}/courses`);
  },

  getCoursesDetail: async (id: number | string): Promise<any[]> => {
    return api.get(`/programs/${id}/courses/detail`);
  }
};
