import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '@/services/courseService';
import { Course } from '@/types/academic';
import { message } from 'antd';

export function useCourses() {
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: ({ signal }) => courseService.getAll(signal),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Course>) => courseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      message.success('Thêm học phần thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Thêm học phần thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Course> }) => courseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      message.success('Cập nhật học phần thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật học phần thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      message.success('Xóa học phần thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Xóa học phần thất bại');
    },
  });

  return {
    courses,
    isLoading,
    error,
    createCourse: createMutation.mutateAsync,
    updateCourse: updateMutation.mutateAsync,
    deleteCourse: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
