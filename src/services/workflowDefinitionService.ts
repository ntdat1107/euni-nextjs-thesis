import { apiClient } from './api';

export interface WorkflowStepDefinitionResponse {
  id: string;
  workflowType: string;
  stepCode: string;
  stepName: string;
  type: string;
  requiredDocuments: string[];
}

export const workflowDefinitionService = {
  getAll: async (): Promise<WorkflowStepDefinitionResponse[]> => {
    return apiClient.get('/workflow-definitions');
  },

  getByType: async (type: string): Promise<WorkflowStepDefinitionResponse[]> => {
    return apiClient.get(`/workflow-definitions/type/${type}`);
  }
};
