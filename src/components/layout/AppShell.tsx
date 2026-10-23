'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn, isTokenExpired } from '@/lib/utils';
import { Alert, Button, App } from 'antd';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MainLoading from '../ui/MainLoading';
import PageSkeleton from '../ui/PageSkeleton';
import { ShieldAlert } from 'lucide-react';
import { isPathAllowed } from '@/lib/permissions';

// Separated component to use useSearchParams within Suspense
function SearchParamsHandler({ 
  isAuthenticated, 
  onNavigateEnd 
}: { 
  isAuthenticated: boolean | null; 
  onNavigateEnd: () => void;
}) {
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  useEffect(() => {
    if (isAuthenticated && searchParams.get('login') === 'success') {
      const userData = localStorage.getItem('euni_user');
      if (userData) {
        const user = JSON.parse(userData);
        message.success(`Chào mừng trở lại, ${user.fullName}!`);
        
        // Clear the param
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]login=success/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [isAuthenticated, searchParams, message]);

  // Handle navigation feedback
  useEffect(() => {
    onNavigateEnd();
  }, [searchParams, onNavigateEnd]);

  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('euni_access_token');
      const refreshToken = localStorage.getItem('euni_refresh_token');
      const userData = localStorage.getItem('euni_user');
      return Boolean(userData && (token || refreshToken));
    }
    return null;
  });
  const [isNavigating, setIsNavigating] = useState(false);

  // --- Instant Navigation Feedback ---
  React.useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigation = useCallback((href: string) => {
    if (href !== pathname) {
      setIsNavigating(true);
      // Safety timeout to prevent getting stuck if navigation fails
      setTimeout(() => setIsNavigating(false), 5000);
    }
  }, [pathname]);

  // Global click interceptor to catch ANY internal navigation (Breadcrumbs, Buttons, Cards)
  React.useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.origin);
        if (
          targetUrl.origin === window.location.origin &&
          targetUrl.pathname !== window.location.pathname
        ) {
          setIsNavigating(true);
        }
      } catch (err) {}
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, []);

  const onNavigateEnd = useCallback(() => {
    setIsNavigating(false);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('euni_access_token');
      const refreshToken = localStorage.getItem('euni_refresh_token');
      const userData = localStorage.getItem('euni_user');

      if (!userData || (!token && !refreshToken)) {
        return false;
      }

      if (refreshToken && (!token || isTokenExpired(token))) {
        return true;
      }

      return true;
    };

    if (!checkAuth()) {
      setIsAuthenticated(false);
      if (pathname !== '/login') {
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/login?session=expired&redirect=${redirectUrl}`);
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [router, pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      const currentUser = JSON.parse(localStorage.getItem('euni_user') || '{}');
      const isInactive = currentUser?.status === 'Inactive';
      const needsPasswordChange = currentUser?.tokenVersion === 0;
      
      if ((isInactive || needsPasswordChange) && pathname !== '/change-password') {
        router.push('/change-password');
      }
    }
  }, [isAuthenticated, pathname, router]);

  // Route permission check for direct link access
  const userRoles = React.useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const currentUser = JSON.parse(localStorage.getItem('euni_user') || '{}');
      return currentUser?.roles || [];
    } catch (e) {
      return [];
    }
  }, [isAuthenticated]);

  const hasPagePermission = React.useMemo(() => {
    if (!isAuthenticated) return true;
    return isPathAllowed(pathname, userRoles);
  }, [isAuthenticated, pathname, userRoles]);

  useEffect(() => {
    if (isAuthenticated && !hasPagePermission) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasPagePermission, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Instant Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-blue-100 overflow-hidden pointer-events-none">
          <div className="h-full bg-blue-600 animate-progress-fast shadow-[0_0_12px_rgba(37,99,235,0.8)]" />
        </div>
      )}

      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onNavigate={handleNavigation}
      />

      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 max-w-full overflow-x-hidden',
          sidebarCollapsed ? 'ml-[80px]' : 'ml-[220px]'
        )}
      >
        <React.Suspense fallback={null}>
          <SearchParamsHandler isAuthenticated={isAuthenticated} onNavigateEnd={onNavigateEnd} />
        </React.Suspense>
        
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-8 flex-shrink-0">
          <Topbar />
        </header>

        <main className="px-4 py-6 pb-12 flex-1 min-w-0 relative w-full max-w-full">
          <MainLoading />
          <div className="w-full h-full">
            {isAuthenticated === true ? (
              hasPagePermission ? (
                <React.Suspense fallback={<PageSkeleton />}>
                  {children}
                </React.Suspense>
              ) : (
                <div className="h-[65vh] w-full flex items-center justify-center p-6">
                  <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                      <ShieldAlert className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">403 - Truy Cập Bị Từ Chối</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                      Tài khoản của bạn không có quyền xem hoặc thao tác trên đường dẫn này. Hệ thống sẽ tự động chuyển bạn về Bảng điều khiển.
                    </p>
                    <Button type="primary" onClick={() => router.push('/')} className="rounded-xl h-10 px-6 font-semibold">
                      Trở về Bảng điều khiển ngay
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="h-[60vh] w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium animate-pulse">Đang xác thực phiên làm việc...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
