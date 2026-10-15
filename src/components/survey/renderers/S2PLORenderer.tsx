'use client';

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import { Button, Input, Checkbox, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { surveyCampaignService } from '@/services/surveyCampaignService';

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

export interface S2PLORef {
  validate: () => boolean;
  getData: () => S2PLOData;
}

interface S2PLORendererProps {
  data?: any; 
  readonly?: boolean;
  onChange?: (data: S2PLOData) => void;
}

export const S2PLORenderer = forwardRef<S2PLORef, S2PLORendererProps>(({
  data,
  readonly = false,
  onChange,
}, ref) => {
  const params = useParams();
  const campaignId = params?.id as string;

  const isLocalChangeRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedTriggerRef = useRef<((targetState: S2PLOData) => void) | null>(null);

  const [campaignMeta, setCampaignMeta] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<S2PLOData>({
    mucTieuHeadingHtml: '<p><b>1. Mục tiêu</b></p>',
    chuanDauRaHeadingHtml: '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
    peos: [{ content: '' }],
    plos: [{ content: '', pis: [{ content: '' }, { content: '' }, { content: '' }] }],
    matrix: [],
  });

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const newErrors: Record<string, string> = {};
      let firstInvalidId: string | null = null;

      const hasText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim().length > 0;

      if (!hasText(state.mucTieuHeadingHtml)) {
        newErrors['mucTieuHeading'] = 'Vui lòng nhập đề mục mục tiêu';
        if (!firstInvalidId) firstInvalidId = 'muc-tieu-heading-editor';
      }

      if (!state.peos || state.peos.length === 0) {
        newErrors['peo-0'] = 'Vui lòng thêm ít nhất một PEO';
        if (!firstInvalidId) firstInvalidId = 'peo-input-0';
      } else {
        state.peos.forEach((peo, idx) => {
          if (!peo.content || !peo.content.trim()) {
            newErrors[`peo-${idx}`] = `Vui lòng nhập nội dung ${getPeoCode(idx)}`;
            if (!firstInvalidId) firstInvalidId = `peo-input-${idx}`;
          }
        });
      }

      if (!hasText(state.chuanDauRaHeadingHtml)) {
        newErrors['chuanDauRaHeading'] = 'Vui lòng nhập đề mục chuẩn đầu ra';
        if (!firstInvalidId) firstInvalidId = 'chuan-dau-ra-heading-editor';
      }

      if (!state.plos || state.plos.length === 0) {
        newErrors['plo-0'] = 'Vui lòng thêm ít nhất một PLO';
        if (!firstInvalidId) firstInvalidId = 'plo-input-0';
      } else {
        state.plos.forEach((plo, ploIdx) => {
          if (!plo.content || !plo.content.trim()) {
            newErrors[`plo-${ploIdx}`] = `Vui lòng nhập nội dung ${getPloCode(ploIdx)}`;
            if (!firstInvalidId) firstInvalidId = `plo-input-${ploIdx}`;
          }
          if (!plo.pis || plo.pis.length === 0) {
            newErrors[`pi-${ploIdx}-0`] = `Vui lòng thêm ít nhất một PI cho ${getPloCode(ploIdx)}`;
            if (!firstInvalidId) firstInvalidId = `pi-input-${ploIdx}-0`;
          } else {
            plo.pis.forEach((pi, piIdx) => {
              if (!pi.content || !pi.content.trim()) {
                newErrors[`pi-${ploIdx}-${piIdx}`] = `Vui lòng nhập nội dung ${getPiCode(ploIdx, piIdx)}`;
                if (!firstInvalidId) firstInvalidId = `pi-input-${ploIdx}-${piIdx}`;
              }
            });
          }
        });
      }

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
      const mucTieu = buildMucTieuHtml(state);
      const chuanDauRa = buildChuanDauRaHtml(state);
      const maTranMucTieuVaCDR = buildMatrixHtml(state);
      return { ...state, mucTieu, chuanDauRa, maTranMucTieuVaCDR };
    }
  }));

  useEffect(() => {
    if (!campaignId) return;
    const loadCampaignMeta = async () => {
      try {
        const campaign = await surveyCampaignService.getById(campaignId);
        if (campaign) {
          setCampaignMeta({
            'Tên chiến dịch / Đợt rà soát': campaign.name,
            'Mã đợt': campaign.code,
            'Tên chương trình đào tạo': campaign.programName || campaign.program?.name,
            'Ngành đào tạo': campaign.program?.major?.name || campaign.programName || campaign.name,
            'Khoa quản lý': campaign.program?.faculty?.name,
            'Trình độ đào tạo': campaign.program?.degreeLevel || 'Đại học'
          });
        }
      } catch (err) {
        console.error('[S2PLO] Fetch campaign metadata error:', err);
      }
    };
    loadCampaignMeta();
  }, [campaignId]);

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
    if (content.trim()) {
      clearError(`peo-${idx}`);
    }
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
    if (content.trim()) {
      clearError(`plo-${idx}`);
    }
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
    handleStateChange({
      plos: state.plos.map((plo, idx) => {
        if (idx !== ploIdx) return plo;
        const nextPis = plo.pis.filter((_, pIdx) => pIdx !== piIdx);
        return { ...plo, pis: nextPis.length ? nextPis : [{ content: '' }] };
      })
    }, true);
  };

  const updatePI = (ploIdx: number, piIdx: number, content: string) => {
    if (content.trim()) {
      clearError(`pi-${ploIdx}-${piIdx}`);
    }
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
          <div id="muc-tieu-heading-editor">
            <RichtextEditor
              value={state.mucTieuHeadingHtml}
              disabled={readonly}
              contentType="PEO"
              metadata={campaignMeta}
              minHeight={120}
              onChange={(val) => {
                clearError('mucTieuHeading');
                handleStateChange({ mucTieuHeadingHtml: val }, false);
              }}
              onApplyParsed={(parsed) => {
                if (parsed.peos && parsed.peos.length > 0) {
                  const newPeos = parsed.peos.map(text => ({ content: text }));
                  clearError('mucTieuHeading');
                  handleStateChange({
                    mucTieuHeadingHtml: parsed.mucTieuChung || state.mucTieuHeadingHtml,
                    peos: newPeos
                  }, true);
                }
              }}
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
          {state.peos.map((peo, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="w-16 pt-2 shrink-0">
                <Text strong className="text-sm text-slate-800">{getPeoCode(idx)}</Text>
              </div>
              <div className="flex-1">
                <TextArea
                  id={`peo-input-${idx}`}
                  value={peo.content}
                  disabled={readonly}
                  onChange={(e) => updatePEO(idx, e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Nhập nội dung PEO..."
                  autoSize={{ minRows: 3 }}
                  className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-900 disabled:cursor-default ${
                    errors[`peo-${idx}`]
                      ? 'border-red-500 bg-red-50/20 ring-2 ring-red-400/20'
                      : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand-500'
                  }`}
                />
                {errors[`peo-${idx}`] && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{errors[`peo-${idx}`]}</span>
                  </div>
                )}
              </div>
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
          <div id="chuan-dau-ra-heading-editor">
            <RichtextEditor
              value={state.chuanDauRaHeadingHtml}
              disabled={readonly}
              contentType="PLO"
              metadata={campaignMeta}
              minHeight={120}
              onChange={(val) => {
                clearError('chuanDauRaHeading');
                handleStateChange({ chuanDauRaHeadingHtml: val }, false);
              }}
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
          {state.plos.length === 0 && <Text type="secondary" italic>Chưa có PLO.</Text>}
          {state.plos.map((plo, ploIdx) => (
            <div key={ploIdx} className="border border-slate-200 rounded-2xl p-6 bg-slate-50/20 space-y-4 hover:border-slate-300 transition-colors shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <Text strong className="text-sm text-slate-800">{getPloCode(ploIdx)}</Text>
                {!readonly && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removePLO(ploIdx)} />}
              </div>
              <div className="w-full">
                <TextArea
                  id={`plo-input-${ploIdx}`}
                  value={plo.content}
                  disabled={readonly}
                  onChange={(e) => updatePLO(ploIdx, e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Nhập nội dung PLO..."
                  autoSize={{ minRows: 2 }}
                  className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-900 disabled:cursor-default ${
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
                      <div className="flex-1">
                        <TextArea
                          id={`pi-input-${ploIdx}-${piIdx}`}
                          value={pi.content}
                          disabled={readonly}
                          onChange={(e) => updatePI(ploIdx, piIdx, e.target.value)}
                          onBlur={handleBlur}
                          placeholder="Nội dung PI..."
                          autoSize={{ minRows: 2 }}
                          className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-900 disabled:cursor-default ${
                            errors[`pi-${ploIdx}-${piIdx}`]
                              ? 'border-red-500 bg-red-50/20 ring-2 ring-red-400/20'
                              : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand-500'
                          }`}
                        />
                        {errors[`pi-${ploIdx}-${piIdx}`] && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>{errors[`pi-${ploIdx}-${piIdx}`]}</span>
                          </div>
                        )}
                      </div>
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
                      <Checkbox
                        checked={!!state.matrix?.[peoIdx]?.[ploIdx]?.[piIdx]}
                        disabled={readonly}
                        onChange={() => toggleMatrix(peoIdx, ploIdx, piIdx)}
                      />
                    </td>
                  )))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx global>{`
        .ant-checkbox-disabled .ant-checkbox-inner {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        .ant-checkbox-disabled.ant-checkbox-checked .ant-checkbox-inner {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }
        .ant-checkbox-disabled.ant-checkbox-checked .ant-checkbox-inner::after {
          border-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
});

S2PLORenderer.displayName = 'S2PLORenderer';

export default S2PLORenderer;
