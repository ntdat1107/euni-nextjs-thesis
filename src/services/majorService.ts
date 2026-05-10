import { apiClient as api } from './api';
import { Major } from '@/types/academic';

export const majorService = {
  getAll: async (signal?: AbortSignal): Promise<Major[]> => {
    return api.get('/majors', { signal });
  },

  create: async (data: Partial<Major>): Promise<Major> => {
    return api.post('/majors', data);
  },

  update: async (id: string, data: Partial<Major>): Promise<Major> => {
    return api.put(`/majors/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/majors/${id}`);
  }
};
