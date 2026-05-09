import { apiClient as api } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  employeeId: string;
  department: string;
  phone: string;
  roles: string[];
  status: string;
}

export const userService = {
  getAll: async (signal?: AbortSignal): Promise<User[]> => {
    return api.get('/users', { signal });
  },

  getById: async (id: string, signal?: AbortSignal): Promise<User> => {
    return api.get(`/users/${id}`, { signal });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/users/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    return api.patch(`/users/${id}/status`, null, { params: { status } });
  },

  create: async (user: Partial<User>): Promise<User> => {
    return api.post('/users', user);
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    return api.put(`/users/${id}`, user);
  },

  resetPassword: async (id: string): Promise<{ tempPassword: string }> => {
    return api.put(`/users/${id}/reset-password`);
  },
};
