'use client';

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import { Button, Input, Checkbox, Typography, Collapse, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { surveyCampaignService } from '@/services/surveyCampaignService';

const { Text } = Typography;
const { TextArea } = Input;

const RichtextEditor = dynamic(() => import('../../common/RichtextEditor'), {
  ssr: false,
});

export type DomainType = 'KNOWLEDGE' | 'SKILL' | 'ATTITUDE';

export const DOMAIN_OPTIONS: { value: DomainType; label: string }[] = [
  { value: 'KNOWLEDGE', label: 'Kiến thức' },
  { value: 'SKILL', label: 'Kỹ năng' },
  { value: 'ATTITUDE', label: 'Mức độ tự chủ và trách nhiệm / Thái độ' },
];

export interface PO {
  code?: string;
  content: string;
}

export type PEO = PO;

export interface PI {
  code?: string;
  content: string;
}

export interface PLO {
  code?: string;
  domain?: DomainType;
  content: string;
  pis: PI[];
}

export interface S2PLOData {
  pos: PO[];
  peos?: PO[]; // Backward compatibility
  plos: PLO[];
  matrix: boolean[][][]; // [poIdx][ploIdx][piIdx]
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
  const [activeAccordionKeys, setActiveAccordionKeys] = useState<string[]>(['1', '2', '3']);

  const [state, setState] = useState<S2PLOData>({
    mucTieuHeadingHtml: '<p><b>1. Mục tiêu đào tạo (PO)</b></p>',
    chuanDauRaHeadingHtml: '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
    pos: [{ content: '' }],
    plos: [{ content: '', domain: 'KNOWLEDGE', pis: [{ content: '' }, { content: '' }, { content: '' }] }],
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

  const getPoCode = (idx: number) => `PO${idx + 1}`;
  const getPloCode = (idx: number) => `PLO${idx + 1}`;
  const getPiCode = (ploIdx: number, piIdx: number) => `PI${ploIdx + 1}.${piIdx + 1}`;

  const getDomainLabel = (domain?: DomainType) => {
    const found = DOMAIN_OPTIONS.find(d => d.value === domain);
    return found ? found.label : 'Kiến thức';
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

      if (!state.pos || state.pos.length === 0) {
        newErrors['po-0'] = 'Vui lòng thêm ít nhất một mục tiêu PO';
        if (!firstInvalidId) firstInvalidId = 'po-input-0';
      } else {
        state.pos.forEach((po, idx) => {
          if (!po.content || !po.content.trim()) {
            newErrors[`po-${idx}`] = `Vui lòng nhập nội dung ${getPoCode(idx)}`;
            if (!firstInvalidId) firstInvalidId = `po-input-${idx}`;
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
      return { ...state, peos: state.pos, mucTieu, chuanDauRa, maTranMucTieuVaCDR };
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

  const ensureMatrixShape = useCallback((pos: PO[], plos: PLO[], currentMatrix: boolean[][][]) => {
    const poCount = pos.length;
    const ploCount = plos.length;

    return Array.from({ length: poCount }, (_, poIdx) =>
      Array.from({ length: ploCount }, (_, ploIdx) => {
        const piCount = plos[ploIdx]?.pis.length || 0;
        return Array.from({ length: piCount }, (_, piIdx) => {
          return currentMatrix?.[poIdx]?.[ploIdx]?.[piIdx] ?? false;
        });
      })
    );
  }, []);

  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    if (data && typeof data === 'object') {
      const source = data.ploBuilder || data;
      const rawPlos = Array.isArray(source.plos) ? source.plos : [
        { content: '', domain: 'KNOWLEDGE', pis: [{ content: '' }, { content: '' }, { content: '' }] }
      ];

      const mappedPlos: PLO[] = rawPlos.map((plo: any, ploIdx: number) => ({
        code: plo.code || getPloCode(ploIdx),
        content: plo.content || '',
        domain: plo.domain || 'KNOWLEDGE',
        pis: Array.isArray(plo.pis)
          ? plo.pis.map((pi: any, piIdx: number) => ({
              code: pi.code || getPiCode(ploIdx, piIdx),
              content: pi.content || '',
            }))
          : [{ content: '' }]
      }));

      const rawPos = Array.isArray(source.pos) ? source.pos : (Array.isArray(source.peos) ? source.peos : [{ content: '' }]);
      const mappedPos: PO[] = rawPos.map((po: any, idx: number) => ({
        code: po.code || getPoCode(idx),
        content: po.content || ''
      }));

      const newState: S2PLOData = {
        mucTieuHeadingHtml: source.mucTieuHeadingHtml || '<p><b>1. Mục tiêu đào tạo (PO)</b></p>',
        chuanDauRaHeadingHtml: source.chuanDauRaHeadingHtml || '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
        pos: mappedPos,
        peos: mappedPos,
        plos: mappedPlos,
        matrix: Array.isArray(source.matrix) ? source.matrix : [],
      };
      newState.matrix = ensureMatrixShape(newState.pos, newState.plos, newState.matrix);
      setState(newState);
    }
  }, [data, ensureMatrixShape]);

  const triggerParentChange = useCallback((targetState: S2PLOData) => {
    const mucTieu = buildMucTieuHtml(targetState);
    const chuanDauRa = buildChuanDauRaHtml(targetState);
    const maTranMucTieuVaCDR = buildMatrixHtml(targetState);
    const committedState = { ...targetState, peos: targetState.pos, mucTieu, chuanDauRa, maTranMucTieuVaCDR };
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
      const nextPos = updates.pos !== undefined ? updates.pos : prev.pos;
      const nextPlos = updates.plos !== undefined ? updates.plos : prev.plos;
      const nextMatrixBase = updates.matrix !== undefined ? updates.matrix : prev.matrix;
      const nextMatrix = ensureMatrixShape(nextPos, nextPlos, nextMatrixBase);

      const nextState = {
        ...prev,
        ...updates,
        pos: nextPos,
        peos: nextPos,
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
    return (raw || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const textToInlineHtml = (raw: string): string => {
    return escapeHtml(raw).replace(/\n/g, '<br/>');
  };

  function buildMucTieuHtml(s: S2PLOData): string {
    const posHtml = s.pos.map((po, idx) => `<p><b>${getPoCode(idx)}.</b> ${textToInlineHtml(po.content)}</p>`).join('');
    return `${s.mucTieuHeadingHtml || ''}${posHtml}`;
  }

  function buildChuanDauRaHtml(s: S2PLOData): string {
    const plosHtml = s.plos.map((plo, ploIdx) => {
      const domainText = getDomainLabel(plo.domain);
      const pisHtml = plo.pis.map((pi, piIdx) => `<p style="margin-left: 16px;"><b>${getPiCode(ploIdx, piIdx)}.</b> ${textToInlineHtml(pi.content)}</p>`).join('');
      return `<div><p><b>${getPloCode(ploIdx)} [${domainText}]:</b> ${textToInlineHtml(plo.content)}</p>${pisHtml}</div>`;
    }).join('');
    return `${s.chuanDauRaHeadingHtml || ''}${plosHtml}`;
  }

  function buildMatrixHtml(s: S2PLOData): string {
    if (!s.pos.length || !s.plos.length) return '';
    const headerRow1 = `<tr><th rowspan="2" style="text-align:left;">Mục tiêu (PO)</th>${s.plos.map((plo, ploIdx) => `<th colspan="${plo.pis.length}">${getPloCode(ploIdx)}</th>`).join('')}</tr>`;
    const headerRow2 = `<tr>${s.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => `<th>${getPiCode(ploIdx, piIdx)}</th>`).join('')).join('')}</tr>`;
    const body = s.pos.map((_, poIdx) => {
      const cells = s.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => `<td>${s.matrix?.[poIdx]?.[ploIdx]?.[piIdx] ? '✓' : ''}</td>`).join('')).join('');
      return `<tr><td><b>${getPoCode(poIdx)}</b></td>${cells}</tr>`;
    }).join('');
    return `<table class="matrix-table"><thead>${headerRow1}${headerRow2}</thead><tbody>${body}</tbody></table>`;
  }

  // PO Actions
  const addPO = () => {
    if (state.pos.length >= 10) return;
    const nextCode = getPoCode(state.pos.length);
    handleStateChange({ pos: [...state.pos, { code: nextCode, content: '' }] }, true);
  };

  const removePO = (idx: number) => {
    handleStateChange({ pos: state.pos.filter((_, i) => i !== idx) }, true);
  };

  const updatePO = (idx: number, content: string) => {
    if (content.trim()) {
      clearError(`po-${idx}`);
    }
    const newPos = state.pos.map((po, i) => i === idx ? { ...po, content } : po);
    handleStateChange({ pos: newPos }, false);
  };

  // PLO Actions
  const addPLO = () => {
    const nextPloIdx = state.plos.length;
    handleStateChange({
      plos: [
        ...state.plos,
        {
          code: getPloCode(nextPloIdx),
          domain: 'KNOWLEDGE',
          content: '',
          pis: [
            { code: getPiCode(nextPloIdx, 0), content: '' },
            { code: getPiCode(nextPloIdx, 1), content: '' }
          ]
        }
      ]
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

  const updatePloDomain = (idx: number, domain: DomainType) => {
    const newPlos = state.plos.map((plo, i) => i === idx ? { ...plo, domain } : plo);
    handleStateChange({ plos: newPlos }, true);
  };

  // PI Actions
  const addPI = (ploIdx: number) => {
    const targetPlo = state.plos[ploIdx];
    const nextPiIdx = targetPlo.pis.length;
    const newPlos = state.plos.map((plo, idx) =>
      idx === ploIdx ? { ...plo, pis: [...plo.pis, { code: getPiCode(ploIdx, nextPiIdx), content: '' }] } : plo
    );
    handleStateChange({ plos: newPlos }, true);
  };

  const removePI = (ploIdx: number, piIdx: number) => {
    handleStateChange({
      plos: state.plos.map((plo, idx) => {
        if (idx !== ploIdx) return plo;
        const nextPis = plo.pis.filter((_, pIdx) => pIdx !== piIdx);
        return { ...plo, pis: nextPis.length ? nextPis : [{ code: getPiCode(ploIdx, 0), content: '' }] };
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

  const toggleMatrix = (poIdx: number, ploIdx: number, piIdx: number) => {
    const newMatrix = [...state.matrix];
    if (!newMatrix[poIdx]) newMatrix[poIdx] = [];
    if (!newMatrix[poIdx][ploIdx]) newMatrix[poIdx][ploIdx] = [];
    newMatrix[poIdx][ploIdx][piIdx] = !newMatrix[poIdx][ploIdx][piIdx];
    handleStateChange({ matrix: newMatrix }, true);
  };

  // Accordion Sections
  const collapseItems = [
    {
      key: '1',
      label: (
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="text-amber-500">✦</span> Mục tiêu chương trình đào tạo (PO)
        </span>
      ),
      children: (
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Đề mục mục tiêu đào tạo (mục 1)</span>
              <span className="text-red-500">*</span>
            </div>
            <div id="muc-tieu-heading-editor">
              <RichtextEditor
                value={state.mucTieuHeadingHtml}
                disabled={readonly}
                contentType="PEO"
                metadata={campaignMeta}
                minHeight={100}
                onChange={(val) => {
                  clearError('mucTieuHeading');
                  handleStateChange({ mucTieuHeadingHtml: val }, false);
                }}
                onApplyParsed={(parsed) => {
                  if (parsed.peos && parsed.peos.length > 0) {
                    const newPos = parsed.peos.map((text, idx) => ({ code: getPoCode(idx), content: text }));
                    clearError('mucTieuHeading');
                    handleStateChange({
                      mucTieuHeadingHtml: parsed.mucTieuChung || state.mucTieuHeadingHtml,
                      pos: newPos
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
            {state.pos.map((po, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-16 pt-2 shrink-0">
                  <span className="text-xs font-bold text-slate-800 font-mono">{getPoCode(idx)}</span>
                </div>
                <div className="flex-1">
                  <TextArea
                    id={`po-input-${idx}`}
                    value={po.content}
                    disabled={readonly}
                    onChange={(e) => updatePO(idx, e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Nhập nội dung mục tiêu đào tạo (PO)..."
                    autoSize={{ minRows: 2 }}
                    className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-900 ${
                      errors[`po-${idx}`]
                        ? 'border-red-500 bg-red-50/20 ring-2 ring-red-400/20'
                        : 'border-slate-200 bg-white focus:ring-2 focus:ring-brand-500'
                    }`}
                  />
                  {errors[`po-${idx}`] && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{errors[`po-${idx}`]}</span>
                    </div>
                  )}
                </div>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removePO(idx)}
                    title="Xóa PO"
                    className="w-8 h-8 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center shrink-0 mt-1 transition-colors"
                  >
                    <DeleteOutlined className="text-xs" />
                  </button>
                )}
              </div>
            ))}
            {!readonly && (
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={addPO}
                disabled={state.pos.length >= 10}
                className="text-brand-600 hover:text-brand-700 font-semibold p-0 text-xs"
              >
                + Thêm mục tiêu (PO)
              </Button>
            )}
          </div>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="text-amber-500">✦</span> Chuẩn đầu ra (PO/PLO) &amp; Chỉ số PI
        </span>
      ),
      children: (
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Chuẩn đầu ra CTĐT (PO/PLO) và chỉ số PI:</span>
              <span className="text-red-500">*</span>
            </div>
            <div id="chuan-dau-ra-heading-editor">
              <RichtextEditor
                value={state.chuanDauRaHeadingHtml}
                disabled={readonly}
                contentType="PLO"
                metadata={campaignMeta}
                minHeight={100}
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
            {state.plos.length === 0 && <Text type="secondary" italic>Chưa có PLO nào.</Text>}
            {state.plos.map((plo, ploIdx) => (
              <div
                key={ploIdx}
                className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 hover:border-slate-300 transition-colors shadow-2xs"
              >
                {/* PLO Row */}
                <div className="flex flex-col md:flex-row gap-3 items-start">
                  <div className="w-16 pt-2 shrink-0">
                    <span className="text-xs font-bold text-slate-800 font-mono">{getPloCode(ploIdx)}</span>
                  </div>

                  <div className="w-48 shrink-0">
                    {readonly ? (
                      <Tag
                        color={plo.domain === 'SKILL' ? 'blue' : plo.domain === 'ATTITUDE' ? 'gold' : 'green'}
                        className="rounded font-semibold text-xs py-0.5 px-2.5"
                      >
                        {getDomainLabel(plo.domain)}
                      </Tag>
                    ) : (
                      <Select
                        value={plo.domain || 'KNOWLEDGE'}
                        onChange={(val) => updatePloDomain(ploIdx, val)}
                        options={DOMAIN_OPTIONS}
                        className="w-full text-xs font-medium"
                      />
                    )}
                  </div>

                  <div className="flex-1 w-full">
                    <TextArea
                      id={`plo-input-${ploIdx}`}
                      value={plo.content}
                      disabled={readonly}
                      onChange={(e) => updatePLO(ploIdx, e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Nhập nội dung chuẩn đầu ra PLO..."
                      autoSize={{ minRows: 2 }}
                      className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-900 ${
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
                      onClick={() => removePLO(ploIdx)}
                      title="Xóa PLO"
                      className="w-8 h-8 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center shrink-0 mt-1 transition-colors"
                    >
                      <DeleteOutlined className="text-xs" />
                    </button>
                  )}
                </div>

                {/* Sub-block PI */}
                <div className="ml-0 md:ml-16 bg-slate-50/60 p-4 rounded-lg border border-slate-200/80 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 pb-1 border-b border-slate-200/60">
                    PI thuộc {getPloCode(ploIdx)} này:
                  </div>

                  <div className="space-y-3">
                    {plo.pis.map((pi, piIdx) => (
                      <div key={piIdx} className="flex gap-2.5 items-start">
                        <div className="w-16 pt-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-700 font-mono">
                            {getPiCode(ploIdx, piIdx)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <TextArea
                            id={`pi-input-${ploIdx}-${piIdx}`}
                            value={pi.content}
                            disabled={readonly}
                            onChange={(e) => updatePI(ploIdx, piIdx, e.target.value)}
                            onBlur={handleBlur}
                            placeholder="Nội dung chỉ số thực hiện (PI)..."
                            autoSize={{ minRows: 2 }}
                            className={`w-full rounded-md px-3 py-1.5 text-xs focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-900 ${
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
                        {!readonly && (
                          <button
                            type="button"
                            onClick={() => removePI(ploIdx, piIdx)}
                            title="Xóa PI"
                            className="w-7 h-7 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center shrink-0 mt-1 transition-colors"
                          >
                            <DeleteOutlined className="text-xs" />
                          </button>
                        )}
                      </div>
                    ))}

                    {!readonly && (
                      <div className="pt-1">
                        <Button
                          type="default"
                          size="small"
                          icon={<PlusOutlined className="text-xs" />}
                          onClick={() => addPI(ploIdx)}
                          className="text-xs border-dashed border-emerald-400 text-emerald-700 hover:text-emerald-800 hover:border-emerald-600 rounded bg-emerald-50/30"
                        >
                          + Thêm PI
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!readonly && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addPLO}
                className="w-full text-brand-600 hover:text-brand-700 font-semibold border-brand-300 hover:border-brand-500 h-10 rounded-lg"
              >
                + Thêm chuẩn đầu ra PLO
              </Button>
            )}
          </div>
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="text-amber-500">✦</span> Ma trận tích hợp mục tiêu &amp; chuẩn đầu ra (PO ↔ PI)
        </span>
      ),
      children: (
        <div className="space-y-3 pt-2">
          <div className="text-xs text-slate-500">
            Đánh dấu tích để xác định mối quan hệ tương quan giữa các Mục tiêu đào tạo (PO) và Chỉ số đo lường (PI).
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th rowSpan={2} className="border border-slate-200 p-2 text-left font-semibold text-slate-600">Mục tiêu (PO)</th>
                  {state.plos.map((plo, ploIdx) => (
                    <th key={ploIdx} colSpan={plo.pis.length} className="border border-slate-200 p-2 text-center font-semibold text-slate-700 border-l">
                      {getPloCode(ploIdx)}
                    </th>
                  ))}
                </tr>
                <tr>
                  {state.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => (
                    <th key={`${ploIdx}-${piIdx}`} className="border border-slate-200 p-1.5 text-center font-medium text-slate-500 border-l">
                      {getPiCode(ploIdx, piIdx)}
                    </th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {state.pos.map((po, poIdx) => (
                  <tr key={poIdx} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-2 font-medium text-slate-700 font-mono">{getPoCode(poIdx)}</td>
                    {state.plos.map((plo, ploIdx) => plo.pis.map((_, piIdx) => (
                      <td key={`${poIdx}-${ploIdx}-${piIdx}`} className="border border-slate-200 p-2 text-center border-l">
                        <Checkbox
                          checked={!!state.matrix?.[poIdx]?.[ploIdx]?.[piIdx]}
                          disabled={readonly}
                          onChange={() => toggleMatrix(poIdx, ploIdx, piIdx)}
                        />
                      </td>
                    )))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full pb-8">
      <Collapse
        activeKey={activeAccordionKeys}
        onChange={(keys) => setActiveAccordionKeys(Array.isArray(keys) ? keys as string[] : [keys as string])}
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
