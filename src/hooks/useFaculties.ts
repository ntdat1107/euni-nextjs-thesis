'use client';

import { useQuery } from '@tanstack/react-query';
import { facultyService, Faculty } from '@/services/facultyService';

export function useFaculties() {
  const { data: faculties = [], isLoading, error } = useQuery({
    queryKey: ['faculties'],
    queryFn: ({ signal }) => facultyService.getAll(signal),
  });

  return {
    faculties,
    isLoading,
    error,
  };
}
