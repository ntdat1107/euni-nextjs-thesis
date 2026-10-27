'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface S6MatrixCellProps {
  level: number;
  readonly: boolean;
  onChange: (newLevel: number) => void;
}

export const S6MatrixCell: React.FC<S6MatrixCellProps> = React.memo(({
  level = 0,
  readonly,
  onChange,
}) => {
  const handleClick = () => {
    if (readonly) return;
    const nextLevel = level >= 4 ? 0 : level + 1;
    onChange(nextLevel);
  };

  const badgeConfig = (() => {
    switch (level) {
      case 1:
        return { label: 'I', textClass: 'text-blue-700 bg-blue-50/90 border-blue-300 hover:bg-blue-100 shadow-2xs' };
      case 2:
        return { label: 'R', textClass: 'text-emerald-700 bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100 shadow-2xs' };
      case 3:
        return { label: 'M', textClass: 'text-amber-700 bg-amber-50/90 border-amber-300 hover:bg-amber-100 shadow-2xs' };
      case 4:
        return { label: 'A', textClass: 'text-purple-700 bg-purple-50/90 border-purple-300 hover:bg-purple-100 shadow-2xs' };
      default:
        return { label: '—', textClass: 'text-slate-300 hover:text-slate-600 hover:bg-slate-100 border-dashed border-slate-200' };
    }
  })();

  if (readonly) {
    if (level === 0) {
      return <span className="text-slate-200 select-none">—</span>;
    }
    return (
      <span
        className={cn(
          "w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs border mx-auto select-none",
          badgeConfig.textClass
        )}
        title={`Mức độ: ${badgeConfig.label}`}
      >
        {badgeConfig.label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs transition-all duration-150 border mx-auto cursor-pointer active:scale-95",
        badgeConfig.textClass
      )}
      title="Nhấp chuột để đổi mức (— -> I -> R -> M -> A -> —)"
    >
      {badgeConfig.label}
    </button>
  );
});

S6MatrixCell.displayName = 'S6MatrixCell';
