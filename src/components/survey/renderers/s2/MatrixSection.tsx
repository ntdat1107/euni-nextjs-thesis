'use client';

import React, { useCallback } from 'react';
import { Checkbox } from 'antd';
import { PO, PLO } from './types';
import { getPoCode, getPloCode, getPiCode } from './utils';

interface MatrixCellProps {
  poIdx: number;
  ploIdx: number;
  piIdx: number;
  checked: boolean;
  readonly: boolean;
  onToggle: (poIdx: number, ploIdx: number, piIdx: number) => void;
}

const MatrixCell = React.memo(function MatrixCell({
  poIdx,
  ploIdx,
  piIdx,
  checked,
  readonly,
  onToggle,
}: MatrixCellProps) {
  const handleChange = useCallback(() => {
    onToggle(poIdx, ploIdx, piIdx);
  }, [poIdx, ploIdx, piIdx, onToggle]);

  return (
    <td className="border border-slate-200 p-2 text-center border-l">
      <Checkbox
        checked={checked}
        disabled={readonly}
        onChange={handleChange}
      />
    </td>
  );
});

interface MatrixSectionProps {
  pos: PO[];
  plos: PLO[];
  matrix: boolean[][][];
  readonly: boolean;
  onToggleMatrix: (poIdx: number, ploIdx: number, piIdx: number) => void;
}

function areMatrixPropsEqual(prev: MatrixSectionProps, next: MatrixSectionProps): boolean {
  if (prev.readonly !== next.readonly) return false;
  if (prev.matrix !== next.matrix) return false;
  if (prev.onToggleMatrix !== next.onToggleMatrix) return false;
  if (prev.pos.length !== next.pos.length) return false;
  if (prev.plos.length !== next.plos.length) return false;

  for (let i = 0; i < prev.pos.length; i++) {
    if ((prev.pos[i]?.code || '') !== (next.pos[i]?.code || '')) return false;
  }

  for (let j = 0; j < prev.plos.length; j++) {
    const prevPlo = prev.plos[j];
    const nextPlo = next.plos[j];
    if ((prevPlo?.code || '') !== (nextPlo?.code || '')) return false;
    const prevPis = prevPlo?.pis || [];
    const nextPis = nextPlo?.pis || [];
    if (prevPis.length !== nextPis.length) return false;
    for (let k = 0; k < prevPis.length; k++) {
      if ((prevPis[k]?.code || '') !== (nextPis[k]?.code || '')) return false;
    }
  }

  return true;
}

export const MatrixSection = React.memo(function MatrixSection({
  pos,
  plos,
  matrix,
  readonly,
  onToggleMatrix,
}: MatrixSectionProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="text-xs text-slate-500">
        Đánh dấu tích để xác định mối quan hệ tương quan giữa các Mục tiêu đào tạo (PO) và Chỉ số đo lường (PI).
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th rowSpan={2} className="border border-slate-200 p-2 text-left font-semibold text-slate-600">
                Mục tiêu (PO)
              </th>
              {(plos || []).map((plo, ploIdx) => (
                <th
                  key={ploIdx}
                  colSpan={(plo?.pis || []).length || 1}
                  className="border border-slate-200 p-2 text-center font-semibold text-slate-700 border-l"
                >
                  {plo?.code || getPloCode(ploIdx)}
                </th>
              ))}
            </tr>
            <tr>
              {(plos || []).map((plo, ploIdx) =>
                (plo?.pis || []).map((pi, piIdx) => (
                  <th
                    key={`${ploIdx}-${piIdx}`}
                    className="border border-slate-200 p-1.5 text-center font-medium text-slate-500 border-l"
                  >
                    {pi?.code || getPiCode(ploIdx, piIdx)}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {(pos || []).map((po, poIdx) => (
              <tr key={poIdx} className="hover:bg-slate-50">
                <td className="border border-slate-200 p-2 font-medium text-slate-700 font-mono">
                  {po?.code || getPoCode(poIdx)}
                </td>
                {(plos || []).map((plo, ploIdx) =>
                  (plo?.pis || []).map((_, piIdx) => (
                    <MatrixCell
                      key={`${poIdx}-${ploIdx}-${piIdx}`}
                      poIdx={poIdx}
                      ploIdx={ploIdx}
                      piIdx={piIdx}
                      checked={!!matrix?.[poIdx]?.[ploIdx]?.[piIdx]}
                      readonly={readonly}
                      onToggle={onToggleMatrix}
                    />
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, areMatrixPropsEqual);
