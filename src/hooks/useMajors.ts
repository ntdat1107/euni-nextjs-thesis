import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { majorService } from '@/services/majorService';
import { Major } from '@/types/academic';
import { message } from 'antd';

export function useMajors() {
  const queryClient = useQueryClient();

  const { data: majors = [], isLoading, error } = useQuery({
    queryKey: ['majors'],
    queryFn: ({ signal }) => majorService.getAll(signal),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Major>) => majorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      message.success('Thêm ngành học thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Thêm ngành học thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Major> }) => majorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      message.success('Cập nhật ngành học thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật ngành học thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => majorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      message.success('Xóa ngành học thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Xóa ngành học thất bại');
    },
  });

  return {
    majors,
    isLoading,
    error,
    createMajor: createMutation.mutateAsync,
    updateMajor: updateMutation.mutateAsync,
    deleteMajor: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
