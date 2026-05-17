import { apiClient as api } from './api';

export interface SurveyCampaignStepRequest {
  stepIndex: number;
  stepName: string;
  deadline?: string;
  requiredDocuments: string[];
  configuration: Record<string, any>;
}

export interface SurveyCampaignRequest {
  code: string;
  name: string;
  description?: string;
  programId: string;
  workflowTemplateId: string;
  startDate: string;
  endDate: string;
  steps: SurveyCampaignStepRequest[];
}

export interface SurveyCampaignStepResponse {
  id: string;
  stepIndex: number;
  stepName: string;
  deadline?: string;
  requiredDocuments: string;
  configuration: string; // JSON string from backend
  status: string;
  resultData?: string; // JSON string from backend
}

export interface SurveyCampaignResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  programId: string;
  programName?: string;
  workflowTemplateId: string;
  workflowTemplateName?: string;
  startDate: string;
  endDate: string;
  status: string;
  steps: SurveyCampaignStepResponse[];
}

export const surveyCampaignService = {
  getAll: async (signal?: AbortSignal): Promise<SurveyCampaignResponse[]> => {
    return api.get('/survey/campaigns', { signal });
  },

  getById: async (id: string, signal?: AbortSignal): Promise<SurveyCampaignResponse> => {
    return api.get(`/survey/campaigns/${id}`, { signal });
  },

  create: async (data: SurveyCampaignRequest): Promise<SurveyCampaignResponse> => {
    return api.post('/survey/campaigns', data);
  },

  update: async (id: string, data: SurveyCampaignRequest): Promise<SurveyCampaignResponse> => {
    return api.put(`/survey/campaigns/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/survey/campaigns/${id}`);
  },
  
  checkCode: async (code: string): Promise<boolean> => {
    return api.get(`/survey/campaigns/check-code?code=${code}`);
  },

  saveStepData: async (campaignId: string, stepId: string, resultData: any): Promise<SurveyCampaignStepResponse> => {
    return api.post(`/survey/campaigns/${campaignId}/steps/${stepId}/save`, { resultData: JSON.stringify(resultData) });
  },

  approve: async (id: string): Promise<void> => {
    return api.post(`/survey/campaigns/${id}/approve`);
  }
};
