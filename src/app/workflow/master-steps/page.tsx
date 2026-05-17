'use client';

import React, { useState, useEffect } from 'react';
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
  Tooltip,
  App as AntdApp
} from 'antd';
import { 
  Search, 
  RefreshCw,
  Layers,
  Box,
  FileText
} from 'lucide-react';
import { workflowDefinitionService, WorkflowStepDefinitionResponse } from '@/services/workflowDefinitionService';

const { Title, Text } = Typography;

function MasterStepsContent() {
  const { message } = AntdApp.useApp();
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<WorkflowStepDefinitionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await workflowDefinitionService.getAll();
      setData(result);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bước mẫu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter(item => 
    item.stepName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.stepCode.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Bước mẫu',
      key: 'step',
      render: (_: any, record: WorkflowStepDefinitionResponse) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{record.stepName}</div>
            <div className="text-xs text-slate-500 font-medium font-mono uppercase tracking-tight">{record.stepCode}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Loại quy trình',
      dataIndex: 'workflowType',
      key: 'workflowType',
      render: (type: string) => (
        <Tag color={type === 'SURVEY_CREATE' ? 'blue' : 'green'} className="rounded-md px-2 py-0.5 border-none font-medium">
          {type === 'SURVEY_CREATE' ? 'Khảo sát tạo mới' : 'Khảo sát cập nhật'}
        </Tag>
      )
    },
    {
      title: 'Hồ sơ công việc (Yêu cầu)',
      dataIndex: 'requiredDocuments',
      key: 'requiredDocuments',
      render: (docs: string[]) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {docs?.map((doc, idx) => (
            <Tag key={idx} className="bg-slate-50 border-slate-200 text-slate-500 text-[10px] rounded-md">
              {doc}
            </Tag>
          ))}
          {(!docs || docs.length === 0) && <Text type="secondary" className="text-xs italic">Không có yêu cầu</Text>}
        </div>
      )
    },
    {
      title: 'Loại bước',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Text className="text-slate-600 font-medium">{type || '---'}</Text>
    }
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
          <Text className="text-slate-500 font-medium italic">Thư viện các bước nghiệp vụ mẫu được đồng bộ từ hệ thống.</Text>
        </div>
        <Button 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />} 
          onClick={fetchData}
          disabled={isLoading}
        >
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số bước mẫu</span>}
              value={data.length} 
              loading={isLoading}
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
        </div>
        <Table 
          dataSource={filteredData} 
          columns={columns} 
          rowKey="id"
          loading={isLoading}
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
      <AntdApp>
        <MasterStepsContent />
      </AntdApp>
    </AppShell>
  );
}
