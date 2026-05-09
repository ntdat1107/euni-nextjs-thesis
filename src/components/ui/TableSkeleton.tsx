'use client';

import React from 'react';
import { Skeleton, Space } from 'antd';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex justify-between mb-6">
        <Skeleton.Input active size="small" style={{ width: 200 }} />
        <Skeleton.Button active size="small" style={{ width: 100 }} />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-slate-50 last:border-0">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton.Input 
                key={j} 
                active 
                size="small" 
                style={{ width: j === 0 ? '30%' : '20%' }} 
              />
            ))}
            <Space className="ml-auto">
              <Skeleton.Button active size="small" shape="square" style={{ width: 32 }} />
              <Skeleton.Button active size="small" shape="square" style={{ width: 32 }} />
            </Space>
          </div>
        ))}
      </div>
    </div>
  );
}
