'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Table, 
  Card, 
  Input, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Tag,
  Button,
  Tooltip
} from 'antd';
import { 
  Search, 
  RefreshCw,
  Layers,
  Settings,
  Eye,
  Box
} from 'lucide-react';

const { Title, Text } = Typography;

// Hardcoded data as requested
const MASTER_STEPS_DATA = [
  {
    id: '1',
    code: 'STEP_DANG_KY',
    name: 'Đăng ký hồ sơ',
    description: 'Bước khởi tạo hồ sơ bởi người dùng',
    screenCode: 'REGISTRATION_FORM',
    performerRole: 'USER',
    approverRole: null,
    status: 'ACTIVE'
  },
  {
    id: '2',
    code: 'STEP_THAM_DINH',
    name: 'Thẩm định hồ sơ',
    description: 'Chuyên viên kiểm tra tính hợp lệ của hồ sơ',
    screenCode: 'REVIEW_FORM',
    performerRole: 'SPECIALIST',
    approverRole: 'MANAGER',
    status: 'ACTIVE'
  },
  {
    id: '3',
    code: 'STEP_PHE_DUYET',
    name: 'Phê duyệt',
    description: 'Lãnh đạo phê duyệt hồ sơ cuối cùng',
    screenCode: 'APPROVAL_FORM',
    performerRole: 'MANAGER',
    approverRole: 'DIRECTOR',
    status: 'ACTIVE'
  },
  {
    id: '4',
    code: 'STEP_BO_SUNG',
    name: 'Yêu cầu bổ sung',
    description: 'Gửi yêu cầu người dùng cập nhật thêm tài liệu',
    screenCode: 'REVISION_FORM',
    performerRole: 'USER',
    approverRole: 'SPECIALIST',
    status: 'ACTIVE'
  },
  {
    id: '5',
    code: 'STEP_BAN_HANH',
    name: 'Ban hành kết quả',
    description: 'Gửi thông báo kết quả cho người dùng',
    screenCode: 'RESULT_NOTICE',
    performerRole: 'SYSTEM',
    approverRole: null,
    status: 'ACTIVE'
  }
];

function MasterStepsContent() {
  const [searchText, setSearchText] = useState('');

  const filteredData = MASTER_STEPS_DATA.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Bước mẫu',
      key: 'step',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{record.name}</div>
            <div className="text-xs text-slate-500 font-medium font-mono uppercase tracking-tight">{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <span className="text-slate-500 text-sm italic">{text || '---'}</span>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<Eye className="w-4 h-4 text-indigo-500" />} 
              className="hover:bg-indigo-50 rounded-lg"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1 font-display tracking-tight flex items-center gap-3">
            <Box className="text-indigo-600" size={32} />
            Kho bước mẫu
          </Title>
          <Text className="text-slate-500 font-medium italic">Thư viện các bước nghiệp vụ mẫu có sẵn để tái sử dụng trong các quy trình.</Text>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số bước mẫu</span>}
              value={MASTER_STEPS_DATA.length} 
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#0f172a' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="card-premium overflow-hidden border-slate-200 shadow-sm" styles={{ body: { padding: 0 } }}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <Input
            placeholder="Tìm kiếm bước mẫu hoặc mã định danh..."
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            className="max-w-md rounded-xl h-11 border-slate-200 bg-white"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg h-10 w-10 flex items-center justify-center" />
        </div>
        <Table 
          dataSource={filteredData} 
          columns={columns} 
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            className: "px-6 py-4"
          }}
          className="ant-table-custom"
        />
      </Card>
    </div>
  );
}

export default function MasterStepsPage() {
  return (
    <AppShell>
      <MasterStepsContent />
    </AppShell>
  );
}
