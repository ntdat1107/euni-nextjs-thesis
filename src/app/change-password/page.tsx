'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Form, Input, Button, Card, App, Typography, Space, Divider 
} from 'antd';
import { 
  LockOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ShieldCheck, AlertCircle, Box } from 'lucide-react';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { message, notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const localUserStr = localStorage.getItem('euni_user');
    if (localUserStr) {
      setCurrentUser(JSON.parse(localUserStr));
    }
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // In a real app, call backend to change password
      // Since this is a simulation based on requirements:
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If success:
      notification.success({
        message: 'Đổi mật khẩu thành công',
        description: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.',
        placement: 'topRight',
      });

      // Clear session and redirect to login
      authService.logout();
    } catch (error: any) {
      message.error(error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidationRules = [
    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!' 
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #fdf4ff 100%)',
      }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <Card className="rounded-3xl shadow-2xl border-0 p-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-edu-primary"></div>
          
          {/* Logo */}
          <div className="flex justify-center mb-8 pt-4">
            <div className="w-16 h-16 bg-edu-primary rounded-2xl flex items-center justify-center shadow-lg shadow-edu-primary/20 rotate-3">
              <ShieldCheck className="w-8 h-8 text-white -rotate-3" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <Title level={2} className="!mb-2 font-display !font-bold text-slate-900">Đổi mật khẩu</Title>
            <Text className="text-slate-500 block mb-1">Để bảo mật tài khoản, vui lòng cập nhật mật khẩu của bạn.</Text>
            {currentUser && (
              <Text type="secondary" className="text-xs font-bold uppercase tracking-widest text-edu-primary">
                Tài khoản: {currentUser.username}
              </Text>
            )}
          </div>

          {/* Form */}
          <Form
            name="change_password_form"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="space-y-4"
          >
            <Form.Item
              name="currentPassword"
              label={<span className="text-sm font-bold text-slate-700">Mật khẩu hiện tại</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                className="rounded-xl h-12 border-slate-200"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={<span className="text-sm font-bold text-slate-700">Mật khẩu mới</span>}
              rules={passwordValidationRules}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                className="rounded-xl h-12 border-slate-200"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span className="text-sm font-bold text-slate-700">Xác nhận mật khẩu mới</span>}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
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
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                className="rounded-xl h-12 border-slate-200"
              />
            </Form.Item>

            <div className="pt-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-14 rounded-2xl bg-edu-primary hover:bg-blue-700 flex items-center justify-center gap-3 border-0 text-base font-bold shadow-xl shadow-edu-primary/20"
              >
                <span>Cập nhật mật khẩu</span>
                {!loading && <ArrowRightOutlined />}
              </Button>
            </div>
          </Form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <Button 
              type="text" 
              className="text-slate-400 hover:!text-slate-600 font-medium"
              onClick={() => authService.logout()}
            >
              Đăng xuất và sử dụng tài khoản khác
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
