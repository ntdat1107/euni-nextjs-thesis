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
  Switch,
  Tooltip
} from 'antd';
import { 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  GripVertical,
  ShieldAlert
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Role } from '@/services/rbacService';
import { WorkflowStepDefinitionResponse } from '@/services/workflowDefinitionService';

const { Text } = Typography;

export interface WorkflowStep {
  tempId: string;
  masterStepId: number | string | null;
  name: string;
  code: string;
  screenCode: string;
  executorRole?: string;
  executorRoles?: string[];
  approverRole?: string;
  approverRoles?: string[];
  isRequired: boolean;
  orderNo: number;
  isDataLevelAuth?: boolean;
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
  onSelectMaster: (tempId: string, masterId: number | string) => void;
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

  // Find matching master step from stepDefinitions by ID, stepCode, or screenCode
  const matchedMaster = React.useMemo(() => {
    if (!stepDefinitions || stepDefinitions.length === 0) return null;
    return stepDefinitions.find(
      m => String(m.id) === String(step.masterStepId) || 
           m.stepCode === step.masterStepId || 
           m.stepCode === step.code || 
           m.stepCode === step.screenCode
    );
  }, [stepDefinitions, step.masterStepId, step.code, step.screenCode]);

  const selectedMasterValue = matchedMaster ? matchedMaster.id : (step.masterStepId || undefined);

  // Extract selected prerequisite codes
  const currentPrereqs: string[] = Array.isArray(step.prerequisiteStepCodes) 
    ? step.prerequisiteStepCodes 
    : (step.prerequisiteStepCode ? [step.prerequisiteStepCode] : []);

  // Normalize role values to match Antd Select.Option values (r.code)
  const mapToRoleCode = (val: string): string => {
    if (!val) return '';
    const clean = val.trim();
    const found = roles.find(r => r.code === clean || r.name === clean);
    if (found) return found.code;
    if (clean.includes('Giảng viên')) return 'LECTURER';
    if (clean.includes('Trưởng Khoa')) return 'DEAN';
    if (clean.includes('Bộ môn')) return 'HEAD_DEPT';
    if (clean.includes('Tổ soạn thảo')) return 'COMMITTEE';
    if (clean.includes('Thẩm định') || clean.includes('Hội đồng')) return 'COUNCIL';
    if (clean.includes('ĐTĐH') || clean.includes('Đào tạo')) return 'DTDH';
    if (clean.includes('ĐBCL') || clean.includes('Khảo thí')) return 'QA';
    if (clean.includes('Quản trị') || clean.includes('Admin')) return 'ADMIN';
    return clean;
  };

  const executorRoleValues: string[] = React.useMemo(() => {
    const raw = Array.isArray(step.executorRoles) && step.executorRoles.length > 0 
      ? step.executorRoles 
      : (step.executorRole ? [step.executorRole] : []);
    return Array.from(new Set(raw.map(mapToRoleCode).filter(Boolean)));
  }, [step.executorRoles, step.executorRole, roles]);

  const approverRoleValues: string[] = React.useMemo(() => {
    const raw = Array.isArray(step.approverRoles) && step.approverRoles.length > 0 
      ? step.approverRoles 
      : (step.approverRole ? [step.approverRole] : []);
    return Array.from(new Set(raw.map(mapToRoleCode).filter(Boolean)));
  }, [step.approverRoles, step.approverRole, roles]);

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
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-72">
            <Select
              size="middle"
              placeholder="Chọn bước mẫu từ Kho..."
              className="w-full text-xs"
              value={selectedMasterValue}
              onChange={(val) => onSelectMaster(step.tempId, val)}
              variant="filled"
              optionFilterProp="children"
              showSearch
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
      <div className="p-4 space-y-4">
        {/* Row 1: Prerequisite Steps (Full Width span=24, auto wrap) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            Bước tiền đề (bắt buộc hoàn thành trước):
          </span>
          <Select 
            mode="multiple"
            size="middle" 
            placeholder="Chọn 1 hoặc nhiều bước tiền đề..." 
            className="w-full text-xs [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!py-1" 
            value={currentPrereqs} 
            onChange={(val) => onUpdateField(step.tempId, 'prerequisiteStepCodes', val)}
            allowClear
            tagRender={(props) => {
              const { value, closable, onClose } = props;
              return (
                <Tag
                  closable={closable}
                  onClose={onClose}
                  style={{ marginRight: 4, marginTop: 2, marginBottom: 2 }}
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 inline-flex items-center gap-1"
                >
                  {value}
                </Tag>
              );
            }}
          >
            {stepDefinitions.map(m => (
              <Select.Option key={m.stepCode} value={m.stepCode}>
                <span className="text-xs text-amber-700 font-mono font-bold mr-1.5">{m.stepCode}</span>
                <span className="text-xs text-slate-700">{m.stepName}</span>
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Row 2: Executors (C & U) & Approvers (A) (Half width each: span=12) */}
        <Row gutter={[16, 12]}>
          {/* Group 1: Executors (Create & Update - C & U) */}
          <Col span={12}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag color="green" className="m-0 text-[10px] font-bold px-1.5 py-0 rounded">C & U</Tag>
                Nhóm Thực hiện / Biên soạn:
              </span>
              <Select 
                mode="multiple"
                size="middle" 
                placeholder="Chọn các vai trò thực hiện..." 
                className="w-full text-xs [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!py-1" 
                value={executorRoleValues} 
                onChange={(val) => {
                  onUpdateField(step.tempId, 'executorRoles', val);
                  onUpdateField(step.tempId, 'executorRole', val[0] || '');
                }}
                allowClear
                tagRender={(props) => {
                  const rObj = roles.find(r => r.code === props.value || r.name === props.value);
                  return (
                    <Tag
                      closable={props.closable}
                      onClose={props.onClose}
                      style={{ marginRight: 4, marginTop: 2, marginBottom: 2 }}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border-emerald-200"
                    >
                      {rObj ? rObj.name : props.value}
                    </Tag>
                  );
                }}
              >
                {roles.map(r => (
                  <Select.Option key={r.code} value={r.code}>
                    <span className="text-xs font-medium">{r.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">({r.code})</span>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Group 2: Approvers (Approve - A) */}
          <Col span={12}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag color="purple" className="m-0 text-[10px] font-bold px-1.5 py-0 rounded">A</Tag>
                Nhóm Phê duyệt / Nghiệm thu:
              </span>
              <Select 
                mode="multiple"
                size="middle" 
                placeholder="Chọn các vai trò duyệt..." 
                className="w-full text-xs [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!py-1" 
                value={approverRoleValues} 
                onChange={(val) => {
                  onUpdateField(step.tempId, 'approverRoles', val);
                  onUpdateField(step.tempId, 'approverRole', val[0] || '');
                }}
                allowClear
                tagRender={(props) => {
                  const rObj = roles.find(r => r.code === props.value || r.name === props.value);
                  return (
                    <Tag
                      closable={props.closable}
                      onClose={props.onClose}
                      style={{ marginRight: 4, marginTop: 2, marginBottom: 2 }}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border-purple-200"
                    >
                      {rObj ? rObj.name : props.value}
                    </Tag>
                  );
                }}
              >
                {roles.map(r => (
                  <Select.Option key={r.code} value={r.code}>
                    <span className="text-xs font-medium">{r.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">({r.code})</span>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        {/* Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 italic">
              * Mặc định tất cả người dùng hệ thống đều có quyền <strong>Xem (View - V)</strong>.
            </span>
          </div>
        </div>

        {/* Required Documents Section */}
        {step.requiredDocuments && step.requiredDocuments.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Hồ sơ công việc yêu cầu:</span>
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

