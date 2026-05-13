'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Select, 
  Divider, 
  Typography, 
  Tag, 
  Row, 
  Col, 
  Tooltip,
  App,
  Switch
} from 'antd';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  GripVertical,
  Settings,
  Layers,
  Info,
  MousePointer2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { 
  restrictToVerticalAxis,
  restrictToParentElement 
} from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import workflowService from '@/services/workflowService';
import { rbacService, Role } from '@/services/rbacService';

const { Title, Text, Paragraph } = Typography;

import { MASTER_STEPS_DATA } from '@/constants/workflowConstants';
import { SortableStepItem, WorkflowStep } from './SortableStepItem';

interface WorkflowEditorModalProps {
  open: boolean;
  editingId?: string | null;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export default function WorkflowEditorModal({ open, editingId, onClose, onSuccess }: WorkflowEditorModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [initialCode, setInitialCode] = useState<string>('');

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Tránh click nhầm khi drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await rbacService.getRoles();
        setRoles(data);
      } catch (e) {
        console.error('Failed to fetch roles');
      }
    };
    if (open) fetchRoles();
  }, [open]);

  useEffect(() => {
    if (open && editingId) {
      loadWorkflowData(editingId);
    } else if (open) {
      form.resetFields();
      setSteps([]);
    }
  }, [open, editingId, form]);

  const loadWorkflowData = async (id: string) => {
    setLoading(true);
    try {
      const res = await workflowService.getById(id);
      form.setFieldsValue({
        name: res.name,
        code: res.code,
        version: res.version,
        description: res.description
      });
      setInitialCode(res.code);

      // Try to parse steps from jsonContent
      if (res.jsonContent) {
        try {
          const content = JSON.parse(res.jsonContent);
          if (content.type === 'linear' && Array.isArray(content.steps)) {
            setSteps(content.steps);
          } else if (content.nodes) {
            // Fallback/Convert from React Flow if needed (advanced)
            // For now assume linear if we are using this modal
          }
        } catch (e) {
          console.error('Failed to parse workflow steps');
        }
      }
    } catch (e) {
      message.error('Không tải được dữ liệu quy trình');
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      tempId: `tmp_${Date.now()}`,
      masterStepId: null,
      name: 'Bước mới',
      code: '',
      screenCode: '',
      executorRole: '',
      approverRole: '',
      isRequired: true,
      orderNo: steps.length + 1
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (tempId: string) => {
    const newSteps = steps.filter(s => s.tempId !== tempId)
      .map((s, i) => ({ ...s, orderNo: i + 1 }));
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update orderNo
    const finalSteps = newSteps.map((s, i) => ({ ...s, orderNo: i + 1 }));
    setSteps(finalSteps);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((i) => i.tempId === active.id);
        const newIndex = items.findIndex((i) => i.tempId === over.id);
        
        const newArray = arrayMove(items, oldIndex, newIndex);
        return newArray.map((s, i) => ({ ...s, orderNo: i + 1 }));
      });
    }
  };

  const handleSelectMasterStep = (tempId: string, masterId: string) => {
    const master = MASTER_STEPS_DATA.find(m => m.id === masterId);
    if (!master) return;

    setSteps(steps.map(s => s.tempId === tempId ? {
      ...s,
      masterStepId: master.id,
      name: master.name,
      code: master.code,
      screenCode: master.screenCode
    } : s));
  };

  const updateStepField = (tempId: string, field: keyof WorkflowStep, value: any) => {
    setSteps(steps.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (steps.length === 0) {
        message.warning('Vui lòng thêm ít nhất 1 bước cho quy trình');
        return;
      }

      setLoading(true);
      
      // Construct JSON Content with Auto-generated Start/End Nodes
      const flowNodes = [
        {
          id: 'node-start',
          type: 'start',
          position: { x: 50, y: 150 },
          data: { label: 'Bắt đầu' }
        },
        ...steps.map((s, i) => ({
          id: s.tempId,
          type: 'state',
          position: { x: 300 + i * 400, y: 150 },
          data: { 
            label: s.name, 
            screenCode: s.screenCode,
            performerRole: s.executorRole,
            approverRole: s.approverRole
          }
        })),
        {
          id: 'node-end',
          type: 'end',
          position: { x: 300 + steps.length * 400, y: 150 },
          data: { label: 'Kết thúc' }
        }
      ];

      const flowEdges = [
        {
          id: 'edge-start',
          source: 'node-start',
          target: steps[0].tempId,
          label: 'Bắt đầu',
          markerEnd: { type: 'arrowclosed', color: '#94a3b8', width: 20, height: 20 }
        },
        ...steps.slice(0, -1).map((s, i) => ({
          id: `e-${s.tempId}-${steps[i+1].tempId}`,
          source: s.tempId,
          target: steps[i+1].tempId,
          label: 'Tiếp tục',
          markerEnd: { type: 'arrowclosed', color: '#94a3b8', width: 20, height: 20 }
        })),
        {
          id: 'edge-end',
          source: steps[steps.length - 1].tempId,
          target: 'node-end',
          label: 'Hoàn thành',
          markerEnd: { type: 'arrowclosed', color: '#94a3b8', width: 20, height: 20 }
        }
      ];

      const jsonContent = JSON.stringify({
        type: 'linear',
        steps: steps,
        nodes: flowNodes,
        edges: flowEdges
      });

      const payload = {
        ...values,
        jsonContent,
        status: 'ACTIVE'
      };

      const result = await workflowService.saveOfficial(payload);
      message.success(editingId ? 'Cập nhật quy trình thành công' : 'Tạo quy trình thành công');

      onSuccess(result.id);
    } catch (e) {
      console.error(e);
      message.error('Lưu quy trình thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 py-1">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Layers className="text-blue-600 w-5 h-5" />
          </div>
          <span className="text-lg font-bold">{editingId ? 'Chỉnh sửa Quy trình' : 'Tạo mới Quy trình'}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={1000}
      confirmLoading={loading}
      okText="Lưu dữ liệu"
      cancelText="Hủy bỏ"
      centered
      styles={{ body: { padding: '24px', maxHeight: '75vh', overflowY: 'auto' } }}
      className="premium-modal"
    >
      <Form form={form} layout="vertical" className="space-y-6">
        {/* General Info */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <Row gutter={20}>
            <Col span={8}>
              <Form.Item 
                label={<span className="font-semibold text-slate-700">Tên quy trình *</span>} 
                name="name" 
                rules={[{ required: true, message: 'Vui lòng nhập tên quy trình' }]}
              >
                <Input placeholder="VD: Quy trình Phê duyệt Đề tài" className="rounded-xl h-11" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label={<span className="font-semibold text-slate-700">Mã quy trình (Unique ID) *</span>} 
                name="code" 
                hasFeedback
                validateTrigger="onBlur"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã quy trình' },
                  {
                    validator: async (_, value) => {
                      if (!value || value.length < 3) return Promise.resolve();
                      
                      // Skip API check if value hasn't changed from initial
                      if (editingId && value === initialCode) {
                        return Promise.resolve();
                      }
                      
                      // Check uniqueness via API
                      try {
                        const exists = await workflowService.checkCode(value, editingId);
                        if (exists) {
                          return Promise.reject('Mã quy trình này đã tồn tại trong hệ thống');
                        }
                        return Promise.resolve();
                      } catch (e) {
                        return Promise.resolve();
                      }
                    }
                  }
                ]}
              >
                <Input placeholder="VD: APPROVE_TOPIC_001" className="rounded-xl h-11 font-mono uppercase" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label={<span className="font-semibold text-slate-700">Phiên bản hiện tại</span>} 
                name="version" 
                initialValue="1"
              >
                <Input placeholder="1" className="rounded-xl h-11" disabled />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item 
                label={<span className="font-semibold text-slate-700">Mô tả chi tiết</span>} 
                name="description"
              >
                <Input.TextArea 
                  placeholder="Mô tả mục đích và phạm vi áp dụng của quy trình..." 
                  className="rounded-xl" 
                  rows={3} 
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Step Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={5} className="!mb-0 flex items-center gap-2">
                Thiết lập các bước quy trình
                <Tooltip title="Các bước sẽ được thực hiện theo trình tự tuyến tính">
                  <Info size={14} className="text-slate-400" />
                </Tooltip>
              </Title>
              <Text type="secondary" className="text-xs">Xác định trình tự thực hiện, người phụ trách và người duyệt cho từng bước.</Text>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext 
                items={steps.map(s => s.tempId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <SortableStepItem
                      key={step.tempId}
                      step={step}
                      index={index}
                      totalSteps={steps.length}
                      roles={roles}
                      onRemove={removeStep}
                      onMove={moveStep}
                      onSelectMaster={handleSelectMasterStep}
                      onUpdateField={updateStepField}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Always show Add Step Button at Bottom */}
            <Button 
              type="dashed" 
              block 
              icon={<Plus size={16} />} 
              onClick={addStep}
              className="h-16 rounded-2xl border-2 border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 bg-slate-50/30 hover:bg-indigo-50/30 transition-all flex items-center justify-center font-medium mt-3"
            >
              Thêm bước mới vào quy trình
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
