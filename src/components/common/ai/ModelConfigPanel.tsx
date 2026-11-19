'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Select } from 'antd';
import { Settings2, RefreshCw, RotateCcw } from 'lucide-react';
import { AI_PROVIDERS_CATALOG } from '@/constants/aiModelsCatalog';
import { UserAiCredential, AiProvider } from '@/services/userAiService';
import { getProviderIcon } from '@/components/ai/AiProviderIcons';
import { cn } from '@/lib/utils';
import { ResolvedDefaultConfig } from './useAiModelSelection';

interface ModelConfigPanelProps {
  selectedProvider: string;
  onChangeProvider: (provider: string) => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  credentials: UserAiCredential[];
  temperature: number;
  onChangeTemperature: (val: number) => void;
  maxTokens: number;
  onChangeMaxTokens: (val: number) => void;
  saveAsDefault: boolean;
  onChangeSaveAsDefault: (val: boolean) => void;
  contentType?: string;
  hasDefaultConfig?: boolean;
  defaultConfig?: ResolvedDefaultConfig | null;
  onResetToDefault?: () => void;
  dynamicModels?: string[];
  loadingModels?: boolean;
  onRefreshModels?: () => void;
  disabled?: boolean;
}

const PROVIDER_METAS = [
  { value: 'GEMINI', label: 'Google Gemini' },
  { value: 'OPENAI', label: 'OpenAI (GPT)' },
  { value: 'ANTHROPIC', label: 'Anthropic (Claude)' },
  { value: 'DEEPSEEK', label: 'DeepSeek AI' },
];

const TEMP_PRESETS = [
  { val: 0.2, label: 'Chuẩn mực' },
  { val: 0.5, label: 'Cân bằng' },
  { val: 0.8, label: 'Sáng tạo' },
];

export const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({
  selectedProvider,
  onChangeProvider,
  selectedModel,
  onChangeModel,
  credentials,
  temperature,
  onChangeTemperature,
  maxTokens,
  onChangeMaxTokens,
  saveAsDefault,
  onChangeSaveAsDefault,
  contentType,
  hasDefaultConfig = false,
  defaultConfig,
  onResetToDefault,
  dynamicModels = [],
  loadingModels = false,
  onRefreshModels,
  disabled = false,
}) => {
  const providerOptions = useMemo(() => {
    return PROVIDER_METAS.map(p => {
      const isGemini = p.value === 'GEMINI';
      const hasKey = isGemini || credentials.some(c => c.provider === p.value && c.active);
      const isDefault = hasDefaultConfig && defaultConfig?.provider === p.value;

      return {
        value: p.value,
        disabled: !hasKey,
        label: (
          <div className={cn("flex items-center justify-between w-full text-xs py-0.5", !hasKey && "opacity-45")}>
            <div className="flex items-center gap-1.5 text-xs text-slate-800">
              {getProviderIcon(p.value as AiProvider, 13)}
              <span className="text-xs">{p.label}</span>
              {isDefault && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-sans font-medium">
                  Mặc định
                </span>
              )}
            </div>
            {!hasKey && (
              <span className="text-[10px] text-slate-400 font-normal italic">
                Chưa có key
              </span>
            )}
          </div>
        ),
      };
    });
  }, [credentials, hasDefaultConfig, defaultConfig]);

  const getModelPriority = (id: string): number => {
    const s = id.toLowerCase();
    if (s.includes('gemini-2.5')) return 100;
    if (s.includes('gemini-2.0-flash')) return 95;
    if (s.includes('gemini-2.0')) return 90;
    if (s.includes('gemini-1.5-pro')) return 85;
    if (s.includes('gemini-1.5-flash')) return 80;

    if (s === 'gpt-4o') return 100;
    if (s === 'gpt-4o-mini') return 95;
    if (s.startsWith('o3')) return 92;
    if (s.startsWith('o1')) return 90;
    if (s.includes('gpt-4-turbo')) return 85;
    if (s.includes('gpt-4')) return 80;
    if (s.includes('gpt-3.5')) return 50;

    if (s.includes('3-7-sonnet') || s.includes('3.7-sonnet')) return 100;
    if (s.includes('3-5-sonnet') || s.includes('3.5-sonnet')) return 95;
    if (s.includes('3-5-haiku') || s.includes('3.5-haiku')) return 90;
    if (s.includes('opus')) return 85;

    if (s.includes('reasoner') || s.includes('r1')) return 100;
    if (s.includes('chat') || s.includes('v3')) return 95;

    return 10;
  };

  const modelOptions = useMemo(() => {
    if (!selectedProvider) return [];
    const meta = AI_PROVIDERS_CATALOG[selectedProvider as AiProvider];

    if (dynamicModels && dynamicModels.length > 0) {
      const sorted = [...dynamicModels].sort((a, b) => {
        const pA = getModelPriority(a);
        const pB = getModelPriority(b);
        return pA !== pB ? pB - pA : a.localeCompare(b);
      });

      return sorted.map(m => {
        const found = meta?.models.find(x => x.id === m);
        const isDefault = hasDefaultConfig && defaultConfig?.modelName === m;
        return {
          value: m,
          label: (
            <div className="flex items-center justify-between w-full gap-1.5 text-xs py-0.5">
              <span className="font-mono text-xs text-slate-800">{m}</span>
              <div className="flex items-center gap-1">
                {isDefault && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-sans font-medium">
                    Mặc định
                  </span>
                )}
                {found?.badge && (
                  <span className="text-[10px] text-slate-400 font-sans font-normal">
                    ({found.badge})
                  </span>
                )}
              </div>
            </div>
          ),
        };
      });
    }

    if (!meta) return [];
    const sortedCatalog = [...meta.models].sort((a, b) => {
      const pA = getModelPriority(a.id);
      const pB = getModelPriority(b.id);
      return pA !== pB ? pB - pA : a.id.localeCompare(b.id);
    });

    return sortedCatalog.map(m => {
      const isDefault = hasDefaultConfig && defaultConfig?.modelName === m.id;
      return {
        value: m.id,
        label: (
          <div className="flex items-center justify-between w-full gap-1.5 text-xs py-0.5">
            <span className="font-mono text-xs text-slate-800">{m.id}</span>
            <div className="flex items-center gap-1">
              {isDefault && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-sans font-medium">
                  Mặc định
                </span>
              )}
              {m.badge && (
                <span className="text-[10px] text-slate-400 font-sans font-normal">
                  ({m.badge})
                </span>
              )}
            </div>
          </div>
        ),
      };
    });
  }, [selectedProvider, dynamicModels, hasDefaultConfig, defaultConfig]);

  const taskDisplayName = useMemo(() => {
    const norm = (contentType || '').toUpperCase();
    if (norm === 'PO' || norm === 'PEO') return 'Mục tiêu đào tạo (PO)';
    if (norm === 'PLO') return 'Chuẩn đầu ra (PLO & PI)';
    if (norm === 'PO_PI_MATRIX' || norm === 'MATRIX' || norm === 'MATRIX_PO_PI') return 'Ma trận tích hợp (PO ↔ PI)';
    if (norm === 'CLO' || norm === 'CO') return 'Chuẩn đầu ra học phần (CLO)';
    if (norm === 'SYLLABUS') return 'Đề cương chi tiết (Syllabus)';
    if (norm === 'COURSE_DESCRIPTION') return 'Mô tả học phần';
    if (norm === 'ASSESSMENT') return 'Phương pháp đánh giá';
    return contentType || 'hiện tại';
  }, [contentType]);

  const isDifferentFromDefault = hasDefaultConfig && defaultConfig && (
    selectedProvider !== defaultConfig.provider ||
    selectedModel !== defaultConfig.modelName ||
    temperature !== defaultConfig.temperature ||
    maxTokens !== defaultConfig.maxTokens
  );

  return (
    <div className="bg-slate-50/95 border border-slate-200/90 rounded-xl p-3.5 space-y-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
      {/* Row 1: Provider and Model selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Loại AI (Nền tảng):</span>
            <Link
              href="/ai-settings"
              target="_blank"
              className={cn(
                "text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium",
                disabled && "pointer-events-none opacity-50 cursor-not-allowed"
              )}
            >
              <Settings2 size={12} /> Cài đặt AI
            </Link>
          </div>
          <div className={cn("w-full relative", disabled && "pointer-events-none select-none cursor-not-allowed")}>
            <Select
              placeholder="Chọn nền tảng AI..."
              value={selectedProvider || undefined}
              onChange={onChangeProvider}
              open={disabled ? false : undefined}
              className={cn(
                "w-full text-xs font-normal h-8 [&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!py-0 [&_.ant-select-selection-item]:!leading-[30px] [&_.ant-select-selection-item]:!text-xs [&_.ant-select-selection-item_*]:!text-xs",
                disabled && "[&_.ant-select-selector]:!bg-slate-100/90 [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selection-item]:!text-slate-800 [&_.ant-select-arrow]:!opacity-40"
              )}
              popupClassName="text-xs [&_.ant-select-item]:text-xs [&_.ant-select-item-option-content]:text-xs [&_.ant-select-item]:py-1.5"
              options={providerOptions}
            />
          </div>
        </div>

        <div className="space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 block">Mô hình thực thi:</span>
            {selectedProvider && onRefreshModels && (
              <button
                type="button"
                onClick={onRefreshModels}
                disabled={disabled || loadingModels}
                className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tải lại danh sách mô hình từ API (Bỏ qua cache)"
              >
                <RefreshCw size={10} className={cn(loadingModels && "animate-spin")} />
                <span>{loadingModels ? "Đang tải..." : "Làm mới"}</span>
              </button>
            )}
          </div>
          <div className={cn("w-full relative", (disabled || !selectedProvider) && "pointer-events-none select-none cursor-not-allowed")}>
            <Select
              showSearch={!disabled}
              placeholder={!selectedProvider ? "Vui lòng chọn loại AI trước" : "Chọn mô hình thực thi..."}
              open={disabled ? false : undefined}
              value={selectedModel || undefined}
              onChange={onChangeModel}
              options={modelOptions}
              loading={loadingModels}
              className={cn(
                "w-full text-xs font-medium h-8 [&_.ant-select-selector]:!h-8 [&_.ant-select-selection-item]:!leading-[30px] [&_.ant-select-selection-item]:!text-xs",
                disabled && "[&_.ant-select-selector]:!bg-slate-100/90 [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selection-item]:!text-slate-800 [&_.ant-select-arrow]:!opacity-40"
              )}
              popupClassName="text-xs [&_.ant-select-item]:text-xs [&_.ant-select-item-option-content]:text-xs [&_.ant-select-item]:py-1.5"
              popupMatchSelectWidth={false}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Default model info & reset button (if modified) */}
      {hasDefaultConfig && defaultConfig && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-100/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
          <span>
            Cấu hình mặc định: <strong className="text-slate-700 font-mono">{defaultConfig.modelName}</strong> ({defaultConfig.provider})
          </span>
          {isDifferentFromDefault && onResetToDefault && (
            <button
              type="button"
              onClick={onResetToDefault}
              disabled={disabled}
              className={cn(
                "text-indigo-600 hover:text-indigo-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              <RotateCcw size={11} />
              <span>Khôi phục giá trị mặc định</span>
            </button>
          )}
        </div>
      )}

      {/* Row 3: Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
        <div className="space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Độ sáng tạo (Temperature):</span>
            <span className="font-mono text-slate-500 font-bold">{temperature}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 h-8 items-center">
            {TEMP_PRESETS.map(p => (
              <button
                key={p.val}
                type="button"
                disabled={disabled}
                onClick={() => onChangeTemperature(p.val)}
                className={cn(
                  "h-8 text-center rounded-lg border text-xs font-medium transition-all flex items-center justify-center",
                  disabled
                    ? temperature === p.val
                      ? "bg-blue-600/80 text-white border-blue-500 shadow-2xs font-bold cursor-not-allowed"
                      : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                    : temperature === p.val
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold cursor-pointer"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Độ dài tối đa:</span>
            <span className="font-mono text-slate-500 font-bold">{maxTokens} tokens</span>
          </div>
          <div className={cn("w-full relative", disabled && "pointer-events-none select-none cursor-not-allowed")}>
            <Select
              value={maxTokens}
              onChange={onChangeMaxTokens}
              open={disabled ? false : undefined}
              options={[
                { label: '2,048 tokens (Ngắn gọn)', value: 2048 },
                { label: '4,096 tokens (Tiêu chuẩn)', value: 4096 },
                { label: '8,192 tokens (Dài chuyên sâu)', value: 8192 },
              ]}
              className={cn(
                "w-full text-xs h-8 [&_.ant-select-selector]:!h-8 [&_.ant-select-selection-item]:!leading-[30px] [&_.ant-select-selection-item]:!text-xs",
                disabled && "[&_.ant-select-selector]:!bg-slate-100/90 [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selection-item]:!text-slate-800 [&_.ant-select-arrow]:!opacity-40"
              )}
              popupClassName="text-xs [&_.ant-select-item]:text-xs [&_.ant-select-item-option-content]:text-xs [&_.ant-select-item]:py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Row 4: Save as default checkbox */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
        <label className={cn("flex items-center gap-2 select-none", disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}>
          <input
            type="checkbox"
            checked={saveAsDefault}
            disabled={disabled}
            onChange={e => onChangeSaveAsDefault(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5 disabled:cursor-not-allowed"
          />
          <span className="text-[11px] font-medium text-slate-700">
            Lưu cấu hình này làm mặc định cho tác vụ <strong>{taskDisplayName}</strong>
          </span>
        </label>
      </div>
    </div>
  );
};
