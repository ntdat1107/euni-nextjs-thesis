import { apiClient } from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  fullName: string;
  roles: string[];
}

export const authService = {
  login: (credentials: any) => 
    apiClient.post<any, LoginResponse>('/auth/login', credentials),
    
  logout: () => {
    localStorage.removeItem('euni_access_token');
    localStorage.removeItem('euni_refresh_token');
    localStorage.removeItem('euni_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};
