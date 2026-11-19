'use client';

import React, { useState, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import { Collapse, Button, message } from 'antd';
import { Sparkles } from 'lucide-react';
import { AiAssistantModal } from '@/components/common/ai/AiAssistantModal';
import { S2PLORef, S2PLORendererProps, DomainType } from './s2/types';
import {
  getPoCode,
  getPloCode,
  getPiCode,
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

  const [isAiAllOpen, setIsAiAllOpen] = useState(false);
  const [isAiPoOpen, setIsAiPoOpen] = useState(false);
  const [isAiPloOpen, setIsAiPloOpen] = useState(false);
  const [isAiMatrixOpen, setIsAiMatrixOpen] = useState(false);

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
      message.success('Đã áp dụng các mục tiêu PO do AI đề xuất');
    } else if (parsed.rawHtml) {
      clearError('mucTieuHeading');
      setState((prev) => {
        const next = {
          ...prev,
          mucTieuHeadingHtml: parsed.rawHtml,
        };
        stateRef.current = next;
        isLocalChangeRef.current = true;
        triggerParentChange(next);
        return next;
      });
      message.success('Đã cập nhật nội dung đề mục PO');
    }
  }, [clearError, triggerParentChange, setState]);

  const handleApplyParsedPlo = useCallback((parsed: any) => {
    if (parsed.plos && parsed.plos.length > 0) {
      clearError('chuanDauRaHeading');
      setState((prev) => {
        const newPlos = parsed.plos;
        const nextMatrix = ensureMatrixShape(prev.pos, newPlos, prev.matrix);
        const next = {
          ...prev,
          chuanDauRaHeadingHtml: parsed.chuanDauRaChung || prev.chuanDauRaHeadingHtml,
          plos: newPlos,
          matrix: nextMatrix,
        };
        stateRef.current = next;
        isLocalChangeRef.current = true;
        triggerParentChange(next);
        return next;
      });
      message.success('Đã áp dụng danh sách PLO & PI do AI đề xuất');
    } else if (parsed.rawHtml) {
      clearError('chuanDauRaHeading');
      setState((prev) => {
        const next = {
          ...prev,
          chuanDauRaHeadingHtml: parsed.rawHtml,
        };
        stateRef.current = next;
        isLocalChangeRef.current = true;
        triggerParentChange(next);
        return next;
      });
      message.success('Đã cập nhật nội dung đề mục PLO');
    }
  }, [clearError, triggerParentChange, setState]);

  const handleApplyParsedMatrix = useCallback((parsed: any) => {
    if (parsed.matrix && Array.isArray(parsed.matrix)) {
      setState((prev) => {
        const next = {
          ...prev,
          matrix: parsed.matrix,
        };
        stateRef.current = next;
        isLocalChangeRef.current = true;
        triggerParentChange(next);
        return next;
      });
      message.success('Đã áp dụng các tích chọn ma trận PO ↔ PI do AI đề xuất');
    }
  }, [triggerParentChange, setState]);

  const handleApplyParsedAll = useCallback((parsed: any) => {
    if (parsed.pos && parsed.pos.length > 0 && parsed.plos && parsed.plos.length > 0) {
      clearError('mucTieuHeading');
      clearError('chuanDauRaHeading');
      const newPos = parsed.pos;
      const newPlos = parsed.plos;
      const nextMatrix = parsed.matrix && Array.isArray(parsed.matrix)
        ? parsed.matrix
        : ensureMatrixShape(newPos, newPlos, []);

      setState((prev) => {
        const next = {
          ...prev,
          mucTieuHeadingHtml: parsed.mucTieuChung || prev.mucTieuHeadingHtml,
          pos: newPos,
          peos: newPos,
          chuanDauRaHeadingHtml: parsed.chuanDauRaChung || prev.chuanDauRaHeadingHtml,
          plos: newPlos,
          matrix: nextMatrix,
        };
        stateRef.current = next;
        isLocalChangeRef.current = true;
        triggerParentChange(next);
        return next;
      });
      message.success('Đã áp dụng toàn bộ Mục tiêu (PO), Chuẩn đầu ra (PLO/PI) và Ma trận tương quan từ AI');
    } else {
      message.warning('Dữ liệu AI trả về chưa đủ cấu trúc PO và PLO để áp dụng toàn bộ');
    }
  }, [clearError, triggerParentChange, setState]);

  // Trích xuất PO hiện tại (loại bỏ phần tử rỗng)
  const currentPosContext = useMemo(() => {
    return (state.pos || []).filter(p => p.content?.trim()).map((po, idx) => ({
      code: po.code || getPoCode(idx),
      content: po.content.trim(),
    }));
  }, [state.pos]);

  // Trích xuất PLO & PI hiện tại
  const currentPlosContext = useMemo(() => {
    return (state.plos || []).filter(p => p.content?.trim() || (p.pis && p.pis.length > 0)).map((plo, ploIdx) => ({
      code: plo.code || getPloCode(ploIdx),
      domain: plo.domain || 'KNOWLEDGE',
      content: (plo.content || '').trim(),
      pis: (plo.pis || []).filter(pi => pi.content?.trim()).map((pi, piIdx) => ({
        code: pi.code || getPiCode(ploIdx, piIdx),
        content: pi.content.trim(),
      })),
    }));
  }, [state.plos]);

  // Trích xuất Ma trận liên kết hiện tại
  const currentMatrixContext = useMemo(() => {
    const pos = state.pos || [];
    const plos = state.plos || [];
    const matrix = state.matrix || [];
    const mappings: Record<string, string[]> = {};

    pos.forEach((po, poIdx) => {
      const poCode = po.code || getPoCode(poIdx);
      plos.forEach((plo, ploIdx) => {
        (plo.pis || []).forEach((pi, piIdx) => {
          const piCode = pi.code || getPiCode(ploIdx, piIdx);
          if (matrix[poIdx]?.[ploIdx]?.[piIdx]) {
            if (!mappings[poCode]) mappings[poCode] = [];
            mappings[poCode].push(piCode);
          }
        });
      });
    });

    return mappings;
  }, [state.pos, state.plos, state.matrix]);

  // 1. Tác vụ tổng thể Bước 2: KHÔNG thu thập PO, PLO, Matrix hiện tại
  const allModalMetadata = useMemo(() => ({
    ...campaignMeta,
  }), [campaignMeta]);

  // 2. Tác vụ PO: Thu thập 2 tác vụ còn lại (PLO & Matrix), KHÔNG gửi PO
  const poModalMetadata = useMemo(() => {
    const meta: Record<string, any> = { ...campaignMeta };
    if (currentPlosContext.length > 0) meta.plos = currentPlosContext;
    if (Object.keys(currentMatrixContext).length > 0) meta.matrixMappings = currentMatrixContext;
    return meta;
  }, [campaignMeta, currentPlosContext, currentMatrixContext]);

  // 3. Tác vụ PLO: Thu thập 2 tác vụ còn lại (PO & Matrix), KHÔNG gửi PLO
  const ploModalMetadata = useMemo(() => {
    const meta: Record<string, any> = { ...campaignMeta };
    if (currentPosContext.length > 0) meta.pos = currentPosContext;
    if (Object.keys(currentMatrixContext).length > 0) meta.matrixMappings = currentMatrixContext;
    return meta;
  }, [campaignMeta, currentPosContext, currentMatrixContext]);

  // 4. Tác vụ Matrix: Thu thập 2 tác vụ còn lại (PO & PLO), KHÔNG gửi Matrix
  const matrixModalMetadata = useMemo(() => {
    const meta: Record<string, any> = { ...campaignMeta };
    if (currentPosContext.length > 0) meta.pos = currentPosContext;
    if (currentPlosContext.length > 0) meta.plos = currentPlosContext;
    return meta;
  }, [campaignMeta, currentPosContext, currentPlosContext]);

  const collapseItems = useMemo(() => [
    {
      key: '1',
      label: (
        <div className="flex items-center justify-between w-full pr-2">
          <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="text-amber-500">✦</span> Mục tiêu chương trình đào tạo (PO)
          </span>
          {!readonly && (
            <Button
              size="small"
              icon={<Sparkles size={13} className="text-indigo-600 animate-pulse" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsAiPoOpen(true);
              }}
              className="bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md h-7 px-2.5 flex items-center gap-1 shadow-2xs"
            >
              Trợ lý AI gợi ý PO
            </Button>
          )}
        </div>
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
        <div className="flex items-center justify-between w-full pr-2">
          <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="text-amber-500">✦</span> Chuẩn đầu ra (PO/PLO) &amp; Chỉ số PI
          </span>
          {!readonly && (
            <Button
              size="small"
              icon={<Sparkles size={13} className="text-indigo-600 animate-pulse" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsAiPloOpen(true);
              }}
              className="bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md h-7 px-2.5 flex items-center gap-1 shadow-2xs"
            >
              Trợ lý AI gợi ý PLO &amp; PI
            </Button>
          )}
        </div>
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
        <div className="flex items-center justify-between w-full pr-2">
          <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="text-amber-500">✦</span> Ma trận tích hợp mục tiêu &amp; chuẩn đầu ra (PO ↔ PI)
          </span>
          {!readonly && (
            <Button
              size="small"
              icon={<Sparkles size={13} className="text-indigo-600 animate-pulse" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsAiMatrixOpen(true);
              }}
              className="bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md h-7 px-2.5 flex items-center gap-1 shadow-2xs"
            >
              Trợ lý AI gợi ý Ma trận
            </Button>
          )}
        </div>
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
      {!readonly && (
        <div className="mb-4 p-3.5 bg-gradient-to-r from-indigo-50/80 via-blue-50/70 to-slate-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Trợ lý AI tổng thể Bước 2</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  PO + PLO + Ma trận
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Tự động đề xuất đồng bộ trọn bộ Mục tiêu đào tạo (PO), Chuẩn đầu ra (PLO/PI) và Ma trận tương quan tích hợp theo chuẩn kiểm định.
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<Sparkles size={13} />}
            onClick={() => setIsAiAllOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg h-8 px-3.5 shadow-xs shrink-0"
          >
            Soạn toàn bộ bằng AI
          </Button>
        </div>
      )}

      <Collapse
        activeKey={activeAccordionKeys}
        onChange={(keys) => setActiveAccordionKeys(Array.isArray(keys) ? (keys as string[]) : [keys as string])}
        items={collapseItems}
        bordered={false}
        className="bg-transparent space-y-4"
      />

      <AiAssistantModal
        open={isAiAllOpen}
        onClose={() => setIsAiAllOpen(false)}
        contentType="S2_ALL"
        metadata={allModalMetadata}
        title="Trợ lý AI - Toàn bộ Bước 2 (PO + PLO + Ma trận)"
        subtitle="Khởi tạo đồng bộ Mục tiêu (PO), Chuẩn đầu ra (PLO/PI) và Ma trận liên kết theo định hướng ngành đào tạo."
        badgeLabel="TOÀN BỘ BƯỚC 2"
        applyButtonText="Áp dụng toàn bộ (PO + PLO + Ma trận)"
        onApply={handleApplyParsedAll}
      />

      <AiAssistantModal
        open={isAiPoOpen}
        onClose={() => setIsAiPoOpen(false)}
        contentType="PO"
        metadata={poModalMetadata}
        title="Trợ lý AI - Mục tiêu đào tạo (PO)"
        subtitle="Tự động đề xuất Mục tiêu chung và các PO cụ thể (tham chiếu PLO và Ma trận hiện có)."
        badgeLabel="PO"
        onApply={handleApplyParsedPo}
      />

      <AiAssistantModal
        open={isAiPloOpen}
        onClose={() => setIsAiPloOpen(false)}
        contentType="PLO"
        metadata={ploModalMetadata}
        title="Trợ lý AI - Chuẩn đầu ra (PLO & PI)"
        subtitle="Tự động đề xuất PLO và các chỉ số PI đo lường theo 4 nhóm chuẩn (tham chiếu PO và Ma trận hiện có)."
        badgeLabel="PLO & PI"
        onApply={handleApplyParsedPlo}
      />

      <AiAssistantModal
        open={isAiMatrixOpen}
        onClose={() => setIsAiMatrixOpen(false)}
        contentType="PO_PI_MATRIX"
        metadata={matrixModalMetadata}
        title="Trợ lý AI - Ma trận tích hợp (PO ↔ PI)"
        subtitle="Kiểm tra tính hợp lệ của PO, PLO & PI, tự động đối sánh và đề xuất các ô tích chọn tương quan."
        badgeLabel="PO ↔ PI"
        applyButtonText="Áp dụng vào Ma trận"
        onApply={handleApplyParsedMatrix}
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
