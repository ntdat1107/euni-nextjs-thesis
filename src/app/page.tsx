'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  Space,
  Typography
} from 'antd';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus
} from 'lucide-react';

const { Title, Text } = Typography;

const columns = [
  {
    title: 'Mã Quy Trình',
    dataIndex: 'id',
    key: 'id',
    render: (text: string) => <Text strong className="text-brand-700">{text}</Text>,
  },
  {
    title: 'Tên Chương Trình',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Giai Đoạn',
    dataIndex: 'stage',
    key: 'stage',
    render: (text: string) => (
      <Tag color="processing" className="rounded-full px-3">{text}</Tag>
    ),
  },
  {
    title: 'Trạng Thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      let color = 'default';
      if (status === 'Hoàn thành') color = 'success';
      if (status === 'Đang xử lý') color = 'warning';
      if (status === 'Chờ duyệt') color = 'processing';
      return <Tag color={color} className="rounded-full px-3">{status}</Tag>;
    },
  },
  {
    title: 'Ngày Cập Nhật',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
  },
  {
    title: 'Thao tác',
    key: 'action',
    render: () => (
      <Space size="middle">
        <Button type="link" size="small">Chi tiết</Button>
        <Button type="link" size="small">Lịch sử</Button>
      </Space>
    ),
  },
];

const data = [
  {
    key: '1',
    id: 'CTDT-2024-001',
    name: 'Kỹ thuật Phần mềm (Chương trình tiên tiến)',
    stage: 'Xây dựng Đề cương',
    status: 'Đang xử lý',
    updatedAt: '2024-05-06 10:30',
  },
  {
    key: '2',
    id: 'CTDT-2024-002',
    name: 'An toàn Thông tin',
    stage: 'Thẩm định',
    status: 'Chờ duyệt',
    updatedAt: '2024-05-05 14:20',
  },
  {
    key: '3',
    id: 'CTDT-2024-003',
    name: 'Khoa học Máy tính',
    stage: 'Hoàn thành',
    status: 'Hoàn thành',
    updatedAt: '2024-05-01 09:00',
  },
];

export default function Dashboard() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 font-display tracking-tight">Bảng Điều Khiển</Title>
            <Text className="text-slate-500 font-medium">Chào mừng bạn trở lại, Admin. Dưới đây là tóm tắt tiến độ công việc.</Text>
          </div>
          <Button type="primary" icon={<Plus className="w-5 h-5" />} className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect">
            Tạo Quy Trình Mới
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-premium">
              <Statistic
                title={<span className="flex items-center gap-2 font-semibold text-slate-500 uppercase tracking-wider text-[11px]"><FileText className="w-4 h-4 text-brand-500" /> Tổng số đề án</span>}
                value={42}
                styles={{ content: { color: '#0f172a', fontWeight: '800', fontFamily: 'var(--font-outfit)' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-premium">
              <Statistic
                title={<span className="flex items-center gap-2 font-semibold text-slate-500 uppercase tracking-wider text-[11px]"><Clock className="w-4 h-4 text-amber-500" /> Đang thực hiện</span>}
                value={12}
                styles={{ content: { color: '#0f172a', fontWeight: '800', fontFamily: 'var(--font-outfit)' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-premium">
              <Statistic
                title={<span className="flex items-center gap-2 font-semibold text-slate-500 uppercase tracking-wider text-[11px]"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã hoàn thành</span>}
                value={28}
                styles={{ content: { color: '#0f172a', fontWeight: '800', fontFamily: 'var(--font-outfit)' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="card-premium border-rose-100">
              <Statistic
                title={<span className="flex items-center gap-2 font-semibold text-rose-500 uppercase tracking-wider text-[11px]"><AlertCircle className="w-4 h-4" /> Cần xử lý gấp</span>}
                value={2}
                styles={{ content: { color: '#e11d48', fontWeight: '800', fontFamily: 'var(--font-outfit)' } }}
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Workflows */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0 font-display">Quy trình cập nhật gần đây</Title>
            <Button type="link" className="font-semibold">Xem tất cả</Button>
          </div>
          <Card className="card-premium overflow-hidden" styles={{ body: { padding: 0 } }}>
            <Table 
              columns={columns} 
              dataSource={data} 
              pagination={false}
              className="ant-table-custom"
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
