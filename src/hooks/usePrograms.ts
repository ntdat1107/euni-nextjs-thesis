import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programService } from '@/services/programService';
import { Program } from '@/types/academic';
import { message } from 'antd';

export function usePrograms() {
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: ({ signal }) => programService.getAll(signal),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Program>) => programService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      message.success('Thêm chương trình đào tạo thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Thêm chương trình đào tạo thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Program> }) => programService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      message.success('Cập nhật chương trình đào tạo thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật chương trình đào tạo thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      message.success('Xóa chương trình đào tạo thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Xóa chương trình đào tạo thất bại');
    },
  });

  const assignCoursesMutation = useMutation({
    mutationFn: ({ id, courseIds }: { id: string; courseIds: string[] }) => programService.assignCourses(id, courseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      message.success('Cập nhật danh sách môn học thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật danh sách môn học thất bại');
    },
  });

  return {
    programs,
    isLoading,
    error,
    createProgram: createMutation.mutateAsync,
    updateProgram: updateMutation.mutateAsync,
    deleteProgram: deleteMutation.mutateAsync,
    assignCourses: assignCoursesMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigning: assignCoursesMutation.isPending,
  };
}
