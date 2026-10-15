'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainingProgramBuilderPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/curriculum/development');
  }, [router]);

  return null;
}

