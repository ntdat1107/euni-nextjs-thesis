import { apiClient } from './api';

export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  permissions: Permission[];
}

export const rbacService = {
  getPermissions: () => apiClient.get<any, Permission[]>('/rbac/permissions'),
  createPermission: (permission: Partial<Permission>) => 
    apiClient.post<any, Permission>('/rbac/permissions', permission),
  deletePermission: (id: string) => apiClient.delete(`/rbac/permissions/${id}`),
  
  getRoles: () => apiClient.get<any, Role[]>('/rbac/roles'),
  createRole: (role: Partial<Role>) => apiClient.post<any, Role>('/rbac/roles', role),
  deleteRole: (id: string) => apiClient.delete(`/rbac/roles/${id}`),
  
  updateRolePermissions: (roleId: string, permissionIds: string[]) => 
    apiClient.put(`/rbac/roles/${roleId}/permissions`, { permissionIds }),
};
