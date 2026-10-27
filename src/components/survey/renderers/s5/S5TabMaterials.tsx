'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button, Input, Select, Table, Typography } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { CourseSyllabusData, MaterialItem } from './types';
import { uid } from './constants';

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
  loading: () => <div className="h-24 bg-slate-50 border border-slate-200 rounded animate-pulse" />
});

const { Text } = Typography;

interface S5TabMaterialsProps {
  data: CourseSyllabusData;
  readonly: boolean;
  onChange: (updated: Partial<CourseSyllabusData>) => void;
}

export const S5TabMaterials: React.FC<S5TabMaterialsProps> = ({ data, readonly, onChange }) => {
  const materials = data.materials || [];

  const handleAddMaterial = (type: 'main' | 'reference') => {
    const newMat: MaterialItem = {
      id: uid(),
      type,
      title: '',
      author: '',
      publisher: '',
      year: new Date().getFullYear().toString(),
      url: '',
    };
    onChange({ materials: [...materials, newMat] });
  };

  const handleUpdateMaterial = (id: string, field: keyof MaterialItem, value: any) => {
    const updated = materials.map(m => (m.id === id ? { ...m, [field]: value } : m));
    onChange({ materials: updated });
  };

  const handleDeleteMaterial = (id: string) => {
    onChange({ materials: materials.filter(m => m.id !== id) });
  };

  const columns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 130,
      render: (val: string, record: MaterialItem) => (
        <Select
          value={val}
          disabled={readonly}
          options={[
            { label: 'Giáo trình chính', value: 'main' },
            { label: 'Tham khảo', value: 'reference' },
          ]}
          onChange={v => handleUpdateMaterial(record.id, 'type', v)}
          className="w-full text-xs"
        />
      ),
    },
    {
      title: 'Tên giáo trình / tài liệu',
      dataIndex: 'title',
      render: (val: string, record: MaterialItem) => (
        <Input
          value={val}
          disabled={readonly}
          onChange={e => handleUpdateMaterial(record.id, 'title', e.target.value)}
          placeholder="Tên sách, tài liệu hoặc đường dẫn học liệu..."
          className="text-xs"
        />
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      width: 170,
      render: (val: string, record: MaterialItem) => (
        <Input
          value={val}
          disabled={readonly}
          onChange={e => handleUpdateMaterial(record.id, 'author', e.target.value)}
          placeholder="Tên tác giả..."
          className="text-xs"
        />
      ),
    },
    {
      title: 'NXB & Năm',
      dataIndex: 'year',
      width: 150,
      render: (_: any, record: MaterialItem) => (
        <div className="flex items-center gap-1">
          <Input
            value={record.publisher}
            disabled={readonly}
            onChange={e => handleUpdateMaterial(record.id, 'publisher', e.target.value)}
            placeholder="NXB"
            className="text-xs"
          />
          <Input
            value={record.year}
            disabled={readonly}
            onChange={e => handleUpdateMaterial(record.id, 'year', e.target.value)}
            placeholder="Năm"
            className="w-16 text-xs text-center"
          />
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 60,
      align: 'center' as const,
      render: (_: any, record: MaterialItem) =>
        !readonly && (
          <Button
            type="text"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteMaterial(record.id)}
            className="hover:bg-rose-50"
          />
        ),
    },
  ];

  return (
    <div className="space-y-6 p-4 max-w-4xl">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Text strong className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Giáo trình chính & Tài liệu học tập (Textbooks & References)
            </Text>
            <p className="text-xs text-slate-500 mt-0.5 mb-0">
              Học phần bắt buộc phải có ít nhất 1 giáo trình chính theo Thông tư 17 (ưu tiên xuất bản trong 5-10 năm gần nhất).
            </p>
          </div>
        </div>

        <Table
          dataSource={materials}
          columns={columns}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          className="text-xs border-slate-200"
        />

        {!readonly && (
          <div className="mt-2.5">
            <Button
              type="dashed"
              icon={<Plus size={13} />}
              onClick={() => handleAddMaterial('main')}
              className="text-xs h-8 px-4 font-medium border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              Thêm tài liệu học tập
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Text strong className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Yêu cầu về Cơ sở vật chất & Phần mềm thực hành (Facilities & Requirements)
          </Text>
          <span className="text-[11px] text-slate-400">
            Hỗ trợ trợ lý AI đề xuất cấu hình phòng lab
          </span>
        </div>
        <RichtextEditor
          value={data.facilitiesRequirements || ''}
          disabled={readonly}
          contentType="GENERAL"
          metadata={{ courseName: data.courseName }}
          minHeight={100}
          placeholder="Yêu cầu phòng máy tính, hệ điều hành, công cụ lập trình, phần cứng thực hành..."
          onChange={val => onChange({ facilitiesRequirements: val })}
        />
      </div>
    </div>
  );
};
