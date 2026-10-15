'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService, Faculty } from '@/services/facultyService';
import { message } from 'antd';

export function useFaculties() {
  const queryClient = useQueryClient();

  const { data: faculties = [], isLoading, error } = useQuery({
    queryKey: ['faculties'],
    queryFn: ({ signal }) => facultyService.getAll(signal),
  });

  const createMutation = useMutation({
    mutationFn: (data: Faculty) => facultyService.createFaculty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      message.success('Thêm khoa thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Thêm khoa thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Faculty }) => facultyService.updateFaculty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      message.success('Cập nhật khoa thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Cập nhật khoa thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => facultyService.deleteFaculty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      message.success('Xóa khoa thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Xóa khoa thất bại');
    },
  });

  return {
    faculties,
    isLoading,
    error,
    createFaculty: createMutation.mutateAsync,
    updateFaculty: updateMutation.mutateAsync,
    deleteFaculty: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
export type { Faculty };
