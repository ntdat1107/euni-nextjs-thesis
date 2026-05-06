'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  HelpCircle,
  Menu
} from 'lucide-react';
import { Input, Badge, Avatar } from 'antd';

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="max-w-md w-full relative group">
          <Input 
            prefix={<Search className="w-4 h-4 text-slate-400" />} 
            placeholder="Tìm kiếm công việc, tài liệu..." 
            className="rounded-lg border-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        <Badge count={5} size="small" offset={[-2, 2]}>
          <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </Badge>

        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">Admin User</p>
            <p className="text-xs text-slate-500">Quản trị viên hệ thống</p>
          </div>
          <Avatar 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            className="border-2 border-brand-100"
          />
        </div>
      </div>
    </header>
  );
}
