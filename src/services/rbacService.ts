import { apiClient as api } from './api';

export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  permissions: Permission[];
}

export const rbacService = {
  getPermissions: async (signal?: AbortSignal): Promise<Permission[]> => {
    return api.get('/rbac/permissions', { signal });
  },

  createPermission: async (permission: Partial<Permission>): Promise<Permission> => {
    return api.post('/rbac/permissions', permission);
  },

  deletePermission: async (id: number | string): Promise<void> => {
    return api.delete(`/rbac/permissions/${id}`);
  },

  getRoles: async (signal?: AbortSignal): Promise<Role[]> => {
    return api.get('/rbac/roles', { signal });
  },

  createRole: async (role: Partial<Role>): Promise<Role> => {
    return api.post('/rbac/roles', role);
  },

  deleteRole: async (id: number | string): Promise<void> => {
    return api.delete(`/rbac/roles/${id}`);
  },

  updateRolePermissions: async (roleId: number | string, permissionIds: (number | string)[]): Promise<void> => {
    return api.put(`/rbac/roles/${roleId}/permissions`, { permissionIds });
  },
};
