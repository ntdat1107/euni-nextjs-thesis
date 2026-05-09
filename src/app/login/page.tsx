'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, App } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { authService } from '@/services/authService';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginContent />
    </React.Suspense>
  );
}

function LoginContent() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const token = localStorage.getItem('euni_access_token');
    if (token) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }

    if (searchParams.get('session') === 'expired') {
      message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      // Clear the session param but keep redirect if needed
      const redirect = searchParams.get('redirect');
      const newUrl = redirect 
        ? `${window.location.pathname}?redirect=${encodeURIComponent(redirect)}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [router, searchParams, message]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await authService.login({
        username: values.username,
        password: values.password,
      });

      // Store tokens and user info
      localStorage.setItem('euni_access_token', response.accessToken);
      localStorage.setItem('euni_refresh_token', response.refreshToken);
      localStorage.setItem('euni_user', JSON.stringify(response));

      // message.success(`Chào mừng trở lại, ${response.fullName}!`);
      
      // Redirect to the original page or dashboard
      const redirect = searchParams.get('redirect') || '/';
      const welcomeUrl = redirect.includes('?') 
        ? `${redirect}&login=success` 
        : `${redirect}?login=success`;
      router.push(welcomeUrl);
    } catch (error: any) {
      message.error(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #fdf4ff 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <Card className="rounded-2xl shadow-lg border-0 p-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <BoxPlotOutlined style={{ fontSize: '28px', color: 'white' }} />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">EUni Management</h1>
            <p className="text-slate-500">Đăng nhập để quản lý hệ thống</p>
          </div>

          {/* Form */}
          <Form
            name="login_form"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-slate-400" />} 
                placeholder="Tên đăng nhập" 
                className="rounded-xl h-12"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Mật khẩu"
                className="rounded-xl h-12"
              />
            </Form.Item>

            <div className="flex items-center justify-between mb-6">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-slate-600">Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 border-0"
              >
                <span>Đăng nhập</span>
                {!loading && <ArrowRightOutlined />}
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Chưa có tài khoản?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Liên hệ Quản trị viên
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
