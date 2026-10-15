import { apiClient as api } from './api';
import { Department } from '@/types/academic';

export const departmentService = {
  getAll: async (facultyId?: number | string, signal?: AbortSignal): Promise<Department[]> => {
    const url = facultyId ? `/departments?facultyId=${facultyId}` : '/departments';
    return api.get(url, { signal });
  },

  create: async (data: Partial<Department>): Promise<Department> => {
    return api.post('/departments', data);
  },

  update: async (id: number | string, data: Partial<Department>): Promise<Department> => {
    return api.put(`/departments/${id}`, data);
  },

  delete: async (id: number | string): Promise<void> => {
    return api.delete(`/departments/${id}`);
  }
};
