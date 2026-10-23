'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ProgramDetailView from '@/components/academic/ProgramDetailView';
import PageSkeleton from '@/components/ui/PageSkeleton';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton rows={8} />}>
        <ProgramDetailView 
          programId={id} 
          onBack={() => router.push('/curriculum/programs')} 
        />
      </Suspense>
    </AppShell>
  );
}
