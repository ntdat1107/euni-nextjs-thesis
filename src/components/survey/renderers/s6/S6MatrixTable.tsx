'use client';

import React, { useMemo, useState } from 'react';
import { Input, Select, Tooltip, Empty } from 'antd';
import { Search } from 'lucide-react';
import { S6CourseRow, S6PloGroup } from './types';
import { S6MatrixCell } from './S6MatrixCell';
import { cn } from '@/lib/utils';

interface S6MatrixTableProps {
  rows: S6CourseRow[];
  ploGroups: S6PloGroup[];
  readonly: boolean;
  onCellChange: (programCourseId: number, piId: number | string, level: number) => void;
}

const getDomainMeta = (domain?: string) => {
  const d = (domain || '').toUpperCase();
  if (d === 'KNOWLEDGE') return { label: 'Miền Kiến thức', headerClass: 'bg-blue-50/90 text-blue-900 border-b border-r border-slate-200' };
  if (d === 'SKILL') return { label: 'Miền Kỹ năng', headerClass: 'bg-emerald-50/90 text-emerald-900 border-b border-r border-slate-200' };
  if (d === 'AUTONOMY') return { label: 'Tự chủ & Trách nhiệm', headerClass: 'bg-amber-50/90 text-amber-900 border-b border-r border-slate-200' };
  if (d === 'ATTITUDE') return { label: 'Phẩm chất & Thái độ', headerClass: 'bg-purple-50/90 text-purple-900 border-b border-r border-slate-200' };
  return { label: 'Miền Khác', headerClass: 'bg-slate-50/90 text-slate-800 border-b border-r border-slate-200' };
};

export const S6MatrixTable: React.FC<S6MatrixTableProps> = ({
  rows,
  ploGroups,
  readonly,
  onCellChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');

  const semesters = useMemo(() => {
    const set = new Set<number>();
    rows.forEach(r => {
      if (r.semester) set.add(r.semester);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (semesterFilter !== 'ALL' && String(r.semester) !== semesterFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const matchCode = r.courseCode.toLowerCase().includes(lower);
        const matchName = r.courseName.toLowerCase().includes(lower);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [rows, searchTerm, semesterFilter]);

  const allPis = useMemo(() => ploGroups.flatMap(p => p.indicators), [ploGroups]);

  const piCoverageCounts = useMemo(() => {
    const map: Record<string | number, number> = {};
    allPis.forEach(pi => {
      map[pi.piId] = rows.filter(r => ((r.cells[pi.piId] ?? r.cells[pi.piCode] ?? 0) > 0)).length;
    });
    return map;
  }, [allPis, rows]);

  return (
    <div className="space-y-3">
      {/* Top Filter & Legend bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-md border border-slate-200/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-56">
            <Input
              prefix={<Search size={13} className="text-slate-400" />}
              placeholder="Tìm theo mã hoặc tên học phần..."
              size="small"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
              className="rounded text-xs"
            />
          </div>

          <Select
            size="small"
            value={semesterFilter}
            onChange={setSemesterFilter}
            className="w-32 text-xs"
            options={[
              { value: 'ALL', label: 'Tất cả học kỳ' },
              ...semesters.map(sem => ({ value: String(sem), label: `Học kỳ ${sem}` }))
            ]}
          />

          <span className="text-xs text-slate-400">
            Hiển thị <span className="font-semibold text-slate-700">{filteredRows.length}</span>/{rows.length} môn
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Thang IRMA:</span>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]" title="Introduce: Mức độ làm quen, giới thiệu kiến thức">I: Giới thiệu</span>
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]" title="Reinforce: Mức độ rèn luyện, củng cố">R: Củng cố</span>
          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]" title="Master: Mức độ thành thạo, làm chủ">M: Thành thạo</span>
          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[11px]" title="Assess: Mức độ kiểm tra, đánh giá toàn diện">A: Đánh giá</span>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="border border-slate-200 rounded-md overflow-x-auto bg-white shadow-none max-h-[620px] overflow-y-auto">
        {allPis.length === 0 ? (
          <div className="py-16">
            <Empty description="Chưa có dữ liệu chuẩn đầu ra (PLO/PI). Vui lòng hoàn thành Bước 2 trước." />
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 z-20 shadow-xs">
              {/* Row 1: Fixed headers & Domain */}
              <tr className="border-b border-slate-200 text-slate-700">
                <th
                  rowSpan={3}
                  className="sticky left-0 bg-slate-100 p-2 text-left font-bold w-[76px] min-w-[76px] max-w-[76px] border-r border-slate-200 z-30"
                >
                  Mã HP
                </th>
                <th
                  rowSpan={3}
                  className="sticky left-[76px] bg-slate-100 p-2 text-left font-bold w-[240px] min-w-[240px] max-w-[240px] border-r border-slate-200 z-30"
                >
                  Tên học phần
                </th>
                <th
                  rowSpan={3}
                  className="p-2 text-center font-bold w-[42px] min-w-[42px] max-w-[42px] border-r border-slate-200"
                >
                  Kỳ
                </th>
                <th
                  rowSpan={3}
                  className="p-2 text-center font-bold w-[42px] min-w-[42px] max-w-[42px] border-r border-slate-300"
                >
                  TC
                </th>

                {ploGroups.map(grp => {
                  const meta = getDomainMeta(grp.domain);
                  return (
                    <th
                      key={`domain-${grp.ploId}`}
                      colSpan={grp.indicators.length}
                      className={cn(
                        "p-1.5 text-center font-bold uppercase tracking-wider text-[11px]",
                        meta.headerClass
                      )}
                    >
                      {meta.label}
                    </th>
                  );
                })}
              </tr>

              {/* Row 2: PLO */}
              <tr className="border-b border-slate-200 text-slate-700">
                {ploGroups.map(grp => (
                  <th
                    key={`plo-${grp.ploId}`}
                    colSpan={grp.indicators.length}
                    className="p-1 text-center font-semibold border-r border-slate-200 bg-slate-50/80"
                  >
                    <Tooltip title={grp.ploName ? `${grp.ploCode}: ${grp.ploName}` : grp.ploCode}>
                      <span className="font-mono text-blue-700 font-bold hover:underline cursor-help">
                        {grp.ploCode}
                      </span>
                    </Tooltip>
                  </th>
                ))}
              </tr>

              {/* Row 3: PI */}
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                {allPis.map(pi => (
                  <th
                    key={`pi-${pi.piId}`}
                    className="p-1 text-center font-mono w-[42px] min-w-[42px] max-w-[42px] border-r border-slate-200 font-semibold"
                  >
                    <Tooltip
                      title={
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-blue-300">{pi.piCode}</div>
                          <div>{pi.content || 'Chưa có nội dung mô tả'}</div>
                          {pi.bloomLevel && (
                            <div className="text-[11px] text-slate-300">
                              Mức Bloom: <span className="font-semibold text-white">{pi.bloomLevel}</span>
                            </div>
                          )}
                        </div>
                      }
                    >
                      <span className="cursor-help inline-flex items-center justify-center w-full">
                        {pi.piCode}
                      </span>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4 + allPis.length} className="p-8 text-center text-slate-400">
                    Không tìm thấy học phần nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.programCourseId} className="hover:bg-blue-50/30 transition-colors">
                    {/* Mã HP */}
                    <td className="sticky left-0 bg-white p-2 font-mono font-bold text-slate-800 border-r border-slate-200 z-10 w-[76px] min-w-[76px] max-w-[76px]">
                      {row.courseCode}
                    </td>

                    {/* Tên học phần */}
                    <td className="sticky left-[76px] bg-white p-2 border-r border-slate-200 z-10 w-[240px] min-w-[240px] max-w-[240px]">
                      <div className="whitespace-normal break-words leading-snug font-medium text-slate-800">
                        {row.courseName}
                      </div>
                    </td>

                    {/* Kỳ */}
                    <td className="p-2 text-center text-slate-500 border-r border-slate-200 font-mono w-[42px] min-w-[42px] max-w-[42px]">
                      {row.semester || 1}
                    </td>

                    {/* TC */}
                    <td className="p-2 text-center text-slate-600 border-r border-slate-300 font-mono w-[42px] min-w-[42px] max-w-[42px]">
                      {row.credits}
                    </td>

                    {/* PI Matrix Cells */}
                    {allPis.map(pi => (
                      <td
                        key={`${row.programCourseId}-${pi.piId}`}
                        className="p-1 border-r border-slate-100 text-center w-[42px] min-w-[42px] max-w-[42px]"
                      >
                        <S6MatrixCell
                          level={row.cells[pi.piId] ?? row.cells[pi.piCode] ?? 0}
                          readonly={readonly}
                          onChange={newLvl => onCellChange(row.programCourseId, pi.piId, newLvl)}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>

            {/* Footer summary: Coverage count per PI */}
            <tfoot className="sticky bottom-0 bg-slate-100/95 font-bold border-t-2 border-slate-300 z-20 backdrop-blur-xs">
              <tr>
                <td
                  colSpan={4}
                  className="sticky left-0 bg-slate-100 p-2 text-right border-r border-slate-300 text-slate-700 w-[400px] min-w-[400px] max-w-[400px]"
                >
                  Số môn đảm nhiệm PI:
                </td>
                {allPis.map(pi => {
                  const count = piCoverageCounts[pi.piId] || 0;
                  const isZero = count === 0;
                  return (
                    <td
                      key={`foot-${pi.piId}`}
                      className={cn(
                        "p-1.5 text-center font-mono border-r border-slate-200 w-[42px] min-w-[42px] max-w-[42px]",
                        isZero ? "bg-rose-100 text-rose-700 font-bold" : "text-slate-700"
                      )}
                      title={isZero ? `Cảnh báo: Chỉ số ${pi.piCode} chưa có môn nào đảm nhiệm!` : `${count} môn đảm nhiệm ${pi.piCode}`}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};
