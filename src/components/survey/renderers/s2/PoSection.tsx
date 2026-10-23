'use client';

import React, { useCallback } from 'react';
import { Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FastTextArea } from '@/components/common/FastInputs';
import { PO } from './types';
import { getPoCode } from './utils';

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
});

interface PoItemProps {
  po: PO;
  idx: number;
  readonly: boolean;
  error?: string;
  onPoImmediate: (idx: number, val: string) => void;
  onPoDebounced: (idx: number, val: string) => void;
  onRemovePo: (idx: number) => void;
}

const PoItem = React.memo(function PoItem({
  po,
  idx,
  readonly,
  error,
  onPoImmediate,
  onPoDebounced,
  onRemovePo,
}: PoItemProps) {
  const handleImmediate = useCallback((val: string) => onPoImmediate(idx, val), [idx, onPoImmediate]);
  const handleDebounced = useCallback((val: string) => onPoDebounced(idx, val), [idx, onPoDebounced]);
  const handleRemove = useCallback(() => onRemovePo(idx), [idx, onRemovePo]);

  return (
    <div className="flex gap-3 items-start">
      <div className="w-16 pt-2 shrink-0">
        <span className="text-xs font-bold text-slate-800 font-mono">{getPoCode(idx)}</span>
      </div>
      <div className="flex-1">
        <FastTextArea
          id={`po-input-${idx}`}
          value={po.content}
          disabled={readonly}
          onImmediateChange={handleImmediate}
          onDebouncedChange={handleDebounced}
          placeholder="Nhập nội dung mục tiêu đào tạo (PO)..."
          rows={3}
          className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-900 ${
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
          title="Xóa PO"
          className="w-8 h-8 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center shrink-0 mt-1 transition-colors cursor-pointer"
        >
          <DeleteOutlined className="text-xs" />
        </button>
      )}
    </div>
  );
});

interface PoSectionProps {
  headingHtml: string;
  pos: PO[];
  readonly: boolean;
  campaignMeta: Record<string, any>;
  errors: Record<string, string>;
  onHeadingChange: (val: string) => void;
  onApplyParsed: (parsed: any) => void;
  onPoImmediate: (idx: number, val: string) => void;
  onPoDebounced: (idx: number, val: string) => void;
  onAddPo: () => void;
  onRemovePo: (idx: number) => void;
}

export const PoSection = React.memo(function PoSection({
  headingHtml,
  pos,
  readonly,
  campaignMeta,
  errors,
  onHeadingChange,
  onApplyParsed,
  onPoImmediate,
  onPoDebounced,
  onAddPo,
  onRemovePo,
}: PoSectionProps) {
  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span>Đề mục mục tiêu đào tạo (mục 1)</span>
          <span className="text-red-500">*</span>
        </div>
        <div id="muc-tieu-heading-editor">
          <RichtextEditor
            value={headingHtml}
            disabled={readonly}
            contentType="PEO"
            metadata={campaignMeta}
            minHeight={100}
            onChange={onHeadingChange}
            onApplyParsed={onApplyParsed}
          />
        </div>
        {errors['mucTieuHeading'] && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errors['mucTieuHeading']}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {pos.map((po, idx) => (
          <PoItem
            key={idx}
            po={po}
            idx={idx}
            readonly={readonly}
            error={errors[`po-${idx}`]}
            onPoImmediate={onPoImmediate}
            onPoDebounced={onPoDebounced}
            onRemovePo={onRemovePo}
          />
        ))}
        {!readonly && (
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={onAddPo}
            disabled={pos.length >= 10}
            className="text-brand-600 hover:text-brand-700 font-semibold p-0 text-xs"
          >
            + Thêm mục tiêu (PO)
          </Button>
        )}
      </div>
    </div>
  );
});
