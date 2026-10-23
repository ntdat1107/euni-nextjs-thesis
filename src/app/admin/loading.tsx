'use client';

import React from 'react';
import PageSkeleton from '@/components/ui/PageSkeleton';

export default function Loading() {
  return (
    <div className="p-2 w-full">
      <PageSkeleton rows={7} />
    </div>
  );
}
