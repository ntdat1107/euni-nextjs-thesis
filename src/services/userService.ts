import { apiClient } from './api';

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
  getAll: () => apiClient.get<any, User[]>('/users'),
  
  getById: (id: string) => apiClient.get<any, User>(`/users/${id}`),
  
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  
  updateStatus: (id: string, status: string) => 
    apiClient.patch(`/users/${id}/status`, null, { params: { status } }),
    
  create: (user: Partial<User>) => apiClient.post<any, User>('/users', user),
  
  update: (id: string, user: Partial<User>) => apiClient.put<any, User>(`/users/${id}`, user),
    
  resetPassword: (id: string) => 
    apiClient.put<{ tempPassword: string }>(`/users/${id}/reset-password`),
};
