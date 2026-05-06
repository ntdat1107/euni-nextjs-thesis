'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  ChevronLeft,
  Box,
  User,
  LogOut,
  TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from 'antd';

interface NavItemProps {
  id: string;
  label: string;
  icon?: React.ElementType;
  path?: string;
  children?: NavItemProps[];
  collapsed?: boolean;
}

const NAV_ITEMS: NavItemProps[] = [
  {
    id: 'dashboard',
    label: 'Bảng điều khiển',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'workflow',
    label: 'Quy trình',
    icon: GitBranch,
    children: [
      { id: 'workflow-templates', label: 'Mẫu quy trình', path: '/workflow/templates' },
    ],
  },
  {
    id: 'operations',
    label: 'Vận hành',
    icon: ClipboardList,
    children: [
      { id: 'cycles', label: 'Chu kỳ đào tạo', path: '/cycles' },
    ],
  },
  {
    id: 'master-data',
    label: 'Dữ liệu gốc',
    icon: GraduationCap,
    children: [
      { id: 'programs', label: 'Chương trình', path: '/master-data/programs' },
      { id: 'majors', label: 'Ngành học', path: '/master-data/majors' },
      { id: 'subjects', label: 'Học phần', path: '/master-data/subjects' },
    ],
  },
  {
    id: 'survey',
    label: 'Khảo sát',
    icon: BarChart3,
    children: [
      { id: 'campaigns', label: 'Đợt khảo sát', path: '/survey/campaigns' },
    ],
  },
  {
    id: 'admin',
    label: 'Hệ thống',
    icon: Shield,
    children: [
      { id: 'users', label: 'Người dùng', path: '/admin/users' },
      { id: 'rbac', label: 'Phân quyền', path: '/admin/rbac' },
    ],
  },
];

export default function Sidebar({ 
  collapsed, 
  onToggle 
}: { 
  collapsed: boolean; 
  onToggle: () => void 
}) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (id: string) => {
    const newGroups = new Set(expandedGroups);
    if (newGroups.has(id)) {
      newGroups.delete(id);
    } else {
      newGroups.add(id);
    }
    setExpandedGroups(newGroups);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Box className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 text-sm leading-tight">eUni Thesis</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Hệ thống tác nghiệp</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              {item.children ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive(item.path) || Array.from(expandedGroups).includes(item.id)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            expandedGroups.has(item.id) && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>

                  {!collapsed && expandedGroups.has(item.id) && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={child.path || '#'}
                            className={cn(
                              'block px-3 py-2 rounded-lg text-sm transition-all duration-150',
                              isActive(child.path)
                                ? 'bg-brand-50 text-brand-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.path || '#'}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive(item.path)
                      ? 'bg-brand-50 text-brand-700 border-l-2 border-brand-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 flex-shrink-0">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mb-2',
            isActive('/settings')
              ? 'bg-brand-50 text-brand-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Cài đặt</span>}
        </Link>

        <div className="p-1 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate leading-tight">Quản trị viên</p>
              <p className="text-xs text-slate-500 truncate">admin@euni.edu.vn</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
