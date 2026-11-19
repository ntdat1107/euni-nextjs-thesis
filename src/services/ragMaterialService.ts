import { apiClient } from './api';

export interface RagMaterialRecommendRequest {
  courseName?: string;
  courseDescription?: string;
  clos?: string[];
  limit?: number;
  majorFilter?: string;
  requireLibraryOnly?: boolean;
  userPrompt?: string;
  modelName?: string;
  credentialId?: number;
}

export interface RagMaterialRecommendResponse {
  id: number;
  bookCode?: string;
  title: string;
  author?: string;
  publisher?: string;
  publishYear?: string;
  shelfCode?: string;
  ddcCode?: string;
  description?: string;
  subjects?: string[];
  suggestedRole: 'main' | 'reference';
  similarityScore?: number;
  relevanceReason?: string;
  libraryLocation?: string;
}

export const ragMaterialService = {
  async recommend(request: RagMaterialRecommendRequest): Promise<RagMaterialRecommendResponse[]> {
    const res = await apiClient.post<unknown>('/v1/rag/materials/recommend', request);
    if (Array.isArray(res)) return res as RagMaterialRecommendResponse[];
    if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as { data: unknown }).data)) {
      return (res as { data: RagMaterialRecommendResponse[] }).data;
    }
    return [];
  },

  async search(query: string, limit = 10): Promise<RagMaterialRecommendResponse[]> {
    const res = await apiClient.get<unknown>('/v1/rag/materials/search', {
      params: { query, limit },
    });
    if (Array.isArray(res)) return res as RagMaterialRecommendResponse[];
    if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as { data: unknown }).data)) {
      return (res as { data: RagMaterialRecommendResponse[] }).data;
    }
    return [];
  },
};
