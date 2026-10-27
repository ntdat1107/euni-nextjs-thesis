'use client';

import React from 'react';
import { Button, Tooltip, Progress } from 'antd';
import { CheckCircle2, AlertTriangle, Sparkles, Layers, BarChart3 } from 'lucide-react';
import { S6CourseRow, S6PloGroup } from './types';

interface S6KpiStripProps {
  rows: S6CourseRow[];
  ploGroups: S6PloGroup[];
  readonly: boolean;
  onAutoDerive: () => void;
  isDeriving: boolean;
}

export const S6KpiStrip: React.FC<S6KpiStripProps> = ({
  rows,
  ploGroups,
  readonly,
  onAutoDerive,
  isDeriving,
}) => {
  const allPis = ploGroups.flatMap(p => p.indicators);
  const totalPis = allPis.length;

  const coveredPiCount = allPis.filter(pi => {
    return rows.some(r => ((r.cells[pi.piId] ?? r.cells[pi.piCode] ?? 0) > 0));
  }).length;

  const coveragePercent = totalPis > 0 ? Math.round((coveredPiCount / totalPis) * 100) : 100;
  const isFullCoverage = coveredPiCount === totalPis && totalPis > 0;

  const isolatedCourses = rows.filter(r => {
    const hasAny = Object.values(r.cells).some(lvl => (lvl || 0) > 0);
    return !hasAny;
  });

  let countI = 0, countR = 0, countM = 0, countA = 0;
  rows.forEach(r => {
    Object.values(r.cells).forEach(lvl => {
      if (lvl === 1) countI++;
      else if (lvl === 2) countR++;
      else if (lvl === 3) countM++;
      else if (lvl === 4) countA++;
    });
  });
  const totalLevels = countI + countR + countM + countA;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* KPI 1: Độ phủ PI */}
      <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Độ phủ chuẩn đầu ra (PI)
          </span>
          {isFullCoverage ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <AlertTriangle size={18} className="text-amber-500" />
          )}
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{coveragePercent}%</span>
            <span className="text-xs text-slate-400">({coveredPiCount}/{totalPis} PI)</span>
          </div>
          <div className="mt-1.5">
            <Progress
              percent={coveragePercent}
              showInfo={false}
              size="small"
              strokeColor={isFullCoverage ? '#10b981' : '#f59e0b'}
              trailColor="#f1f5f9"
            />
          </div>
        </div>
      </div>

      {/* KPI 2: Môn học chưa đóng góp */}
      <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Môn chưa gắn ma trận
          </span>
          <Layers size={18} className={isolatedCourses.length > 0 ? "text-amber-500" : "text-emerald-500"} />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className={isolatedCourses.length > 0 ? "text-2xl font-bold text-amber-600" : "text-2xl font-bold text-slate-800"}>
              {isolatedCourses.length} môn
            </span>
            <span className="text-xs text-slate-400">/ {rows.length} môn học</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isolatedCourses.length === 0 ? (
              <span className="text-emerald-600 font-medium">✓ Tất cả môn học đều có đóng góp</span>
            ) : (
              <span className="text-amber-600 font-medium">Cần hoàn thiện phân bổ môn học</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI 3: Phân bổ thang IRMA */}
      <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Phân bổ thang IRMA
          </span>
          <BarChart3 size={18} className="text-blue-500" />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200" title="Introduce">
              I: {countI}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200" title="Reinforce">
              R: {countR}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono font-bold text-xs border border-amber-200" title="Master">
              M: {countM}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-bold text-xs border border-purple-200" title="Assess">
              A: {countA}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Tổng cộng: <span className="font-semibold text-slate-700">{totalLevels}</span> vị trí liên kết
          </div>
        </div>
      </div>

      {/* Action: Đồng bộ từ đề cương */}
      <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-none flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tác vụ tự động
          </span>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Tự động suy luận ma trận I-R-M-A từ chuẩn đầu ra (CLO) đã định nghĩa ở Bước 5.
          </p>
        </div>
        <div className="mt-2">
          {!readonly ? (
            <Tooltip title="Hệ thống sẽ quét toàn bộ CLO & Bloom level từ Đề cương học phần (Bước 5) để tự động điền các mức IRMA vào ma trận">
              <Button
                type="default"
                icon={<Sparkles size={13} className="text-blue-600" />}
                onClick={onAutoDerive}
                loading={isDeriving}
                className="w-full text-xs h-8 font-medium border-blue-300 text-blue-700 hover:bg-blue-50/80 rounded"
              >
                Đồng bộ từ Đề cương
              </Button>
            </Tooltip>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-50 p-1.5 rounded text-center border border-slate-100">
              Chế độ xem ma trận
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
