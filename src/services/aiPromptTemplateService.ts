import { apiClient } from './api';

export interface AiPromptTemplate {
  id: number;
  code: string;
  name: string;
  description?: string;
  templateContent: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiPromptTemplateRequest {
  code: string;
  name: string;
  description?: string;
  templateContent: string;
  active?: boolean;
}

export const aiPromptTemplateService = {
  getAll: async (): Promise<AiPromptTemplate[]> => {
    return apiClient.get('/v1/ai/prompt-templates');
  },

  getById: async (id: number): Promise<AiPromptTemplate> => {
    return apiClient.get(`/v1/ai/prompt-templates/${id}`);
  },

  getByCode: async (code: string): Promise<AiPromptTemplate> => {
    return apiClient.get(`/v1/ai/prompt-templates/code/${code}`);
  },

  create: async (payload: AiPromptTemplateRequest): Promise<AiPromptTemplate> => {
    return apiClient.post('/v1/ai/prompt-templates', payload);
  },

  update: async (id: number, payload: AiPromptTemplateRequest): Promise<AiPromptTemplate> => {
    return apiClient.put(`/v1/ai/prompt-templates/${id}`, payload);
  },

  toggleActive: async (id: number): Promise<AiPromptTemplate> => {
    return apiClient.patch(`/v1/ai/prompt-templates/${id}/toggle-active`);
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.delete(`/v1/ai/prompt-templates/${id}`);
  },
};
