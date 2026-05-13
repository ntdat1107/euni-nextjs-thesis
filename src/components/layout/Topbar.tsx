'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  HelpCircle,
  Menu
} from 'lucide-react';
import { Input, Badge, Avatar, Dropdown } from 'antd';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { roleCache } from '@/lib/roleCache';
import { Role } from '@/services/rbacService';
import Link from 'next/link';

export default function Topbar() {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [allRoles, setAllRoles] = React.useState<Role[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    const initData = async () => {
      try {
        const [rolesList] = await Promise.all([roleCache.getRoles()]);
        setAllRoles(rolesList);
        
        const localUserStr = localStorage.getItem('euni_user');
        if (localUserStr) {
          setCurrentUser(JSON.parse(localUserStr));
        }
      } catch (error) {
        console.error('Topbar data init failed:', error);
      }
    };
    initData();
  }, []);

  return (
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="max-w-md w-full relative group">
          <Input 
            prefix={<Search className="w-4 h-4 text-slate-400 group-focus-within:text-edu-primary transition-colors" />} 
            placeholder="Tìm kiếm thông tin, hồ sơ, học phần..." 
            variant="filled"
            className="rounded-lg border-transparent bg-slate-100 hover:bg-slate-200/70 focus:bg-white focus:ring-2 focus:ring-edu-primary/20 transition-all h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-edu-primary rounded-lg transition-all">
          <HelpCircle className="w-5 h-5" />
        </button>

        <Badge count={5} size="small" offset={[-2, 2]} color="#1e3a8a">
          <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-edu-primary rounded-lg transition-all">
            <Bell className="w-5 h-5" />
          </button>
        </Badge>

        <div className="h-6 w-px bg-slate-200 mx-3" />

        <Dropdown
          menu={{
            items: [
              {
                key: 'profile',
                label: 'Hồ sơ người dùng',
                icon: <User className="w-4 h-4" />,
                onClick: () => router.push('/profile'),
              },
              {
                type: 'divider',
              },
              {
                key: 'logout',
                label: 'Đăng xuất',
                icon: <LogOut className="w-4 h-4" />,
                danger: true,
                onClick: () => authService.logout(),
              },
            ],
          }}
          trigger={['click']}
          placement="bottomRight"
          overlayClassName="min-w-[200px]"
        >
          <div className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group min-h-[46px] cursor-pointer">
            {isClient && currentUser ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-edu-primary transition-colors">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {roleCache.getRoleLabel(allRoles, currentUser.roles)}
                  </p>
                </div>
                <Avatar 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
                  className="border border-slate-200 bg-white"
                  size={36}
                />
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block space-y-1 text-right">
                  <div className="h-3 w-20 bg-slate-100 animate-pulse rounded ml-auto" />
                  <div className="h-2 w-16 bg-slate-100 animate-pulse rounded ml-auto" />
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  );
}
