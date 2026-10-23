'use client';

import React, { useCallback } from 'react';
import { Button, Select, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FastTextArea } from '@/components/common/FastInputs';
import { DomainType, DOMAIN_OPTIONS, PI, PLO } from './types';
import { getDomainLabel, getPloCode } from './utils';
import { PiItem } from './PiItem';

const { Text } = Typography;

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
});

interface PloItemProps {
  plo: PLO;
  ploIdx: number;
  readonly: boolean;
  errors: Record<string, string>;
  onPloImmediate: (ploIdx: number, val: string) => void;
  onPloDebounced: (ploIdx: number, val: string) => void;
  onPloDomainChange: (ploIdx: number, domain: DomainType) => void;
  onRemovePlo: (ploIdx: number) => void;
  onPiImmediate: (ploIdx: number, piIdx: number, val: string) => void;
  onPiDebounced: (ploIdx: number, piIdx: number, val: string) => void;
  onAddPi: (ploIdx: number) => void;
  onRemovePi: (ploIdx: number, piIdx: number) => void;
}

const PloItem = React.memo(function PloItem({
  plo,
  ploIdx,
  readonly,
  errors,
  onPloImmediate,
  onPloDebounced,
  onPloDomainChange,
  onRemovePlo,
  onPiImmediate,
  onPiDebounced,
  onAddPi,
  onRemovePi,
}: PloItemProps) {
  const handleImmediate = useCallback((val: string) => onPloImmediate(ploIdx, val), [ploIdx, onPloImmediate]);
  const handleDebounced = useCallback((val: string) => onPloDebounced(ploIdx, val), [ploIdx, onPloDebounced]);
  const handleDomainChange = useCallback((dom: DomainType) => onPloDomainChange(ploIdx, dom), [ploIdx, onPloDomainChange]);
  const handleRemove = useCallback(() => onRemovePlo(ploIdx), [ploIdx, onRemovePlo]);
  const handleAddPiClick = useCallback(() => onAddPi(ploIdx), [ploIdx, onAddPi]);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 hover:border-slate-300 transition-colors shadow-2xs">
      <div className="flex flex-col md:flex-row gap-3 items-start">
        <div className="w-16 pt-2 shrink-0">
          <span className="text-xs font-bold text-slate-800 font-mono">{getPloCode(ploIdx)}</span>
        </div>

        <div className="w-48 shrink-0">
          {readonly ? (
            <Tag
              color={
                plo.domain === 'KNOWLEDGE'
                  ? 'blue'
                  : plo.domain === 'SKILL'
                  ? 'cyan'
                  : plo.domain === 'AUTONOMY'
                  ? 'purple'
                  : 'gold'
              }
              className="rounded font-semibold text-xs py-0.5 px-2.5"
            >
              {getDomainLabel(plo.domain)}
            </Tag>
          ) : (
            <Select
              value={plo.domain || 'KNOWLEDGE'}
              onChange={handleDomainChange}
              options={DOMAIN_OPTIONS}
              className="w-full text-xs font-medium"
            />
          )}
        </div>

        <div className="flex-1 w-full">
          <FastTextArea
            id={`plo-input-${ploIdx}`}
            value={plo.content}
            disabled={readonly}
            onImmediateChange={handleImmediate}
            onDebouncedChange={handleDebounced}
            placeholder="Nhập nội dung chuẩn đầu ra PLO..."
            rows={3}
            className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-900 ${
              errors[`plo-${ploIdx}`]
                ? 'border-red-500 bg-red-50/20 ring-2 ring-red-400/20'
                : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand-500'
            }`}
          />
          {errors[`plo-${ploIdx}`] && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{errors[`plo-${ploIdx}`]}</span>
            </div>
          )}
        </div>

        {!readonly && (
          <button
            type="button"
            onClick={handleRemove}
            title="Xóa PLO"
            className="w-8 h-8 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center shrink-0 mt-1 transition-colors cursor-pointer"
          >
            <DeleteOutlined className="text-xs" />
          </button>
        )}
      </div>

      <div className="ml-0 md:ml-16 bg-slate-50/60 p-4 rounded-lg border border-slate-200/80 space-y-3">
        <div className="text-xs font-semibold text-slate-700 pb-1 border-b border-slate-200/60">
          PI thuộc {getPloCode(ploIdx)} này:
        </div>

        <div className="space-y-3">
          {plo.pis.map((pi, piIdx) => (
            <PiItem
              key={piIdx}
              pi={pi}
              ploIdx={ploIdx}
              piIdx={piIdx}
              readonly={readonly}
              error={errors[`pi-${ploIdx}-${piIdx}`]}
              onPiImmediate={onPiImmediate}
              onPiDebounced={onPiDebounced}
              onRemovePi={onRemovePi}
            />
          ))}

          {!readonly && (
            <div className="pt-1">
              <Button
                type="default"
                size="small"
                icon={<PlusOutlined className="text-xs" />}
                onClick={handleAddPiClick}
                className="text-xs border-dashed border-emerald-400 text-emerald-700 hover:text-emerald-800 hover:border-emerald-600 rounded bg-emerald-50/30"
              >
                + Thêm PI
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

interface PloSectionProps {
  headingHtml: string;
  plos: PLO[];
  readonly: boolean;
  campaignMeta: Record<string, any>;
  errors: Record<string, string>;
  onHeadingChange: (val: string) => void;
  onPloImmediate: (ploIdx: number, val: string) => void;
  onPloDebounced: (ploIdx: number, val: string) => void;
  onPloDomainChange: (ploIdx: number, domain: DomainType) => void;
  onAddPlo: () => void;
  onRemovePlo: (ploIdx: number) => void;
  onPiImmediate: (ploIdx: number, piIdx: number, val: string) => void;
  onPiDebounced: (ploIdx: number, piIdx: number, val: string) => void;
  onAddPi: (ploIdx: number) => void;
  onRemovePi: (ploIdx: number, piIdx: number) => void;
}

export const PloSection = React.memo(function PloSection({
  headingHtml,
  plos,
  readonly,
  campaignMeta,
  errors,
  onHeadingChange,
  onPloImmediate,
  onPloDebounced,
  onPloDomainChange,
  onAddPlo,
  onRemovePlo,
  onPiImmediate,
  onPiDebounced,
  onAddPi,
  onRemovePi,
}: PloSectionProps) {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span>Chuẩn đầu ra CTĐT (PO/PLO) và chỉ số PI:</span>
          <span className="text-red-500">*</span>
        </div>
        <div id="chuan-dau-ra-heading-editor">
          <RichtextEditor
            value={headingHtml}
            disabled={readonly}
            contentType="PLO"
            metadata={campaignMeta}
            minHeight={100}
            onChange={onHeadingChange}
          />
        </div>
        {errors['chuanDauRaHeading'] && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errors['chuanDauRaHeading']}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {plos.length === 0 && <Text type="secondary" italic>Chưa có PLO nào.</Text>}
        {plos.map((plo, ploIdx) => (
          <PloItem
            key={ploIdx}
            plo={plo}
            ploIdx={ploIdx}
            readonly={readonly}
            errors={errors}
            onPloImmediate={onPloImmediate}
            onPloDebounced={onPloDebounced}
            onPloDomainChange={onPloDomainChange}
            onRemovePlo={onRemovePlo}
            onPiImmediate={onPiImmediate}
            onPiDebounced={onPiDebounced}
            onAddPi={onAddPi}
            onRemovePi={onRemovePi}
          />
        ))}

        {!readonly && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={onAddPlo}
            className="w-full text-brand-600 hover:text-brand-700 font-semibold border-brand-300 hover:border-brand-500 h-10 rounded-lg"
          >
            + Thêm chuẩn đầu ra PLO
          </Button>
        )}
      </div>
    </div>
  );
});
