'use client';

import React, { useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn, isTokenExpired } from '@/lib/utils';
import { Alert, Button, App } from 'antd';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import MainLoading from '../ui/MainLoading';

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
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // --- Instant Navigation Feedback ---
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigation = useCallback((href: string) => {
    if (href !== pathname) {
      setIsNavigating(true);
      // Safety timeout to prevent getting stuck if navigation fails
      setTimeout(() => setIsNavigating(false), 5000);
    }
  }, [pathname]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Instant Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-brand-100 overflow-hidden">
          <div className="h-full bg-brand-600 animate-progress-fast shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
        </div>
      )}

      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onNavigate={handleNavigation}
      />

      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-[80px]' : 'ml-[220px]'
        )}
      >
        <React.Suspense fallback={null}>
          <SearchParamsHandler isAuthenticated={isAuthenticated} onNavigateEnd={onNavigateEnd} />
        </React.Suspense>
        
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-8 flex-shrink-0">
          <Topbar />
        </header>

        <main className="pl-4 pr-0 py-6 pb-12 flex-1 min-w-0 relative">
          <MainLoading />
          <div className="w-full h-full pr-0">
            {isAuthenticated === true ? (
              children
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
