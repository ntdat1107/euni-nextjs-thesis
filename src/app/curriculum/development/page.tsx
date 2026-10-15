'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  Typography, Card, Button, Space, Breadcrumb, Table, Tag,
  Input, Row, Col, Tooltip, App as AntdApp
} from 'antd';
import {
  Plus, Search, Eye,
  Clock, CheckCircle2, AlertCircle, FileText, Ban, Layers
} from 'lucide-react';
import { surveyCampaignService, SurveyCampaignResponse } from '@/services/surveyCampaignService';
import { Modal, message } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Paragraph, Text } = Typography;

export default function CurriculumDevelopmentListPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<SurveyCampaignResponse[]>([]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await surveyCampaignService.getAll();
      setCampaigns(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách đợt xây dựng & rà soát');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCancelCampaign = (record: SurveyCampaignResponse) => {
    Modal.confirm({
      title: 'Xác nhận Hủy đợt xây dựng & rà soát',
      content: (
        <div className="py-2">
          <p className="text-slate-600 text-sm font-medium">Bạn có chắc chắn muốn hủy đợt <strong>"{record.name}"</strong> không?</p>
          <p className="text-slate-400 text-xs mt-1">Đợt sau khi hủy sẽ dừng quy trình hiện tại và giải phóng CTĐT để có thể tạo đợt mới.</p>
        </div>
      ),
      okText: 'Hủy đợt',
      okType: 'danger',
      cancelText: 'Quay lại',
      centered: true,
      onOk: async () => {
        try {
          await surveyCampaignService.cancel(record.id);
          message.success('Đã hủy đợt thành công');
          fetchCampaigns();
        } catch (error: any) {
          message.error(error?.response?.data?.message || error?.message || 'Lỗi khi hủy đợt');
        }
      }
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag icon={<CheckCircle2 size={12} />} color="success" className="rounded-full px-3">Đang diễn ra</Tag>;
      case 'DRAFT':
        return <Tag icon={<AlertCircle size={12} />} color="warning" className="rounded-full px-3">Bản nháp</Tag>;
      case 'COMPLETED':
      case 'CLOSED':
        return <Tag icon={<Clock size={12} />} color="default" className="rounded-full px-3">Đã kết thúc</Tag>;
      case 'APPROVED':
        return <Tag icon={<CheckCircle2 size={12} />} color="gold" className="rounded-full px-3">Đã phê duyệt (Synced)</Tag>;
      case 'CANCELLED':
        return <Tag icon={<Ban size={12} />} color="error" className="rounded-full px-3">Đã hủy</Tag>;
      default:
        return <Tag className="rounded-full px-3">{status}</Tag>;
    }
  };

  const columns: ColumnsType<SurveyCampaignResponse> = [
    {
      title: 'Đợt xây dựng / rà soát',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex flex-col">
          <Text strong className="text-slate-800">{text}</Text>
          <Text type="secondary" className="text-xs">Mã đợt: <span className="font-mono">{record.code}</span></Text>
        </div>
      ),
    },
    {
      title: 'Chương trình đào tạo',
      dataIndex: 'programName',
      key: 'programName',
      render: (text) => <Text className="text-slate-700 font-medium">{text || '---'}</Text>,
    },
    {
      title: 'Quy trình áp dụng',
      dataIndex: 'workflowTemplateName',
      key: 'workflowTemplateName',
      render: (text) => (
        <div className="flex items-center gap-2 text-blue-600">
          <FileText size={14} />
          <span className="text-xs font-semibold">{text || 'Quy trình chuẩn'}</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thời gian thực hiện',
      key: 'timeline',
      width: 180,
      render: (_, record) => (
        <Text className="text-xs text-slate-500 font-medium">
          {record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : '---'} - {record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : '---'}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Vào thực hiện quy trình xây dựng">
            <Button
              type="primary"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => router.push(`/curriculum/development/${record.id}`)}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 font-medium text-xs flex items-center gap-1.5 px-3 h-8 shadow-xs"
            >
              Vào thực hiện
            </Button>
          </Tooltip>
          {record.status !== 'APPROVED' && record.status !== 'CANCELLED' && (
            <Tooltip title="Hủy đợt">
              <Button
                type="text"
                danger
                icon={<Ban size={16} />}
                onClick={() => handleCancelCampaign(record)}
                className="hover:bg-rose-50 rounded-lg"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { title: <a onClick={() => router.push('/')} className="hover:text-blue-600">Trang chủ</a> },
            { title: <a onClick={() => router.push('/curriculum/programs')} className="hover:text-blue-600">Đào tạo</a> },
            { title: 'Xây dựng & Rà soát CTĐT' },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <Title level={2} className="!mb-1 !text-slate-800 tracking-tight font-bold text-2xl">
              Xây dựng &amp; Rà soát Chương trình Đào tạo
            </Title>
            <Paragraph type="secondary" className="!mb-0 text-slate-500 text-xs">
              Danh sách các đợt xây dựng mới và rà soát, cập nhật chương trình đào tạo theo quy trình
            </Paragraph>
          </div>
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => router.push('/curriculum/development/new')}
            className="rounded-xl px-6 h-11 font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 border-none flex items-center gap-2 cursor-pointer"
          >
            Tạo mới đợt xây dựng
          </Button>
        </div>

        <Card className="shadow-2xs border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Input
              placeholder="Tìm kiếm theo tên đợt, mã đợt..."
              prefix={<Search size={18} className="text-slate-400" />}
              className="h-10 rounded-xl max-w-md"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <Table
            columns={columns as any}
            dataSource={campaigns.filter(i => (i.name || '').toLowerCase().includes(searchText.toLowerCase()) || (i.code || '').toLowerCase().includes(searchText.toLowerCase()))}
            rowKey="id"
            loading={loading}
            className="ant-table-custom"
            pagination={{ pageSize: 10, position: ['bottomRight'] }}
          />
        </Card>
      </div>
    </AppShell>
  );
}
