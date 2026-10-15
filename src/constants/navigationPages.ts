import {
  LayoutDashboard,
  GitBranch,
  FolderTree,
  BookMarked,
  Shield,
  User,
} from 'lucide-react';

export interface NavPageItem {
  id: string;
  name: string;
  category: 'Tổng quan' | 'Quy trình' | 'Danh mục' | 'Đào tạo' | 'Hệ thống';
  path: string;
  defaultRoles: string[]; // Roles with default view access
  createUpdateRoles?: string[]; // Roles with default create/update access
}

export interface SidebarNavGroup {
  id: string;
  label: string;
  icon?: any;
  roles?: string[];
  path?: string;
  children?: {
    id: string;
    label: string;
    path: string;
    roles?: string[];
  }[];
}

// SINGLE SOURCE OF TRUTH FOR ALL SIDEBAR & RBAC PAGES
export const NAV_PAGES: NavPageItem[] = [
  {
    id: 'dashboard',
    name: 'Bảng điều khiển',
    category: 'Tổng quan',
    path: '/',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER', 'COMMITTEE', 'COUNCIL', 'QA'],
    createUpdateRoles: ['ADMIN', 'DTDH'],
  },
  {
    id: 'workflow-templates',
    name: 'Mẫu quy trình',
    category: 'Quy trình',
    path: '/workflow/templates',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'COMMITTEE', 'COUNCIL'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'COMMITTEE'],
  },
  {
    id: 'workflow-master-steps',
    name: 'Kho bước mẫu',
    category: 'Quy trình',
    path: '/workflow/master-steps',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'COMMITTEE'],
    createUpdateRoles: ['ADMIN', 'DTDH'],
  },
  {
    id: 'faculties',
    name: 'Khoa',
    category: 'Danh mục',
    path: '/master-data/faculties',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN'],
  },
  {
    id: 'departments',
    name: 'Bộ môn',
    category: 'Danh mục',
    path: '/master-data/departments',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT'],
  },
  {
    id: 'majors',
    name: 'Ngành học',
    category: 'Danh mục',
    path: '/master-data/majors',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN'],
  },
  {
    id: 'subjects',
    name: 'Môn học',
    category: 'Danh mục',
    path: '/master-data/subjects',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER', 'COMMITTEE', 'COUNCIL', 'QA'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER'],
  },

  {
    id: 'curriculum-programs',
    name: 'Chương trình đào tạo',
    category: 'Đào tạo',
    path: '/curriculum/programs',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER', 'COUNCIL', 'QA'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN'],
  },
  {
    id: 'curriculum-development',
    name: 'Xây dựng & Rà soát CTĐT',
    category: 'Đào tạo',
    path: '/curriculum/development',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'QA'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN', 'QA'],
  },
  {
    id: 'users',
    name: 'Quản lý người dùng',
    category: 'Hệ thống',
    path: '/admin/users',
    defaultRoles: ['ADMIN', 'DTDH'],
    createUpdateRoles: ['ADMIN'],
  },
  {
    id: 'rbac',
    name: 'Phân quyền (RBAC)',
    category: 'Hệ thống',
    path: '/admin/rbac',
    defaultRoles: ['ADMIN', 'DTDH'],
    createUpdateRoles: ['ADMIN'],
  },
  {
    id: 'ai-prompts',
    name: 'Quản lý AI Prompts',
    category: 'Hệ thống',
    path: '/admin/ai-prompts',
    defaultRoles: ['ADMIN', 'DTDH'],
    createUpdateRoles: ['ADMIN'],
  },
  {
    id: 'profile',
    name: 'Hồ sơ người dùng',
    category: 'Hệ thống',
    path: '/profile',
    defaultRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER', 'COMMITTEE', 'COUNCIL', 'QA'],
    createUpdateRoles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER', 'COMMITTEE', 'COUNCIL', 'QA'],
  },
];

// Auto-generated SIDEBAR_PAGES for RBAC Page
export const SIDEBAR_PAGES = NAV_PAGES.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  path: p.path,
}));

// Auto-generated NAV_ITEMS tree for Sidebar Menu Component
export const DYNAMIC_NAV_ITEMS: SidebarNavGroup[] = [
  {
    id: 'dashboard',
    label: 'Bảng điều khiển',
    icon: LayoutDashboard,
    path: '/',
    roles: NAV_PAGES.find((p) => p.id === 'dashboard')?.defaultRoles,
  },
  {
    id: 'workflow',
    label: 'Quy trình',
    icon: GitBranch,
    roles: ['ADMIN', 'DTDH', 'DEAN', 'COMMITTEE', 'COUNCIL'],
    children: [
      {
        id: 'workflow-templates',
        label: 'Mẫu quy trình',
        path: '/workflow/templates',
        roles: NAV_PAGES.find((p) => p.id === 'workflow-templates')?.defaultRoles,
      },
      {
        id: 'workflow-master-steps',
        label: 'Kho bước mẫu',
        path: '/workflow/master-steps',
        roles: NAV_PAGES.find((p) => p.id === 'workflow-master-steps')?.defaultRoles,
      },
    ],
  },
  {
    id: 'master-data',
    label: 'Danh mục',
    icon: FolderTree,
    roles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER'],
    children: [
      {
        id: 'faculties',
        label: 'Khoa',
        path: '/master-data/faculties',
        roles: NAV_PAGES.find((p) => p.id === 'faculties')?.defaultRoles,
      },
      {
        id: 'departments',
        label: 'Bộ môn',
        path: '/master-data/departments',
        roles: NAV_PAGES.find((p) => p.id === 'departments')?.defaultRoles,
      },
      {
        id: 'majors',
        label: 'Ngành học',
        path: '/master-data/majors',
        roles: NAV_PAGES.find((p) => p.id === 'majors')?.defaultRoles,
      },
      {
        id: 'subjects',
        label: 'Môn học',
        path: '/master-data/subjects',
        roles: NAV_PAGES.find((p) => p.id === 'subjects')?.defaultRoles,
      },

    ],
  },
  {
    id: 'curriculum',
    label: 'Đào tạo',
    icon: BookMarked,
    roles: ['ADMIN', 'DTDH', 'DEAN', 'HEAD_DEPT', 'LECTURER', 'COUNCIL', 'QA'],
    children: [
      {
        id: 'curriculum-programs',
        label: 'Chương trình đào tạo',
        path: '/curriculum/programs',
        roles: NAV_PAGES.find((p) => p.id === 'curriculum-programs')?.defaultRoles,
      },
      {
        id: 'curriculum-development',
        label: 'Xây dựng & Rà soát CTĐT',
        path: '/curriculum/development',
        roles: NAV_PAGES.find((p) => p.id === 'curriculum-development')?.defaultRoles,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Hệ thống',
    icon: Shield,
    roles: ['ADMIN', 'DTDH'],
    children: [
      {
        id: 'users',
        label: 'Người dùng',
        path: '/admin/users',
        roles: NAV_PAGES.find((p) => p.id === 'users')?.defaultRoles,
      },
      {
        id: 'rbac',
        label: 'Phân quyền (RBAC)',
        path: '/admin/rbac',
        roles: NAV_PAGES.find((p) => p.id === 'rbac')?.defaultRoles,
      },
      {
        id: 'ai-prompts',
        label: 'Quản lý AI Prompts',
        path: '/admin/ai-prompts',
        roles: NAV_PAGES.find((p) => p.id === 'ai-prompts')?.defaultRoles,
      },
    ],
  },
  {
    id: 'profile',
    label: 'Hồ sơ người dùng',
    icon: User,
    path: '/profile',
    roles: NAV_PAGES.find((p) => p.id === 'profile')?.defaultRoles,
  },
];
