'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Divider, 
  Alert,
  App
} from 'antd';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

const { Title, Text, Paragraph } = Typography;

function SettingsContent() {
  const { users = [], isLoading, updateUserStatus, changePassword } = useUsers();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      const localUserStr = localStorage.getItem('euni_user');
      const localUser = localUserStr ? JSON.parse(localUserStr) : null;
      const user = users.find((u: any) => u.username === localUser?.username) || localUser;
      setCurrentUser(user);
    }
  }, [isLoading, users]);

  if (isLoading) {
    return <Card className="p-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" /></Card>;
  }
  
  const isInactive = currentUser?.status === 'Inactive' || currentUser?.tokenVersion === 0;

  const handlePasswordChange = async (values: any) => {
    try {
      await changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      
      // Clear token and redirect to login
      localStorage.removeItem('euni_access_token');
      localStorage.removeItem('euni_refresh_token');
      localStorage.removeItem('euni_user');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
      form.resetFields();
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <Title level={2} className="!mb-1 font-display tracking-tight">
          {isInactive ? 'Kích hoạt tài khoản' : 'Cài đặt tài khoản'}
        </Title>
        <Text className="text-slate-500 font-medium">
          {isInactive 
            ? 'Vui lòng thay đổi mật khẩu mặc định để kích hoạt tài khoản của bạn.' 
            : 'Quản lý thông tin cá nhân và thiết lập bảo mật hệ thống.'}
        </Text>
      </div>

      <Card className="card-premium overflow-hidden border-0" styles={{ body: { padding: 0 } }}>
        <Tabs
          tabPosition="left"
          defaultActiveKey={isInactive ? 'security' : 'profile'}
          className="settings-tabs min-h-[600px]"
          items={[
            {
              key: 'profile',
              label: (
                <div className="flex items-center gap-3 px-6 py-4">
                  <User className="w-5 h-5" /> 
                  <span className="font-bold tracking-tight">Thông tin cá nhân</span>
                </div>
              ),
              children: (
                <div className="p-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <Title level={4} className="!mb-8 font-display">Thông tin định danh</Title>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div className="group">
                        <Text className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2 group-hover:text-brand-500 transition-colors">Họ và tên</Text>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-brand-100 group-hover:shadow-sm transition-all">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <User className="w-5 h-5 text-brand-600" />
                          </div>
                          <span className="font-bold text-slate-900">{currentUser?.fullName}</span>
                        </div>
                      </div>
                      <div className="group">
                        <Text className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2 group-hover:text-brand-500 transition-colors">Email công vụ</Text>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-brand-100 group-hover:shadow-sm transition-all">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Mail className="w-5 h-5 text-brand-600" />
                          </div>
                          <span className="font-bold text-slate-900">{currentUser?.email}</span>
                        </div>
                      </div>
                      <div className="group">
                        <Text className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2 group-hover:text-brand-500 transition-colors">Mã số NV/GV</Text>
                        <div className="flex items-center gap-3 p-4 bg-brand-50/30 rounded-xl border border-brand-100 group-hover:bg-white group-hover:border-brand-200 group-hover:shadow-sm transition-all">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-brand-600" />
                          </div>
                          <span className="font-mono font-bold text-brand-700">{currentUser?.employeeId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="group">
                        <Text className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2 group-hover:text-brand-500 transition-colors">Đơn vị công tác</Text>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-brand-100 group-hover:shadow-sm transition-all">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5 text-brand-600" />
                          </div>
                          <span className="font-bold text-slate-900">{currentUser?.department}</span>
                        </div>
                      </div>
                      <div className="group">
                        <Text className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-2 group-hover:text-brand-500 transition-colors">Số điện thoại</Text>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-brand-100 group-hover:shadow-sm transition-all">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Phone className="w-5 h-5 text-brand-600" />
                          </div>
                          <span className="font-bold text-slate-900">{currentUser?.phone || 'Chưa cập nhật'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 items-start">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-100">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900 mb-1">Thông tin được bảo mật</p>
                      <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Các thông tin định danh trên được đồng bộ từ hệ thống nhân sự trung tâm. 
                        Để thay đổi, vui lòng liên hệ <strong>Phòng Tổ chức Cán bộ</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'security',
              label: (
                <div className="flex items-center gap-3 px-6 py-4">
                  <Lock className="w-5 h-5" /> 
                  <span className="font-bold tracking-tight">Bảo mật tài khoản</span>
                </div>
              ),
              children: (
                <div className="p-10 max-w-xl animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                      <Lock className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <Title level={4} className="!mb-0 font-display">Thay đổi mật khẩu</Title>
                      <Paragraph className="text-slate-500 font-medium mb-0 text-sm">
                        Thiết lập mật khẩu mới để bảo vệ tài khoản của bạn.
                      </Paragraph>
                    </div>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                    requiredMark={false}
                    className="space-y-4"
                  >
                    <Form.Item
                      name="oldPassword"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu hiện tại</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
                    >
                      <Input.Password 
                        prefix={<Lock className="w-4 h-4 text-slate-300 mr-2" />} 
                        placeholder="••••••••"
                        className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        iconRender={visible => (visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />)}
                      />
                    </Form.Item>

                    <Divider className="!my-6 border-slate-100" />

                    <Form.Item
                      name="newPassword"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu mới</span>}
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                        { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
                      ]}
                    >
                      <Input.Password 
                        prefix={<Lock className="w-4 h-4 text-slate-300 mr-2" />}
                        placeholder="Tối thiểu 8 ký tự"
                        className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        iconRender={visible => (visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />)}
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Xác nhận mật khẩu mới</span>}
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password 
                        prefix={<Lock className="w-4 h-4 text-slate-300 mr-2" />}
                        placeholder="Nhập lại mật khẩu mới"
                        className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all"
                        iconRender={visible => (visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />)}
                      />
                    </Form.Item>

                    <Form.Item className="pt-6">
                      <Button type="primary" htmlType="submit" className="h-12 px-10 shadow-lg shadow-brand-100 btn-hover-effect text-base font-bold" block>
                        Cập nhật mật khẩu ngay
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}
