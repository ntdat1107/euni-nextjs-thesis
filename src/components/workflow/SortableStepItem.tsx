'use client';

import React from 'react';
import { 
  Form, 
  Select, 
  Button, 
  Space, 
  Divider, 
  Typography, 
  Tag, 
  Row, 
  Col, 
  Switch 
} from 'antd';
import { 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  GripVertical 
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Role } from '@/services/rbacService';

const { Text } = Typography;

export interface WorkflowStep {
  tempId: string;
  masterStepId: string | null;
  name: string;
  code: string;
  screenCode: string;
  executorRole: string;
  approverRole: string;
  isRequired: boolean;
  orderNo: number;
}

import { MASTER_STEPS_DATA } from '@/constants/workflowConstants';

interface SortableStepItemProps {
  step: WorkflowStep;
  index: number;
  totalSteps: number;
  roles: Role[];
  onRemove: (tempId: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onSelectMaster: (tempId: string, masterId: string) => void;
  onUpdateField: (tempId: string, field: keyof WorkflowStep, value: any) => void;
}

export function SortableStepItem({ 
  step, 
  index, 
  totalSteps, 
  roles, 
  onRemove, 
  onMove, 
  onSelectMaster, 
  onUpdateField 
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.tempId });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white transition-all hover:border-blue-300 ${isDragging ? 'shadow-lg border-blue-400 ring-2 ring-blue-50' : ''}`}
    >
      <div className="px-4 py-2 flex items-center gap-4">
        {/* Drag Handle & Order */}
        <div className="flex items-center gap-2 shrink-0">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
          >
            <GripVertical size={16} />
          </div>
          <div className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm">
            {step.orderNo}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 min-w-0">
          <Row gutter={10} align="middle">
            <Col span={7}>
              <div className="flex flex-col min-w-0">
                <Text strong className="text-[11px] truncate leading-tight block" title={step.name}>
                  {step.name || 'Bước mới'}
                </Text>
                {step.masterStepId && step.code && (
                  <div className="mt-0.5">
                    <Tag className="m-0 text-[8px] px-1 py-0 bg-blue-50 border-none text-blue-600 font-mono inline-block">
                      {step.code}
                    </Tag>
                  </div>
                )}
              </div>
            </Col>
            <Col span={7}>
              <Select
                size="small"
                placeholder="Chọn bước mẫu..."
                className="w-full text-[11px]"
                value={step.masterStepId}
                onChange={(val) => onSelectMaster(step.tempId, val)}
                variant="filled"
              >
                {MASTER_STEPS_DATA.map(m => (
                  <Select.Option key={m.id} value={m.id}>
                    <span className="text-[11px]">{m.name}</span>
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select 
                size="small" 
                placeholder="Người thực hiện" 
                className="w-full text-[11px]" 
                value={step.executorRole || undefined} 
                onChange={(val) => onUpdateField(step.tempId, 'executorRole', val)}
                variant="borderless"
                allowClear
              >
                {roles.map(r => <Select.Option key={r.code} value={r.code}><span className="text-[11px]">{r.name}</span></Select.Option>)}
              </Select>
            </Col>
            <Col span={4}>
              <Select 
                size="small" 
                placeholder="Người duyệt" 
                className="w-full text-[11px]" 
                value={step.approverRole || undefined} 
                onChange={(val) => onUpdateField(step.tempId, 'approverRole', val)}
                variant="borderless"
                allowClear
              >
                {roles.map(r => <Select.Option key={r.code} value={r.code}><span className="text-[11px]">{r.name}</span></Select.Option>)}
              </Select>
            </Col>
            <Col span={2} className="text-right">
              <Button 
                type="text" 
                size="small" 
                icon={<Trash2 size={14} />} 
                danger 
                onClick={() => onRemove(step.tempId)} 
                className="hover:bg-red-50"
              />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}
