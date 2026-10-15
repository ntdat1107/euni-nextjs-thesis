'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ProgramDetailView from '@/components/academic/ProgramDetailView';
import TableSkeleton from '@/components/ui/TableSkeleton';

export default function CreateProgramPage() {
  const router = useRouter();

  return (
    <AppShell>
      <Suspense fallback={<TableSkeleton rows={8} columns={4} />}>
        <ProgramDetailView 
          programId="new" 
          onBack={() => router.push('/curriculum/programs')} 
        />
      </Suspense>
    </AppShell>
  );
}
