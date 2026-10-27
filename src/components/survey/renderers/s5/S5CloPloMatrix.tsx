'use client';

import React, { useState, useMemo } from 'react';
import { Typography, Tag, Tooltip, Checkbox } from 'antd';
import { Grid, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { CLOItem, PloDomainGroup, PiMetaItem } from './types';
import { getDomainColor } from './constants';

const { Text } = Typography;

interface S5CloPloMatrixProps {
  clos: CLOItem[];
  ploDomains: PloDomainGroup[];
  readonly: boolean;
  onToggleMapping: (cloId: string, piCode: string) => void;
}

export const S5CloPloMatrix: React.FC<S5CloPloMatrixProps> = ({
  clos,
  ploDomains,
  readonly,
  onToggleMapping,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filter groups that have at least one PI column
  const activeDomains = useMemo(() => {
    return ploDomains.filter(g => g.allPis && g.allPis.length > 0);
  }, [ploDomains]);

  // Flattened list of all leaf PIs across all domains
  const allLeafPis = useMemo<PiMetaItem[]>(() => {
    return activeDomains.flatMap(g => g.allPis);
  }, [activeDomains]);

  const totalPis = allLeafPis.length;

  // Calculate coverage for each PI (how many CLOs map to it)
  const piCoverage = useMemo(() => {
    const map: Record<string, number> = {};
    allLeafPis.forEach(pi => {
      map[pi.code] = clos.filter(c => Array.isArray(c.mappedPlos) && c.mappedPlos.includes(pi.code)).length;
    });
    return map;
  }, [allLeafPis, clos]);

  if (clos.length === 0 || totalPis === 0) {
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
          <Grid size={15} className="text-blue-600 shrink-0" />
          <Text strong className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Ma trận Chuẩn đầu ra học phần (CLO) ↔ Chuẩn đầu ra CTĐT (PLO/PI)
          </Text>
          <Tag color="blue" className="rounded text-[10px] font-semibold px-1.5 py-0 m-0">
            {clos.length} CLO × {totalPis} Chỉ số PI
          </Tag>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check size={11} className="stroke-[3]" /> [√] Đóng góp
            </span>
            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              [-] Không đóng góp
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
          <p className="text-xs text-slate-500 mb-0">
            Đánh dấu tích để xác định chuẩn đầu ra học phần (CLO) đóng góp trực tiếp vào chỉ số đo lường (PI) nào của Chương trình đào tạo. Dữ liệu liên kết đồng bộ hai chiều với thông tin chi tiết từng CLO.
          </p>

          <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[500px]">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                {/* Row 0: General Title */}
                <tr>
                  <th
                    rowSpan={3}
                    className="border border-slate-200 p-2.5 text-left font-bold text-slate-800 bg-slate-100/80 min-w-[240px] max-w-[280px] align-middle shadow-xs"
                  >
                    Chuẩn đầu ra học phần (CLO)
                  </th>
                  <th
                    colSpan={totalPis}
                    className="border border-slate-200 py-1.5 px-3 text-center font-bold text-blue-900 bg-blue-50/90 tracking-wide uppercase text-[11px]"
                  >
                    Chuẩn đầu ra Chương trình đào tạo (PLO / PI)
                  </th>
                </tr>

                {/* Row 1: Domains */}
                <tr>
                  {activeDomains.map(group => {
                    const colors = getDomainColor(group.domain);
                    return (
                      <th
                        key={group.domain}
                        colSpan={group.allPis.length}
                        className={`border border-slate-200 py-1.5 px-2 text-center font-bold text-[11px] ${colors.headerBg} ${colors.text}`}
                      >
                        {group.domainLabel}
                      </th>
                    );
                  })}
                </tr>

                {/* Row 2: Leaf PIs */}
                <tr>
                  {allLeafPis.map(pi => (
                    <th
                      key={pi.code}
                      className="border border-slate-200 p-1.5 text-center font-mono font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors min-w-[48px]"
                    >
                      <Tooltip title={`${pi.code}: ${pi.title}${pi.ploCode ? ` (thuộc ${pi.ploCode})` : ''}`}>
                        <span className="cursor-help underline decoration-dotted decoration-slate-400">
                          {pi.code}
                        </span>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {clos.map((clo, cloIdx) => {
                  const mapped = clo.mappedPlos || [];
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

                      {/* PI Checkboxes / Marks */}
                      {allLeafPis.map(pi => {
                        const isChecked = mapped.includes(pi.code);
                        return (
                          <td
                            key={pi.code}
                            className={`border border-slate-200 p-1.5 text-center align-middle transition-colors ${
                              isChecked ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            {readonly ? (
                              isChecked ? (
                                <span className="font-bold text-emerald-600 text-sm">√</span>
                              ) : (
                                <span className="text-slate-300 font-light">-</span>
                              )
                            ) : (
                              <Checkbox
                                checked={isChecked}
                                onChange={() => onToggleMapping(clo.id, pi.code)}
                                className="scale-105"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer Summary: Coverage */}
              <tfoot className="bg-slate-50/90 font-semibold text-[11px] border-t border-slate-200">
                <tr>
                  <td className="border border-slate-200 p-2 text-slate-700 text-right pr-3 font-semibold">
                    Tổng số CLO đáp ứng:
                  </td>
                  {allLeafPis.map(pi => {
                    const count = piCoverage[pi.code] || 0;
                    return (
                      <td
                        key={`cov-${pi.code}`}
                        className={`border border-slate-200 p-1.5 text-center font-mono ${
                          count > 0 ? 'text-emerald-700 font-bold bg-emerald-50/40' : 'text-slate-400 font-normal'
                        }`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default S5CloPloMatrix;
