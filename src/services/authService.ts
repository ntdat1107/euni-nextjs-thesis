import { apiClient as api } from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  fullName: string;
  roles: string[];
  tokenVersion: number;
}

export const authService = {
  login: async (credentials: any, signal?: AbortSignal): Promise<LoginResponse> => {
    return api.post('/auth/login', credentials, { signal });
  },

  logout: () => {
    localStorage.removeItem('euni_access_token');
    localStorage.removeItem('euni_refresh_token');
    localStorage.removeItem('euni_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  changePassword: async (data: { currentPassword?: string; oldPassword?: string; newPassword?: string }): Promise<void> => {
    return api.put('/users/change-password', {
      oldPassword: data.oldPassword || data.currentPassword,
      newPassword: data.newPassword,
    });
  }
};
