import { apiClient as api } from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

export const departmentService = {
  getAll: async (signal?: AbortSignal): Promise<Department[]> => {
    return api.get('/departments', { signal });
  },

  createDepartment: async (data: Department): Promise<Department> => {
    return api.post('/departments', data);
  },

  updateDepartment: async (id: string, data: Department): Promise<Department> => {
    return api.put(`/departments/${id}`, data);
  },

  deleteDepartment: async (id: string): Promise<void> => {
    return api.delete(`/departments/${id}`);
  }
};
