'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProgramDetailPage from '@/app/curriculum/programs/[id]/page';

export default function MasterDataProgramDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/curriculum/programs/${id}`);
    }
  }, [id, router]);

  return <ProgramDetailPage />;
}
