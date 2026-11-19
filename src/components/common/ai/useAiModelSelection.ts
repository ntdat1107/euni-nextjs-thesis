import { useState, useEffect, useMemo, useCallback } from 'react';
import { userAiService, UserAiCredential, UserAiModelConfig, AiProvider } from '@/services/userAiService';
import { AI_PROVIDERS_CATALOG } from '@/constants/aiModelsCatalog';
import { DisplayModelInfo } from './types';

const DEFAULT_MODELS_BY_PROVIDER: Record<string, string> = {
  GEMINI: 'gemini-2.5-flash',
  OPENAI: 'gpt-4o-mini',
  ANTHROPIC: 'claude-3-5-sonnet',
  DEEPSEEK: 'deepseek-chat',
};

const isPoPeo = (t?: string) => t === 'PO' || t === 'PEO';
const matchTask = (cfgTask?: string, reqTask?: string) => {
  if (!cfgTask || !reqTask) return false;
  return cfgTask === reqTask || (isPoPeo(cfgTask) && isPoPeo(reqTask));
};

export const inferProviderFromModel = (modelName?: string): AiProvider => {
  if (!modelName) return 'GEMINI';
  const m = modelName.toLowerCase();
  if (m.includes('gemini')) return 'GEMINI';
  if (m.includes('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('chatgpt')) return 'OPENAI';
  if (m.includes('claude')) return 'ANTHROPIC';
  if (m.includes('deepseek')) return 'DEEPSEEK';
  return 'GEMINI';
};

export interface ResolvedDefaultConfig {
  provider: AiProvider;
  modelName: string;
  temperature: number;
  maxTokens: number;
  credentialId?: number;
  keyAlias?: string;
  hasKey: boolean;
}

export const useAiModelSelection = (open: boolean, contentType?: string) => {
  const [credentials, setCredentials] = useState<UserAiCredential[]>([]);
  const [modelConfigs, setModelConfigs] = useState<UserAiModelConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [temperature, setTemperature] = useState<number>(0.5);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchModelsForProvider = useCallback(async (provider: string, credId?: number, refresh = false) => {
    if (!provider) {
      setDynamicModels([]);
      return;
    }
    setLoadingModels(true);
    try {
      if (credId) {
        const list = await userAiService.getAvailableModels(credId, refresh);
        if (list && list.length > 0) {
          setDynamicModels(list);
          return;
        }
      }
      const list = await userAiService.getAvailableModelsByProvider(provider as AiProvider, refresh);
      setDynamicModels(list || []);
    } catch (err) {
      console.warn('[AI Assistant] Lỗi khi lấy model khả dụng:', err);
      setDynamicModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Xác định cấu hình mặc định (nếu đã có cấu hình trong DB)
  const defaultConfig: ResolvedDefaultConfig | null = useMemo(() => {
    const normalized = (contentType || 'DEFAULT').toUpperCase();
    const taskCfg = (modelConfigs || []).find(m => matchTask(m.taskType, normalized) && m.active) ||
                    (modelConfigs || []).find(m => m.taskType === 'DEFAULT' && m.active);

    if (!taskCfg || !taskCfg.modelName || !taskCfg.modelName.trim()) {
      return null;
    }

    let prov: AiProvider = 'GEMINI';
    let keyAlias: string | undefined = undefined;
    let hasKey = true;

    if (taskCfg.credentialId) {
      const matchedCred = credentials.find(c => c.id === taskCfg.credentialId && c.active);
      if (matchedCred) {
        prov = matchedCred.provider;
        keyAlias = matchedCred.keyAlias;
        hasKey = true;
      } else {
        hasKey = false;
      }
    } else if (taskCfg.provider) {
      prov = taskCfg.provider;
      hasKey = prov === 'GEMINI' || credentials.some(c => c.provider === prov && c.active);
    } else {
      prov = inferProviderFromModel(taskCfg.modelName);
      hasKey = prov === 'GEMINI' || credentials.some(c => c.provider === prov && c.active);
    }

    return {
      provider: prov,
      modelName: taskCfg.modelName,
      temperature: taskCfg.temperature ?? 0.5,
      maxTokens: taskCfg.maxTokens ?? 4096,
      credentialId: taskCfg.credentialId,
      keyAlias,
      hasKey,
    };
  }, [modelConfigs, credentials, contentType]);

  const hasDefaultConfig = Boolean(defaultConfig);

  useEffect(() => {
    if (open) {
      let isMounted = true;
      const load = async () => {
        try {
          const [creds, configs] = await Promise.all([
            userAiService.getCredentials(),
            userAiService.getModelConfigs(),
          ]);
          if (!isMounted) return;

          setCredentials(creds || []);
          setModelConfigs(configs || []);

          const normalized = (contentType || 'DEFAULT').toUpperCase();
          const taskCfg = (configs || []).find(m => matchTask(m.taskType, normalized) && m.active) ||
                          (configs || []).find(m => m.taskType === 'DEFAULT' && m.active);

          if (taskCfg && taskCfg.modelName && taskCfg.modelName.trim()) {
            // Đã có mô hình default được cấu hình -> Auto-fill giá trị vào!
            let prov: AiProvider = 'GEMINI';
            if (taskCfg.credentialId) {
              const matchedCred = (creds || []).find(c => c.id === taskCfg.credentialId && c.active);
              if (matchedCred) {
                prov = matchedCred.provider;
              } else if (taskCfg.provider) {
                prov = taskCfg.provider;
              } else {
                prov = inferProviderFromModel(taskCfg.modelName);
              }
            } else if (taskCfg.provider) {
              prov = taskCfg.provider;
            } else {
              prov = inferProviderFromModel(taskCfg.modelName);
            }

            setSelectedProvider(prov);
            setSelectedModel(taskCfg.modelName);
            if (taskCfg.temperature !== undefined) setTemperature(taskCfg.temperature);
            if (taskCfg.maxTokens !== undefined) setMaxTokens(taskCfg.maxTokens);
          } else {
            // Chưa có mô hình mặc định được cấu hình -> Để trống phần mô hình!
            setSelectedProvider('');
            setSelectedModel('');
            setTemperature(0.5);
            setMaxTokens(4096);
          }
        } catch (err) {
          console.warn('[AI Assistant] Load settings error:', err);
        }
      };
      load();

      return () => {
        isMounted = false;
      };
    } else {
      setSelectedProvider('');
      setSelectedModel('');
      setIsCustomizing(false);
      setSaveAsDefault(false);
    }
  }, [open, contentType]);

  const handleProviderChange = useCallback((provider: string) => {
    setSelectedProvider(provider);
    if (!provider) {
      setSelectedModel('');
      return;
    }
    // Nếu chuyển sang provider trùng với default config thì ưu tiên auto-fill model của default
    if (defaultConfig && defaultConfig.provider === provider) {
      setSelectedModel(defaultConfig.modelName);
    } else {
      const defaultForProv = DEFAULT_MODELS_BY_PROVIDER[provider] || AI_PROVIDERS_CATALOG[provider as AiProvider]?.models[0]?.id || '';
      setSelectedModel(defaultForProv);
    }
  }, [defaultConfig]);

  const resetToDefault = useCallback(() => {
    if (defaultConfig) {
      setSelectedProvider(defaultConfig.provider);
      setSelectedModel(defaultConfig.modelName);
      setTemperature(defaultConfig.temperature);
      setMaxTokens(defaultConfig.maxTokens);
    }
  }, [defaultConfig]);

  const currentDisplay: DisplayModelInfo = useMemo(() => {
    if (!selectedModel || !selectedProvider) {
      return {
        isByok: false,
        provider: (selectedProvider as AiProvider) || '',
        modelName: '',
        hasKey: false,
      };
    }

    const prov = selectedProvider as AiProvider;
    const activeCred = credentials.find(c => c.provider === prov && c.active);
    const hasKey = prov === 'GEMINI' || !!activeCred;
    const isByok = !!activeCred;

    return {
      isByok,
      provider: prov,
      modelName: selectedModel,
      keyAlias: activeCred?.keyAlias || (prov === 'GEMINI' ? 'Hệ thống eUni' : undefined),
      hasKey,
    };
  }, [selectedProvider, selectedModel, credentials]);

  const activeCredentialForProvider = useMemo(() => {
    if (!selectedProvider) return undefined;
    return credentials.find(c => c.provider === selectedProvider && c.active);
  }, [selectedProvider, credentials]);

  useEffect(() => {
    if (isCustomizing && selectedProvider) {
      const activeCred = credentials.find(c => c.provider === selectedProvider && c.active);
      fetchModelsForProvider(selectedProvider, activeCred?.id);
    }
  }, [isCustomizing, selectedProvider, credentials, fetchModelsForProvider]);

  return {
    credentials,
    selectedProvider,
    setSelectedProvider: handleProviderChange,
    selectedModel,
    setSelectedModel,
    dynamicModels,
    loadingModels,
    refreshModels: () => fetchModelsForProvider(selectedProvider, activeCredentialForProvider?.id, true),
    isCustomizing,
    setIsCustomizing,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    saveAsDefault,
    setSaveAsDefault,
    hasDefaultConfig,
    defaultConfig,
    resetToDefault,
    currentDisplay,
    activeCredentialForProvider,
  };
};
