'use client';

import React, { useMemo, useCallback } from 'react';
import { Button, Input, InputNumber, Typography, Tooltip, Modal } from 'antd';
import { Plus, Trash2, CheckCircle2, AlertCircle, RotateCcw, CheckSquare, Info } from 'lucide-react';
import { FastTextArea } from '@/components/common/FastInputs';
import { AssessmentComponent, CourseSyllabusData } from './types';
import { DEFAULT_ASSESSMENT_PRESET, uid } from './constants';
import { S5AssessmentMatrix } from './S5AssessmentMatrix';

const { Text } = Typography;

interface S5TabAssessmentProps {
  data: CourseSyllabusData;
  readonly: boolean;
  onChange: (updated: Partial<CourseSyllabusData>) => void;
}

export const S5TabAssessment: React.FC<S5TabAssessmentProps> = ({
  data,
  readonly,
  onChange,
}) => {
  const components = useMemo(() => data.assessmentComponents || [], [data.assessmentComponents]);
  const clos = useMemo(() => data.clos || [], [data.clos]);

  const totalWeight = useMemo(() => {
    return components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  }, [components]);

  const isWeightValid = totalWeight === 100;

  const handleAddComponent = () => {
    const newComp: AssessmentComponent = {
      id: uid(),
      name: `Thành phần đánh giá ${components.length + 1}`,
      weight: 10,
      method: 'written',
      criteria: 'Quy định tiêu chí đánh giá và hình thức thực hiện...',
      description: '',
      mappedClos: clos.length > 0 ? [clos[0].code] : [],
    };
    onChange({ assessmentComponents: [...components, newComp] });
  };

  const handleUpdateComponent = useCallback(
    (id: string, field: keyof AssessmentComponent, value: any) => {
      const updated = components.map(c => (c.id === id ? { ...c, [field]: value } : c));
      onChange({ assessmentComponents: updated });
    },
    [components, onChange]
  );

  const handleDeleteComponent = (id: string) => {
    onChange({ assessmentComponents: components.filter(c => c.id !== id) });
  };

  const handleApplyPreset = () => {
    Modal.confirm({
      title: 'Áp dụng khung đánh giá chuẩn Nhà trường (HUMG)',
      content:
        'Hành động này sẽ thiết lập 4 thành phần đánh giá chuẩn: Chuyên cần (10%), Tự học & bài tập (10%), Giữa kỳ (20%), Cuối kỳ (60%). Bạn có muốn tiếp tục?',
      okText: 'Áp dụng mẫu chuẩn',
      cancelText: 'Hủy',
      centered: true,
      onOk: () => {
        const cloCodes = clos.map(c => c.code);
        const preset = DEFAULT_ASSESSMENT_PRESET.map((p, idx) => ({
          ...p,
          id: uid(),
          mappedClos: idx === 3 ? cloCodes : cloCodes.slice(0, Math.min(idx + 2, cloCodes.length)),
        }));
        onChange({ assessmentComponents: preset });
      },
    });
  };

  const handleToggleMatrixMapping = (componentId: string, cloCode: string) => {
    if (readonly) return;
    const targetComp = components.find(c => c.id === componentId);
    if (!targetComp) return;

    const currentMapped = targetComp.mappedClos || [];
    const nextMapped = currentMapped.includes(cloCode)
      ? currentMapped.filter(code => code !== cloCode)
      : [...currentMapped, cloCode];

    handleUpdateComponent(componentId, 'mappedClos', nextMapped);
  };

  return (
    <div className="space-y-6 max-w-5xl p-6">
      {/* 1. Header Bar with KPI Strip & Preset Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <CheckSquare size={18} />
            </div>
            <div>
              <Text strong className="text-sm font-bold text-slate-800 uppercase tracking-wide block">
                Đánh giá kết quả học tập của sinh viên
              </Text>
              <p className="text-xs text-slate-500 mt-0.5 mb-0">
                Xác định các điểm thành phần, hình thức tiêu chí đánh giá và bảng ma trận đo lường Chuẩn đầu ra học phần (CLO).
              </p>
            </div>
          </div>
        </div>

        {/* Quality KPI Indicators Strip */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span>Tổng trọng số:</span>
            <strong className={isWeightValid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold font-mono text-sm'}>
              {totalWeight}%
            </strong>
            {isWeightValid ? (
              <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" /> (Hợp lệ)
              </span>
            ) : (
              <span className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle size={13} className="text-rose-600 shrink-0" /> (Cần đúng 100%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <span>Số bài đánh giá:</span>
            <strong className="text-slate-800 font-bold">{components.length} cột điểm</strong>
          </div>
        </div>
      </div>

      {/* 2. Bảng Đánh giá học phần */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200">
          <Text strong className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
            Cách đánh giá học phần
          </Text>
          <p className="text-xs text-slate-500 mt-0.5 mb-0">
            Quy định các điểm thành phần, hình thức thực hiện và trọng số % đóng góp vào điểm tổng kết học phần.
          </p>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-slate-700 w-12">
                  TT
                </th>
                <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-700 w-60">
                  Điểm thành phần
                </th>
                <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-700 min-w-[280px]">
                  Quy định / Tiêu chí &amp; Hình thức thực hiện
                </th>
                <th className="border border-slate-200 p-2.5 text-center font-bold text-slate-700 w-28">
                  Trọng số (%)
                </th>
                {!readonly && (
                  <th className="border border-slate-200 p-2.5 text-center font-bold text-slate-700 w-16">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {components.length === 0 ? (
                <tr>
                  <td
                    colSpan={readonly ? 4 : 5}
                    className="p-8 text-center text-slate-400 italic bg-slate-50/30 border border-slate-200"
                  >
                    Chưa có thành phần đánh giá nào. Nhấp vào &ldquo;Áp dụng mẫu chuẩn HUMG&rdquo; hoặc &ldquo;Thêm thành phần&rdquo; ở trên.
                  </td>
                </tr>
              ) : (
                components.map((comp, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={comp.id}
                      className={`${isEven ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/20 transition-colors`}
                    >
                      {/* TT */}
                      <td className="border border-slate-200 p-2.5 text-center font-mono font-bold text-slate-600 align-top">
                        {idx + 1}
                      </td>

                      {/* Điểm thành phần */}
                      <td className="border border-slate-200 p-2.5 align-top">
                        {readonly ? (
                          <span className="font-semibold text-slate-800 text-xs">{comp.name}</span>
                        ) : (
                          <Input
                            value={comp.name}
                            onChange={e => handleUpdateComponent(comp.id, 'name', e.target.value)}
                            placeholder="Ví dụ: Điểm kiểm tra giữa kỳ"
                            className="text-xs font-medium rounded border-slate-200"
                          />
                        )}
                      </td>

                      {/* Quy định tiêu chí */}
                      <td className="border border-slate-200 p-2.5 align-top">
                        {readonly ? (
                          <span className="text-slate-600 text-xs whitespace-pre-line">
                            {comp.criteria || comp.description || '-'}
                          </span>
                        ) : (
                          <FastTextArea
                            value={comp.criteria || comp.description || ''}
                            onDebouncedChange={val => handleUpdateComponent(comp.id, 'criteria', val)}
                            placeholder="Quy định hình thức (thi viết/trắc nghiệm/phiếu chuẩn bị), thời lượng, tiêu chuẩn..."
                            rows={2}
                            className="w-full text-xs rounded border-slate-200"
                          />
                        )}
                      </td>

                      {/* Trọng số % */}
                      <td className="border border-slate-200 p-2.5 text-center align-top">
                        {readonly ? (
                          <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {comp.weight}%
                          </span>
                        ) : (
                          <InputNumber
                            min={0}
                            max={100}
                            value={comp.weight}
                            formatter={v => `${v}%`}
                            parser={(v: any) => v.replace('%', '')}
                            onChange={v => handleUpdateComponent(comp.id, 'weight', v || 0)}
                            className="w-20 text-xs font-mono font-semibold"
                            size="small"
                          />
                        )}
                      </td>

                      {/* Thao tác */}
                      {!readonly && (
                        <td className="border border-slate-200 p-2.5 text-center align-top">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<Trash2 size={14} />}
                            onClick={() => handleDeleteComponent(comp.id)}
                            disabled={components.length <= 1}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded h-7 w-7 p-0"
                            title="Xóa cột điểm này"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {components.length > 0 && (
              <tfoot className="bg-slate-50/90 font-semibold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="border border-slate-200 p-2.5 text-right text-slate-700 font-bold">
                    Tổng cộng trọng số:
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center font-mono">
                    <span
                      className={`font-bold text-xs px-2 py-0.5 rounded border ${
                        isWeightValid
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-rose-600 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {totalWeight}%
                    </span>
                  </td>
                  {!readonly && <td className="border border-slate-200 p-2.5" />}
                </tr>
              </tfoot>
            )}
          </table>

          {/* Action Row below Table */}
          {!readonly && (
            <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-slate-100 flex-wrap gap-2">
              <Button
                type="dashed"
                icon={<Plus size={13} />}
                onClick={handleAddComponent}
                className="text-xs h-8 px-3.5 font-medium border-blue-300 text-blue-700 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                Thêm thành phần đánh giá
              </Button>

              <Tooltip title="Thiết lập 4 cột điểm chuẩn: 10% Chuyên cần + 10% Tự học + 20% Giữa kỳ + 60% Cuối kỳ">
                <Button
                  size="small"
                  icon={<RotateCcw size={12} />}
                  onClick={handleApplyPreset}
                  className="rounded text-xs h-8 px-3 border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 flex items-center gap-1.5"
                >
                  Áp dụng mẫu chuẩn HUMG (10 - 10 - 20 - 60)
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* 3. Quy định cách tính điểm */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-blue-600 shrink-0" />
          <Text strong className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Quy định cách tính điểm
          </Text>
        </div>
        <div className="space-y-1.5 text-xs text-slate-600 pl-6">
          <p className="mb-0 leading-relaxed">
            • Điểm đánh giá thành phần và điểm thi kết thúc học phần được chấm theo thang điểm 10 (từ 0 đến 10), làm tròn đến một chữ số thập phân.
          </p>
          <p className="mb-0 leading-relaxed">
            • Điểm học phần là tổng điểm của tất cả các điểm đánh giá thành phần của học phần nhân với trọng số tương ứng. Điểm học phần tính theo thang điểm 10 làm tròn đến một chữ số thập phân, sau đó được quy đổi sang điểm chữ và điểm số theo thang điểm 4 theo Quy chế công tác đào tạo hiện hành của Nhà trường.
          </p>
        </div>
      </div>

      {/* 4. Mục 9.3: Bảng Ma trận CLO ↔ Bài đánh giá */}
      <S5AssessmentMatrix
        clos={clos}
        components={components}
        readonly={readonly}
        onToggleMapping={handleToggleMatrixMapping}
      />
    </div>
  );
};

export default S5TabAssessment;
