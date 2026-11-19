'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button, Select, Tag, Typography, message } from 'antd';
import {
  Plus,
  Trash2,
  BookOpen,
  Target,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FastTextArea } from '@/components/common/FastInputs';
import { COItem, CODomain, CLOItem, CourseSyllabusData, PloDomainGroup } from './types';
import {
  CO_DOMAIN_OPTIONS,
  getCoDomainMeta,
  BLOOM_OPTIONS,
  MASTERY_OPTIONS,
  getBloomMeta,
  uid,
} from './constants';
import {
  helperExtractCos,
  helperSyncObjectivesFromCos,
  helperParsePloDomains,
} from './utils';
import { AiAssistantModal } from '@/components/common/ai/AiAssistantModal';
import { S5CloPloMatrix } from './S5CloPloMatrix';

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
  loading: () => <div className="h-28 bg-slate-50 border border-slate-200 rounded animate-pulse" />,
});

const { Text } = Typography;

interface S5TabGeneralAndClosProps {
  data: CourseSyllabusData;
  readonly: boolean;
  availablePlos?: { code: string; title: string }[];
  ploDomains?: PloDomainGroup[];
  campaignMeta?: Record<string, any>;
  onChange: (updated: Partial<CourseSyllabusData>) => void;
}

export const S5TabGeneralAndClos: React.FC<S5TabGeneralAndClosProps> = ({
  data,
  readonly,
  availablePlos = [],
  ploDomains = [],
  campaignMeta = {},
  onChange,
}) => {
  // AI Modals state
  const [isAiAllOpen, setIsAiAllOpen] = useState(false);
  const [isAiCoOpen, setIsAiCoOpen] = useState(false);
  const [isAiCloOpen, setIsAiCloOpen] = useState(false);
  const [isAiMatrixOpen, setIsAiMatrixOpen] = useState(false);

  // COs
  const cos = useMemo(
    () => helperExtractCos(data),
    [data.cos, data.knowledgeObjective, data.skillsObjective, data.attitudesObjective]
  );

  // CLOs
  const clos = useMemo(() => data.clos || [], [data.clos]);

  // PLO Domains
  const resolvedPloDomains = useMemo(() => {
    if (Array.isArray(ploDomains) && ploDomains.length > 0) return ploDomains;
    return helperParsePloDomains([]);
  }, [ploDomains]);

  // Quality KPI Stats for CLO
  const stats = useMemo(() => {
    const total = clos.length;
    const withPi = clos.filter(c => Array.isArray(c.mappedPlos) && c.mappedPlos.length > 0).length;
    const isStandardCount = total >= 3 && total <= 6;
    return { total, withPi, isStandardCount };
  }, [clos]);

  // --- Handlers for CO ---
  const handleUpdateCos = useCallback(
    (newCos: COItem[]) => {
      const syncedObjectives = helperSyncObjectivesFromCos(newCos);
      onChange({
        cos: newCos,
        ...syncedObjectives,
      });
    },
    [onChange]
  );

  const handleAddCo = () => {
    const nextIdx = cos.length + 1;
    const domains: CODomain[] = ['KNOWLEDGE', 'SKILL', 'AUTONOMY'];
    const domain = domains[(nextIdx - 1) % domains.length];
    const newCo: COItem = {
      id: uid(),
      code: `CO${nextIdx}`,
      domain,
      content: '',
    };
    handleUpdateCos([...cos, newCo]);
  };

  const handleCoChange = (id: string, field: keyof COItem, value: any) => {
    const updated = cos.map(c => (c.id === id ? { ...c, [field]: value } : c));
    handleUpdateCos(updated);
  };

  const handleRemoveCo = (id: string) => {
    const filtered = cos.filter(c => c.id !== id);
    const reindexed = filtered.map((c, i) => ({ ...c, code: `CO${i + 1}` }));
    handleUpdateCos(reindexed);
  };

  // --- Handlers for CLO ---
  const handleAddClo = () => {
    const nextIndex = clos.length + 1;
    const newClo: CLOItem = {
      id: uid(),
      code: `CLO${nextIndex}`,
      content: '',
      mappedPlos: [],
      bloomLevel: '3',
      masteryLevel: 'R',
    };
    onChange({ clos: [...clos, newClo] });
  };

  const handleUpdateClo = useCallback(
    (id: string, field: keyof CLOItem, value: any) => {
      const updated = clos.map(c => (c.id === id ? { ...c, [field]: value } : c));
      onChange({ clos: updated });
    },
    [clos, onChange]
  );

  const handleDeleteClo = (id: string) => {
    const filtered = clos.filter(c => c.id !== id);
    const reindexed = filtered.map((c, i) => ({ ...c, code: `CLO${i + 1}` }));
    onChange({ clos: reindexed });
  };

  const handleTogglePiMapping = (cloId: string, piCode: string) => {
    if (readonly) return;
    const targetClo = clos.find(c => c.id === cloId);
    if (!targetClo) return;

    const currentMapped = targetClo.mappedPlos || [];
    const nextMapped = currentMapped.includes(piCode)
      ? currentMapped.filter(code => code !== piCode)
      : [...currentMapped, piCode];

    handleUpdateClo(cloId, 'mappedPlos', nextMapped);
  };

  // --- AI Apply Handlers ---
  const handleApplyAiAll = useCallback(
    (result: any) => {
      const updates: Partial<CourseSyllabusData> = {};

      if (result.courseDescription) {
        updates.courseDescription = result.courseDescription;
      }

      if (Array.isArray(result.cos) && result.cos.length > 0) {
        const newCos: COItem[] = result.cos.map((c: any, idx: number) => ({
          id: uid(),
          code: c.code || `CO${idx + 1}`,
          domain: c.domain || 'KNOWLEDGE',
          content: c.content || '',
        }));
        updates.cos = newCos;
        Object.assign(updates, helperSyncObjectivesFromCos(newCos));
      }

      if (Array.isArray(result.clos) && result.clos.length > 0) {
        const newClos: CLOItem[] = result.clos.map((c: any, idx: number) => ({
          id: uid(),
          code: c.code || `CLO${idx + 1}`,
          content: c.content || '',
          bloomLevel: c.bloomLevel || '3',
          masteryLevel: c.masteryLevel || 'R',
          mappedPlos: Array.isArray(c.mappedPlos) ? c.mappedPlos : [],
        }));

        if (result.mappings && typeof result.mappings === 'object') {
          newClos.forEach(c => {
            const code = c.code.toUpperCase();
            if (result.mappings[code]) {
              c.mappedPlos = result.mappings[code];
            }
          });
        }
        updates.clos = newClos;
      }

      onChange(updates);
      message.success('Đã áp dụng trọn bộ đề xuất của Trợ lý AI (Mô tả, CO, CLO & Ma trận)');
    },
    [onChange]
  );

  const handleApplyAiCo = useCallback(
    (result: any) => {
      if (result.cos && result.cos.length > 0) {
        const newCos: COItem[] = result.cos.map((c: any, idx: number) => ({
          id: uid(),
          code: c.code || `CO${idx + 1}`,
          domain: c.domain || 'KNOWLEDGE',
          content: c.content || '',
        }));
        handleUpdateCos(newCos);
        message.success('Đã áp dụng các mục tiêu học phần (CO) do AI đề xuất');
      } else if (result.rawHtml) {
        message.info('Đã nhận phản hồi từ AI');
      }
    },
    [handleUpdateCos]
  );

  const handleApplyAiClo = useCallback(
    (result: any) => {
      if (Array.isArray(result.clos) && result.clos.length > 0) {
        const newClos: CLOItem[] = result.clos.map((c: any, idx: number) => ({
          id: uid(),
          code: c.code || `CLO${idx + 1}`,
          content: c.content || '',
          bloomLevel: c.bloomLevel || '3',
          masteryLevel: c.masteryLevel || 'R',
          mappedPlos: Array.isArray(c.mappedPlos) ? c.mappedPlos : [],
        }));
        onChange({ clos: newClos });
        message.success('Đã áp dụng danh sách Chuẩn đầu ra (CLO) do AI đề xuất');
      } else {
        message.info('Đã nhận kết quả từ AI');
      }
    },
    [onChange]
  );

  const handleApplyAiMatrix = useCallback(
    (result: any) => {
      if (result.mappings && typeof result.mappings === 'object') {
        const updated = clos.map(c => {
          const cCode = c.code.toUpperCase().trim();
          const mapped = result.mappings[cCode];
          if (Array.isArray(mapped)) {
            return { ...c, mappedPlos: mapped };
          }
          return c;
        });
        onChange({ clos: updated });
        message.success('Đã áp dụng đề xuất ma trận CLO ↔ PLO/PI từ AI');
      } else {
        message.info('Đã nhận phản hồi ma trận từ AI');
      }
    },
    [clos, onChange]
  );

  // Metadata contexts for AI
  const baseAiMetadata = useMemo(
    () => ({
      'Tên học phần': data.courseName,
      'Mã học phần': data.courseCode,
      'Số tín chỉ': data.credits,
      'Khoa phụ trách': data.department,
      ...campaignMeta,
    }),
    [data.courseName, data.courseCode, data.credits, data.department, campaignMeta]
  );

  return (
    <div className="space-y-6 w-full p-6">
      {/* 0. HERO AI BANNER: Trợ lý AI tổng thể Bước 5 (Tương tự Step 2) */}
      {!readonly && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 via-blue-50/70 to-slate-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Trợ lý AI tổng thể Đề cương &amp; Chuẩn đầu ra (CLO)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  CO • CLO • MA TRẬN
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Tự động đề xuất đồng bộ Mô tả học phần, Mục tiêu (CO), Chuẩn đầu ra (CLO theo Bloom) và Ma trận liên kết PI của CTĐT.
              </div>
            </div>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<Sparkles size={13} />}
            onClick={() => setIsAiAllOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-md text-xs font-semibold h-8 px-3 shrink-0 shadow-xs flex items-center gap-1.5"
          >
            Kích hoạt AI tổng thể
          </Button>
        </div>
      )}

      {/* 1. MÔ TẢ TÓM TẮT HỌC PHẦN */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <BookOpen size={15} />
            </div>
            <div>
              <Text strong className="text-sm font-bold text-slate-800 uppercase tracking-wide block">
                Mô tả tóm tắt học phần (Course Description)
              </Text>
              <span className="text-xs text-slate-500">
                Vị trí, vai trò, nội dung tổng quan và đối tượng của học phần trong CTĐT.
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
            Hỗ trợ trợ lý AI viết &amp; tinh chỉnh
          </span>
        </div>

        <RichtextEditor
          value={data.courseDescription || ''}
          disabled={readonly}
          showAiButton={true}
          contentType="COURSE_DESCRIPTION"
          metadata={{ courseName: data.courseName, courseCode: data.courseCode, credits: data.credits }}
          minHeight={120}
          placeholder="Mô tả vị trí, vai trò, nội dung tổng quan và đối tượng của học phần trong chương trình..."
          onChange={val => onChange({ courseDescription: val })}
        />
      </div>

      {/* 2. MỤC TIÊU HỌC PHẦN (CO) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
              <Target size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Text strong className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Mục tiêu học phần (Course Objectives - CO)
                </Text>
                <Tag color="blue" className="rounded-full text-[11px] font-semibold px-2 py-0 m-0">
                  {cos.length} mục tiêu
                </Tag>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 mb-0">
                Mục tiêu chung về Kiến thức, Kỹ năng và Mức độ tự chủ/trách nhiệm (theo Thông tư 17/2021/TT-BGDĐT).
              </p>
            </div>
          </div>
          {!readonly && (
            <Button
              size="small"
              icon={<Sparkles size={13} className="text-indigo-600 animate-pulse" />}
              onClick={() => setIsAiCoOpen(true)}
              className="bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md h-7 px-2.5 flex items-center gap-1 shadow-2xs"
            >
              Trợ lý AI gợi ý CO
            </Button>
          )}
        </div>

        {/* Danh sách các CO Items */}
        <div className="space-y-3">
          {cos.map(co => {
            const meta = getCoDomainMeta(co.domain);
            return (
              <div
                key={co.id}
                className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                      {co.code}
                    </span>

                    {readonly ? (
                      <Tag color={meta.color} className="rounded text-xs font-medium px-2 py-0.5 m-0">
                        {meta.label}
                      </Tag>
                    ) : (
                      <Select
                        value={co.domain}
                        options={CO_DOMAIN_OPTIONS}
                        onChange={val => handleCoChange(co.id, 'domain', val)}
                        className="w-56 text-xs font-medium"
                        size="small"
                      />
                    )}
                  </div>

                  {!readonly && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<Trash2 size={13} />}
                      onClick={() => handleRemoveCo(co.id)}
                      disabled={cos.length <= 1}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded h-7 w-7 flex items-center justify-center p-0"
                      title="Xóa mục tiêu này"
                    />
                  )}
                </div>

                <div>
                  <FastTextArea
                    value={co.content}
                    disabled={readonly}
                    onDebouncedChange={val => handleCoChange(co.id, 'content', val)}
                    placeholder={`Nhập mục tiêu cụ thể về ${meta.label.toLowerCase()} sinh viên đạt được sau học phần...`}
                    rows={2}
                    className="w-full text-xs rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-800"
                  />
                </div>
              </div>
            );
          })}

          {!readonly && (
            <Button
              type="dashed"
              icon={<Plus size={14} />}
              onClick={handleAddCo}
              className="w-full text-xs h-8 font-medium border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs mt-2"
            >
              Thêm mục tiêu học phần (CO{cos.length + 1})
            </Button>
          )}
        </div>
      </div>

      {/* 3. CHUẨN ĐẦU RA HỌC PHẦN (CLO) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Award size={18} />
            </div>
            <div>
              <Text strong className="text-sm font-bold text-slate-800 uppercase tracking-wide block">
                Chuẩn đầu ra học phần (CLO - Course Learning Outcomes)
              </Text>
              <p className="text-xs text-slate-500 mt-0.5 mb-0">
                Mỗi học phần có từ 3 đến 6 CLO đo lường được theo thang Bloom. Mối quan hệ đóng góp vào các PI của CTĐT được thiết lập tại bảng ma trận bên dưới.
              </p>
            </div>
          </div>

          {!readonly && (
            <Button
              size="small"
              icon={<Sparkles size={13} className="text-indigo-600 animate-pulse" />}
              onClick={() => setIsAiCloOpen(true)}
              className="bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md h-7 px-2.5 flex items-center gap-1 shadow-2xs shrink-0"
            >
              Trợ lý AI gợi ý CLO
            </Button>
          )}
        </div>

        {/* Quality KPI Indicators Strip */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span>Số lượng:</span>
            <strong className={stats.isStandardCount ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {stats.total} CLO
            </strong>
            <span className="text-slate-400 text-[11px]">(chuẩn: 3 - 6)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span>Ánh xạ CTĐT (PI):</span>
            <strong
              className={
                stats.withPi === stats.total && stats.total > 0
                  ? 'text-emerald-700 font-bold'
                  : 'text-amber-700 font-bold'
              }
            >
              {stats.withPi}/{stats.total} CLO
            </strong>
            {stats.withPi === stats.total && stats.total > 0 ? (
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={13} className="text-amber-600 shrink-0" />
            )}
          </div>
        </div>

        {/* Danh sách CLO Card Items */}
        <div className="space-y-3.5">
          {clos.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-slate-600">Chưa có Chuẩn đầu ra (CLO) nào cho học phần này.</p>
              {!readonly && (
                <Button type="primary" size="small" icon={<Plus size={13} />} onClick={handleAddClo} className="bg-blue-600">
                  Khởi tạo CLO đầu tiên
                </Button>
              )}
            </div>
          ) : (
            clos.map(clo => {
              const bloomMeta = getBloomMeta(clo.bloomLevel);
              const mappedPiCount = (clo.mappedPlos || []).length;

              return (
                <div
                  key={clo.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                >
                  {/* Meta Row: Code, Bloom, Mastery, Mapped count indicator, Delete */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      {/* CLO Code */}
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-600 text-white shadow-2xs shrink-0">
                        {clo.code}
                      </span>

                      {/* Bloom Level */}
                      <div className="w-52 shrink-0">
                        {readonly ? (
                          <Tag color={bloomMeta.color} className="rounded text-xs font-semibold px-2 py-0.5 m-0">
                            {bloomMeta.label}
                          </Tag>
                        ) : (
                          <Select
                            value={clo.bloomLevel || '3'}
                            options={BLOOM_OPTIONS}
                            onChange={val => handleUpdateClo(clo.id, 'bloomLevel', val)}
                            className="w-full text-xs font-medium"
                            size="small"
                          />
                        )}
                      </div>

                      {/* Mastery Level */}
                      <div className="w-40 shrink-0">
                        {readonly ? (
                          <Tag color="purple" className="rounded text-[11px] font-medium px-2 py-0.5 m-0">
                            {MASTERY_OPTIONS.find(m => m.value === clo.masteryLevel)?.label || clo.masteryLevel || 'R'}
                          </Tag>
                        ) : (
                          <Select
                            value={clo.masteryLevel || 'R'}
                            options={MASTERY_OPTIONS}
                            onChange={val => handleUpdateClo(clo.id, 'masteryLevel', val)}
                            className="w-full text-xs"
                            size="small"
                          />
                        )}
                      </div>

                      {/* Mapped PI Count Indicator */}
                      <div className="flex items-center gap-1.5 text-xs">
                        {mappedPiCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="font-bold font-mono">{mappedPiCount}</span> PI CTĐT đáp ứng
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa tick chọn PI ở ma trận bên dưới
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    {!readonly && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDeleteClo(clo.id)}
                        disabled={clos.length <= 1}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded h-7 w-7 flex items-center justify-center p-0 shrink-0"
                        title="Xóa CLO này"
                      />
                    )}
                  </div>

                  {/* Content Body: Clean FastTextArea */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Nội dung Chuẩn đầu ra (CLO):</span>
                      <span className="text-[11px] text-slate-400 italic">
                        Bắt đầu bằng động từ hành động đo lường được theo thang {bloomMeta.label.split(':')[0]}
                      </span>
                    </div>
                    <FastTextArea
                      value={clo.content}
                      disabled={readonly}
                      onDebouncedChange={val => handleUpdateClo(clo.id, 'content', val)}
                      placeholder="Ví dụ: Áp dụng được các giải thuật cơ bản để giải quyết bài toán kỹ thuật..."
                      rows={2}
                      className="w-full text-xs rounded-lg border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-800"
                    />
                  </div>
                </div>
              );
            })
          )}

          {clos.length > 0 && !readonly && (
            <Button
              type="dashed"
              icon={<Plus size={14} />}
              onClick={handleAddClo}
              className="w-full text-xs h-9 font-medium border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              Thêm Chuẩn đầu ra (CLO{clos.length + 1})
            </Button>
          )}
        </div>
      </div>

      {/* 4. BẢNG MA TRẬN CLO ↔ PLO/PI */}
      <S5CloPloMatrix
        clos={clos}
        ploDomains={resolvedPloDomains}
        readonly={readonly}
        onToggleMapping={handleTogglePiMapping}
        onOpenAiModal={() => setIsAiMatrixOpen(true)}
      />

      {/* AI Assistant Modals */}
      {/* A. Modal AI Tổng thể */}
      <AiAssistantModal
        open={isAiAllOpen}
        onClose={() => setIsAiAllOpen(false)}
        contentType="S5_ALL"
        metadata={{
          ...baseAiMetadata,
          existingCos: cos.map(c => ({ code: c.code, domain: c.domain, content: c.content })),
          existingClos: clos.map(c => ({ code: c.code, content: c.content, bloomLevel: c.bloomLevel })),
          plos: availablePlos,
        }}
        title="Trợ lý AI - Tổng thể Đề cương & CLO học phần"
        subtitle="Tự động đề xuất đồng bộ Mô tả học phần, Mục tiêu (CO), Chuẩn đầu ra (CLO) và Ma trận đóng góp vào chuẩn đầu ra CTĐT."
        onApply={handleApplyAiAll}
      />

      {/* B. Modal AI CO */}
      <AiAssistantModal
        open={isAiCoOpen}
        onClose={() => setIsAiCoOpen(false)}
        contentType="CO"
        metadata={{
          ...baseAiMetadata,
          existingClos: clos.map(c => ({ code: c.code, content: c.content })),
        }}
        title="Trợ lý AI - Mục tiêu học phần (CO)"
        subtitle="Tự động đề xuất mục tiêu Kiến thức, Kỹ năng và Mức tự chủ theo Thông tư 17."
        onApply={handleApplyAiCo}
      />

      {/* C. Modal AI CLO */}
      <AiAssistantModal
        open={isAiCloOpen}
        onClose={() => setIsAiCloOpen(false)}
        contentType="CLO"
        metadata={{
          ...baseAiMetadata,
          cos: cos.map(c => ({ code: c.code, domain: c.domain, content: c.content })),
          plos: availablePlos,
        }}
        title="Trợ lý AI - Chuẩn đầu ra học phần (CLO)"
        subtitle="Đề xuất các CLO đo lường được theo thang Bloom từ cấp độ 3 đến 5 và gắn chuẩn kỹ năng."
        onApply={handleApplyAiClo}
      />

      {/* D. Modal AI Matrix CLO ↔ PLO/PI */}
      <AiAssistantModal
        open={isAiMatrixOpen}
        onClose={() => setIsAiMatrixOpen(false)}
        contentType="CLO_PLO_MATRIX"
        metadata={{
          ...baseAiMetadata,
          clos: clos.map(c => ({ code: c.code, content: c.content, bloomLevel: c.bloomLevel })),
          plos: availablePlos,
        }}
        title="Trợ lý AI - Ma trận đối sánh CLO ↔ PLO/PI"
        subtitle="Phân tích ngữ nghĩa nội dung CLO và đề xuất ma trận đối sánh vào các PI phù hợp nhất của CTĐT."
        onApply={handleApplyAiMatrix}
      />
    </div>
  );
};

export default S5TabGeneralAndClos;
