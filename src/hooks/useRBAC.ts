'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService, Role, Permission } from '@/services/rbacService';
import { roleCache } from '@/lib/roleCache';
import { App } from 'antd';

export function useRBAC() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: ({ signal }) => rbacService.getPermissions(signal),
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: ({ signal }) => rbacService.getRoles(signal),
  });

  const createRoleMutation = useMutation({
    mutationFn: (role: Partial<Role>) => rbacService.createRole(role),
    onSuccess: () => {
      roleCache.clearCache();
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Tạo vai trò thành công');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Role> }) => rbacService.updateRole(id, data),
    onSuccess: () => {
      roleCache.clearCache();
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Cập nhật vai trò thành công');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number | string) => rbacService.deleteRole(id),
    onSuccess: () => {
      roleCache.clearCache();
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
    mutationFn: (id: number | string) => rbacService.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      message.success('Xóa quyền thành công');
    },
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number | string; permissionIds: (number | string)[] }) => 
      rbacService.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      roleCache.clearCache();
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Cập nhật quyền cho vai trò thành công');
    },
  });

  return {
    permissions,
    roles,
    isLoading: loadingRoles || loadingPermissions,
    addRole: (role: Partial<Role>) => createRoleMutation.mutate(role),
    updateRole: (id: number | string, data: Partial<Role>) => updateRoleMutation.mutate({ id, data }),
    deleteRole: (id: number | string) => deleteRoleMutation.mutate(id),
    addPermission: (permission: Partial<Permission>) => createPermissionMutation.mutate(permission),
    deletePermission: (id: number | string) => deletePermissionMutation.mutate(id),
    updateRolePermissions: (roleId: number | string, permissionIds: (number | string)[]) => 
      updateRolePermissionsMutation.mutate({ roleId, permissionIds }),
  };
}
