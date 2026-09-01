import { rbacService, Role } from '@/services/rbacService';

const ROLES_CACHE_KEY = 'euni_roles_cache';

export const roleCache = {
  getRoles: async (): Promise<Role[]> => {
    if (typeof window === 'undefined') return [];
    
    const cached = localStorage.getItem(ROLES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const roles = await rbacService.getRoles();
    localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(roles));
    return roles;
  },

  clearCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ROLES_CACHE_KEY);
    }
  },

  getRoleLabel: (rolesList: Role[], userRoles: string[] | undefined) => {
    if (!userRoles || userRoles.length === 0) return 'Người dùng';
    const firstRole = userRoles[0];
    const rawCode = typeof firstRole === 'string' ? firstRole : ((firstRole as any)?.code || (firstRole as any)?.name || '');
    const primaryRoleCode = rawCode.replace(/^ROLE_/, '').toUpperCase();
    const role = rolesList.find(r => r.code.replace(/^ROLE_/, '').toUpperCase() === primaryRoleCode);
    return role ? role.name : 'Người dùng';
  }
};
