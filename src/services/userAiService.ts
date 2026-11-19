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

// In-flight & micro-cache to avoid duplicated API calls across components
let inFlightCredentials: Promise<UserAiCredential[]> | null = null;
let inFlightModelConfigs: Promise<UserAiModelConfig[]> | null = null;
const modelsCache = new Map<string, { promise: Promise<string[]>; time: number }>();

const clearAiDataCache = () => {
  inFlightCredentials = null;
  inFlightModelConfigs = null;
};

export const userAiService = {
  getCredentials: async (force = false): Promise<UserAiCredential[]> => {
    if (force || !inFlightCredentials) {
      inFlightCredentials = (apiClient.get('/v1/user/ai-credentials') as Promise<UserAiCredential[]>)
        .finally(() => {
          // Clear after 3 seconds so subsequent fresh actions can refetch, but concurrent calls share the same promise
          setTimeout(() => { inFlightCredentials = null; }, 3000);
        });
    }
    return inFlightCredentials;
  },

  createCredential: async (payload: UserAiCredentialRequest): Promise<UserAiCredential> => {
    clearAiDataCache();
    modelsCache.clear();
    return apiClient.post('/v1/user/ai-credentials', payload);
  },

  updateCredential: async (id: number, payload: UserAiCredentialRequest): Promise<UserAiCredential> => {
    clearAiDataCache();
    modelsCache.clear();
    return apiClient.put(`/v1/user/ai-credentials/${id}`, payload);
  },

  deleteCredential: async (id: number): Promise<void> => {
    clearAiDataCache();
    modelsCache.clear();
    return apiClient.delete(`/v1/user/ai-credentials/${id}`);
  },

  testConnection: async (payload: TestConnectionRequest): Promise<TestConnectionResponse> => {
    return apiClient.post('/v1/user/ai-credentials/test', payload);
  },

  getAvailableModels: async (credentialId: number, refresh = false): Promise<string[]> => {
    const cacheKey = `cred:${credentialId}`;
    const now = Date.now();
    const existing = modelsCache.get(cacheKey);

    if (!refresh && existing && (now - existing.time < 30000)) {
      return existing.promise;
    }

    const promise = apiClient.get(`/v1/user/ai-credentials/${credentialId}/models`, {
      params: refresh ? { refresh: true } : undefined,
    }) as Promise<string[]>;

    modelsCache.set(cacheKey, { promise, time: now });
    return promise;
  },

  getAvailableModelsByProvider: async (provider: AiProvider, refresh = false): Promise<string[]> => {
    const cacheKey = `prov:${provider}`;
    const now = Date.now();
    const existing = modelsCache.get(cacheKey);

    if (!refresh && existing && (now - existing.time < 30000)) {
      return existing.promise;
    }

    const promise = apiClient.get('/v1/user/ai-credentials/models-by-provider', {
      params: refresh ? { provider, refresh: true } : { provider },
    }) as Promise<string[]>;

    modelsCache.set(cacheKey, { promise, time: now });
    return promise;
  },

  getModelConfigs: async (force = false): Promise<UserAiModelConfig[]> => {
    if (force || !inFlightModelConfigs) {
      inFlightModelConfigs = (apiClient.get('/v1/user/ai-model-configs') as Promise<UserAiModelConfig[]>)
        .finally(() => {
          setTimeout(() => { inFlightModelConfigs = null; }, 3000);
        });
    }
    return inFlightModelConfigs;
  },

  saveModelConfig: async (payload: UserAiModelConfigRequest): Promise<UserAiModelConfig> => {
    clearAiDataCache();
    return apiClient.post('/v1/user/ai-model-configs', payload);
  },

  deleteModelConfig: async (id: number): Promise<void> => {
    clearAiDataCache();
    return apiClient.delete(`/v1/user/ai-model-configs/${id}`);
  },
};
