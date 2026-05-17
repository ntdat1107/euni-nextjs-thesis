'use client';

import React, { useState, useEffect } from 'react';
import { Table, Select, Typography, Card, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface S6MatrixData {
  mapping: Record<string, Record<string, string>>; // ploCode -> { cloCode: level }
}

interface S6MatrixRendererProps {
  data?: S6MatrixData;
  readonly?: boolean;
  onChange?: (data: S6MatrixData) => void;
  // Metadata inherited from S2 and S5
  plos?: { id: string; content: string }[];
  clos?: { id: string; content: string }[];
}

export const S6MatrixRenderer: React.FC<S6MatrixRendererProps> = ({
  data,
  readonly = false,
  onChange,
  plos = [
    { id: 'PLO1', content: 'Kỹ năng lập trình' },
    { id: 'PLO2', content: 'Tư duy logic' },
    { id: 'PLO3', content: 'Làm việc nhóm' },
  ],
  clos = [
    { id: 'CLO1', content: 'Viết code C++ sạch' },
    { id: 'CLO2', content: 'Giải quyết thuật toán' },
    { id: 'CLO3', content: 'Sử dụng Git' },
    { id: 'CLO4', content: 'Thuyết trình kỹ thuật' },
  ],
}) => {
  const [state, setState] = useState<S6MatrixData>({
    mapping: data?.mapping || {},
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setState({
        mapping: data.mapping || {},
      });
    }
  }, [data]);

  const handleStateChange = (newState: S6MatrixData) => {
    setState(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  const updateMapping = (ploId: string, cloId: string, level: string) => {
    if (readonly) return;
    const newMapping = { ...state.mapping };
    if (!newMapping[ploId]) newMapping[ploId] = {};
    newMapping[ploId][cloId] = level;
    handleStateChange({ ...state, mapping: newMapping });
  };

  // Build columns for the table: Rows are PLOs, Columns are CLOs
  const columns = [
    {
      title: 'PLO \\ CLO',
      dataIndex: 'id',
      key: 'plo_header',
      fixed: 'left' as const,
      width: 150,
      render: (text: string, record: any) => (
        <Tooltip title={record.content} placement="right">
          <div className="flex items-center gap-2 cursor-help">
            <Text strong className="text-brand-600">{text}</Text>
            <InfoCircleOutlined className="text-slate-400 text-xs" />
          </div>
        </Tooltip>
      ),
    },
    ...clos?.map(clo => ({
      title: (
        <Tooltip title={clo.content}>
          <div className="text-center cursor-help">
            <Tag color="blue" className="mr-0">{clo.id}</Tag>
          </div>
        </Tooltip>
      ),
      dataIndex: clo.id,
      key: clo.id,
      align: 'center' as const,
      width: 100,
      render: (_: any, record: any) => (
        <Select
          value={state.mapping[record.id]?.[clo.id] || ''}
          disabled={readonly}
          className="w-full min-w-[70px]"
          variant="borderless"
          onChange={(val) => updateMapping(record.id, clo.id, val)}
          options={[
            { label: '—', value: '' },
            { label: 'L: Thấp', value: '1' },
            { label: 'M: TB', value: '2' },
            { label: 'H: Cao', value: '3' },
          ]}
        />
      ),
    })),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <Card className="shadow-sm border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="!mb-0">Ma trận liên kết PLO - CLO</Title>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-brand-50 border border-brand-200 rounded"></span>
              <Text className="text-xs" type="secondary">L: Low</Text>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-brand-100 border border-brand-300 rounded"></span>
              <Text className="text-xs" type="secondary">M: Medium</Text>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-brand-200 border border-brand-400 rounded"></span>
              <Text className="text-xs" type="secondary">H: High</Text>
            </div>
          </div>
        </div>

        <Table 
          dataSource={plos || []} 
          columns={columns} 
          pagination={false}
          rowKey="id"
          bordered
          scroll={{ x: 'max-content' }}
          className="matrix-table"
        />
      </Card>

      <style jsx global>{`
        .matrix-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          padding: 12px 8px !important;
        }
        .matrix-table .ant-table-cell {
          padding: 4px 8px !important;
        }
        .matrix-table .ant-select-selector {
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default S6MatrixRenderer;
