'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  Typography, Card, Button, Space, Breadcrumb, Table, Tag,
  Input, Row, Col, Tooltip, Modal, App as AntdApp, Switch, Spin
} from 'antd';
import {
  Plus, Search, Eye, Edit, Trash2,
  MoreHorizontal, FileCode, Clock, CheckCircle2,
  AlertCircle, History
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import workflowService, { WorkflowTemplateResponse } from '@/services/workflowService';
import axios from 'axios';
import { useEffect } from 'react';
import WorkflowEditorModal from '@/components/workflow/WorkflowEditorModal';

const { Title, Paragraph, Text } = Typography;

interface WorkflowTemplate {
  key: string;
  id: string;
  name: string;
  code: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  lastModified: string;
  author: string;
}

export default function WorkflowTemplatesListPage() {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<WorkflowTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async (signal?: AbortSignal) => {
    try {
      const result = await workflowService.getAll(signal);
      setData(result);
    } catch (error: any) {
      if (axios.isCancel(error)) return;
      message.error('Lỗi khi tải danh sách quy trình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [message]);

  const handleStatusChange = async (id: string, checked: boolean) => {
    try {
      const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
      await workflowService.updateStatus(id, newStatus);
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      message.success(`Đã cập nhật trạng thái quy trình thành ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}`);
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusTag = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return <Tag icon={<CheckCircle2 size={12} />} color="success" className="rounded-full px-3 flex items-center gap-1 whitespace-nowrap w-fit">Active</Tag>;
      case 'INACTIVE':
        return <Tag icon={<AlertCircle size={12} />} color="error" className="rounded-full px-3 flex items-center gap-1 whitespace-nowrap w-fit">Inactive</Tag>;
      case 'DRAFT':
        return <Tag icon={<AlertCircle size={12} />} color="warning" className="rounded-full px-3 flex items-center gap-1 whitespace-nowrap w-fit">Draft</Tag>;
      case 'ARCHIVED':
        return <Tag icon={<History size={12} />} color="default" className="rounded-full px-3 flex items-center gap-1 whitespace-nowrap w-fit">Archived</Tag>;
      default:
        return <Tag className="rounded-full px-3 flex items-center gap-1 whitespace-nowrap w-fit">{status}</Tag>;
    }
  };

  const columns: ColumnsType<WorkflowTemplate> = [
    {
      title: 'Mã Quy trình',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Text strong className="font-mono text-blue-600">{text}</Text>,
    },
    {
      title: 'Tên Quy trình',
      dataIndex: 'name',
      key: 'name',
      render: (text, record: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Text strong>{text}</Text>
            {record.hasDraft && (
              <Tooltip title="Có bản nháp chưa lưu">
                <AlertCircle size={14} className="text-orange-500" />
              </Tooltip>
            )}
          </div>
          <Text type="secondary" className="text-xs">ID: {record.id}</Text>
        </div>
      ),
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      key: 'version',
      render: (text) => <Tag color="blue" className="rounded-lg">{text}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => (
        <div className="flex items-center gap-3">
          {getStatusTag(status)}
        </div>
      ),
    },
    {
      title: 'Cập nhật cuối',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text) => (
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} />
          <span className="text-xs">{text ? new Date(text).toLocaleString('vi-VN') : '-'}</span>
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 80,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa nhanh">
            <Button
              type="text"
              icon={<Edit size={18} className="text-amber-500" />}
              onClick={() => {
                setEditingId(record.id);
                setIsModalOpen(true);
              }}
              className="hover:bg-amber-50"
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={18} className="text-blue-500" />}
              onClick={() => router.push(`/workflow/templates/${record.id}`)}
              className="hover:bg-blue-50"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AppShell>
      <Spin spinning={loading} tip="Đang tải danh sách quy trình..." size="large">
        <div className="flex flex-col gap-6">
          <Breadcrumb
            items={[
              { title: 'Trang chủ' },
              { title: 'Quy trình' },
              { title: 'Mẫu quy trình' },
            ]}
          />

          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <Title level={2} className="!mb-1 !text-slate-800">Mẫu Quy trình Hệ thống</Title>
              <Paragraph type="secondary" className="!mb-0 text-slate-500">
                Quản lý danh sách các luồng quy trình nghiệp vụ đã được định nghĩa
              </Paragraph>
            </div>
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => {
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="rounded-xl px-6 h-11 font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 border-none"
            >
              Tạo mới Quy trình
            </Button>
          </div>

          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <Row gutter={16} className="mb-6">
              <Col span={12}>
                <Input
                  placeholder="Tìm kiếm theo tên hoặc mã quy trình..."
                  prefix={<Search size={18} className="text-slate-400" />}
                  className="h-10 rounded-lg"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </Col>
            </Row>

            <Table
              columns={columns as any}
              dataSource={data.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase()) || i.code.toLowerCase().includes(searchText.toLowerCase()))}
              rowKey="id"
              loading={loading}
              className="workflow-table"
              pagination={{ pageSize: 10, position: ['bottomRight'] }}
            />
          </Card>
        </div>
      </Spin>

      <WorkflowEditorModal
        open={isModalOpen}
        editingId={editingId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(id) => {
          setIsModalOpen(false);
          router.push(`/workflow/templates/${id}`);
        }}
      />

      <style jsx global>{`
        .workflow-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
        }
        .workflow-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
      `}</style>
    </AppShell>
  );
}

