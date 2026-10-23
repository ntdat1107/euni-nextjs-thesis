'use client';

import React, { useCallback } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import { FastTextArea } from '@/components/common/FastInputs';
import { PI } from './types';
import { getPiCode } from './utils';

export interface PiItemProps {
  pi: PI;
  ploIdx: number;
  piIdx: number;
  readonly: boolean;
  error?: string;
  onPiImmediate: (ploIdx: number, piIdx: number, val: string) => void;
  onPiDebounced: (ploIdx: number, piIdx: number, val: string) => void;
  onRemovePi: (ploIdx: number, piIdx: number) => void;
}

export const PiItem = React.memo(function PiItem({
  pi,
  ploIdx,
  piIdx,
  readonly,
  error,
  onPiImmediate,
  onPiDebounced,
  onRemovePi,
}: PiItemProps) {
  const handleImmediate = useCallback((val: string) => onPiImmediate(ploIdx, piIdx, val), [ploIdx, piIdx, onPiImmediate]);
  const handleDebounced = useCallback((val: string) => onPiDebounced(ploIdx, piIdx, val), [ploIdx, piIdx, onPiDebounced]);
  const handleRemove = useCallback(() => onRemovePi(ploIdx, piIdx), [ploIdx, piIdx, onRemovePi]);

  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-16 pt-2 shrink-0">
        <span className="text-xs font-semibold text-slate-700 font-mono">
          {getPiCode(ploIdx, piIdx)}
        </span>
      </div>
      <div className="flex-1">
        <FastTextArea
          id={`pi-input-${ploIdx}-${piIdx}`}
          value={pi.content}
          disabled={readonly}
          onImmediateChange={handleImmediate}
          onDebouncedChange={handleDebounced}
          placeholder="Nội dung chỉ số thực hiện (PI)..."
          rows={2}
          className={`w-full rounded-md px-3 py-1.5 text-xs focus:outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-900 ${
            error
              ? 'border-red-500 bg-red-50/20 ring-2 ring-red-400/20'
              : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand-500'
          }`}
        />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      {!readonly && (
        <button
          type="button"
          onClick={handleRemove}
          title="Xóa PI"
          className="w-7 h-7 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center shrink-0 mt-1 transition-colors cursor-pointer"
        >
          <DeleteOutlined className="text-xs" />
        </button>
      )}
    </div>
  );
});
