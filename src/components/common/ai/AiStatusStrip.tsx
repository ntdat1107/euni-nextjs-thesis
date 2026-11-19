'use client';

import React from 'react';
import { Sliders, ChevronDown } from 'lucide-react';
import { getProviderIcon } from '@/components/ai/AiProviderIcons';
import { DisplayModelInfo } from './types';
import { cn } from '@/lib/utils';
import { AiProvider } from '@/services/userAiService';

interface AiStatusStripProps {
  currentDisplay: DisplayModelInfo;
  temperature: number;
  isCustomizing: boolean;
  onToggleCustomizing: () => void;
  disabled?: boolean;
}

export const AiStatusStrip: React.FC<AiStatusStripProps> = ({
  currentDisplay,
  temperature,
  isCustomizing,
  onToggleCustomizing,
  disabled,
}) => {
  const hasModel = Boolean(currentDisplay.modelName && currentDisplay.modelName.trim());

  return (
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium">Mô hình:</span>

        {hasModel ? (
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            {currentDisplay.provider && getProviderIcon(currentDisplay.provider as AiProvider, 14)}
            <span className="font-mono text-xs">{currentDisplay.modelName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100/90 px-2 py-0.5 rounded-md border border-dashed border-slate-300">
            <span className="text-[11px] italic">Chưa chọn mô hình</span>
          </div>
        )}

        {hasModel && (
          <span className="text-[10px] text-slate-400 font-mono">
            Temp: {temperature}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onToggleCustomizing}
        className={cn(
          "flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all shrink-0",
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200"
            : isCustomizing
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs cursor-pointer"
            : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 cursor-pointer"
        )}
      >
        <Sliders size={12} className={disabled ? 'text-slate-300' : isCustomizing ? 'text-indigo-600' : 'text-slate-400'} />
        <span>Tùy chỉnh mô hình</span>
        <ChevronDown size={12} className={cn("transition-transform duration-200", isCustomizing && "rotate-180 text-indigo-600")} />
      </button>
    </div>
  );
};
