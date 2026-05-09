import { apiClient } from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

export const departmentService = {
  getAll: () => apiClient.get<any, Department[]>('/departments'),
};
