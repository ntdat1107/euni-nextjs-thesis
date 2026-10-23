'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { S2PLOData, DomainType, PO, PLO } from './types';
import {
  getPoCode,
  getPloCode,
  getPiCode,
  ensureMatrixShape,
  buildMucTieuHtml,
  buildChuanDauRaHtml,
  buildMatrixHtml,
  parseS2Source,
} from './utils';

export function useS2State(
  data: any,
  campaign: any,
  onChange?: (data: S2PLOData) => void
) {
  const isLocalChangeRef = useRef(false);

  const [campaignMeta, setCampaignMeta] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeAccordionKeys, setActiveAccordionKeys] = useState<string[]>(['1', '2', '3']);

  const [state, setState] = useState<S2PLOData>({
    mucTieuHeadingHtml: '<p><b>1. Mục tiêu đào tạo (PO)</b></p>',
    chuanDauRaHeadingHtml: '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
    pos: [{ content: '' }],
    plos: [{ content: '', domain: 'KNOWLEDGE', pis: [{ content: '' }, { content: '' }, { content: '' }] }],
    matrix: [],
  });

  const stateRef = useRef<S2PLOData>(state);
  stateRef.current = state;

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const triggerParentChange = useCallback((targetState: S2PLOData) => {
    const mucTieu = buildMucTieuHtml(targetState);
    const chuanDauRa = buildChuanDauRaHtml(targetState);
    const maTranMucTieuVaCDR = buildMatrixHtml(targetState);
    const committedState = { ...targetState, peos: targetState.pos, mucTieu, chuanDauRa, maTranMucTieuVaCDR };
    onChange?.(committedState);
  }, [onChange]);

  useEffect(() => {
    if (campaign) {
      setCampaignMeta({
        'Tên chiến dịch / Đợt rà soát': campaign.name,
        'Mã đợt': campaign.code,
        'Tên chương trình đào tạo': campaign.programName || campaign.program?.name,
        'Ngành đào tạo': campaign.program?.major?.name || campaign.programName || campaign.name,
        'Khoa quản lý': campaign.program?.faculty?.name,
        'Trình độ đào tạo': campaign.program?.degreeLevel || 'Đại học',
      });
    }
  }, [campaign]);

  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    if (data && typeof data === 'object') {
      const newState = parseS2Source(data);
      stateRef.current = newState;
      setState(newState);
    }
  }, [data]);

  const handlePoImmediate = useCallback((idx: number, val: string) => {
    if (stateRef.current.pos[idx]) {
      stateRef.current.pos[idx].content = val;
    }
    if (val.trim()) clearError(`po-${idx}`);
  }, [clearError]);

  const handlePoDebounced = useCallback((idx: number, val: string) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPos = prev.pos.map((p, i) => (i === idx ? { ...p, content: val } : p));
      const next = { ...prev, pos: nextPos, peos: nextPos };
      stateRef.current = next;
      return next;
    });
  }, []);

  const handleAddPo = useCallback(() => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      if (prev.pos.length >= 10) return prev;
      const nextPos = [...prev.pos, { code: getPoCode(prev.pos.length), content: '' }];
      const nextMatrix = ensureMatrixShape(nextPos, prev.plos, prev.matrix);
      const next = { ...prev, pos: nextPos, peos: nextPos, matrix: nextMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handleRemovePo = useCallback((idx: number) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPos = prev.pos.filter((_, i) => i !== idx);
      const nextMatrix = ensureMatrixShape(nextPos, prev.plos, prev.matrix);
      const next = { ...prev, pos: nextPos, peos: nextPos, matrix: nextMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handlePloImmediate = useCallback((ploIdx: number, val: string) => {
    if (stateRef.current.plos[ploIdx]) {
      stateRef.current.plos[ploIdx].content = val;
    }
    if (val.trim()) clearError(`plo-${ploIdx}`);
  }, [clearError]);

  const handlePloDebounced = useCallback((ploIdx: number, val: string) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPlos = prev.plos.map((p, i) => (i === ploIdx ? { ...p, content: val } : p));
      const next = { ...prev, plos: nextPlos };
      stateRef.current = next;
      return next;
    });
  }, []);

  const handlePloDomainChange = useCallback((ploIdx: number, domain: DomainType) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPlos = prev.plos.map((p, i) => (i === ploIdx ? { ...p, domain } : p));
      const next = { ...prev, plos: nextPlos };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handleAddPlo = useCallback(() => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextIdx = prev.plos.length;
      const newPlo: PLO = {
        code: getPloCode(nextIdx),
        domain: 'KNOWLEDGE',
        content: '',
        pis: [
          { code: getPiCode(nextIdx, 0), content: '' },
          { code: getPiCode(nextIdx, 1), content: '' },
        ],
      };
      const nextPlos = [...prev.plos, newPlo];
      const nextMatrix = ensureMatrixShape(prev.pos, nextPlos, prev.matrix);
      const next = { ...prev, plos: nextPlos, matrix: nextMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handleRemovePlo = useCallback((idx: number) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPlos = prev.plos.filter((_, i) => i !== idx);
      const nextMatrix = ensureMatrixShape(prev.pos, nextPlos, prev.matrix);
      const next = { ...prev, plos: nextPlos, matrix: nextMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handlePiImmediate = useCallback((ploIdx: number, piIdx: number, val: string) => {
    if (stateRef.current.plos[ploIdx]?.pis?.[piIdx]) {
      stateRef.current.plos[ploIdx].pis[piIdx].content = val;
    }
    if (val.trim()) clearError(`pi-${ploIdx}-${piIdx}`);
  }, [clearError]);

  const handlePiDebounced = useCallback((ploIdx: number, piIdx: number, val: string) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPlos = prev.plos.map((plo, i) => {
        if (i !== ploIdx) return plo;
        const nextPis = (plo.pis || []).map((pi, pIdx) => (pIdx === piIdx ? { ...pi, content: val } : pi));
        return { ...plo, pis: nextPis };
      });
      const next = { ...prev, plos: nextPlos };
      stateRef.current = next;
      return next;
    });
  }, []);

  const handleAddPi = useCallback((ploIdx: number) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const targetPis = prev.plos[ploIdx]?.pis || [];
      const nextPis = [...targetPis, { code: getPiCode(ploIdx, targetPis.length), content: '' }];
      const nextPlos = prev.plos.map((plo, i) => (i === ploIdx ? { ...plo, pis: nextPis } : plo));
      const nextMatrix = ensureMatrixShape(prev.pos, nextPlos, prev.matrix);
      const next = { ...prev, plos: nextPlos, matrix: nextMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handleRemovePi = useCallback((ploIdx: number, piIdx: number) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPlos = prev.plos.map((plo, idx) => {
        if (idx !== ploIdx) return plo;
        const filtered = (plo.pis || []).filter((_, pIdx) => pIdx !== piIdx);
        return { ...plo, pis: filtered.length ? filtered : [{ code: getPiCode(ploIdx, 0), content: '' }] };
      });
      const nextMatrix = ensureMatrixShape(prev.pos, nextPlos, prev.matrix);
      const next = { ...prev, plos: nextPlos, matrix: nextMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  const handleToggleMatrix = useCallback((poIdx: number, ploIdx: number, piIdx: number) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const newMatrix = prev.matrix.map((row, rIdx) =>
        rIdx === poIdx
          ? row.map((col, cIdx) =>
              cIdx === ploIdx
                ? col.map((cell, cellIdx) => (cellIdx === piIdx ? !cell : cell))
                : col
            )
          : row
      );
      const next = { ...prev, matrix: newMatrix };
      stateRef.current = next;
      triggerParentChange(next);
      return next;
    });
  }, [triggerParentChange]);

  return {
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
  };
}
