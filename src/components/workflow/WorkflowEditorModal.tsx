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
  Switch,
  Spin
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
  MousePointer2,
  AlertCircle
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
import { workflowDefinitionService, WorkflowStepDefinitionResponse } from '@/services/workflowDefinitionService';

const { Title, Text, Paragraph } = Typography;

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
  const [stepDefinitions, setStepDefinitions] = useState<WorkflowStepDefinitionResponse[]>([]);
  const [initialCode, setInitialCode] = useState<string>('');
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [officialData, setOfficialData] = useState<any>(null);

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
    const fetchData = async () => {
      try {
        const [rData, dData] = await Promise.all([
          rbacService.getRoles(),
          workflowDefinitionService.getAll()
        ]);
        setRoles(rData);
        setStepDefinitions(dData);
      } catch (e) {
        console.error('Failed to fetch initial data');
      }
    };
    if (open) fetchData();
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
      let res = await workflowService.getById(id);
      
      // Nếu id này là của bản nháp, mặc định lấy dữ liệu bản nháp để chỉnh sửa
      if (res.status === 'DRAFT') {
        setupData(res);
        return;
      }

      // Always try to fetch draft by code when editing an official template
      const draft = await workflowService.getDraftByCode(res.code);
      if (draft) {
        setDraftData(draft);
        setOfficialData(res);
        setShowDraftConfirm(true);
      } else {
        setupData(res);
      }
    } catch (e) {
      message.error('Không tải được dữ liệu quy trình');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDraft = (useDraft: boolean) => {
    setupData(useDraft ? draftData : officialData);
    setShowDraftConfirm(false);
  };

  const setupData = (data: any) => {
    form.setFieldsValue({
      name: data.name,
      code: data.code,
      version: data.version || 0,
      description: data.description
    });
    setInitialCode(data.code);

    if (data.jsonContent) {
      try {
        const content = JSON.parse(data.jsonContent);
        if (content.type === 'linear' && Array.isArray(content.steps)) {
          setSteps(content.steps);
        }
      } catch (e) {
        console.error('Failed to parse workflow steps');
      }
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
    const master = stepDefinitions.find(m => m.id === masterId);
    if (!master) return;

    setSteps(steps.map(s => s.tempId === tempId ? {
      ...s,
      masterStepId: master.id,
      name: master.stepName,
      code: master.stepCode,
      screenCode: master.stepCode,
      requiredDocuments: master.requiredDocuments || []
    } : s));
  };

  const updateStepField = (tempId: string, field: keyof WorkflowStep, value: any) => {
    setSteps(steps.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));
  };

  const getPayload = (values: any) => {
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
          orderNo: i + 1,
          screenCode: s.screenCode,
          performerRole: s.executorRole,
          approverRole: s.approverRole,
          requiredDocuments: s.requiredDocuments
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

    return {
      ...values,
      jsonContent,
      status: values.status || 'ACTIVE'
    };
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.getFieldsValue();
      if (steps.length === 0) {
        message.warning('Vui lòng thêm ít nhất 1 bước');
        return;
      }
      setLoading(true);
      const result = await workflowService.syncDraft(getPayload(values));
      message.success('Đã lưu bản nháp thành công');
      onSuccess(result.id); // Return the draft ID
    } catch (e) {
      message.error('Lưu bản nháp thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      if (steps.length === 0) {
        message.warning('Vui lòng thêm ít nhất 1 bước');
        return;
      }

      setLoading(true);
      const result = await workflowService.saveOfficial(getPayload(values));
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
    <>
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
      footer={[
        <Button key="cancel" onClick={onClose} className="rounded-xl px-6 h-11 border-slate-200">
          Hủy bỏ
        </Button>,
        <Button key="draft" onClick={handleSaveDraft} loading={loading} className="rounded-xl px-6 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none">
          Lưu bản nháp
        </Button>,
        <Button key="publish" type="primary" onClick={handlePublish} loading={loading} className="rounded-xl px-8 h-11 bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-100">
          Xuất bản
        </Button>
      ]}
      width={1000}
      centered
      styles={{ body: { padding: '24px', maxHeight: '75vh', overflowY: 'auto' } }}
      className="premium-modal"
    >
      <Spin spinning={loading} tip="Đang tải dữ liệu quy trình...">
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
                <Input 
                  placeholder="VD: APPROVE_TOPIC_001" 
                  className="rounded-xl h-11 font-mono uppercase" 
                  disabled={!!editingId}
                />
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
                      stepDefinitions={stepDefinitions}
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
      </Spin>
    </Modal>

      <Modal
        title="Phát hiện bản nháp chưa lưu"
        open={showDraftConfirm}
        onCancel={() => {
          setShowDraftConfirm(false);
          onClose(); // Close both if Cancel/Esc
        }}
        footer={[
          <Button key="original" onClick={() => handleConfirmDraft(false)}>
            Dùng bản chính thức
          </Button>,
          <Button key="draft" type="primary" onClick={() => handleConfirmDraft(true)}>
            Tiếp tục bản nháp
          </Button>
        ]}
        centered
        maskClosable={false}
      >
        <div className="flex items-start gap-4 py-4">
          <AlertCircle className="text-orange-500 mt-1" size={24} />
          <div>
            <p>Hệ thống tìm thấy một bản nháp chưa xuất bản của quy trình này.</p>
            <p className="text-slate-500 text-sm mt-1">Lưu lúc: {draftData && new Date(draftData.lastSavedAt || draftData.updatedAt || draftData.createdAt).toLocaleString()}</p>
            <p className="mt-4 font-medium">Bạn có muốn tiếp tục chỉnh sửa từ bản nháp này không?</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
