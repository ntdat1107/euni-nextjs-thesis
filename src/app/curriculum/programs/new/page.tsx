'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ProgramDetailView from '@/components/academic/ProgramDetailView';
import PageSkeleton from '@/components/ui/PageSkeleton';

export default function CreateProgramPage() {
  const router = useRouter();

  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton rows={8} />}>
        <ProgramDetailView 
          programId="new" 
          onBack={() => router.push('/curriculum/programs')} 
        />
      </Suspense>
    </AppShell>
  );
}
