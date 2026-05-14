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
    const response = await apiClient.get('/workflow-definitions');
    return response;
  },

  getByType: async (type: string): Promise<WorkflowStepDefinitionResponse[]> => {
    const response = await apiClient.get(`/workflow-definitions/type/${type}`);
    return response;
  }
};
