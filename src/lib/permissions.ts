import { NAV_PAGES } from '@/constants/navigationPages';

export interface PermissionState {
  [pageId: string]: {
    [roleCode: string]: {
      view: boolean;
      createUpdate: boolean;
    };
  };
}

export function isPathAllowed(pathname: string, userRoles: string[]): boolean {
  if (!pathname || pathname === '/' || pathname === '/profile' || pathname === '/change-password') {
    return true;
  }

  // Normalize role codes (remove ROLE_ prefix and uppercase)
  const normalizedRoles = userRoles.map((r) =>
    (typeof r === 'string' ? r : (r as any)?.code || '')
      .replace(/^ROLE_/, '')
      .toUpperCase()
  ).filter(Boolean);

  // ADMIN always has access to all pages
  if (normalizedRoles.includes('ADMIN')) {
    return true;
  }

  // Dynamic Route to pageId Lookup from single source of truth
  const targetPage = NAV_PAGES.find((p) => p.path !== '/' && pathname.startsWith(p.path));
  if (!targetPage) return true; // Default allow for unspecified routes

  const pageId = targetPage.id;

  // 1. Check saved custom permissions in localStorage
  if (typeof window !== 'undefined') {
    const savedStr = localStorage.getItem('euni_sidebar_page_permissions');
    if (savedStr) {
      try {
        const savedPerms: PermissionState = JSON.parse(savedStr);
        const pagePerm = savedPerms[pageId];
        if (pagePerm) {
          return normalizedRoles.some((role) => pagePerm[role]?.view === true);
        }
      } catch (e) {}
    }
  }

  // 2. Default permission fallback from NAV_PAGES defaultRoles
  return normalizedRoles.some((role) => targetPage.defaultRoles.includes(role));
}
