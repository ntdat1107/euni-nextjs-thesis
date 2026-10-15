'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainingProgramsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/curriculum/programs');
  }, [router]);

  return null;
}

