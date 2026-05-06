'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '@/lib/utils';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <div
        className={cn(
          'transition-all duration-300 flex flex-col min-h-screen',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        )}
      >
        <Topbar />

        <main className="p-6 flex-1">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="py-4 px-6 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
          &copy; {new Date().getFullYear()} eUni Thesis System - Hệ Thống Tác Nghiệp Số Xây Dựng Và Cập Nhật CTDT
        </footer>
      </div>
    </div>
  );
}
