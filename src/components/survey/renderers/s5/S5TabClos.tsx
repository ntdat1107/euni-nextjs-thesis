'use client';

import React, { useMemo, useCallback } from 'react';
import { Button, Select, Tag, Typography } from 'antd';
import { Plus, Trash2, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { FastTextArea } from '@/components/common/FastInputs';
import { CLOItem, CourseSyllabusData, PloDomainGroup } from './types';
import { BLOOM_OPTIONS, MASTERY_OPTIONS, getBloomMeta, uid } from './constants';
import { helperParsePloDomains } from './utils';
import { S5CloPloMatrix } from './S5CloPloMatrix';

const { Text } = Typography;

interface S5TabClosProps {
  data: CourseSyllabusData;
  readonly: boolean;
  availablePlos?: { code: string; title: string }[];
  ploDomains?: PloDomainGroup[];
  onChange: (updated: Partial<CourseSyllabusData>) => void;
}

export const S5TabClos: React.FC<S5TabClosProps> = ({
  data,
  readonly,
  ploDomains = [],
  onChange,
}) => {
  const clos = useMemo(() => data.clos || [], [data.clos]);

  const resolvedPloDomains = useMemo(() => {
    if (Array.isArray(ploDomains) && ploDomains.length > 0) return ploDomains;
    return helperParsePloDomains([]);
  }, [ploDomains]);

  // Quality KPI Stats
  const stats = useMemo(() => {
    const total = clos.length;
    const withPi = clos.filter(c => Array.isArray(c.mappedPlos) && c.mappedPlos.length > 0).length;
    const isStandardCount = total >= 3 && total <= 6;
    return { total, withPi, isStandardCount };
  }, [clos]);

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

  return (
    <div className="space-y-6 max-w-5xl p-6">
      {/* 1. Header Bar with Guidelines & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Award size={18} />
            </div>
            <div>
              <Text strong className="text-sm font-bold text-slate-800 uppercase tracking-wide block">
                Chuẩn đầu ra học phần (CLO - Course Learning Outcomes)
              </Text>
              <p className="text-xs text-slate-500 mt-0.5 mb-0">
                Mỗi học phần có từ 3 đến 6 CLO đo lường được theo thang Bloom. Mối quan hệ đóng góp vào các PI của CTĐT được thiết lập tập trung tại Bảng ma trận bên dưới.
              </p>
            </div>
          </div>
        </div>

        {/* Quality KPI Indicators Strip */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap text-xs">
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
      </div>

      {/* 2. Danh sách CLO Card Items (Không dùng DDL ánh xạ - quản lý tập trung ở Ma trận bên dưới) */}
      <div className="space-y-4">
        {clos.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs space-y-2">
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

                    {/* Mapped PI Count Indicator (phản ánh từ Ma trận bên dưới) */}
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

        {/* Add CLO Action Button directly below the CLO list */}
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

      {/* 3. Bảng Ma trận Chuẩn đầu ra học phần (CLO) ↔ Chuẩn đầu ra CTĐT (PLO/PI) */}
      <S5CloPloMatrix
        clos={clos}
        ploDomains={resolvedPloDomains}
        readonly={readonly}
        onToggleMapping={handleTogglePiMapping}
      />
    </div>
  );
};

export default S5TabClos;
