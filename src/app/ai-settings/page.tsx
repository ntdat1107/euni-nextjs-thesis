'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, KeyRound, Cpu, Plus, Trash2, CheckCircle2, XCircle, 
  RefreshCw, Sliders, ShieldCheck, Zap, ArrowRight, Check, Settings2
} from 'lucide-react';
import { 
  Card, Button, Tag, Modal, Form, Input, Select, 
  Switch, Slider, Typography, App, Popconfirm, Space
} from 'antd';
import AppShell from '@/components/layout/AppShell';
import { 
  userAiService, 
  UserAiCredential, 
  UserAiModelConfig, 
  AiProvider 
} from '@/services/userAiService';
import { 
  GoogleGeminiIcon, 
  OpenAiIcon, 
  AnthropicClaudeIcon, 
  DeepSeekIcon, 
  CustomAiIcon, 
  getProviderIcon 
} from '@/components/ai/AiProviderIcons';
import { 
  AI_PROVIDERS_CATALOG, 
  AI_TASK_DEFINITIONS, 
  ModelDetail 
} from '@/constants/aiModelsCatalog';
import { cn } from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;

export default function AiSettingsPage() {
  const { message } = App.useApp();

  const [credentials, setCredentials] = useState<UserAiCredential[]>([]);
  const [modelConfigs, setModelConfigs] = useState<UserAiModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'providers' | 'tasks' | 'params'>('providers');

  // Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<UserAiCredential | null>(null);
  const [savingCred, setSavingCred] = useState(false);
  const [keyForm] = Form.useForm();
  const selectedProvider = Form.useWatch('provider', keyForm);

  // Connection testing state (per provider)
  const [testingProviders, setTestingProviders] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; msg: string; latency?: number }>>({});

  // Model Assignment Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<string>('DEFAULT');
  const [savingTaskModel, setSavingTaskModel] = useState(false);
  const [taskForm] = Form.useForm();
  const selectedTaskProvider = Form.useWatch('selectedProvider', taskForm);

  // Global generation params state (stored with DEFAULT task config)
  const [globalTemperature, setGlobalTemperature] = useState<number>(0.5);
  const [globalMaxTokens, setGlobalMaxTokens] = useState<number>(4096);
  const [savingParams, setSavingParams] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [creds, models] = await Promise.all([
        userAiService.getCredentials(),
        userAiService.getModelConfigs(),
      ]);
      setCredentials(creds || []);
      setModelConfigs(models || []);

      const defaultConfig = (models || []).find(m => m.taskType === 'DEFAULT');
      if (defaultConfig) {
        if (defaultConfig.temperature !== undefined) setGlobalTemperature(defaultConfig.temperature);
        if (defaultConfig.maxTokens !== undefined) setGlobalMaxTokens(defaultConfig.maxTokens);
      }
    } catch (err: any) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map of configured credentials by provider
  const credsByProvider = useMemo(() => {
    const map: Partial<Record<AiProvider, UserAiCredential>> = {};
    credentials.forEach(c => {
      if (c.provider) {
        map[c.provider] = c;
      }
    });
    return map;
  }, [credentials]);

  // Map of configs by task
  const configsByTask = useMemo(() => {
    const map: Record<string, UserAiModelConfig> = {};
    modelConfigs.forEach(m => {
      map[m.taskType] = m;
    });
    return map;
  }, [modelConfigs]);

  const hasAnyActiveKey = useMemo(() => {
    return credentials.some(c => c.active);
  }, [credentials]);

  // Open modal to configure or edit key for a provider
  const handleOpenKeyModal = (provider: AiProvider) => {
    const existing = credsByProvider[provider];
    setEditingCred(existing || null);
    keyForm.resetFields();

    if (existing) {
      keyForm.setFieldsValue({
        provider: existing.provider,
        keyAlias: existing.keyAlias,
        baseUrl: existing.baseUrl,
        active: existing.active,
      });
    } else {
      const catalog = AI_PROVIDERS_CATALOG[provider];
      keyForm.setFieldsValue({
        provider,
        keyAlias: `${catalog.name} Cá Nhân`,
        active: true,
      });
    }
    setIsKeyModalOpen(true);
  };

  const handleSaveCredential = async (values: any) => {
    setSavingCred(true);
    try {
      if (editingCred) {
        await userAiService.updateCredential(editingCred.id, values);
        message.success(`Đã cập nhật API Key cho ${values.provider}`);
      } else {
        await userAiService.createCredential(values);
        message.success(`Đã lưu API Key cho ${values.provider}`);
      }
      setIsKeyModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Không thể lưu API Key');
    } finally {
      setSavingCred(false);
    }
  };

  const handleDeleteCred = async (id: number, providerName: string) => {
    try {
      await userAiService.deleteCredential(id);
      message.success(`Đã xóa API Key của ${providerName}`);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa API Key');
    }
  };

  const handleTestConnection = async (provider: AiProvider, credentialId?: number) => {
    setTestingProviders(prev => ({ ...prev, [provider]: true }));
    try {
      const res = await userAiService.testConnection({
        provider,
        credentialId,
      });
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: res.success,
          msg: res.message,
          latency: res.latencyMs,
        },
      }));
      if (res.success) {
        message.success(`Kết nối ${provider} thành công (${res.latencyMs || 0}ms)`);
      } else {
        message.error(res.message || `Kết nối ${provider} thất bại`);
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          msg: err.message || 'Lỗi kết nối',
        },
      }));
      message.error(err.message || 'Lỗi kiểm tra kết nối');
    } finally {
      setTestingProviders(prev => ({ ...prev, [provider]: false }));
    }
  };

  // Open modal to assign model to a task
  const handleOpenTaskModal = (taskType: string) => {
    setEditingTaskType(taskType);
    taskForm.resetFields();

    const currentConfig = configsByTask[taskType];
    const taskDef = AI_TASK_DEFINITIONS.find(t => t.type === taskType);
    const initialProvider = currentConfig?.provider || taskDef?.recommendedProvider || 'GEMINI';
    const initialModel = currentConfig?.modelName || taskDef?.recommendedModelId || 'gemini-2.0-flash';

    taskForm.setFieldsValue({
      selectedProvider: initialProvider,
      modelName: initialModel,
      temperature: currentConfig?.temperature ?? globalTemperature,
      maxTokens: currentConfig?.maxTokens ?? globalMaxTokens,
      active: currentConfig?.active ?? true,
    });

    setIsTaskModalOpen(true);
  };

  const handleSaveTaskModel = async (values: any) => {
    setSavingTaskModel(true);
    try {
      const targetCred = credsByProvider[values.selectedProvider as AiProvider];

      await userAiService.saveModelConfig({
        taskType: editingTaskType,
        modelName: values.modelName,
        credentialId: targetCred ? targetCred.id : undefined,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        active: values.active,
      });

      message.success('Cập nhật cấu hình mô hình thành công');
      setIsTaskModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingTaskModel(false);
    }
  };

  const handleSaveGlobalParams = async () => {
    setSavingParams(true);
    try {
      const defaultConf = configsByTask['DEFAULT'];
      const targetCred = defaultConf?.credentialId 
        ? defaultConf.credentialId 
        : (credsByProvider['GEMINI']?.id || undefined);

      await userAiService.saveModelConfig({
        taskType: 'DEFAULT',
        modelName: defaultConf?.modelName || 'gemini-2.0-flash',
        credentialId: targetCred,
        temperature: globalTemperature,
        maxTokens: globalMaxTokens,
        active: true,
      });
      message.success('Đã lưu tham số tạo sinh mặc định');
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu tham số');
    } finally {
      setSavingParams(false);
    }
  };

  // Available models for currently selected provider in Task Modal
  const availableModelsForSelectedProvider = useMemo(() => {
    if (!selectedTaskProvider) return [];
    const catalog = AI_PROVIDERS_CATALOG[selectedTaskProvider as AiProvider];
    return catalog?.models || [];
  }, [selectedTaskProvider]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
        
        {/* 1. Breadcrumb (Layout Standard) */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-edu-primary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">Cấu hình AI cá nhân (BYOK)</span>
        </div>

        {/* 2. Header Card (Standard Container Architecture) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-edu-primary via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Title level={3} className="!mb-0 !text-slate-900 font-display">Cấu hình AI Cá nhân (BYOK)</Title>
                {hasAnyActiveKey ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ĐANG DÙNG KEY CÁ NHÂN
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    HỆ THỐNG MẶC ĐỊNH
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                Tự do kết nối khóa API cá nhân, lựa chọn nhà cung cấp và mô hình AI cho từng tác vụ học thuật
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Button 
              icon={<RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />} 
              onClick={fetchData}
              disabled={loading}
              className="rounded-lg h-9 text-xs font-semibold border-slate-200 hover:border-blue-500 hover:text-blue-600 shadow-none flex items-center gap-1.5"
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* 3. Navigation View Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
              activeTab === 'providers' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            Nhà cung cấp & API Key
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
              activeTab === 'tasks' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Cpu className="w-4 h-4 text-violet-600" />
            Mô hình theo Tác vụ ({AI_TASK_DEFINITIONS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
              activeTab === 'params' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
            Tham số tạo sinh
          </button>
        </div>

        {/* 4. Tab 1: AI Provider Cards Grid */}
        {activeTab === 'providers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(Object.keys(AI_PROVIDERS_CATALOG) as AiProvider[]).map((provKey) => {
              const meta = AI_PROVIDERS_CATALOG[provKey];
              const cred = credsByProvider[provKey];
              const isConfigured = !!cred;
              const isActive = cred?.active ?? false;
              const testResult = testResults[provKey];
              const isTesting = testingProviders[provKey] || false;

              return (
                <div
                  key={provKey}
                  className={cn(
                    "bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between relative group hover:shadow-md",
                    isConfigured && isActive
                      ? "border-slate-300 ring-1 ring-slate-200 shadow-sm"
                      : "border-slate-200/90"
                  )}
                >
                  <div>
                    {/* Provider Brand Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center p-2.5 shadow-sm border border-slate-100", meta.accentBg)}>
                          {getProviderIcon(provKey, 24)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                            {meta.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">{meta.company}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      {isConfigured ? (
                        isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Tạm tắt
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Mặc định hệ thống
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {meta.tagline}
                    </p>

                    {/* API Key Status Pill */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Khóa API:</span>
                        {isConfigured ? (
                          <code className="bg-white px-2 py-0.5 rounded text-[11px] font-mono text-slate-800 border border-slate-200 shadow-2xs font-semibold">
                            {cred?.maskedKey || '••••••••'}
                          </code>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Chưa nhập key cá nhân</span>
                        )}
                      </div>

                      {testResult && (
                        <div className={cn(
                          "mt-2.5 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5",
                          testResult.success
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        )}>
                          {testResult.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {testResult.success ? `Sẵn sàng (${testResult.latency || 0}ms)` : testResult.msg}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Supported Models Badges List */}
                    <div className="space-y-1.5 mb-5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Các mô hình sẵn có:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.models.map((mod) => (
                          <div
                            key={mod.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
                          >
                            <span>{mod.id}</span>
                            {mod.badge && (
                              <span className={cn(
                                "text-[9px] px-1 py-0 rounded font-sans font-bold uppercase",
                                mod.badgeType === 'recommend' && "bg-blue-100 text-blue-700",
                                mod.badgeType === 'new' && "bg-emerald-100 text-emerald-700",
                                mod.badgeType === 'reason' && "bg-purple-100 text-purple-700",
                                mod.badgeType === 'fast' && "bg-amber-100 text-amber-800"
                              )}>
                                {mod.badge}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="small"
                        type={isConfigured ? 'default' : 'primary'}
                        onClick={() => handleOpenKeyModal(provKey)}
                        className={cn(
                          "rounded-lg text-xs font-semibold h-8",
                          !isConfigured && "bg-edu-primary hover:bg-blue-700 border-none text-white"
                        )}
                      >
                        {isConfigured ? 'Cập nhật Key' : 'Thêm Key'}
                      </Button>

                      {isConfigured && (
                        <Button
                          size="small"
                          loading={isTesting}
                          onClick={() => handleTestConnection(provKey, cred?.id)}
                          className="rounded-lg text-xs font-semibold h-8 border-slate-200"
                        >
                          Kiểm tra
                        </Button>
                      )}
                    </div>

                    {isConfigured && cred && (
                      <Popconfirm
                        title="Xóa API Key"
                        description={`Hệ thống sẽ chuyển về key mặc định cho ${meta.name}.`}
                        onConfirm={() => handleDeleteCred(cred.id, meta.name)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          className="rounded-lg h-8 px-2"
                        />
                      </Popconfirm>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Tab 2: Task-to-Model Assignment */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-0.5">Phân bổ Mô hình theo từng tác vụ</h3>
                <p className="text-xs text-slate-500 mb-0">
                  Gán từng mô hình AI có thế mạnh phù hợp nhất cho mỗi bước sinh dữ liệu trong đề cương & chuẩn đầu ra
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {AI_TASK_DEFINITIONS.map((task) => {
                const assigned = configsByTask[task.type];
                const activeModelName = assigned?.modelName || task.recommendedModelId;
                const activeProvider = assigned?.provider || task.recommendedProvider;
                const isCustomized = !!assigned;

                return (
                  <div 
                    key={task.type} 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{task.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                          {task.category}
                        </span>
                        {task.type === 'DEFAULT' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Chính
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-0">{task.note}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {getProviderIcon(activeProvider, 18)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {activeModelName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isCustomized ? 'Tùy biến cá nhân' : 'Đề xuất hệ thống'}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="default"
                        size="small"
                        icon={<Settings2 className="w-3.5 h-3.5 text-slate-500" />}
                        onClick={() => handleOpenTaskModal(task.type)}
                        className="rounded-lg h-8 text-xs font-semibold border-slate-200 hover:border-blue-500 hover:text-blue-600"
                      >
                        Đổi mô hình
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Tab 3: Generation Parameters */}
        {activeTab === 'params' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 max-w-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-1">Tham số tạo sinh mặc định</h3>
            <p className="text-xs text-slate-500 mb-6">
              Điều chỉnh mức độ sáng tạo và độ dài tối đa của văn bản phản hồi do AI sinh ra
            </p>

            <div className="space-y-6">
              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nhiệt độ sáng tạo (Temperature): {globalTemperature}
                  </label>
                  <span className="text-xs text-slate-500">
                    {globalTemperature <= 0.3 ? 'Rất chặt chẽ, chính xác' : globalTemperature <= 0.7 ? 'Cân bằng, tự nhiên' : 'Rất sáng tạo, đa dạng'}
                  </span>
                </div>
                <Slider
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  value={globalTemperature}
                  onChange={(val) => setGlobalTemperature(val)}
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>0.0 (Chính xác nhất)</span>
                  <span>0.5 (Khuyên dùng)</span>
                  <span>1.0 (Sáng tạo tối đa)</span>
                </div>
              </div>

              {/* Max Tokens Select */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Giới hạn số token đầu ra (Max Tokens)
                </label>
                <Select
                  value={globalMaxTokens}
                  onChange={(val) => setGlobalMaxTokens(val)}
                  className="w-full h-10"
                  options={[
                    { value: 2048, label: '2,048 tokens (~1,500 từ) - Nhanh gọn' },
                    { value: 4096, label: '4,096 tokens (~3,000 từ) - Chuẩn cho đề cương' },
                    { value: 8192, label: '8,192 tokens (~6,000 từ) - Tài liệu dài' },
                  ]}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="primary"
                  loading={savingParams}
                  onClick={handleSaveGlobalParams}
                  className="bg-edu-primary hover:bg-blue-700 rounded-lg h-9 font-semibold text-xs border-none px-5"
                >
                  Lưu thiết lập tham số
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Configure API Key */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center p-1.5 border border-blue-100">
              {getProviderIcon(selectedProvider, 20)}
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">
                {editingCred ? 'Cập nhật API Key' : 'Thêm API Key cá nhân'}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {selectedProvider ? AI_PROVIDERS_CATALOG[selectedProvider as AiProvider]?.name : ''}
              </span>
            </div>
          </div>
        }
        open={isKeyModalOpen}
        onCancel={() => setIsKeyModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        width={460}
      >
        <Form form={keyForm} layout="vertical" onFinish={handleSaveCredential} className="mt-4">
          <Form.Item name="provider" label="Nhà cung cấp" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(AI_PROVIDERS_CATALOG) as AiProvider[]).map(p => ({
                value: p,
                label: (
                  <div className="flex items-center gap-2">
                    {getProviderIcon(p, 16)}
                    <span>{AI_PROVIDERS_CATALOG[p].name}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="keyAlias" 
            label="Tên nhận diện" 
            rules={[{ required: true, message: 'Vui lòng nhập tên nhận diện' }]}
          >
            <Input placeholder="Ví dụ: Gemini Cá Nhân, OpenAI VIP..." className="h-10 rounded-lg" />
          </Form.Item>

          <Form.Item 
            name="apiKey" 
            label={editingCred ? "Khóa API mới (Để trống nếu giữ nguyên)" : "Khóa API (API Key)"} 
            rules={editingCred ? [] : [{ required: true, message: 'Vui lòng nhập API Key' }]}
          >
            <Input.Password 
              placeholder={selectedProvider ? AI_PROVIDERS_CATALOG[selectedProvider as AiProvider]?.keyPrefix : 'sk-...'} 
              className="h-10 rounded-lg" 
            />
          </Form.Item>

          {(selectedProvider === 'CUSTOM' || selectedProvider === 'DEEPSEEK') && (
            <Form.Item name="baseUrl" label="Custom Base URL (Tùy chọn)">
              <Input placeholder="https://api.deepseek.com/v1 hoặc http://localhost:11434/v1" className="h-10 rounded-lg" />
            </Form.Item>
          )}

          <Form.Item name="active" label="Kích hoạt sử dụng ngay" valuePropName="checked" className="mb-6">
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button onClick={() => setIsKeyModalOpen(false)} className="rounded-lg h-9 text-xs font-semibold">
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={savingCred} 
              className="bg-edu-primary hover:bg-blue-700 rounded-lg h-9 text-xs font-semibold border-none px-4"
            >
              Lưu Khóa API
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Assign Model to Task */}
      <Modal
        title={
          <div className="flex items-center gap-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">
                Gán Mô hình cho Tác vụ
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {AI_TASK_DEFINITIONS.find(t => t.type === editingTaskType)?.name}
              </span>
            </div>
          </div>
        }
        open={isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        width={480}
      >
        <Form form={taskForm} layout="vertical" onFinish={handleSaveTaskModel} className="mt-4">
          <Form.Item name="selectedProvider" label="Nhà cung cấp AI" rules={[{ required: true }]}>
            <Select
              onChange={() => {
                const firstModel = availableModelsForSelectedProvider[0]?.id || '';
                taskForm.setFieldsValue({ modelName: firstModel });
              }}
              options={(Object.keys(AI_PROVIDERS_CATALOG) as AiProvider[]).map(p => ({
                value: p,
                label: (
                  <div className="flex items-center gap-2">
                    {getProviderIcon(p, 16)}
                    <span>{AI_PROVIDERS_CATALOG[p].name}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="modelName" 
            label="Mô hình AI (Model)" 
            rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập tên mô hình' }]}
          >
            <Select
              showSearch
              placeholder="Chọn mô hình phù hợp"
              options={availableModelsForSelectedProvider.map(m => ({
                value: m.id,
                label: (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{m.id}</span>
                    {m.badge && (
                      <span className="text-[10px] text-slate-500 font-sans ml-2">({m.badge})</span>
                    )}
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="temperature" label="Nhiệt độ (0.0 - 1.0)">
              <Select options={[
                { value: 0.2, label: '0.2 - Chặt chẽ' },
                { value: 0.5, label: '0.5 - Chuẩn' },
                { value: 0.8, label: '0.8 - Sáng tạo' },
              ]} />
            </Form.Item>

            <Form.Item name="maxTokens" label="Độ dài tối đa">
              <Select options={[
                { value: 2048, label: '2,048 tokens' },
                { value: 4096, label: '4,096 tokens' },
                { value: 8192, label: '8,192 tokens' },
              ]} />
            </Form.Item>
          </div>

          <Form.Item name="active" label="Kích hoạt cho tác vụ này" valuePropName="checked" className="mb-6">
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button onClick={() => setIsTaskModalOpen(false)} className="rounded-lg h-9 text-xs font-semibold">
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={savingTaskModel} 
              className="bg-edu-primary hover:bg-blue-700 rounded-lg h-9 text-xs font-semibold border-none px-4"
            >
              Lưu Cấu Hình
            </Button>
          </div>
        </Form>
      </Modal>
    </AppShell>
  );
}
