'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Calendar, Pencil, Lock, LogOut, Save, X, RefreshCw 
} from 'lucide-react';
import { Avatar, Button, Card, Tag, Input, Typography, App, Space, Divider, Modal, Form } from 'antd';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { apiClient } from '@/services/api';
import { cn } from '@/lib/utils';
import AppShell from '@/components/layout/AppShell';

import { userService } from '@/services/userService';
import { roleCache } from '@/lib/roleCache';
import { Role } from '@/services/rbacService';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const router = useRouter();
  const { message } = App.useApp();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passForm] = Form.useForm();

  useEffect(() => {
    const initData = async () => {
      setRefreshing(true);
      try {
        const [user, rolesList] = await Promise.all([
          userService.getMe(),
          roleCache.getRoles()
        ]);
        
        setCurrentUser(user);
        setAllRoles(rolesList);
        setEditEmail(user.email || '');
        
        localStorage.setItem('euni_user', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to init profile data:', error);
        const localUserStr = localStorage.getItem('euni_user');
        if (localUserStr) {
          const user = JSON.parse(localUserStr);
          setCurrentUser(user);
          setEditEmail(user.email || '');
        }
      } finally {
        setRefreshing(false);
      }
    };

    initData();
  }, []);

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      roleCache.clearCache();
      const [user, rolesList] = await Promise.all([
        userService.getMe(),
        roleCache.getRoles()
      ]);
      setCurrentUser(user);
      setAllRoles(rolesList);
      message.success('Đã cập nhật thông tin mới nhất');
    } catch (error) {
      message.error('Không thể tải thông tin. Vui lòng thử lại.');
    } finally {
      setRefreshing(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Simulation of update
      const updatedUser = { ...currentUser, email: editEmail };
      localStorage.setItem('euni_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      message.success('Đã cập nhật hồ sơ');
      setEditMode(false);
    } catch (error) {
      message.error('Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handlePassChange = async (values: any) => {
    setPassLoading(true);
    try {
      await authService.changePassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Đổi mật khẩu thành công');
      setIsPassModalOpen(false);
      passForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Đã xảy ra lỗi khi đổi mật khẩu');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (!currentUser) return null;

  const roleLabel = roleCache.getRoleLabel(allRoles, currentUser.roles);
  const roleColor = (currentUser.roles && currentUser.roles[0]?.toUpperCase() === 'ADMIN') ? 'red' : 'blue';

  const avatarInitials = currentUser.fullName ? currentUser.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <AppShell>
      <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1">Hồ sơ cá nhân</Title>
            <Text type="secondary">Xem và quản lý thông tin tài khoản của bạn</Text>
          </div>
          <Button 
            icon={<RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />} 
            onClick={refreshProfile}
            disabled={refreshing}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-24 h-24 bg-gradient-to-br from-edu-primary to-blue-700 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-white">
                  <span className="text-3xl font-bold text-white select-none">{avatarInitials}</span>
                </div>
                <Title level={4} className="!mb-1">{currentUser.fullName}</Title>
                <Text type="secondary" className="block mb-3">{currentUser.email || 'Chưa có email'}</Text>
                <Tag color={roleColor} className="rounded-full px-4 py-0.5 border-0 font-medium">
                  {roleLabel}
                </Tag>
              </div>

              <Divider className="my-6" />

              <div className="space-y-2">
                <Button 
                  type="text" 
                  block 
                  className="flex items-center justify-start gap-3 !h-11 !px-4 hover:!bg-blue-50 hover:!text-edu-primary transition-colors border-0"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-600">Chỉnh sửa hồ sơ</span>
                </Button>
                <Button 
                  type="text" 
                  block 
                  className="flex items-center justify-start gap-3 !h-11 !px-4 hover:!bg-slate-50 transition-colors border-0"
                  onClick={() => setIsPassModalOpen(true)}
                >
                  <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-600">Đổi mật khẩu</span>
                </Button>
                <Button 
                  type="text" 
                  block 
                  danger
                  className="flex items-center justify-start gap-3 !h-11 !px-4 hover:!bg-rose-50 transition-colors border-0"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Đăng xuất</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Card 
              className="shadow-sm border-slate-200" 
              title={<span className="text-base font-bold text-slate-800">Thông tin tài khoản</span>}
              extra={
                !editMode && (
                  <Button 
                    type="link" 
                    icon={<Pencil className="w-3.5 h-3.5" />} 
                    onClick={() => setEditMode(true)}
                    className="font-bold flex items-center"
                  >
                    Chỉnh sửa
                  </Button>
                )
              }
            >
              {!editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tên đăng nhập</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser.username || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                      <Mail className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                      <Shield className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vai trò</p>
                      <div className="mt-0.5">
                        <Tag color={roleColor} className="rounded-full px-3 py-0 border-0 font-bold text-[10px] uppercase">
                          {roleLabel}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                      <Calendar className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ID tài khoản</p>
                      <p className="text-[13px] font-mono font-bold text-slate-600 truncate">{currentUser.id || '—'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tên đăng nhập</label>
                    <Input 
                      value={currentUser.username} 
                      disabled 
                      className="h-10 rounded-lg bg-slate-50 font-bold" 
                    />
                    <Text type="secondary" className="text-[11px]">Tên đăng nhập không thể thay đổi</Text>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Họ và tên</label>
                    <Input 
                      value={currentUser.fullName} 
                      disabled 
                      className="h-10 rounded-lg bg-slate-50 font-bold" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <Input 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email..."
                      className="h-10 rounded-lg focus:ring-2 focus:ring-edu-primary/20"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <Button 
                      type="primary" 
                      icon={<Save className="w-4 h-4" />} 
                      onClick={saveProfile}
                      loading={saving}
                      className="bg-edu-primary h-10 rounded-lg font-bold px-6 border-0"
                    >
                      Lưu thay đổi
                    </Button>
                    <Button 
                      icon={<X className="w-4 h-4" />} 
                      onClick={() => setEditMode(false)}
                      disabled={saving}
                      className="h-10 rounded-lg font-bold border-slate-200"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <Card 
              className="shadow-sm border-slate-200" 
              title={<span className="text-base font-bold text-slate-800">Bảo mật</span>}
            >
              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex items-center justify-between py-4 first:pt-0">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold text-slate-900 mb-0.5">Mật khẩu</p>
                    <p className="text-xs text-slate-500">Đổi mật khẩu để bảo vệ tài khoản</p>
                  </div>
                  <Button 
                    onClick={() => setIsPassModalOpen(true)}
                    className="font-bold border-slate-200 h-9"
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-0.5">Xác thực 2 bước</p>
                    <p className="text-xs text-slate-500">Thêm lớp bảo mật cho tài khoản</p>
                  </div>
                  <Tag color="default" className="rounded-full px-3 py-0.5 border-0 font-bold text-[10px] uppercase">Sắp ra mắt</Tag>
                </div>
                <div className="flex items-center justify-between py-4 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-0.5">Phiên đăng nhập</p>
                    <p className="text-xs text-slate-500">Quản lý các thiết bị đã đăng nhập</p>
                  </div>
                  <Tag color="default" className="rounded-full px-3 py-0.5 border-0 font-bold text-[10px] uppercase">Sắp ra mắt</Tag>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 py-1">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-lg font-bold text-slate-800">Đổi mật khẩu</span>
          </div>
        }
        open={isPassModalOpen}
        onCancel={() => {
          setIsPassModalOpen(false);
          passForm.resetFields();
        }}
        footer={null}
        width={400}
        centered
        className="premium-modal"
      >
        <Form
          form={passForm}
          layout="vertical"
          onFinish={handlePassChange}
          className="mt-6"
          requiredMark={false}
        >
          <Form.Item
            name="currentPassword"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password 
              placeholder="••••••••" 
              className="h-11 border-slate-200 focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password 
              placeholder="••••••••" 
              className="h-11 border-slate-200 focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu mới</span>}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
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
              placeholder="••••••••" 
              className="h-11 border-slate-200 focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all"
            />
          </Form.Item>

          <div className="flex gap-3 mt-8">
            <Button 
              className="flex-1 h-11 border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              onClick={() => {
                setIsPassModalOpen(false);
                passForm.resetFields();
              }}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="primary"
              htmlType="submit"
              loading={passLoading}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 border-none font-bold shadow-lg shadow-blue-100"
            >
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </AppShell>
  );
}
