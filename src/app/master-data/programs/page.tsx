'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CurriculumProgramsListPage from '@/app/curriculum/programs/page';

export default function MasterDataProgramsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/curriculum/programs');
  }, [router]);

  return <CurriculumProgramsListPage />;
}
