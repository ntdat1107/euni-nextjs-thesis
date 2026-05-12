import { apiClient as api } from './api';

export interface WorkflowTemplateRequest {
  code: string;
  name: string;
  description?: string;
  status?: string;
  xmlContent: string;
}

export interface WorkflowTemplateResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  xmlContent: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasDraft?: boolean;
}

export interface WorkflowDraftResponse {
  id: string;
  templateId?: string;
  code: string;
  name: string;
  description?: string;
  status?: string;
  xmlContent: string;
  lastSavedAt: string;
}

const workflowService = {
  getAll: async (signal?: AbortSignal): Promise<WorkflowTemplateResponse[]> => {
    return api.get('/workflow-templates', { signal });
  },

  getById: async (id: string, signal?: AbortSignal): Promise<WorkflowTemplateResponse> => {
    return api.get(`/workflow-templates/${id}`, { signal });
  },

  saveOfficial: async (data: WorkflowTemplateRequest, signal?: AbortSignal): Promise<WorkflowTemplateResponse> => {
    return api.post('/workflow-templates/save-official', data, { signal });
  },

  syncDraft: async (data: WorkflowTemplateRequest, signal?: AbortSignal): Promise<WorkflowDraftResponse> => {
    return api.post('/workflow-templates/sync-draft', data, { signal });
  },

  getDraftByCode: async (code: string, signal?: AbortSignal): Promise<WorkflowDraftResponse | null> => {
    try {
      return await api.get(`/workflow-templates/draft/${code}`, { signal });
    } catch (error) {
      // Return null if no draft found (404 or other errors)
      return null;
    }
  },
  
  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<WorkflowTemplateResponse> => {
    return api.patch(`/workflow-templates/${id}/status`, { status });
  },

  getHistory: async (id: string, signal?: AbortSignal): Promise<WorkflowTemplateResponse[]> => {
    return api.get(`/workflow-templates/${id}/history`, { signal });
  }
};

export default workflowService;
