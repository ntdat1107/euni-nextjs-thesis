import { apiClient } from './api';

export type AiProvider = 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'DEEPSEEK' | 'CUSTOM';

export interface UserAiCredential {
  id: number;
  provider: AiProvider;
  keyAlias: string;
  maskedKey: string;
  baseUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserAiCredentialRequest {
  provider: AiProvider;
  keyAlias: string;
  apiKey?: string;
  baseUrl?: string;
  active?: boolean;
}

export interface TestConnectionRequest {
  provider?: AiProvider;
  apiKey?: string;
  credentialId?: number;
  baseUrl?: string;
  modelName?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latencyMs?: number;
  availableModels?: string[];
}

export interface UserAiModelConfig {
  id: number;
  credentialId?: number;
  credentialAlias?: string;
  provider?: AiProvider;
  taskType: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  active: boolean;
}

export interface UserAiModelConfigRequest {
  credentialId?: number;
  taskType: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  active?: boolean;
}

export const userAiService = {
  getCredentials: async (): Promise<UserAiCredential[]> => {
    return apiClient.get('/v1/user/ai-credentials');
  },

  createCredential: async (payload: UserAiCredentialRequest): Promise<UserAiCredential> => {
    return apiClient.post('/v1/user/ai-credentials', payload);
  },

  updateCredential: async (id: number, payload: UserAiCredentialRequest): Promise<UserAiCredential> => {
    return apiClient.put(`/v1/user/ai-credentials/${id}`, payload);
  },

  deleteCredential: async (id: number): Promise<void> => {
    return apiClient.delete(`/v1/user/ai-credentials/${id}`);
  },

  testConnection: async (payload: TestConnectionRequest): Promise<TestConnectionResponse> => {
    return apiClient.post('/v1/user/ai-credentials/test', payload);
  },

  getModelConfigs: async (): Promise<UserAiModelConfig[]> => {
    return apiClient.get('/v1/user/ai-model-configs');
  },

  saveModelConfig: async (payload: UserAiModelConfigRequest): Promise<UserAiModelConfig> => {
    return apiClient.post('/v1/user/ai-model-configs', payload);
  },

  deleteModelConfig: async (id: number): Promise<void> => {
    return apiClient.delete(`/v1/user/ai-model-configs/${id}`);
  },
};
