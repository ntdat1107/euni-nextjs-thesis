import { apiClient as api } from './api';

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description: string;
}

export const facultyService = {
  getAll: async (signal?: AbortSignal): Promise<Faculty[]> => {
    return api.get('/faculties', { signal });
  },

  createFaculty: async (data: Faculty): Promise<Faculty> => {
    return api.post('/faculties', data);
  },

  updateFaculty: async (id: number | string, data: Faculty): Promise<Faculty> => {
    return api.put(`/faculties/${id}`, data);
  },

  deleteFaculty: async (id: number | string): Promise<void> => {
    return api.delete(`/faculties/${id}`);
  }
};
