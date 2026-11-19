'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button, Input, Select, Table, Typography, Popconfirm, message } from 'antd';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { CourseSyllabusData, MaterialItem } from './types';
import { uid } from './constants';
import { RagMaterialModal } from './RagMaterialModal';
import { AiAssistantModal } from '@/components/common/ai/AiAssistantModal';

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
  const [ragModalVisible, setRagModalVisible] = useState(false);
  const [isAiFacilitiesOpen, setIsAiFacilitiesOpen] = useState(false);
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

  const handleClearAllMaterials = () => {
    onChange({ materials: [] });
    message.success('Đã xóa tất cả học liệu.');
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
    <div className="space-y-6 p-4 w-full">
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
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="dashed"
                icon={<Plus size={13} />}
                onClick={() => handleAddMaterial('main')}
                className="text-xs h-8 px-4 font-medium border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                Thêm tài liệu học tập
              </Button>
              <Button
                type="default"
                icon={<Sparkles size={13} className="text-blue-600" />}
                onClick={() => setRagModalVisible(true)}
                className="text-xs h-8 px-3.5 font-medium border-blue-200 bg-blue-50/50 text-blue-800 hover:border-blue-300 hover:bg-blue-100/60 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                Gợi ý học liệu (AI & RAG)
              </Button>
            </div>

            {materials.length > 0 && (
              <Popconfirm
                title="Xóa tất cả học liệu?"
                description="Bạn có chắc chắn muốn xóa toàn bộ danh mục tài liệu học tập của học phần này không?"
                onConfirm={handleClearAllMaterials}
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  type="text"
                  icon={<Trash2 size={13} />}
                  className="text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  Xóa tất cả
                </Button>
              </Popconfirm>
            )}
          </div>
        )}

        <RagMaterialModal
          visible={ragModalVisible}
          onClose={() => setRagModalVisible(false)}
          courseName={data.courseName}
          courseDescription={data.courseDescription}
          clos={data.clos}
          onAddMaterials={newItems => onChange({ materials: [...materials, ...newItems] })}
        />
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Text strong className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Yêu cầu về Cơ sở vật chất & Phần mềm thực hành (Facilities & Requirements)
            </Text>
            <p className="text-xs text-slate-500 mt-0.5 mb-0">
              Cấu hình phòng lab máy tính, thiết bị phần cứng, hệ điều hành và công cụ phần mềm phục vụ thực hành.
            </p>
          </div>
          {!readonly && (
            <Button
              type="default"
              size="small"
              icon={<Sparkles size={13} className="text-blue-600" />}
              onClick={() => setIsAiFacilitiesOpen(true)}
              className="text-xs h-7 px-3 font-medium border-blue-200 bg-blue-50/60 text-blue-700 hover:border-blue-300 hover:bg-blue-100/60 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              Trợ lý AI
            </Button>
          )}
        </div>
        <RichtextEditor
          value={data.facilitiesRequirements || ''}
          disabled={readonly}
          contentType="FACILITIES"
          metadata={{
            courseName: data.courseName,
            courseDescription: data.courseDescription,
            clos: (data.clos || []).map(c => ({ code: c.code, content: c.content })),
          }}
          minHeight={120}
          placeholder="Yêu cầu phòng máy tính, hệ điều hành, công cụ lập trình, phần cứng thực hành..."
          onChange={val => onChange({ facilitiesRequirements: val })}
        />

        <AiAssistantModal
          open={isAiFacilitiesOpen}
          onClose={() => setIsAiFacilitiesOpen(false)}
          contentType="FACILITIES"
          metadata={{
            courseName: data.courseName,
            courseDescription: data.courseDescription,
            clos: (data.clos || []).map(c => ({ code: c.code, content: c.content })),
          }}
          title="Trợ lý AI - Cơ sở vật chất & Phần mềm thực hành"
          subtitle="Tự động đề xuất cấu hình phòng lab, trang thiết bị phần cứng, hệ điều hành, công cụ phần mềm và môi trường phát triển phù hợp với chuẩn đầu ra môn học."
          placeholder="Nhập yêu cầu định hướng thiết bị, phòng lab hoặc công cụ phần mềm thực hành (ví dụ: Cấu hình phòng lab mạng Cisco, máy tính cài đặt Ubuntu và Docker, công cụ lập trình VS Code và JDK 21...)"
          onApply={result => {
            if (result.rawHtml) {
              onChange({ facilitiesRequirements: result.rawHtml });
            }
          }}
        />
      </div>
    </div>
  );
};
