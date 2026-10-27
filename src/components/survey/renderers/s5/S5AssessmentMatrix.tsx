'use client';

import React, { useState, useMemo } from 'react';
import { Typography, Tag, Tooltip, Checkbox } from 'antd';
import { TableProperties, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AssessmentComponent, CLOItem } from './types';

const { Text } = Typography;

interface S5AssessmentMatrixProps {
  clos: CLOItem[];
  components: AssessmentComponent[];
  readonly: boolean;
  onToggleMapping: (componentId: string, cloCode: string) => void;
}

export const S5AssessmentMatrix: React.FC<S5AssessmentMatrixProps> = ({
  clos,
  components,
  readonly,
  onToggleMapping,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Check CLO coverage: which CLOs are covered by at least one assessment
  const coverageAnalysis = useMemo(() => {
    const cloHitCount: Record<string, number> = {};
    clos.forEach(c => {
      cloHitCount[c.code] = 0;
    });

    components.forEach(comp => {
      (comp.mappedClos || []).forEach(cloCode => {
        if (cloHitCount[cloCode] !== undefined) {
          cloHitCount[cloCode] += 1;
        }
      });
    });

    const uncoveredClos = clos.filter(c => (cloHitCount[c.code] || 0) === 0);
    const isFullyCovered = uncoveredClos.length === 0 && clos.length > 0;

    return { cloHitCount, uncoveredClos, isFullyCovered };
  }, [clos, components]);

  if (clos.length === 0 || components.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Header bar with toggle and title */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50/90 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors border-b border-slate-200 select-none"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <TableProperties size={15} className="text-blue-600 shrink-0" />
          <Text strong className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Ma trận Chuẩn đầu ra học phần (CLO) ↔ Các thành phần đánh giá
          </Text>
          <Tag color="blue" className="rounded text-[10px] font-semibold px-1.5 py-0 m-0">
            {clos.length} CLO × {components.length} Bài đánh giá
          </Tag>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              [X] Đánh giá đo lường
            </span>
            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              [-] Không đo lường
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>{isOpen ? 'Thu gọn' : 'Mở rộng'}</span>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-slate-500 mb-0">
              Các đánh giá trên nhằm kiểm tra việc đạt các chuẩn đầu ra học phần sau (đánh dấu X tại ô giao nhau):
            </p>

            {/* Quality badge */}
            {coverageAnalysis.isFullyCovered ? (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0">
                <CheckCircle2 size={12} /> 100% CLO được đo lường
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 shrink-0">
                <AlertTriangle size={12} /> {coverageAnalysis.uncoveredClos.length} CLO chưa có bài đánh giá
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-800 bg-slate-100/80 min-w-[220px]">
                    CĐR học phần (CLO)
                  </th>
                  {components.map(comp => (
                    <th
                      key={comp.id}
                      className="border border-slate-200 p-2.5 text-center font-semibold text-slate-700 min-w-[120px] max-w-[160px]"
                    >
                      <Tooltip title={`${comp.name} - Trọng số: ${comp.weight}%`}>
                        <div className="font-bold text-slate-800 cursor-help line-clamp-1">{comp.name}</div>
                        <span className="inline-block text-[10px] text-blue-700 font-mono font-medium bg-blue-50 border border-blue-200 rounded px-1.5 py-0 mt-0.5">
                          {comp.weight}%
                        </span>
                      </Tooltip>
                    </th>
                  ))}
                  <th className="border border-slate-200 p-2.5 text-center font-bold text-slate-700 bg-slate-100/70 min-w-[90px]">
                    Độ phủ
                  </th>
                </tr>
              </thead>

              <tbody>
                {clos.map((clo, cloIdx) => {
                  const hitCount = coverageAnalysis.cloHitCount[clo.code] || 0;
                  const isEven = cloIdx % 2 === 0;

                  return (
                    <tr
                      key={clo.id}
                      className={`${isEven ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/30 transition-colors`}
                    >
                      {/* CLO Code & Title */}
                      <td className="border border-slate-200 p-2 text-left font-medium text-slate-700 align-middle">
                        <div className="flex items-start gap-1.5">
                          <span className="font-mono font-bold text-blue-700 shrink-0 text-xs bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            {clo.code}
                          </span>
                          <span
                            className="text-slate-600 line-clamp-2 text-xs"
                            title={clo.content || '(Chưa nhập nội dung CLO)'}
                          >
                            {clo.content || <em className="text-slate-400">Chưa nhập nội dung</em>}
                          </span>
                        </div>
                      </td>

                      {/* Component Cells */}
                      {components.map(comp => {
                        const isMapped = (comp.mappedClos || []).includes(clo.code);
                        return (
                          <td
                            key={comp.id}
                            className={`border border-slate-200 p-2 text-center align-middle transition-colors ${
                              isMapped ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            {readonly ? (
                              isMapped ? (
                                <span className="font-bold text-blue-700 text-sm">X</span>
                              ) : (
                                <span className="text-slate-300 font-light">-</span>
                              )
                            ) : (
                              <Checkbox
                                checked={isMapped}
                                onChange={() => onToggleMapping(comp.id, clo.code)}
                                className="scale-105"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Coverage column */}
                      <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                        {hitCount > 0 ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {hitCount} bài
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            0 bài
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer: Component Coverage */}
              <tfoot className="bg-slate-50/90 font-semibold text-[11px] border-t border-slate-200">
                <tr>
                  <td className="border border-slate-200 p-2 text-slate-700 text-right pr-3 font-semibold">
                    Tổng CLO đo lường:
                  </td>
                  {components.map(comp => {
                    const count = (comp.mappedClos || []).length;
                    return (
                      <td
                        key={`cov-${comp.id}`}
                        className={`border border-slate-200 p-2 text-center font-mono ${
                          count > 0 ? 'text-blue-700 font-bold bg-blue-50/40' : 'text-slate-400 font-normal'
                        }`}
                      >
                        {count} CLO
                      </td>
                    );
                  })}
                  <td className="border border-slate-200 p-2 text-center bg-slate-100/60 font-mono text-slate-600">
                    {clos.length} CLO
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default S5AssessmentMatrix;
