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
  programId: number | string;
  workflowTemplateId: number | string;
  startDate: string;
  endDate: string;
  steps: SurveyCampaignStepRequest[];
}

export interface SurveyCampaignStepResponse {
  id: number;
  stepIndex: number;
  stepName: string;
  deadline?: string;
  requiredDocuments: string;
  configuration: string; // JSON string from backend
  status: string;
  resultData?: string; // JSON string from backend
}

export interface SurveyCampaignCourseMeta {
  id: number;
  stepId?: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  status: string;
}

export interface SurveyCampaignCourseDetail {
  id: number;
  campaignId: number;
  stepId?: number;
  courseId: number;
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
  id: number;
  code: string;
  name: string;
  description?: string;
  programId: number;
  programName?: string;
  program?: any;
  workflowTemplateId: number;
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

  getById: async (id: number | string, signal?: AbortSignal): Promise<SurveyCampaignResponse> => {
    return api.get(`/survey/campaigns/${id}`, { signal });
  },

  getCourseDetail: async (campaignId: number | string, courseId: number | string, stepId?: number | string): Promise<SurveyCampaignCourseDetail> => {
    const url = stepId 
      ? `/survey/campaigns/${campaignId}/courses/${courseId}?stepId=${stepId}`
      : `/survey/campaigns/${campaignId}/courses/${courseId}`;
    return api.get(url);
  },

  saveCourseDetail: async (campaignId: number | string, courseId: number | string, syllabusData: any, status?: string, stepId?: number | string): Promise<SurveyCampaignCourseDetail> => {
    return api.post(`/survey/campaigns/${campaignId}/courses/${courseId}/save`, { 
      syllabusData: typeof syllabusData === 'string' ? syllabusData : JSON.stringify(syllabusData),
      status: status || 'COMPLETED',
      stepId: stepId
    });
  },

  create: async (data: SurveyCampaignRequest): Promise<SurveyCampaignResponse> => {
    return api.post('/survey/campaigns', data);
  },

  update: async (id: number | string, data: SurveyCampaignRequest): Promise<SurveyCampaignResponse> => {
    return api.put(`/survey/campaigns/${id}`, data);
  },

  delete: async (id: number | string): Promise<void> => {
    return api.delete(`/survey/campaigns/${id}`);
  },
  
  checkCode: async (code: string): Promise<boolean> => {
    return api.get(`/survey/campaigns/check-code?code=${code}`);
  },

  saveStepData: async (campaignId: number | string, stepId: number | string, resultData: any, status?: string, reviewNote?: string): Promise<SurveyCampaignStepResponse> => {
    return api.post(`/survey/campaigns/${campaignId}/steps/${stepId}/save`, { 
      resultData: typeof resultData === 'string' ? resultData : JSON.stringify(resultData),
      status: status || 'COMPLETED',
      reviewNote: reviewNote
    });
  },

  approve: async (id: number | string): Promise<void> => {
    return api.post(`/survey/campaigns/${id}/approve`);
  },

  cancel: async (id: number | string): Promise<SurveyCampaignResponse> => {
    // TODO: RBAC Permission Check (PERM_SURVEY_CAMPAIGN_CANCEL)
    return api.post(`/survey/campaigns/${id}/cancel`);
  }
};
