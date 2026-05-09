'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import WorkflowViewer from '@/components/ui/WorkflowViewer';
import { Typography, Card, Button, Space, Breadcrumb, Tag } from 'antd';
import { Download, Upload, Play } from 'lucide-react';

const { Title, Paragraph } = Typography;

export default function WorkflowTemplatesPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { title: 'Trang chủ' },
            { title: 'Quy trình' },
            { title: 'Mẫu quy trình' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1">Quản Lý Mẫu Quy Trình (Camunda)</Title>
            <Paragraph type="secondary">Xem và chỉnh sửa sơ đồ quy trình nghiệp vụ BPMN 2.0</Paragraph>
          </div>
          <Space>
            <Button icon={<Download className="w-4 h-4" />}>Xuất XML</Button>
            <Button icon={<Upload className="w-4 h-4" />}>Nhập XML</Button>
            <Button type="primary" icon={<Play className="w-4 h-4" />}>Triển khai</Button>
          </Space>
        </div>

        <Card className="shadow-sm border-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <Title level={4} className="!mb-0">Sơ đồ: Quy trình Cập nhật CTDT</Title>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Version: 1.0.4
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                Active
              </span>
            </div>
          </div>
          <WorkflowViewer />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Thông tin chi tiết" className="shadow-sm">
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-500 block mb-1">Mã quy trình:</span>
                <span className="font-medium">UPDATE_CTDT_PROCESS</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Mô tả:</span>
                <p className="text-sm text-slate-700">
                  Quy trình tự động hóa việc thu thập ý kiến, xây dựng đề cương và thẩm định chương trình đào tạo theo tiêu chuẩn.
                </p>
              </div>
            </div>
          </Card>
          
          <Card title="Phân quyền (Casbin)" className="shadow-sm">
             <div className="space-y-3">
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                 <span className="text-sm font-medium">Giảng viên</span>
                 <Tag color="blue">Cập nhật đề cương</Tag>
               </div>
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                 <span className="text-sm font-medium">Hội đồng khoa học</span>
                 <Tag color="purple">Thẩm định</Tag>
               </div>
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                 <span className="text-sm font-medium">Ban Giám hiệu</span>
                 <Tag color="gold">Phê duyệt cuối</Tag>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

