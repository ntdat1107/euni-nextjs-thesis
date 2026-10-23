'use client';

import React from 'react';
import PageSkeleton from '@/components/ui/PageSkeleton';

export default function RootLoading() {
  return (
    <div className="p-6 w-full max-w-full">
      <PageSkeleton rows={7} />
    </div>
  );
}
