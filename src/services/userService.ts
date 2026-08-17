import { apiClient as api } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  employeeId: string;
  faculty: string;
  phone: string;
  roles: string[];
  status: string;
  tokenVersion?: number;
}

export const userService = {
  getAll: async (signal?: AbortSignal): Promise<User[]> => {
    return api.get('/users', { signal });
  },

  getMe: async (signal?: AbortSignal): Promise<User> => {
    return api.get('/users/me', { signal });
  },

  getById: async (id: number | string, signal?: AbortSignal): Promise<User> => {
    return api.get(`/users/${id}`, { signal });
  },

  delete: async (id: number | string): Promise<void> => {
    return api.delete(`/users/${id}`);
  },

  updateStatus: async (id: number | string, status: string): Promise<void> => {
    return api.patch(`/users/${id}/status`, null, { params: { status } });
  },

  create: async (user: Partial<User>): Promise<User> => {
    return api.post('/users', user);
  },

  update: async (id: number | string, user: Partial<User>): Promise<User> => {
    return api.put(`/users/${id}`, user);
  },

  resetPassword: async (id: number | string): Promise<{ tempPassword: string }> => {
    return api.put(`/users/${id}/reset-password`);
  },
};
