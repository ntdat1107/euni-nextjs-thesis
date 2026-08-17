'use client';

import React from 'react';
import { Button } from 'antd';
import { cn } from '@/lib/utils';

export interface ActionItem {
  key?: string;
  label: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export interface ActionBarProps {
  actions?: ActionItem[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Enterprise Floating Bottom Action Bar component
 * Cố định sát góc dưới bên phải màn hình (fixed bottom-3 right-4).
 * Kích thước vừa vặn cân bằng ở giữa 2 mức (h-[28px], px-2.5, text-[11.5px]).
 */
export default function ActionBar({
  actions,
  children,
  className,
}: ActionBarProps) {
  if (!actions && !children) return null;

  return (
    <div className="fixed bottom-3 right-4 z-50 pointer-events-none transition-all duration-200">
      <div className={cn("flex items-center gap-2 pointer-events-auto", className)}>
        {actions && actions.length > 0 ? (
          actions.map((act, index) => (
            <Button
              key={act.key || index}
              type={act.type || 'default'}
              danger={act.danger}
              disabled={act.disabled}
              loading={act.loading}
              icon={act.icon}
              onClick={act.onClick}
              className={cn(
                "rounded-md h-[28px] px-2.5 text-[11.5px] font-medium shadow-none transition-all duration-200 flex items-center gap-1.5",
                act.type === 'primary' && !act.danger && "bg-blue-700 hover:bg-blue-800 border-none text-white",
                act.type === 'default' && "border-slate-300 text-slate-700 hover:text-blue-700 hover:border-blue-500 bg-white",
                act.className
              )}
            >
              {act.label}
            </Button>
          ))
        ) : (
          children
        )}
      </div>
    </div>
  );
}
