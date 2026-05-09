'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService, Role, Permission } from '@/services/rbacService';
import { App } from 'antd';

export function useRBAC() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rbacService.getPermissions(),
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacService.getRoles(),
  });

  const createRoleMutation = useMutation({
    mutationFn: (role: Partial<Role>) => rbacService.createRole(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Tạo vai trò thành công');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Xóa vai trò thành công');
    },
  });

  const createPermissionMutation = useMutation({
    mutationFn: (permission: Partial<Permission>) => rbacService.createPermission(permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      message.success('Tạo quyền thành công');
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (id: string) => rbacService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      message.success('Xóa quyền thành công');
    },
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => 
      rbacService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Cập nhật quyền cho vai trò thành công');
    },
  });

  return {
    permissions,
    roles,
    isLoading: loadingRoles || loadingPermissions,
    addRole: (role: Partial<Role>) => createRoleMutation.mutate(role),
    deleteRole: (id: string) => deleteRoleMutation.mutate(id),
    addPermission: (permission: Partial<Permission>) => createPermissionMutation.mutate(permission),
    deletePermission: (id: string) => deletePermissionMutation.mutate(id),
    updateRolePermissions: (roleId: string, permissionIds: string[]) => 
      updateRolePermissionsMutation.mutate({ roleId, permissionIds }),
  };
}
