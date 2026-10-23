'use client';

import React from 'react';
import { Skeleton, Space } from 'antd';

interface PageSkeletonProps {
  rows?: number;
  showBreadcrumb?: boolean;
  showHeaderCard?: boolean;
}

export default function PageSkeleton({
  rows = 6,
  showBreadcrumb = true,
  showHeaderCard = true,
}: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* 1. Breadcrumb Skeleton */}
      {showBreadcrumb && (
        <div className="flex items-center gap-2">
          <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
          <span className="text-slate-300">/</span>
          <Skeleton.Input active size="small" style={{ width: 140, height: 16 }} />
        </div>
      )}

      {/* 2. Header Card Skeleton (Standard container) */}
      {showHeaderCard && (
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col gap-2">
            <Skeleton.Input active size="default" style={{ width: 280, height: 28 }} />
            <Skeleton.Input active size="small" style={{ width: 380, height: 16 }} />
          </div>
          <Space>
            <Skeleton.Button active size="default" style={{ width: 130, height: 40, borderRadius: 12 }} />
          </Space>
        </div>
      )}

      {/* 3. Content Table/List Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <Skeleton.Input active size="default" style={{ width: 280, height: 40, borderRadius: 10 }} />
          <Space>
            <Skeleton.Button active size="default" style={{ width: 100, height: 40, borderRadius: 10 }} />
            <Skeleton.Button active size="default" style={{ width: 40, height: 40, borderRadius: 10 }} />
          </Space>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3 pt-1">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3.5 px-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg transition-colors"
            >
              <Skeleton.Avatar active size="small" shape="square" style={{ width: 36, height: 36, borderRadius: 8 }} />
              <div className="flex-1 space-y-1.5">
                <Skeleton.Input active size="small" style={{ width: `${Math.max(25, 45 - (i % 3) * 10)}%`, height: 16 }} />
                <Skeleton.Input active size="small" style={{ width: `${Math.max(20, 30 - (i % 2) * 5)}%`, height: 12 }} />
              </div>
              <Skeleton.Input active size="small" style={{ width: 120, height: 18 }} />
              <Space className="ml-4">
                <Skeleton.Button active size="small" shape="square" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <Skeleton.Button active size="small" shape="square" style={{ width: 32, height: 32, borderRadius: 8 }} />
              </Space>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
