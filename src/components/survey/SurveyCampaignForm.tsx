'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Typography, Card, Button, Space, Breadcrumb, Form, Input,
  Select, Steps, Divider, Row, Col, DatePicker, App as AntdApp,
  Empty, Checkbox,
  Tag
} from 'antd';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2,
  Settings, FileText, Users, Calendar, Info, Loader2
} from 'lucide-react';
import dayjs from 'dayjs';
import { XMLParser } from 'fast-xml-parser';
import { programService } from '@/services/programService';
import workflowService, { WorkflowTemplateResponse } from '@/services/workflowService';
import { surveyCampaignService, SurveyCampaignRequest } from '@/services/surveyCampaignService';
import { rbacService, Role } from '@/services/rbacService';

const { Title, Text, Paragraph } = Typography;

// No more mock data here

export default function SurveyCampaignForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = AntdApp.useApp();
  
  const id = params?.id as string;
  const isNew = !id || id === 'new';
  const mode = searchParams.get('mode');
  const isView = !isNew && mode !== 'edit';
  
  const [currentStep, setCurrentStep] = useState(-1);
  const [form] = Form.useForm();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [maxStepReached, setMaxStepReached] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplateResponse[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, wData, rData] = await Promise.all([
          programService.getAll(),
          workflowService.getAll(),
          rbacService.getRoles()
        ]);
        setPrograms(pData);
        setWorkflows(wData);
        setRoles(rData);
      } catch (error) {
        message.error('Lỗi khi tải dữ liệu khởi tạo');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      const fetchCampaign = async () => {
        try {
          setIsLoading(true);
          const data = await surveyCampaignService.getById(id);
          setCampaignData(data);
          form.setFieldsValue({
            ...data,
            range: [dayjs(data.startDate), dayjs(data.endDate)]
          });
          setSelectedWorkflowId(data.workflowTemplateId);
          setWorkflowSteps(data.steps.map(s => ({
            id: s.id,
            title: s.stepName,
            deadline: s.deadline ? dayjs(s.deadline) : null,
            requiredDocuments: s.requiredDocuments,
            configuration: s.configuration
          })));
          setCurrentStep(0);
          if (isView) setMaxStepReached(data.steps.length);
        } catch (error) {
          message.error('Lỗi khi tải chi tiết đợt khảo sát');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCampaign();
    }
  }, [id, isNew, form, isView]);

  useEffect(() => {
    if (currentStep > maxStepReached) {
      setMaxStepReached(currentStep);
    }
  }, [currentStep, maxStepReached]);

  const handleWorkflowChange = (value: string) => {
    setSelectedWorkflowId(value);
  };

  const next = async () => {
    try {
      if (!isView) {
        await form.validateFields();
      }

      if (currentStep === -1 && selectedWorkflowId && isNew) {
        const wf = workflows.find(w => w.id === selectedWorkflowId);
        if (wf) {
           const parser = new XMLParser({ 
             ignoreAttributes: false, 
             attributeNamePrefix: "",
             removeNSPrefix: true // Simplify by removing bpmn:, camunda: prefixes
           });
           const jsonObj = parser.parse(wf.xmlContent);
           const definitions = jsonObj.definitions;
           const process = definitions?.process;
           
           if (process) {
             // Helper to convert single objects to arrays
             const toArray = (obj: any) => Array.isArray(obj) ? obj : (obj ? [obj] : []);
             
             const startEvents = toArray(process.startEvent);
             const userTasks = [...toArray(process.userTask), ...toArray(process.task)];
             const sequenceFlows = toArray(process.sequenceFlow);
             
             if (startEvents.length > 0) {
               const steps: any[] = [];
               let currentNodeId = startEvents[0].id;
               const visited = new Set<string>();
               
               while (currentNodeId && !visited.has(currentNodeId)) {
                 visited.add(currentNodeId);
                 
                 // Find outgoing flow from current node
                 const outgoingFlow = sequenceFlows.find((f: any) => f.sourceRef === currentNodeId);
                 if (!outgoingFlow) break;
                 
                 const targetId = outgoingFlow.targetRef;
                 const task = userTasks.find((t: any) => t.id === targetId);
                 
                 if (task) {
                   steps.push({
                     title: task.name || task.id,
                     description: task.documentation || '',
                     configuration: {
                       taskId: task.id,
                       performerRole: task.performerRole || '',
                       approverRole: task.approverRole || '',
                       screenCode: task.formKey || ''
                     },
                     deadline: null,
                     requiredDocuments: []
                   });
                 }
                 
                 currentNodeId = targetId;
               }
               setWorkflowSteps(steps);
             }
           }
        }
      }

      setCurrentStep(currentStep + 1);
    } catch (error) {
       console.error('Validation error or parsing error:', error);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStepChange = async (step: number) => {
    // If we are in General Info, we must validate first to move to steps
    if (currentStep === -1) {
      if (step >= 0) {
        await next();
      }
      return;
    }

    // If going back to general info
    if (step < 0) {
      setCurrentStep(-1);
      return;
    }

    // If going back, just go
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    if (step <= maxStepReached || isView) {
      setCurrentStep(step);
    } else if (step === currentStep + 1) {
      await next();
    }
  };

  const onFinish = async (values: any) => {
    try {
      setIsSubmitting(true);
      const { range, ...rest } = values;
      
      const requestData: SurveyCampaignRequest = {
        ...rest,
        code: values.code || `CAM-${Date.now()}`, // Temporary code if not provided
        workflowTemplateId: selectedWorkflowId!,
        startDate: range[0].toISOString(),
        endDate: range[1].toISOString(),
        steps: workflowSteps.map((s, idx) => ({
          stepIndex: idx,
          stepName: s.title,
          deadline: s.deadline?.toISOString(),
          requiredDocuments: s.requiredDocuments || [],
          configuration: s.configuration || {}
        }))
      };

      let result;
      if (isNew) {
        result = await surveyCampaignService.create(requestData);
        message.success('Đã tạo đợt khảo sát thành công!');
      } else {
        result = await surveyCampaignService.update(id, requestData);
        message.success('Đã cập nhật đợt khảo sát!');
      }

      router.push(`/survey/campaigns/${result.id}?mode=view`);
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = workflowSteps.length;

  const renderStepContent = (stepIndex: number) => {
    if (stepIndex === -1) {
      return (
        <div className="max-w-3xl mx-auto py-6">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={<span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Mã đợt khảo sát</span>}
              >
                <Input placeholder="Tự động sinh nếu để trống" className="h-11 rounded-xl" disabled={isView} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={<span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Tên đợt khảo sát</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên đợt khảo sát' }]}
              >
                <Input placeholder="Ví dụ: Khảo sát CTĐT CNTT 2026" className="h-11 rounded-xl" disabled={isView} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="programId"
                label={<span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Chương trình đào tạo</span>}
                rules={[{ required: true, message: 'Vui lòng chọn chương trình' }]}
              >
                <Select placeholder="Chọn chương trình đào tạo" className="h-11" disabled={isView}>
                  {programs.map(p => (
                    <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="workflowId"
                label={<span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Mẫu quy trình áp dụng</span>}
                rules={[{ required: true, message: 'Vui lòng chọn mẫu quy trình' }]}
              >
                <Select 
                  placeholder="Chọn mẫu quy trình" 
                  className="h-11" 
                  onChange={handleWorkflowChange}
                  disabled={isView || !isNew}
                >
                  {workflows.map(w => (
                    <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="range"
                label={<span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Thời gian thực hiện</span>}
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <DatePicker.RangePicker className="w-full h-11 rounded-xl" disabled={isView} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label={<span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Mô tả chi tiết</span>}
              >
                <Input.TextArea rows={4} placeholder="Nhập mô tả đợt khảo sát..." className="rounded-xl" disabled={isView} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      );
    }

    const currentWfStep = workflowSteps[stepIndex];
    if (currentWfStep) {
      return (
        <div className="max-w-4xl mx-auto py-6">
          <Card className="bg-blue-50/50 border-blue-100 rounded-2xl mb-6 shadow-none">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <Title level={4} className="!mb-0 text-blue-900">{currentWfStep.title}</Title>
                <Text type="secondary" className="text-sm">{currentWfStep.description || 'Không có mô tả chi tiết'}</Text>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <Title level={5} className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-slate-400" />
                  Quy định thực hiện (Theo quy trình)
                </Title>
                <Row gutter={24}>
                  <Col span={12}>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Người thực hiện</Text>
                    <Tag color="blue" className="text-sm px-3 py-1 rounded-full">
                       {roles.find(r => r.code === currentWfStep.configuration?.performerRole)?.name || 'Mọi thành viên'}
                    </Tag>
                  </Col>
                  <Col span={12}>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Người kiểm duyệt</Text>
                    <Tag color="orange" className="text-sm px-3 py-1 rounded-full">
                       {roles.find(r => r.code === currentWfStep.configuration?.approverRole)?.name || 'Chưa quy định'}
                    </Tag>
                  </Col>
                </Row>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <Title level={5} className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Tài liệu/Biểu mẫu yêu cầu
                </Title>
                <Checkbox.Group 
                  className="flex flex-col gap-3" 
                  disabled={isView} 
                  value={currentWfStep.requiredDocuments}
                  onChange={(checkedValues) => {
                    const newSteps = [...workflowSteps];
                    newSteps[stepIndex].requiredDocuments = checkedValues;
                    setWorkflowSteps(newSteps);
                  }}
                >
                  <Checkbox value="doc-1">Kế hoạch chi tiết đợt khảo sát</Checkbox>
                  <Checkbox value="doc-2">Danh sách sinh viên/cựu sinh viên</Checkbox>
                  <Checkbox value="doc-3">Quyết định thành lập hội đồng</Checkbox>
                </Checkbox.Group>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <Title level={5} className="flex items-center gap-2 mb-4">
                   <Calendar className="w-4 h-4 text-slate-400" />
                   Hạn chót hoàn thành (Deadline)
                </Title>
                <DatePicker 
                  className="w-full h-11 rounded-xl" 
                  disabled={isView} 
                  placeholder="Chọn ngày hạn chót" 
                  value={currentWfStep.deadline}
                  onChange={(date) => {
                    const newSteps = [...workflowSteps];
                    newSteps[stepIndex].deadline = date;
                    setWorkflowSteps(newSteps);
                  }}
                />
             </div>
          </div>
        </div>
      );
    }

    return <Empty description="Không có dữ liệu quy trình" />;
  };

  const renderCampaignHeader = () => {
    const data = !isNew ? campaignData : form.getFieldsValue();
    const programName = data?.programName || programs.find(p => p.id === data?.programId)?.name || '---';
    const workflowName = data?.workflowTemplateName || workflows.find(w => w.id === data?.workflowTemplateId || w.id === data?.workflowId)?.name || '---';

    return (
      <div className="bg-slate-50/80 px-12 py-6 border-b border-slate-100">
        <Row gutter={[32, 16]}>
          <Col span={8}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Chương trình đào tạo</Text>
            <Text className="text-slate-700 font-semibold flex items-center gap-2">
               <Info size={14} className="text-blue-500" />
               {programName}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mẫu quy trình</Text>
            <Text className="text-slate-700 font-semibold flex items-center gap-2">
               <Settings size={14} className="text-purple-500" />
               {workflowName}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian hiệu lực</Text>
            <Text className="text-slate-700 font-semibold flex items-center gap-2">
               <Calendar size={14} className="text-emerald-500" />
               {data?.startDate ? `${dayjs(data.startDate).format('DD/MM/YYYY')} - ${dayjs(data.endDate).format('DD/MM/YYYY')}` : '---'}
            </Text>
          </Col>
        </Row>
        {data?.description && (
          <div className="mt-4 pt-4 border-t border-slate-100/50">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mô tả chi tiết</Text>
            <Paragraph className="!mb-0 text-slate-600 text-sm italic">
              "{data.description}"
            </Paragraph>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { title: 'Trang chủ' },
          { title: 'Khảo sát' },
          { title: 'Đợt khảo sát' },
          { title: isNew ? 'Tạo mới' : (isView ? 'Chi tiết' : 'Chỉnh sửa') },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            icon={<ArrowLeft className="w-4 h-4" />} 
            onClick={() => router.push('/survey/campaigns')}
            className="rounded-lg hover:bg-slate-100 border-none flex items-center"
          >
            Quay lại
          </Button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div>
            <Title level={2} className="!mb-0 !text-slate-800 tracking-tight">
              {isNew ? 'Thiết lập Đợt Khảo sát mới' : (isView ? `Chi tiết: ${campaignData?.name}` : `Chỉnh sửa: ${campaignData?.name}`)}
            </Title>
            <Paragraph type="secondary" className="!mb-0 text-slate-500 font-medium">
              {isNew ? 'Khởi tạo đợt khảo sát và gán quy trình thực hiện' : 'Theo dõi và quản lý thông tin đợt khảo sát'}
            </Paragraph>
          </div>
        </div>
        {!isView && (
          <Button
            type="primary"
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            onClick={() => form.submit()}
            disabled={isSubmitting}
            className="rounded-xl px-8 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none transition-all"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu dữ liệu'}
          </Button>
        )}
      </div>

      <Card className="shadow-sm border-slate-200 rounded-3xl overflow-hidden min-h-[600px] relative" styles={{ body: { padding: 0 } }}>
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <Text className="text-slate-500 font-medium">Đang tải dữ liệu...</Text>
            </div>
          </div>
        )}
        {currentStep >= 0 && renderCampaignHeader()}
        
        {workflowSteps.length > 0 && (
          <div className="px-12 pt-10 pb-8 bg-white border-b border-slate-50">
            <Steps 
              current={currentStep} 
              onChange={handleStepChange}
              className="premium-steps"
              items={workflowSteps.map((s, idx) => ({
                  title: s.title,
                  status: currentStep === idx ? 'process' : 'wait'
              }))}
            />
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} disabled={isView} className="px-12 py-2">
           {renderStepContent(currentStep)}
        </Form>

        <div className="p-8 border-t border-slate-100 flex justify-between bg-slate-50/30">
          <Button
            disabled={currentStep === -1 || (!isNew && currentStep === 0)}
            onClick={prev}
            icon={<ArrowLeft size={16} />}
            className="h-11 px-6 rounded-xl flex items-center"
          >
            Quay lại
          </Button>
          
          {currentStep < totalSteps - 1 ? (
            <Button
              type="primary"
              onClick={next}
              className="h-11 px-8 rounded-xl flex items-center gap-2 bg-blue-600 shadow-md"
              disabled={currentStep === -1 && !selectedWorkflowId}
            >
              {currentStep === -1 ? 'Thiết lập quy trình' : 'Tiếp tục'} <ArrowRight size={16} />
            </Button>
          ) : (
            !isView && (
              <Button
                type="primary"
                onClick={() => form.submit()}
                className="h-11 px-10 rounded-xl flex items-center gap-2 bg-emerald-600 shadow-md"
              >
                Hoàn tất <CheckCircle2 size={16} />
              </Button>
            )
          )}
        </div>
      </Card>

      <style jsx global>{`
        .premium-steps .ant-steps-item-process .ant-steps-item-icon {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        .premium-steps .ant-steps-item-finish .ant-steps-item-icon {
          border-color: #10b981;
          color: #10b981;
        }
        .premium-steps .ant-steps-item-finish .ant-steps-item-tail::after {
          background-color: #10b981;
        }
        .ant-form-item-label label {
          margin-bottom: 4px;
        }
        .ant-input-disabled, .ant-select-disabled .ant-select-selector, .ant-picker-disabled {
          background-color: #fff !important;
          color: #1e293b !important;
          cursor: default !important;
          border-color: #e2e8f0 !important;
          opacity: 1 !important;
        }
        .ant-checkbox-disabled + span, .ant-radio-disabled + span {
           color: #1e293b !important;
           cursor: default !important;
           opacity: 1 !important;
        }
        .ant-select-disabled .ant-select-selection-item {
          color: #1e293b !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
