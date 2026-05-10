import { apiClient as api } from './api';
import { Course } from '@/types/academic';

export const courseService = {
  getAll: async (signal?: AbortSignal): Promise<Course[]> => {
    return api.get('/courses', { signal });
  },

  create: async (data: Partial<Course>): Promise<Course> => {
    return api.post('/courses', data);
  },

  update: async (id: string, data: Partial<Course>): Promise<Course> => {
    return api.put(`/courses/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/courses/${id}`);
  }
};
