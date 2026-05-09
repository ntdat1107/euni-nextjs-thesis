'use client';

import { useQuery } from '@tanstack/react-query';
import { departmentService, Department } from '@/services/departmentService';

export function useDepartments() {
  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: ({ signal }) => departmentService.getAll(signal),
  });

  return {
    departments,
    isLoading,
    error,
  };
}
