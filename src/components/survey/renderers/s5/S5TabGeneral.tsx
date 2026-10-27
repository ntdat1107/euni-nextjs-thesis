'use client';

import React, { useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button, Select, Tag, Typography } from 'antd';
import { Plus, Trash2, BookOpen, Target, Sparkles } from 'lucide-react';
import { FastTextArea } from '@/components/common/FastInputs';
import { COItem, CODomain, CourseSyllabusData } from './types';
import { CO_DOMAIN_OPTIONS, getCoDomainMeta, uid } from './constants';
import { helperExtractCos, helperSyncObjectivesFromCos } from './utils';

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
  loading: () => <div className="h-28 bg-slate-50 border border-slate-200 rounded animate-pulse" />
});

const { Text, Title } = Typography;

interface S5TabGeneralProps {
  data: CourseSyllabusData;
  readonly: boolean;
  onChange: (updated: Partial<CourseSyllabusData>) => void;
}

export const S5TabGeneral: React.FC<S5TabGeneralProps> = ({ data, readonly, onChange }) => {
  const cos = useMemo(() => helperExtractCos(data), [data.cos, data.knowledgeObjective, data.skillsObjective, data.attitudesObjective]);

  const handleUpdateCos = useCallback((newCos: COItem[]) => {
    const syncedObjectives = helperSyncObjectivesFromCos(newCos);
    onChange({
      cos: newCos,
      ...syncedObjectives,
    });
  }, [onChange]);

  const handleAddCo = () => {
    const nextIdx = cos.length + 1;
    // Auto-cycle default domain
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
    // Re-index codes sequentially
    const reindexed = filtered.map((c, i) => ({ ...c, code: `CO${i + 1}` }));
    handleUpdateCos(reindexed);
  };

  return (
    <div className="space-y-6 max-w-5xl p-6">
      {/* 1. Mô tả tóm tắt học phần */}
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
            Hỗ trợ trợ lý AI viết & tinh chỉnh
          </span>
        </div>

        <RichtextEditor
          value={data.courseDescription || ''}
          disabled={readonly}
          contentType="COURSE_DESCRIPTION"
          metadata={{ courseName: data.courseName, courseCode: data.courseCode, credits: data.credits }}
          minHeight={120}
          placeholder="Mô tả vị trí, vai trò, nội dung tổng quan và đối tượng của học phần trong chương trình..."
          onChange={val => onChange({ courseDescription: val })}
        />
      </div>

      {/* 2. Mục tiêu học phần CO - Tương tự phong cách PO Step 2 */}
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
        </div>

        {/* Danh sách các CO Items */}
        <div className="space-y-3">
          {cos.map((co) => {
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
    </div>
  );
};

export default S5TabGeneral;
