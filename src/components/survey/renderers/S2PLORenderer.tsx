'use client';

import React, { useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import { Collapse, message } from 'antd';
import { S2PLORef, S2PLORendererProps, DomainType } from './s2/types';
import {
  getPoCode,
  buildMucTieuHtml,
  buildChuanDauRaHtml,
  buildMatrixHtml,
  ensureMatrixShape,
  validateS2Data,
} from './s2/utils';
import { useS2State } from './s2/useS2State';
import { PoSection } from './s2/PoSection';
import { PloSection } from './s2/PloSection';
import { MatrixSection } from './s2/MatrixSection';

export * from './s2/types';
export * from './s2/utils';

export const S2PLORenderer = forwardRef<S2PLORef, S2PLORendererProps>(({
  data,
  campaign,
  readonly = false,
  onChange,
}, ref) => {
  const {
    state,
    stateRef,
    setState,
    isLocalChangeRef,
    campaignMeta,
    errors,
    setErrors,
    clearError,
    activeAccordionKeys,
    setActiveAccordionKeys,
    triggerParentChange,
    handlePoImmediate,
    handlePoDebounced,
    handleAddPo,
    handleRemovePo,
    handlePloImmediate,
    handlePloDebounced,
    handlePloDomainChange,
    handleAddPlo,
    handleRemovePlo,
    handlePiImmediate,
    handlePiDebounced,
    handleAddPi,
    handleRemovePi,
    handleToggleMatrix,
  } = useS2State(data, campaign, onChange);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const { errors: newErrors, firstInvalidId } = validateS2Data(stateRef.current);
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        if (firstInvalidId) {
          setTimeout(() => {
            const el = document.getElementById(firstInvalidId!);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus();
            }
          }, 50);
        }
        return false;
      }
      return true;
    },
    getData: () => {
      const current = stateRef.current;
      return {
        ...current,
        pos: current?.pos || [],
        peos: current?.pos || [],
        plos: current?.plos || [],
        matrix: current?.matrix || [],
        mucTieu: buildMucTieuHtml(current),
        chuanDauRa: buildChuanDauRaHtml(current),
        maTranMucTieuVaCDR: buildMatrixHtml(current),
      };
    },
  }));

  const handlePoHeadingChange = useCallback((val: string) => {
    clearError('mucTieuHeading');
    stateRef.current.mucTieuHeadingHtml = val;
  }, [clearError]);

  const handlePloHeadingChange = useCallback((val: string) => {
    clearError('chuanDauRaHeading');
    stateRef.current.chuanDauRaHeadingHtml = val;
  }, [clearError]);

  const handleApplyParsedPo = useCallback((parsed: any) => {
    if (parsed.peos && parsed.peos.length > 0) {
      const newPos = parsed.peos.map((text: string, idx: number) => ({ code: getPoCode(idx), content: text }));
      clearError('mucTieuHeading');
      setState((prev) => {
        const nextMatrix = ensureMatrixShape(newPos, prev.plos, prev.matrix);
        const next = {
          ...prev,
          mucTieuHeadingHtml: parsed.mucTieuChung || prev.mucTieuHeadingHtml,
          pos: newPos,
          peos: newPos,
          matrix: nextMatrix,
        };
        stateRef.current = next;
        isLocalChangeRef.current = true;
        triggerParentChange(next);
        return next;
      });
    }
  }, [clearError, triggerParentChange, setState]);

  const collapseItems = useMemo(() => [
    {
      key: '1',
      label: (
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="text-amber-500">✦</span> Mục tiêu chương trình đào tạo (PO)
        </span>
      ),
      children: (
        <PoSection
          headingHtml={state.mucTieuHeadingHtml}
          pos={state.pos}
          readonly={readonly}
          campaignMeta={campaignMeta}
          errors={errors}
          onHeadingChange={handlePoHeadingChange}
          onApplyParsed={handleApplyParsedPo}
          onPoImmediate={handlePoImmediate}
          onPoDebounced={handlePoDebounced}
          onAddPo={handleAddPo}
          onRemovePo={handleRemovePo}
        />
      ),
    },
    {
      key: '2',
      label: (
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="text-amber-500">✦</span> Chuẩn đầu ra (PO/PLO) &amp; Chỉ số PI
        </span>
      ),
      children: (
        <PloSection
          headingHtml={state.chuanDauRaHeadingHtml}
          plos={state.plos}
          readonly={readonly}
          campaignMeta={campaignMeta}
          errors={errors}
          onHeadingChange={handlePloHeadingChange}
          onPloImmediate={handlePloImmediate}
          onPloDebounced={handlePloDebounced}
          onPloDomainChange={handlePloDomainChange}
          onAddPlo={handleAddPlo}
          onRemovePlo={handleRemovePlo}
          onPiImmediate={handlePiImmediate}
          onPiDebounced={handlePiDebounced}
          onAddPi={handleAddPi}
          onRemovePi={handleRemovePi}
        />
      ),
    },
    {
      key: '3',
      label: (
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="text-amber-500">✦</span> Ma trận tích hợp mục tiêu &amp; chuẩn đầu ra (PO ↔ PI)
        </span>
      ),
      children: (
        <MatrixSection
          pos={state.pos}
          plos={state.plos}
          matrix={state.matrix}
          readonly={readonly}
          onToggleMatrix={handleToggleMatrix}
        />
      ),
    },
  ], [
    state.pos,
    state.plos,
    state.matrix,
    state.mucTieuHeadingHtml,
    state.chuanDauRaHeadingHtml,
    readonly,
    campaignMeta,
    errors,
    handlePoHeadingChange,
    handleApplyParsedPo,
    handlePoImmediate,
    handlePoDebounced,
    handleAddPo,
    handleRemovePo,
    handlePloHeadingChange,
    handlePloImmediate,
    handlePloDebounced,
    handlePloDomainChange,
    handleAddPlo,
    handleRemovePlo,
    handlePiImmediate,
    handlePiDebounced,
    handleAddPi,
    handleRemovePi,
    handleToggleMatrix,
  ]);

  return (
    <div className="w-full pb-8">
      <Collapse
        activeKey={activeAccordionKeys}
        onChange={(keys) => setActiveAccordionKeys(Array.isArray(keys) ? (keys as string[]) : [keys as string])}
        items={collapseItems}
        bordered={false}
        className="bg-transparent space-y-4"
      />
      <style jsx global>{`
        .ant-collapse > .ant-collapse-item {
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          background: #ffffff !important;
          margin-bottom: 16px !important;
          overflow: hidden;
        }
        .ant-collapse-header {
          background-color: #f8fafc !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid #f1f5f9;
        }
        .ant-collapse-content-box {
          padding: 16px 20px !important;
        }
      `}</style>
    </div>
  );
});

S2PLORenderer.displayName = 'S2PLORenderer';

export default S2PLORenderer;
