'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { Button, Result } from 'antd';
import Link from 'next/link';

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[70vh]">
        <Result
          status="404"
          title="404"
          subTitle="Rất tiếc, trang bạn đang tìm kiếm không tồn tại."
          extra={
            <Link href="/">
              <Button type="primary">Quay lại trang chủ</Button>
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
