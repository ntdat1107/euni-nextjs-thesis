import { apiClient as api } from './api';

export type SurveyQuestionType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'LIKERT_SCALE';

export type SurveyFormStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'CLOSED';

export interface SurveyOption {
  id?: number;
  content: string;
  orderIndex: number;
}

export interface SurveyQuestion {
  id?: number;
  sectionId?: number | null;
  content: string;
  helpText?: string;
  questionType: SurveyQuestionType;
  required: boolean;
  orderIndex: number;
  minRating?: number;
  maxRating?: number;
  options?: SurveyOption[];
}

export interface SurveySection {
  id?: number;
  title: string;
  description?: string;
  orderIndex: number;
  questions?: SurveyQuestion[];
}

export interface SurveyForm {
  id: number;
  campaignStepId?: number;
  programId: number;
  programCode?: string;
  programName?: string;
  title: string;
  description?: string;
  targetAudience?: string;
  publicSlug?: string;
  publicUrl?: string;
  status: SurveyFormStatus;
  version: number;
  isCurrent: boolean;
  previousVersionId?: number;
  anonymous: boolean;
  startDate?: string;
  endDate?: string;
  totalSubmissions: number;
  sections: SurveySection[];
  directQuestions: SurveyQuestion[];
}

export interface SurveyFormVersionItem {
  id: number;
  campaignStepId: number;
  version: number;
  status: SurveyFormStatus;
  title: string;
  publicSlug?: string;
  totalSubmissions: number;
  isCurrent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SurveyFormSaveRequest {
  title: string;
  description?: string;
  targetAudience?: string;
  anonymous?: boolean;
  startDate?: string;
  endDate?: string;
  sections: SurveySection[];
  directQuestions?: SurveyQuestion[];
}

export interface SurveySubmissionAnswer {
  questionId: number;
  textValue?: string;
  numericValue?: number;
  selectedOptions?: string[];
}

export interface SurveySubmissionRequest {
  respondentName?: string;
  respondentEmail?: string;
  respondentPhone?: string;
  organization?: string;
  position?: string;
  answers: SurveySubmissionAnswer[];
}

export interface SurveySubmissionItem {
  id: number;
  formId: number;
  respondentName?: string;
  respondentEmail?: string;
  respondentPhone?: string;
  organization?: string;
  position?: string;
  submittedAt: string;
  answers: {
    id: number;
    questionId: number;
    questionContent: string;
    questionType: string;
    textValue?: string;
    numericValue?: number;
    selectedOptions?: string[];
  }[];
}

export interface QuestionStat {
  questionId: number;
  content: string;
  questionType: string;
  averageScore?: number;
  optionDistribution?: Record<string, number>;
  textSamples?: string[];
}

export interface SurveySummary {
  formId: number;
  formTitle: string;
  totalSubmissions: number;
  publicSlug?: string;
  publicUrl?: string;
  status: string;
  questionStats: QuestionStat[];
}

export const surveyFormService = {
  getFormByStep: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.get(`/v1/survey-forms/step/${stepId}`);
  },

  saveForm: async (stepId: number | string, data: SurveyFormSaveRequest): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}`, data);
  },

  submitReview: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/submit-review`);
  },

  approveDesign: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/approve-design`);
  },

  recallSubmission: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/recall`);
  },

  rejectDesign: async (stepId: number | string, reason?: string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/reject-design`, { reason: reason || '' });
  },

  publishForm: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/publish`);
  },

  requestRevision: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/request-revision`);
  },

  closeForm: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/close`);
  },

  getFormVersions: async (stepId: number | string): Promise<SurveyFormVersionItem[]> => {
    return await api.get(`/v1/survey-forms/step/${stepId}/versions`);
  },

  getFormById: async (formId: number | string): Promise<SurveyForm> => {
    return await api.get(`/v1/survey-forms/version/${formId}`);
  },

  getSubmissions: async (stepId: number | string): Promise<SurveySubmissionItem[]> => {
    return await api.get(`/v1/survey-forms/step/${stepId}/submissions`);
  },

  getSubmissionsByFormId: async (formId: number | string): Promise<SurveySubmissionItem[]> => {
    return await api.get(`/v1/survey-forms/version/${formId}/submissions`);
  },

  getSummary: async (stepId: number | string): Promise<SurveySummary> => {
    return await api.get(`/v1/survey-forms/step/${stepId}/summary`);
  },

  getSummaryByFormId: async (formId: number | string): Promise<SurveySummary> => {
    return await api.get(`/v1/survey-forms/version/${formId}/summary`);
  },

  // Public APIs for anonymous respondents
  getPublicForm: async (slug: string): Promise<SurveyForm> => {
    return await api.get(`/v1/public/surveys/${slug}`);
  },

  submitPublicSurvey: async (slug: string, data: SurveySubmissionRequest): Promise<Record<string, unknown>> => {
    return await api.post(`/v1/public/surveys/${slug}/submit`, data);
  },
};
