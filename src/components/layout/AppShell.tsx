'use client';

import React, { useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn, isTokenExpired } from '@/lib/utils';
import { Alert, Button, App } from 'antd';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import MainLoading from '../ui/MainLoading';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // --- Instant Navigation Feedback ---
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const handleNavigation = useCallback((href: string) => {
    if (href !== pathname) {
      setIsNavigating(true);
      // Safety timeout to prevent getting stuck if navigation fails
      setTimeout(() => setIsNavigating(false), 5000);
    }
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem('euni_access_token');
    const userData = localStorage.getItem('euni_user');

    const checkAuth = () => {
      if (!token || !userData) {
        return false;
      }

      if (isTokenExpired(token)) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('euni_access_token');
        localStorage.removeItem('euni_refresh_token');
        localStorage.removeItem('euni_user');
        return false;
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
      
      if ((isInactive || needsPasswordChange) && pathname !== '/settings') {
        router.push('/settings');
      }
    }
  }, [isAuthenticated, pathname, router]);

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
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'
        )}
      >
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-8 flex-shrink-0">
          <Topbar />
        </header>

        <main className="p-8 flex-1 overflow-x-hidden relative">
          <MainLoading />
          <div className="max-w-[1600px] mx-auto h-full">
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
        
        <footer className="py-6 px-8 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
          <p className="font-semibold text-slate-500 uppercase tracking-wider mb-1">Trường Đại học Công nghệ eUni</p>
          &copy; {new Date().getFullYear()} eUni Thesis System - Hệ Thống Tác Nghiệp Số Xây Dựng Và Cập Nhật CTDT
        </footer>
      </div>
    </div>
  );
}
