'use client';

import React, { useState } from 'react';
import { Button, Input, Table, Select, Space, Typography, Tag, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import RichtextEditor from '@/components/common/RichtextEditor';

const { Text, Title } = Typography;

interface CLO {
  id: string;
  content: string;
  ploMapping: string; // Mapping to PLO code (e.g., PLO1)
  level: string;      // Bloom level (1-6)
}

interface S5CLOData {
  courseCode: string;
  courseName: string;
  clos: CLO[];
  descriptionHtml?: string;
}

interface S5CLORendererProps {
  data?: S5CLOData;
  readonly?: boolean;
  onChange?: (data: S5CLOData) => void;
  availablePLOs?: string[]; // To select from PLO list
}

export const S5CLORenderer: React.FC<S5CLORendererProps> = ({
  data,
  readonly = false,
  onChange,
  availablePLOs = ['PLO1', 'PLO2', 'PLO3', 'PLO4', 'PLO5'],
}) => {
  const [state, setState] = useState<S5CLOData>({
    courseCode: data?.courseCode || '',
    courseName: data?.courseName || '',
    clos: data?.clos || [{ id: 'CLO1', content: '', ploMapping: 'PLO1', level: '3' }],
    descriptionHtml: data?.descriptionHtml || '',
  });

  React.useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setState({
        courseCode: data.courseCode || '',
        courseName: data.courseName || '',
        clos: data.clos || [],
        descriptionHtml: data.descriptionHtml || '',
      });
    }
  }, [data]);

  const handleStateChange = (newState: S5CLOData) => {
    setState(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  const addCLO = () => {
    const nextIdx = state.clos.length + 1;
    const newClo: CLO = { 
      id: `CLO${nextIdx}`, 
      content: '', 
      ploMapping: availablePLOs[0] || '', 
      level: '3' 
    };
    handleStateChange({ ...state, clos: [...state.clos, newClo] });
  };

  const removeCLO = (index: number) => {
    const newClos = state.clos.filter((_, i) => i !== index);
    handleStateChange({ ...state, clos: newClos });
  };

  const updateCLO = (index: number, field: keyof CLO, value: string) => {
    const newClos = [...state.clos];
    (newClos[index] as any)[field] = value;
    handleStateChange({ ...state, clos: newClos });
  };

  const columns = [
    {
      title: 'Mã CLO',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <Text strong className="text-brand-600">{text}</Text>,
    },
    {
      title: 'Nội dung Chuẩn đầu ra học phần (CLO)',
      dataIndex: 'content',
      key: 'content',
      render: (text: string, record: CLO, index: number) => (
        <Input.TextArea
          value={text}
          disabled={readonly}
          placeholder="Nhập nội dung CLO..."
          autoSize={{ minRows: 2 }}
          onChange={(e) => updateCLO(index, 'content', e.target.value)}
          className="border-slate-200"
        />
      ),
    },
    {
      title: 'Mapping PLO',
      dataIndex: 'ploMapping',
      key: 'ploMapping',
      width: 150,
      render: (text: string, record: CLO, index: number) => (
        <Select
          value={text}
          disabled={readonly}
          className="w-full"
          onChange={(val) => updateCLO(index, 'ploMapping', val)}
          options={availablePLOs.map(plo => ({ label: plo, value: plo }))}
        />
      ),
    },
    {
      title: 'Mức độ (Bloom)',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (text: string, record: CLO, index: number) => (
        <Select
          value={text}
          disabled={readonly}
          className="w-full"
          onChange={(val) => updateCLO(index, 'level', val)}
          options={[
            { label: 'L1: Nhớ', value: '1' },
            { label: 'L2: Hiểu', value: '2' },
            { label: 'L3: Vận dụng', value: '3' },
            { label: 'L4: Phân tích', value: '4' },
            { label: 'L5: Đánh giá', value: '5' },
            { label: 'L6: Sáng tạo', value: '6' },
          ]}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: any, record: CLO, index: number) => (
        !readonly && (
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => removeCLO(index)} 
          />
        )
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
        <Title level={4} className="!mb-6">Thông tin Chuẩn đầu ra học phần (CLO)</Title>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <Text strong>Mã học phần</Text>
            <Input 
              value={state.courseCode} 
              disabled={readonly}
              onChange={(e) => handleStateChange({ ...state, courseCode: e.target.value })}
              placeholder="VD: IT101"
            />
          </div>
          <div className="space-y-2">
            <Text strong>Tên học phần</Text>
            <Input 
              value={state.courseName} 
              disabled={readonly}
              onChange={(e) => handleStateChange({ ...state, courseName: e.target.value })}
              placeholder="VD: Lập trình C++"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text strong>Danh sách CLO</Text>
            {!readonly && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addCLO}
                className="bg-brand-600 hover:bg-brand-700"
              >
                Thêm CLO
              </Button>
            )}
          </div>
          
          <Table 
            dataSource={state.clos} 
            columns={columns} 
            pagination={false}
            rowKey="id"
            bordered
            className="clo-table"
          />
        </div>

        <Divider />

        <div className="space-y-2">
          <Text strong>Nội dung chi tiết học phần</Text>
          <RichtextEditor
            value={state.descriptionHtml || ''}
            disabled={readonly}
            onChange={(val) => handleStateChange({ ...state, descriptionHtml: val })}
            placeholder="Nhập nội dung chi tiết (ví dụ: đề cương, tài liệu tham khảo...)"
          />
        </div>
      </div>

      <style jsx global>{`
        .clo-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default S5CLORenderer;
