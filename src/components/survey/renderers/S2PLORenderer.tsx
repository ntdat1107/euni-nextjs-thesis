'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Input, Checkbox, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const { Text, Title } = Typography;
const { TextArea } = Input;

const RichtextEditor = dynamic(() => import('../../common/RichtextEditor'), {
  ssr: false,
});

interface PEO {
  content: string;
}

interface PI {
  content: string;
}

interface PLO {
  content: string;
  pis: PI[];
}

interface S2PLOData {
  peos: PEO[];
  plos: PLO[];
  matrix: boolean[][][]; // [peoIdx][ploIdx][piIdx]
  mucTieuHeadingHtml: string;
  chuanDauRaHeadingHtml: string;
  // Computed HTML for export/display
  mucTieu?: string;
  chuanDauRa?: string;
  maTranMucTieuVaCDR?: string;
}

interface S2PLORendererProps {
  data?: any; 
  readonly?: boolean;
  onChange?: (data: S2PLOData) => void;
}

export const S2PLORenderer: React.FC<S2PLORendererProps> = ({
  data,
  readonly = false,
  onChange,
}) => {
  const isLocalChangeRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedTriggerRef = useRef<((targetState: S2PLOData) => void) | null>(null);

  const [state, setState] = useState<S2PLOData>({
    mucTieuHeadingHtml: '<p><b>1. Mục tiêu</b></p>',
    chuanDauRaHeadingHtml: '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
    peos: [{ content: '' }],
    plos: [{ content: '', pis: [{ content: '' }, { content: '' }, { content: '' }] }],
    matrix: [],
  });

  const getPeoCode = (idx: number) => `PEO${idx + 1}`;
  const getPloCode = (idx: number) => `PLO${idx + 1}`;
  const getPiCode = (ploIdx: number, piIdx: number) => `PI${ploIdx + 1}.${piIdx + 1}`;

  const ensureMatrixShape = useCallback((peos: PEO[], plos: PLO[], currentMatrix: boolean[][][]) => {
    const peoCount = peos.length;
    const ploCount = plos.length;

    const newMatrix = Array.from({ length: peoCount }, (_, peoIdx) =>
      Array.from({ length: ploCount }, (_, ploIdx) => {
        const piCount = plos[ploIdx]?.pis.length || 0;
        return Array.from({ length: piCount }, (_, piIdx) => {
          return currentMatrix?.[peoIdx]?.[ploIdx]?.[piIdx] ?? false;
        });
      })
    );
    return newMatrix;
  }, []);

  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    if (data && typeof data === 'object') {
      const source = data.ploBuilder || data;
      const newState: S2PLOData = {
        mucTieuHeadingHtml: source.mucTieuHeadingHtml || '<p><b>1. Mục tiêu</b></p>',
        chuanDauRaHeadingHtml: source.chuanDauRaHeadingHtml || '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
        peos: Array.isArray(source.peos) ? source.peos : [{ content: '' }],
        plos: Array.isArray(source.plos) ? source.plos : [{ content: '', pis: [{ content: '' }, { content: '' }, { content: '' }] }],
        matrix: Array.isArray(source.matrix) ? source.matrix : [],
      };
      newState.matrix = ensureMatrixShape(newState.peos, newState.plos, newState.matrix);
      setState(newState);
    }
  }, [data, ensureMatrixShape]);

  const triggerParentChange = useCallback((targetState: S2PLOData) => {
    const mucTieu = buildMucTieuHtml(targetState);
    const chuanDauRa = buildChuanDauRaHtml(targetState);
    const maTranMucTieuVaCDR = buildMatrixHtml(targetState);
    const committedState = { ...targetState, mucTieu, chuanDauRa, maTranMucTieuVaCDR };
    if (onChange) onChange(committedState);
  }, [onChange]);
  
  useEffect(() => {
    debouncedTriggerRef.current = (targetState: S2PLOData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        triggerParentChange(targetState);
      }, 400);
    };
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [triggerParentChange]);

  const handleStateChange = (updates: Partial<S2PLOData>, immediate = false) => {
    isLocalChangeRef.current = true;
    setState((prev) => {
      const nextPeos = updates.peos !== undefined ? updates.peos : prev.peos;
      const nextPlos = updates.plos !== undefined ? updates.plos : prev.plos;
      const nextMatrixBase = updates.matrix !== undefined ? updates.matrix : prev.matrix;
      const nextMatrix = ensureMatrixShape(nextPeos, nextPlos, nextMatrixBase);
      
      const nextState = {
        ...prev,
        ...updates,
        peos: nextPeos,
        plos: nextPlos,
        matrix: nextMatrix,
      };

      if (immediate) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        triggerParentChange(nextState);
      } else {
        if (debouncedTriggerRef.current) {
          debouncedTriggerRef.current(nextState);
        }
      }
      return nextState;
    });
  };

  const handleBlur = () => {
    setState((curr) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      triggerParentChange(curr);
      return curr;
    });
  };

  const escapeHtml = (raw: string): string => {
    return (raw || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  const textToInlineHtml = (raw: string): string => {
    return escapeHtml(raw).replace(/\n/g, "<br/>");
  };

  function buildMucTieuHtml(s: S2PLOData): string {
    const peosHtml = s.peos.map((peo, idx) => `<p><b>${getPeoCode(idx)}.</b> ${textToInlineHtml(peo.content)}</p>`).join("");
    return `${s.mucTieuHeadingHtml || ''}${peosHtml}`;
  }

  function buildChuanDauRaHtml(s: S2PLOData): string {
    const plosHtml = s.plos.map((plo, ploIdx) => {
      const pisHtml = plo.pis.map((pi, piIdx) => `<p style="margin-left: 16px;"><b>${getPiCode(ploIdx, piIdx)}.</b> ${textToInlineHtml(pi.content)}</p>`).join("");
      return `<div><p><b>${getPloCode(ploIdx)}.</b> ${textToInlineHtml(plo.content)}</p>${pisHtml}</div>`;
    }).join("");
    return `${s.chuanDauRaHeadingHtml || ''}${plosHtml}`;
  }

  function buildMatrixHtml(s: S2PLOData): string {
    if (!s.peos.length || !s.plos.length) return "";
    const headerRow1 = `<tr><th rowspan="2" style="text-align:left;">Mục tiêu</th>${s.plos.map((plo, ploIdx) => `<th colspan="${plo.pis.length}">${getPloCode(ploIdx)}</th>`).join("")}</tr>`;
    const headerRow2 = `<tr>${s.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => `<th>${getPiCode(ploIdx, piIdx)}</th>`).join("")).join("")}</tr>`;
    const body = s.peos.map((_, peoIdx) => {
      const cells = s.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => `<td>${s.matrix?.[peoIdx]?.[ploIdx]?.[piIdx] ? "✓" : ""}</td>`).join("")).join("");
      return `<tr><td><b>${getPeoCode(peoIdx)}</b></td>${cells}</tr>`;
    }).join("");
    return `<table class="matrix-table"><thead>${headerRow1}${headerRow2}</thead><tbody>${body}</tbody></table>`;
  }

  // Actions
  const addPEO = () => {
    if (state.peos.length >= 5) return;
    handleStateChange({ peos: [...state.peos, { content: '' }] }, true);
  };

  const removePEO = (idx: number) => {
    handleStateChange({ peos: state.peos.filter((_, i) => i !== idx) }, true);
  };

  const updatePEO = (idx: number, content: string) => {
    const newPeos = state.peos.map((peo, i) => i === idx ? { ...peo, content } : peo);
    handleStateChange({ peos: newPeos }, false);
  };

  const addPLO = () => {
    handleStateChange({ 
      plos: [...state.plos, { content: '', pis: [{ content: '' }, { content: '' }, { content: '' }] }] 
    }, true);
  };

  const removePLO = (idx: number) => {
    handleStateChange({ plos: state.plos.filter((_, i) => i !== idx) }, true);
  };

  const updatePLO = (idx: number, content: string) => {
    const newPlos = state.plos.map((plo, i) => i === idx ? { ...plo, content } : plo);
    handleStateChange({ plos: newPlos }, false);
  };

  const addPI = (ploIdx: number) => {
    const newPlos = state.plos.map((plo, idx) => 
      idx === ploIdx ? { ...plo, pis: [...plo.pis, { content: '' }] } : plo
    );
    handleStateChange({ plos: newPlos }, true);
  };

  const removePI = (ploIdx: number, piIdx: number) => {
    const newPlos = state.plos.map((plo, idx) => {
      if (idx !== ploIdx) return plo;
      const nextPis = plo.pis.filter((_, pIdx) => pIdx !== piIdx);
      return { ...plo, pis: nextPis.length ? nextPis : [{ content: '' }] };
    });
    handleStateChange({ plos: newPlos }, true);
  };

  const updatePI = (ploIdx: number, piIdx: number, content: string) => {
    const newPlos = state.plos.map((plo, idx) => {
      if (idx !== ploIdx) return plo;
      const nextPis = plo.pis.map((pi, pIdx) => pIdx === piIdx ? { ...pi, content } : pi);
      return { ...plo, pis: nextPis };
    });
    handleStateChange({ plos: newPlos }, false);
  };

  const toggleMatrix = (peoIdx: number, ploIdx: number, piIdx: number) => {
    const newMatrix = [...state.matrix];
    if (!newMatrix[peoIdx]) newMatrix[peoIdx] = [];
    if (!newMatrix[peoIdx][ploIdx]) newMatrix[peoIdx][ploIdx] = [];
    newMatrix[peoIdx][ploIdx][piIdx] = !newMatrix[peoIdx][ploIdx][piIdx];
    handleStateChange({ matrix: newMatrix }, true);
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* SECTION 1: MỤC TIÊU */}
      <section className="space-y-4">
        <div className="space-y-3">
          <div className="text-base font-bold text-slate-800 flex items-center gap-2 border-l-4 border-brand-500 pl-3 py-0.5 font-sans">
            <span>1. Đề mục mục tiêu (mục 1)</span>
            <span className="text-red-500">*</span>
          </div>
          <RichtextEditor
            value={state.mucTieuHeadingHtml}
            disabled={readonly}
            minHeight={120}
            onChange={(val) => handleStateChange({ mucTieuHeadingHtml: val }, false)}
          />
        </div>

        <div className="space-y-3">
          {state.peos.map((peo, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-16 pt-2 shrink-0">
                <Text strong className="text-sm text-slate-800">{getPeoCode(idx)}</Text>
              </div>
              <TextArea
                value={peo.content}
                disabled={readonly}
                onChange={(e) => updatePEO(idx, e.target.value)}
                onBlur={handleBlur}
                placeholder="Nhập nội dung PEO..."
                autoSize={{ minRows: 3 }}
                className="flex-1 rounded-md border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {!readonly && (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removePEO(idx)} className="mt-1" />
              )}
            </div>
          ))}
          {!readonly && (
            <Button type="link" icon={<PlusOutlined />} onClick={addPEO} disabled={state.peos.length >= 5} className="text-brand-600 hover:text-brand-700 font-semibold p-0">
              Thêm PEO
            </Button>
          )}
        </div>
      </section>

      <Divider className="!my-6" />

      {/* SECTION 2: CHUẨN ĐẦU RA */}
      <section className="space-y-4">
        <div className="space-y-3">
          <div className="text-base font-bold text-slate-800 flex items-center gap-2 border-l-4 border-brand-500 pl-3 py-0.5 font-sans">
            <span>2. Đề mục chuẩn đầu ra (mục 2)</span>
            <span className="text-red-500">*</span>
          </div>
          <RichtextEditor
            value={state.chuanDauRaHeadingHtml}
            disabled={readonly}
            minHeight={120}
            onChange={(val) => handleStateChange({ chuanDauRaHeadingHtml: val }, false)}
          />
        </div>

        <div className="space-y-6">
          {state.plos.length === 0 && <Text type="secondary" italic>Chưa có PLO.</Text>}
          {state.plos.map((plo, ploIdx) => (
            <div key={ploIdx} className="border border-slate-200 rounded-2xl p-6 bg-slate-50/20 space-y-4 hover:border-slate-300 transition-colors shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <Text strong className="text-sm text-slate-800">{getPloCode(ploIdx)}</Text>
                {!readonly && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removePLO(ploIdx)} />}
              </div>
              <TextArea
                value={plo.content}
                disabled={readonly}
                onChange={(e) => updatePLO(ploIdx, e.target.value)}
                onBlur={handleBlur}
                placeholder="Nhập nội dung PLO..."
                autoSize={{ minRows: 2 }}
                className="w-full rounded-md border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
              />

              <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 space-y-4 !mt-5">
                <div className="border-b border-slate-150 pb-2">
                  <Text strong className="text-sm text-slate-700">PI của {getPloCode(ploIdx)}</Text>
                </div>
                <div className="space-y-3">
                  {plo.pis.map((pi, piIdx) => (
                    <div key={piIdx} className="flex gap-3 items-start">
                      <div className="w-20 pt-2 shrink-0">
                        <Text strong className="text-xs text-slate-800">{getPiCode(ploIdx, piIdx)}</Text>
                      </div>
                      <TextArea
                        value={pi.content}
                        disabled={readonly}
                        onChange={(e) => updatePI(ploIdx, piIdx, e.target.value)}
                        onBlur={handleBlur}
                        placeholder="Nội dung PI..."
                        autoSize={{ minRows: 2 }}
                        className="flex-1 rounded-md border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                      {!readonly && <Button type="text" danger size="small" icon={<DeleteOutlined className="text-xs" />} onClick={() => removePI(ploIdx, piIdx)} />}
                    </div>
                  ))}
                  {!readonly && (
                    <div className="pt-2 border-t border-dashed border-slate-200 mt-2">
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<PlusOutlined />} 
                        onClick={() => addPI(ploIdx)} 
                        className="font-semibold text-brand-600 hover:text-brand-700 p-0"
                      >
                        Thêm PI
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!readonly && (
            <Button type="link" icon={<PlusOutlined />} onClick={addPLO} className="text-brand-600 hover:text-brand-700 font-semibold p-0">
              Thêm PLO
            </Button>
          )}
        </div>
      </section>

      <Divider className="!my-6" />

      {/* SECTION 3: MATRIX */}
      <section className="space-y-4">
        <div className="text-base font-bold text-slate-800 border-l-4 border-brand-500 pl-3 py-0.5 font-sans">
          3. Ma trận tích hợp mục tiêu & chuẩn đầu ra
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th rowSpan={2} className="border border-slate-200 p-2 text-left font-semibold text-slate-500">Mục tiêu</th>
                {state.plos.map((plo, ploIdx) => (
                  <th key={ploIdx} colSpan={plo.pis.length} className="border border-slate-200 p-2 text-center font-semibold text-slate-500 border-l">
                    {getPloCode(ploIdx)}
                  </th>
                ))}
              </tr>
              <tr>
                {state.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => (
                  <th key={`${ploIdx}-${piIdx}`} className="border border-slate-200 p-2 text-center font-medium text-slate-500 border-l">
                    {getPiCode(ploIdx, piIdx)}
                  </th>
                )))}
              </tr>
            </thead>
            <tbody>
              {state.peos.map((peo, peoIdx) => (
                <tr key={peoIdx} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 font-medium text-slate-700">{getPeoCode(peoIdx)}</td>
                  {state.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => (
                    <td key={`${peoIdx}-${ploIdx}-${piIdx}`} className="border border-slate-200 p-2 text-center border-l">
                      {readonly ? (
                        <span className="font-semibold text-brand-600">{state.matrix?.[peoIdx]?.[ploIdx]?.[piIdx] ? "✓" : ""}</span>
                      ) : (
                        <Checkbox
                          checked={state.matrix?.[peoIdx]?.[ploIdx]?.[piIdx] || false}
                          onChange={() => toggleMatrix(peoIdx, ploIdx, piIdx)}
                        />
                      )}
                    </td>
                  )))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default S2PLORenderer;
