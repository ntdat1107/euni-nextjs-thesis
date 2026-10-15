import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import {
  aiPromptTemplateService,
  AiPromptTemplate,
  AiPromptTemplateRequest,
} from '@/services/aiPromptTemplateService';

export function useAiPromptTemplates() {
  const [templates, setTemplates] = useState<AiPromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { message } = App.useApp();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await aiPromptTemplateService.getAll();
      setTemplates(data || []);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách AI Prompt Templates');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (payload: AiPromptTemplateRequest) => {
    try {
      const created = await aiPromptTemplateService.create(payload);
      message.success(`Tạo mới mẫu Prompt '${created.code}' thành công!`);
      await fetchTemplates();
      return created;
    } catch (error: any) {
      message.error(error.message || 'Không thể tạo mới mẫu Prompt');
      throw error;
    }
  };

  const updateTemplate = async (id: number, payload: AiPromptTemplateRequest) => {
    try {
      const updated = await aiPromptTemplateService.update(id, payload);
      message.success(`Cập nhật mẫu Prompt '${updated.code}' thành công!`);
      await fetchTemplates();
      return updated;
    } catch (error: any) {
      message.error(error.message || 'Không thể cập nhật mẫu Prompt');
      throw error;
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const updated = await aiPromptTemplateService.toggleActive(id);
      message.success(
        `Đã ${updated.active ? 'kích hoạt' : 'tắt'} mẫu Prompt '${updated.code}'`
      );
      await fetchTemplates();
      return updated;
    } catch (error: any) {
      message.error(error.message || 'Không thể thay đổi trạng thái mẫu Prompt');
      throw error;
    }
  };

  const deleteTemplate = async (id: number) => {
    try {
      await aiPromptTemplateService.delete(id);
      message.success('Đã xóa mẫu Prompt thành công');
      await fetchTemplates();
    } catch (error: any) {
      message.error(error.message || 'Không thể xóa mẫu Prompt');
      throw error;
    }
  };

  return {
    templates,
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    toggleActive,
    deleteTemplate,
  };
}
