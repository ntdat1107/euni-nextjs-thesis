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
import { WorkflowStepDefinitionResponse } from '@/services/workflowDefinitionService';

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
  requiredDocuments?: string[];
  prerequisiteStepCode?: string;
  prerequisiteStepCodes?: string[];
}

interface SortableStepItemProps {
  step: WorkflowStep;
  index: number;
  totalSteps: number;
  roles: Role[];
  stepDefinitions: WorkflowStepDefinitionResponse[];
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
  stepDefinitions,
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

  // Extract selected prerequisite codes (supporting single string or array)
  const currentPrereqs: string[] = Array.isArray(step.prerequisiteStepCodes) 
    ? step.prerequisiteStepCodes 
    : (step.prerequisiteStepCode ? [step.prerequisiteStepCode] : []);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white transition-all hover:border-blue-300 ${isDragging ? 'shadow-lg border-blue-400 ring-2 ring-blue-50' : ''}`}
    >
      {/* Header Row: Order, Step Title, Master Step Picker & Delete */}
      <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-200/60 rounded-lg transition-colors text-slate-400 hover:text-slate-600 shrink-0"
          >
            <GripVertical size={16} />
          </div>
          <div className="w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0">
            {step.orderNo}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Text strong className="text-sm truncate text-slate-800" title={step.name}>
              {step.name || 'Bước mới'}
            </Text>
            {step.masterStepId && step.code && (
              <Tag className="m-0 text-[11px] px-2 py-0.5 bg-blue-100 border-none text-blue-700 font-mono font-bold rounded-lg shrink-0">
                {step.code}
              </Tag>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-64">
            <Select
              size="middle"
              placeholder="Chọn bước mẫu..."
              className="w-full text-xs"
              value={step.masterStepId}
              onChange={(val) => onSelectMaster(step.tempId, val)}
              variant="filled"
            >
              {stepDefinitions.map(m => (
                <Select.Option key={m.id} value={m.id}>
                  <span className="text-xs font-medium">{m.stepCode} - {m.stepName}</span>
                </Select.Option>
              ))}
            </Select>
          </div>
          <Button 
            type="text" 
            size="middle" 
            icon={<Trash2 size={16} />} 
            danger 
            onClick={() => onRemove(step.tempId)} 
            className="hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl px-2"
          />
        </div>
      </div>

      {/* Fields Grid Row */}
      <div className="p-4 space-y-3">
        <Row gutter={[16, 12]}>
          <Col span={10}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Các bước bắt buộc trước (Tiền đề):
              </span>
              <Select 
                mode="multiple"
                size="small" 
                placeholder="Chọn 1 hoặc nhiều bước tiền đề..." 
                className="w-full text-xs" 
                value={currentPrereqs} 
                onChange={(val) => onUpdateField(step.tempId, 'prerequisiteStepCodes', val)}
                allowClear
                tagRender={(props) => {
                  const { value, closable, onClose } = props;
                  const onPreventMouseDown = (e: React.MouseEvent<HTMLSpanElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                  };
                  return (
                    <Tag
                      onMouseDown={onPreventMouseDown}
                      closable={closable}
                      onClose={onClose}
                      style={{ marginRight: 3, marginTop: 2, marginBottom: 2 }}
                      className="text-[11px] font-mono font-bold px-1.5 py-0 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1 inline-flex"
                    >
                      {value}
                    </Tag>
                  );
                }}
              >
                {stepDefinitions.map(m => (
                  <Select.Option key={m.stepCode} value={m.stepCode}>
                    <span className="text-xs text-amber-700 font-bold">{m.stepCode}</span> - {m.stepName}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col span={7}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Người thực hiện:
              </span>
              <Select 
                size="small" 
                placeholder="Chọn vai trò thực hiện..." 
                className="w-full text-xs" 
                value={step.executorRole || undefined} 
                onChange={(val) => onUpdateField(step.tempId, 'executorRole', val)}
                allowClear
              >
                {roles.map(r => (
                  <Select.Option key={r.code} value={r.code}>
                    <span className="text-xs">{r.name}</span>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col span={7}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Người duyệt:
              </span>
              <Select 
                size="small" 
                placeholder="Chọn vai trò duyệt..." 
                className="w-full text-xs" 
                value={step.approverRole || undefined} 
                onChange={(val) => onUpdateField(step.tempId, 'approverRole', val)}
                allowClear
              >
                {roles.map(r => (
                  <Select.Option key={r.code} value={r.code}>
                    <span className="text-xs">{r.name}</span>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        {/* Required Documents Section: ONLY render if masterStepId is selected AND requiredDocuments exists and has items */}
        {step.masterStepId && step.requiredDocuments && step.requiredDocuments.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Hồ sơ công việc (Yêu cầu):</span>
            <div className="flex flex-wrap gap-1.5">
              {step.requiredDocuments.map((doc, i) => (
                <Tag key={i} className="m-0 text-[11px] bg-slate-100 border-slate-200 text-slate-600 rounded-md">
                  {doc}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
