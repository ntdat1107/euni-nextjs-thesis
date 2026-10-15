import { apiClient as api } from './api';

export type SurveyQuestionType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'LIKERT_SCALE';

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
  publicSlug: string;
  publicUrl: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  anonymous: boolean;
  startDate?: string;
  endDate?: string;
  totalSubmissions: number;
  sections: SurveySection[];
  directQuestions: SurveyQuestion[];
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
  publicSlug: string;
  publicUrl: string;
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

  publishForm: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/publish`);
  },

  closeForm: async (stepId: number | string): Promise<SurveyForm> => {
    return await api.post(`/v1/survey-forms/step/${stepId}/close`);
  },

  getSubmissions: async (stepId: number | string): Promise<SurveySubmissionItem[]> => {
    return await api.get(`/v1/survey-forms/step/${stepId}/submissions`);
  },

  getSummary: async (stepId: number | string): Promise<SurveySummary> => {
    return await api.get(`/v1/survey-forms/step/${stepId}/summary`);
  },

  // Public APIs for anonymous respondents
  getPublicForm: async (slug: string): Promise<SurveyForm> => {
    return await api.get(`/v1/public/surveys/${slug}`);
  },

  submitPublicSurvey: async (slug: string, data: SurveySubmissionRequest): Promise<Record<string, unknown>> => {
    return await api.post(`/v1/public/surveys/${slug}/submit`, data);
  },
};
