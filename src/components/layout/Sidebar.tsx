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
import { Button, Avatar } from 'antd';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: (href: string) => void;
}

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
  onToggle,
  onNavigate
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    setIsClient(true);
    const localUserStr = localStorage.getItem('euni_user');
    if (localUserStr) {
      setCurrentUser(JSON.parse(localUserStr));
    }
  }, []);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Auto-expand group when child path is active
  React.useEffect(() => {
    if (!pathname) return;
    
    NAV_ITEMS.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => {
          if (!child.path) return false;
          return pathname === child.path || pathname.startsWith(child.path + '/');
        });
        
        if (hasActiveChild) {
          setExpandedGroups(prev => {
            if (prev.has(item.id)) return prev;
            return new Set(prev).add(item.id);
          });
        }
      }
    });
  }, [pathname]);

  // Memoize active path check to avoid redundant string operations during render
  const activePath = React.useMemo(() => {
    if (!pathname) return '';
    return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  }, [pathname]);

  const isActive = React.useCallback((path?: string) => {
    if (!path || !activePath) return false;
    
    const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');

    if (normalizedPath === '/') return activePath === '/';
    return activePath === normalizedPath || activePath.startsWith(normalizedPath + '/');
  }, [activePath]);


  const handleLogout = () => {
    import('@/services/authService').then(({ authService }) => {
      authService.logout();
    });
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-50 border-r border-slate-200 flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[80px]' : 'w-[280px]'
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-edu-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-edu-primary text-base leading-tight tracking-tight uppercase">eUni Thesis</span>
              <span className="text-[9px] text-slate-500 font-bold tracking-[0.1em] uppercase">Hệ thống tác nghiệp số</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              {item.children ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group',
                      expandedGroups.has(item.id)
                        ? 'text-slate-900 bg-white/50'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    {item.icon && (
                      <item.icon 
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors", 
                          expandedGroups.has(item.id) ? "text-edu-primary" : "text-slate-400 group-hover:text-edu-primary"
                        )} 
                      />
                    )}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-300 opacity-50',
                            expandedGroups.has(item.id) && 'rotate-180 opacity-100'
                          )}
                        />
                      </>
                    )}
                  </button>

                  {!collapsed && expandedGroups.has(item.id) && (
                    <ul className="mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <li key={child.id} className="relative">
                          <Link
                            href={child.path || '#'}
                            prefetch={false}
                            onMouseDown={() => child.path && onNavigate?.(child.path)}
                            className={cn(
                              'block pl-11 pr-4 py-2 rounded-lg text-sm transition-all duration-200',
                              isActive(child.path)
                                ? '!text-edu-primary font-bold bg-white shadow-sm ring-1 ring-slate-200'
                                : '!text-slate-500 hover:!text-slate-900 hover:bg-white/50'
                            )}
                          >
                            {child.label}
                          </Link>
                          {isActive(child.path) && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-4 bg-edu-primary rounded-full" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                  <Link
                    href={item.path || '#'}
                    prefetch={false}
                    onMouseDown={() => item.path && onNavigate?.(item.path)}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group',
                      isActive(item.path)
                        ? 'bg-white !text-edu-primary font-bold shadow-sm ring-1 ring-slate-200'
                        : '!text-slate-600 hover:bg-white hover:!text-slate-900'
                    )}
                  >
                    {item.icon && (
                      <item.icon 
                        className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors", 
                          isActive(item.path) ? "!text-edu-primary" : "!text-slate-400 group-hover:!text-slate-600"
                        )} 
                      />
                    )}
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {isActive(item.path) && (
                    <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 bg-edu-primary rounded-r-full" />
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Area */}
      <div className="border-t border-slate-200 bg-white px-3 py-4 flex-shrink-0 space-y-2">
        <Link
          href="/settings"
          prefetch={false}
          onMouseDown={() => onNavigate?.('/settings')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group',
            isActive('/settings')
              ? '!text-edu-primary bg-slate-50 font-bold'
              : '!text-slate-600 hover:bg-slate-50 hover:!text-slate-900'
          )}
        >
          <Settings className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive('/settings') ? '!text-edu-primary' : '!text-slate-400 group-hover:!text-slate-600')} />
          {!collapsed && <span>Cài đặt hệ thống</span>}
        </Link>

        <div className="p-2 rounded-xl flex items-center gap-3 border border-slate-100 bg-slate-50/50 min-h-[56px]">
          {isClient && currentUser ? (
            <>
              <Avatar 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} 
                size={40}
                className="border border-slate-200 flex-shrink-0"
              />
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium mt-0.5">{currentUser.email}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
              {!collapsed && (
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                  <div className="h-2 w-24 bg-slate-200 animate-pulse rounded" />
                </div>
              )}
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm z-50"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
