'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  Typography, Card, Button, Space, Breadcrumb, Table, Tag,
  Input, Row, Col, Tooltip, App as AntdApp
} from 'antd';
import {
  Plus, Search, Eye, Edit3, Trash2,
  Clock, CheckCircle2, AlertCircle, FileText, Loader2
} from 'lucide-react';
import { surveyCampaignService, SurveyCampaignResponse } from '@/services/surveyCampaignService';
import { Modal, message } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Paragraph, Text } = Typography;

// Mock data removed

export default function SurveyCampaignsPage() {
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
      message.error('Lỗi khi tải danh sách đợt khảo sát');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa đợt khảo sát này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await surveyCampaignService.delete(id);
          message.success('Đã xóa đợt khảo sát');
          fetchCampaigns();
        } catch (error) {
          message.error('Lỗi khi xóa đợt khảo sát');
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
      default:
        return <Tag className="rounded-full px-3">{status}</Tag>;
    }
  };

  const columns: ColumnsType<SurveyCampaignResponse> = [
    {
      title: 'Đợt khảo sát',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex flex-col">
          <Text strong className="text-slate-800">{text}</Text>
          <Text type="secondary" className="text-xs">ID: {record.id}</Text>
        </div>
      ),
    },
    {
      title: 'Chương trình đào tạo',
      dataIndex: 'programName',
      key: 'programName',
      render: (text) => <Text className="text-slate-600 font-medium">{text}</Text>,
    },
    {
      title: 'Quy trình áp dụng',
      dataIndex: 'workflowTemplateName',
      key: 'workflowTemplateName',
      render: (text) => (
        <div className="flex items-center gap-2 text-blue-600">
          <FileText size={14} />
          <span className="text-xs font-semibold">{text}</span>
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
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => (
        <Text className="text-[13px] text-slate-500 font-medium">
          {dayjs(text).format('DD/MM/YYYY')}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={18} className="text-blue-500" />}
              onClick={() => router.push(`/survey/campaigns/${record.id}`)}
              className="hover:bg-blue-50"
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Xóa bản nháp">
              <Button
                type="text"
                danger
                icon={<Trash2 size={18} />}
                onClick={() => handleDelete(record.id)}
                className="hover:bg-rose-50"
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
            { title: 'Trang chủ' },
            { title: 'Khảo sát' },
            { title: 'Đợt khảo sát' },
          ]}
        />

        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <Title level={2} className="!mb-1 !text-slate-800">Quản lý Đợt Khảo sát</Title>
            <Paragraph type="secondary" className="!mb-0 text-slate-500">
              Quản lý các đợt khảo sát chương trình đào tạo và theo dõi tiến độ
            </Paragraph>
          </div>
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => router.push('/survey/campaigns/new')}
            className="rounded-xl px-6 h-11 font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 border-none"
          >
            Tạo đợt khảo sát
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200 rounded-2xl">
          <Row gutter={16} className="mb-6">
            <Col span={12}>
              <Input
                placeholder="Tìm kiếm đợt khảo sát..."
                prefix={<Search size={18} className="text-slate-400" />}
                className="h-10 rounded-lg"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </Col>
          </Row>

          <Table
            columns={columns as any}
            dataSource={campaigns.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase()))}
            rowKey="id"
            loading={loading}
            className="campaign-table"
            pagination={{ pageSize: 10, position: ['bottomRight'] }}
          />
        </Card>
      </div>

      <style jsx global>{`
        .campaign-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
        }
        .campaign-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
      `}</style>
    </AppShell>
  );
}
