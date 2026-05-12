'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Typography, Card, Button, Space, Breadcrumb, Form, Input,
  Select, Steps, Divider, Row, Col, DatePicker, App as AntdApp,
  Empty, Checkbox
} from 'antd';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2,
  Settings, FileText, Users, Calendar, Info
} from 'lucide-react';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// Mock Data
const MOCK_PROGRAMS = [
  { id: 'PRO-001', name: 'Công nghệ thông tin', code: 'IT' },
  { id: 'PRO-002', name: 'Kinh tế đầu tư', code: 'ECON' },
  { id: 'PRO-003', name: 'Ngôn ngữ Anh', code: 'ENG' },
];

const MOCK_WORKFLOWS = [
  { 
    id: 'WF-001', 
    name: 'Quy trình đánh giá chuẩn đầu ra', 
    steps: [
      { title: 'Lập kế hoạch', description: 'Xác định mục tiêu và đối tượng' },
      { title: 'Thu thập dữ liệu', description: 'Thực hiện khảo sát và thu thập' },
      { title: 'Phân tích & Báo cáo', description: 'Xử lý dữ liệu và xuất báo cáo' }
    ] 
  },
  { 
    id: 'WF-002', 
    name: 'Quy trình lấy ý kiến sinh viên', 
    steps: [
      { title: 'Thiết kế câu hỏi', description: 'Soạn thảo bộ câu hỏi khảo sát' },
      { title: 'Triển khai khảo sát', description: 'Gửi khảo sát đến sinh viên' }
    ] 
  },
];

const MOCK_CAMPAIGNS: Record<string, any> = {
  'CAM-001': {
    id: 'CAM-001',
    name: 'Khảo sát CTĐT CNTT 2026 - Đợt 1',
    programId: 'PRO-001',
    workflowId: 'WF-001',
    status: 'ACTIVE',
    startDate: '2026-05-10',
    endDate: '2026-06-10',
    description: 'Khảo sát định kỳ đánh giá chất lượng đào tạo ngành CNTT năm 2026',
  }
};

export default function SurveyCampaignForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = AntdApp.useApp();
  
  const id = params?.id as string;
  const isNew = !id || id === 'new';
  const mode = searchParams.get('mode');
  const isView = !isNew && mode !== 'edit';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);

  const [maxStepReached, setMaxStepReached] = useState(0);

  useEffect(() => {
    if (currentStep > maxStepReached) {
      setMaxStepReached(currentStep);
    }
  }, [currentStep, maxStepReached]);

  useEffect(() => {
    if (!isNew && MOCK_CAMPAIGNS[id]) {
      const data = MOCK_CAMPAIGNS[id];
      form.setFieldsValue({
        ...data,
        range: [dayjs(data.startDate), dayjs(data.endDate)]
      });
      setSelectedWorkflowId(data.workflowId);
      const wf = MOCK_WORKFLOWS.find(w => w.id === data.workflowId);
      if (wf) {
        setWorkflowSteps(wf.steps);
        // In view mode, allow clicking all steps
        if (isView) setMaxStepReached(wf.steps.length);
      }
    }
  }, [id, isNew, form, isView]);

  const handleWorkflowChange = (value: string) => {
    setSelectedWorkflowId(value);
    const wf = MOCK_WORKFLOWS.find(w => w.id === value);
    if (wf) {
      setWorkflowSteps(wf.steps);
    } else {
      setWorkflowSteps([]);
    }
  };

  const next = async () => {
    try {
      if (!isView) {
        await form.validateFields();
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStepChange = async (step: number) => {
    // If going back, just go
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // If going forward, check if step is "performed" (reached) or is the immediate next
    // But the user said: "nếu step đó chưa được thực hiện thì sẽ disable"
    // Usually means you can't click steps > maxStepReached + 1
    if (step <= maxStepReached || isView) {
      setCurrentStep(step);
    } else if (step === currentStep + 1) {
      // Allow clicking next step if current is valid
      await next();
    }
  };

  const onFinish = (values: any) => {
    message.success(isNew ? 'Đã tạo đợt khảo sát thành công!' : 'Đã cập nhật đợt khảo sát!');
    router.push('/survey/campaigns');
  };

  const totalSteps = workflowSteps.length + 1;

  const renderStepContent = (stepIndex: number) => {
    if (stepIndex === 0) {
      return (
        <div className="max-w-3xl mx-auto py-6">
          <Row gutter={24}>
            <Col span={24}>
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
                  {MOCK_PROGRAMS.map(p => (
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
                  {MOCK_WORKFLOWS.map(w => (
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

    const currentWfStep = workflowSteps[stepIndex - 1];
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
                <Text type="secondary" className="text-sm">{currentWfStep.description}</Text>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <Title level={5} className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-slate-400" />
                  Gán người phụ trách
                </Title>
                <Select 
                  mode="multiple" 
                  placeholder="Chọn người phụ trách bước này" 
                  className="w-full"
                  defaultValue={isView ? ['user-1'] : []}
                  disabled={isView}
                >
                  <Select.Option value="user-1">Nguyễn Văn A - Quản trị viên</Select.Option>
                  <Select.Option value="user-2">Trần Thị B - Trưởng bộ môn</Select.Option>
                  <Select.Option value="user-3">Lê Văn C - Giảng viên</Select.Option>
                </Select>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <Title level={5} className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Tài liệu/Biểu mẫu yêu cầu
                </Title>
                <Checkbox.Group className="flex flex-col gap-3" disabled={isView} defaultValue={isView ? ['doc-1'] : []}>
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
                <DatePicker className="w-full h-11 rounded-xl" disabled={isView} placeholder="Chọn ngày hạn chót" />
             </div>
          </div>
        </div>
      );
    }

    return <Empty description="Không có dữ liệu quy trình" />;
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
              {isNew ? 'Thiết lập Đợt Khảo sát mới' : (isView ? `Chi tiết: ${MOCK_CAMPAIGNS[id]?.name}` : `Chỉnh sửa: ${MOCK_CAMPAIGNS[id]?.name}`)}
            </Title>
            <Paragraph type="secondary" className="!mb-0 text-slate-500 font-medium">
              {isNew ? 'Khởi tạo đợt khảo sát và gán quy trình thực hiện' : 'Theo dõi và quản lý thông tin đợt khảo sát'}
            </Paragraph>
          </div>
        </div>
        {!isView && (
          <Button
            type="primary"
            icon={<Save size={18} />}
            onClick={() => form.submit()}
            className="rounded-xl px-8 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none transition-all"
          >
            Lưu dữ liệu
          </Button>
        )}
      </div>

      <Card className="shadow-sm border-slate-200 rounded-3xl overflow-hidden min-h-[600px]" styles={{ body: { padding: 0 } }}>
        <div className="px-12 pt-10 pb-8 bg-white border-b border-slate-50">
          <Steps 
            current={currentStep} 
            onChange={handleStepChange}
            className="premium-steps"
            items={[
              { 
                title: 'Thông tin chung',
                status: currentStep === 0 ? 'process' : 'wait'
              },
              ...workflowSteps.map((s, idx) => ({
                title: s.title,
                status: currentStep === idx + 1 ? 'process' : 'wait'
              }))
            ]}
          />
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} disabled={isView} className="px-12 py-2">
           {renderStepContent(currentStep)}
        </Form>

        <div className="p-8 border-t border-slate-100 flex justify-between bg-slate-50/30">
          <Button
            disabled={currentStep === 0}
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
              disabled={currentStep === 0 && !selectedWorkflowId}
            >
              Tiếp tục <ArrowRight size={16} />
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
