'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/departmentService';
import { Department } from '@/types/academic';
import { message } from 'antd';

export function useDepartments(facultyId?: number | string) {
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments', facultyId],
    queryFn: ({ signal }) => departmentService.getAll(facultyId, signal),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Department>) => departmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success('Thêm bộ môn thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Thêm bộ môn thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Department> }) => departmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success('Cập nhật bộ môn thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Cập nhật bộ môn thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => departmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success('Xóa bộ môn thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Xóa bộ môn thất bại');
    },
  });

  return {
    departments,
    isLoading,
    error,
    createDepartment: createMutation.mutateAsync,
    updateDepartment: updateMutation.mutateAsync,
    deleteDepartment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
