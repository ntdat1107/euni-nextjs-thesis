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

  // Map route pathname to pageId
  let pageId = '';
  if (pathname.startsWith('/workflow/templates')) pageId = 'workflow-templates';
  else if (pathname.startsWith('/workflow/master-steps')) pageId = 'workflow-master-steps';
  else if (pathname.startsWith('/master-data/majors')) pageId = 'majors';
  else if (pathname.startsWith('/master-data/programs')) pageId = 'programs';
  else if (pathname.startsWith('/master-data/subjects')) pageId = 'subjects';
  else if (pathname.startsWith('/survey/campaigns')) pageId = 'survey-campaigns';
  else if (pathname.startsWith('/admin/users')) pageId = 'users';
  else if (pathname.startsWith('/admin/rbac')) pageId = 'rbac';

  if (!pageId) return true; // Default allow for unspecified routes

  // 1. Check saved permissions in localStorage
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

  // 2. Default permission mapping fallback
  const defaultAllowedPages: Record<string, string[]> = {
    ADMIN: ['dashboard', 'workflow-templates', 'workflow-master-steps', 'survey-campaigns', 'subjects', 'programs', 'majors', 'users', 'rbac', 'profile'],
    DTDH: ['dashboard', 'workflow-templates', 'workflow-master-steps', 'survey-campaigns', 'subjects', 'programs', 'majors', 'users', 'rbac', 'profile'],
    DEAN: ['dashboard', 'workflow-templates', 'workflow-master-steps', 'survey-campaigns', 'subjects', 'programs', 'majors', 'profile'],
    HEAD_DEPT: ['dashboard', 'subjects', 'programs', 'majors', 'profile'],
    LECTURER: ['dashboard', 'subjects', 'programs', 'majors', 'profile'],
    COMMITTEE: ['dashboard', 'workflow-templates', 'workflow-master-steps', 'subjects', 'profile'],
    COUNCIL: ['dashboard', 'workflow-templates', 'subjects', 'programs', 'profile'],
    QA: ['dashboard', 'survey-campaigns', 'subjects', 'programs', 'profile'],
  };

  return normalizedRoles.some((role) => {
    const allowedList = defaultAllowedPages[role];
    return allowedList ? allowedList.includes(pageId) : false;
  });
}
