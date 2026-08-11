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

export interface SurveyCampaignCourseMeta {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  status: string;
}

export interface SurveyCampaignCourseDetail {
  id: string;
  campaignId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  status: string;
  syllabusData?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SurveyCampaignResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  programId: string;
  programName?: string;
  program?: any;
  workflowTemplateId: string;
  workflowTemplateName?: string;
  workflowTemplate?: any;
  startDate: string;
  endDate: string;
  status: string;
  courses?: SurveyCampaignCourseMeta[];
  steps: SurveyCampaignStepResponse[];
}

export const surveyCampaignService = {
  getAll: async (signal?: AbortSignal): Promise<SurveyCampaignResponse[]> => {
    return api.get('/survey/campaigns', { signal });
  },

  getById: async (id: string, signal?: AbortSignal): Promise<SurveyCampaignResponse> => {
    return api.get(`/survey/campaigns/${id}`, { signal });
  },

  getCourseDetail: async (campaignId: string, courseId: string): Promise<SurveyCampaignCourseDetail> => {
    return api.get(`/survey/campaigns/${campaignId}/courses/${courseId}`);
  },

  saveCourseDetail: async (campaignId: string, courseId: string, syllabusData: any, status?: string): Promise<SurveyCampaignCourseDetail> => {
    return api.post(`/survey/campaigns/${campaignId}/courses/${courseId}/save`, { 
      syllabusData: typeof syllabusData === 'string' ? syllabusData : JSON.stringify(syllabusData),
      status: status || 'COMPLETED'
    });
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
  },

  cancel: async (id: string): Promise<SurveyCampaignResponse> => {
    // TODO: RBAC Permission Check (PERM_SURVEY_CAMPAIGN_CANCEL)
    return api.post(`/survey/campaigns/${id}/cancel`);
  }
};
