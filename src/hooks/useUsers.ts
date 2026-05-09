'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '@/services/userService';
import { apiClient } from '@/services/api';
import { message } from 'antd';

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => userService.getAll(signal),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Xóa người dùng thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Xóa người dùng thất bại');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      userService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Cập nhật trạng thái thành công');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userService.resetPassword(id),
    onSuccess: (data) => {
      message.success(`Mật khẩu tạm thời: ${data.tempPassword}`);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (user: Partial<User>) => userService.create(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Tạo người dùng thất bại');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, user }: { id: string; user: Partial<User> }) => userService.update(id, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Cập nhật người dùng thành công');
    },
    onError: (err: any) => {
      message.error(err.message || 'Cập nhật người dùng thất bại');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/users/change-password', data),
    onSuccess: () => {
      message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      // Optional: Redirect to login or auto update token
    },
    onError: (err: any) => {
      message.error(err.message || 'Đổi mật khẩu thất bại');
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser: async (user: Partial<User>) => createUserMutation.mutateAsync(user),
    updateUser: (id: string, user: Partial<User>) => updateUserMutation.mutate({ id, user }),
    deleteUser: (id: string) => deleteUserMutation.mutate(id),
    updateUserStatus: (id: string, status: string) => 
      updateStatusMutation.mutate({ id, status }),
    resetPassword: async (id: string) => resetPasswordMutation.mutateAsync(id),
    changePassword: async (data: any) => changePasswordMutation.mutateAsync(data),
  };
}
