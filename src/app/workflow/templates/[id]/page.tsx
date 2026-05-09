'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import WorkflowDesigner from '@/components/ui/WorkflowDesigner';
import { 
  Typography, Card, Button, Space, Breadcrumb, Tag, 
  Divider, Form, Input, Row, Col, Modal, App as AntdApp, Switch 
} from 'antd';
import { 
  Save, Edit3, Eye, ArrowLeft, Download, Upload, 
  FileText, Code, Info, AlertCircle 
} from 'lucide-react';
import workflowService, { WorkflowTemplateResponse, WorkflowDraftResponse } from '@/services/workflowService';

const { Title, Paragraph, Text } = Typography;

const DEFAULT_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Bắt đầu" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export default function WorkflowEditorPage() {
  const { message, modal } = AntdApp.useApp();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  
  const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view');
  const [xml, setXml] = useState(DEFAULT_DIAGRAM);
  const [form] = Form.useForm();
  const [template, setTemplate] = useState<WorkflowTemplateResponse | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;

    const controller = new AbortController();
    const fetchTemplate = async () => {
      try {
        const data = await workflowService.getById(id, controller.signal);
        setTemplate(data);
        setXml(data.xmlContent);
        form.setFieldsValue({
          name: data.name,
          code: data.code,
          description: data.description,
          status: data.status,
          version: data.version || 1
        });
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        message.error('Không thể tải thông tin quy trình');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
    return () => controller.abort();
  }, [id, isNew, form]);

  const handleEditClick = async () => {
    if (isNew) {
      setMode('edit');
      return;
    }

    const currentCode = form.getFieldValue('code');
    const draft = await workflowService.getDraftByCode(currentCode);

    if (draft) {
      modal.confirm({
        title: 'Phát hiện bản nháp chưa lưu',
        icon: <AlertCircle className="text-orange-500" />,
        content: `Hệ thống tìm thấy một bản nháp được lưu lúc ${new Date(draft.lastSavedAt).toLocaleString()}. Bạn có muốn tiếp tục chỉnh sửa từ bản nháp này không?`,
        okText: 'Tiếp tục bản nháp',
        cancelText: 'Dùng bản chính thức',
        onOk: () => {
          setXml(draft.xmlContent);
          form.setFieldsValue({
            name: draft.name,
            code: draft.code,
            description: draft.description
          });
          setMode('edit');
          message.success('Đã tải bản nháp');
        },
        onCancel: () => {
          if (template) setXml(template.xmlContent);
          setMode('edit');
        },
      });
    } else {
      setMode('edit');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await workflowService.saveOfficial({
        ...values,
        xmlContent: xml,
        status: values.status || 'ACTIVE'
      });
      message.success('Đã lưu quy trình thành công');
      setMode('view');
      if (isNew) {
        router.push('/workflow/templates');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu quy trình');
    }
  };

  const handleStatusToggle = async (checked: boolean) => {
    if (!id || id === 'new') return;
    try {
      const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
      await workflowService.updateStatus(id, newStatus);
      form.setFieldsValue({ status: newStatus });
      message.success(`Đã chuyển trạng thái thành ${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}`);
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleXmlChange = useCallback((newXml: string) => {
    setXml(newXml);
  }, []);

  const watchedName = Form.useWatch('name', form);
  const watchedCode = Form.useWatch('code', form);
  const watchedDescription = Form.useWatch('description', form);
  const watchedStatus = Form.useWatch('status', form);
  const watchedVersion = Form.useWatch('version', form);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <Breadcrumb
            items={[
              { title: 'Trang chủ', href: '/' },
              { title: 'Quy trình', href: '/workflow/templates' },
              { title: 'Mẫu quy trình', href: '/workflow/templates' },
              { title: isNew ? 'Tạo mới' : id },
            ]}
          />

          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <Button 
                icon={<ArrowLeft size={18} />} 
                type="text" 
                onClick={() => router.push('/workflow/templates')}
                className="hover:bg-slate-100"
              />
              <div>
                <div className="flex items-center gap-3">
                  <Title level={2} className="!mb-0 !text-slate-800">
                    {isNew ? 'Thiết kế Quy trình mới' : `Quy trình: ${watchedName || '...'} - ${watchedCode || '...'}`}
                  </Title>
                </div>
                <div className="flex items-center gap-2">
                  {!isNew && (
                    <Tag 
                      color={mode === 'edit' ? 'orange' : 'blue'} 
                      className="rounded-full px-2 text-[10px] uppercase font-bold m-0 border-none"
                      style={{ background: mode === 'edit' ? '#fff7ed' : '#eff6ff', color: mode === 'edit' ? '#c2410c' : '#1d4ed8' }}
                    >
                      {mode === 'edit' ? 'Đang chỉnh sửa' : 'Chế độ xem'}
                    </Tag>
                  )}
                  <Paragraph type="secondary" className="!mb-0 text-slate-500">
                    {isNew ? 'Khởi tạo luồng nghiệp vụ và phân quyền các bước' : 'Xem và điều chỉnh cấu hình luồng nghiệp vụ hiện tại'}
                  </Paragraph>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isNew && (
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 h-10">
                  <span className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap">Trạng thái:</span>
                  <Switch 
                    size="small" 
                    checked={(watchedStatus || 'ACTIVE').toUpperCase() === 'ACTIVE'} 
                    onChange={handleStatusToggle}
                  />
                  <Tag 
                    color={(watchedStatus || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'success' : 'error'}
                    className="border-none m-0 text-[10px] font-bold uppercase rounded-md"
                  >
                    {(watchedStatus || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                {mode === 'edit' ? (
                  <>
                    <Button 
                      type="primary"
                      icon={<Save size={18} />} 
                      onClick={handleSave}
                      className="rounded-xl px-8 h-11 font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 border-none"
                    >
                      Lưu Quy trình
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="primary" 
                    icon={<Edit3 size={18} />} 
                    onClick={handleEditClick}
                    className="rounded-xl px-8 h-11 font-medium bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 border-none"
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card 
              title={<Space><FileText size={18} className="text-blue-500" /><span>Thông tin cơ bản</span></Space>}
              className="shadow-sm border-slate-200 rounded-2xl"
            >
              <Form 
                form={form} 
                layout="vertical" 
                disabled={mode === 'view'}
                initialValues={{
                  name: '',
                  code: '',
                  description: '',
                  status: 'ACTIVE',
                  version: 1
                }}
              >
                {/* Hidden status field to keep it in form state */}
                <Form.Item name="status" hidden><Input /></Form.Item>
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item 
                      label={<Text strong>Tên quy trình</Text>} 
                      name="name" 
                      rules={[{ required: true, message: 'Nhập tên quy trình' }]}
                    >
                      <Input placeholder="VD: Quy trình Phê duyệt Đề tài" className="h-10 rounded-lg" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label={<Text strong>Mã quy trình (Unique ID)</Text>} 
                      name="code" 
                      rules={[{ required: true, message: 'Nhập mã định danh' }]}
                    >
                      <Input placeholder="VD: APPROVE_TOPIC_001" className="h-10 rounded-lg font-mono" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label={<Text strong>Phiên bản</Text>} name="version">
                      <Input disabled className="h-10 rounded-lg bg-slate-50 font-bold text-blue-600" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={<Text strong>Mô tả chi tiết</Text>} name="description">
                      <Input.TextArea rows={2} placeholder="Mô tả mục đích và phạm vi áp dụng của quy trình..." className="rounded-lg" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>

          <Col span={24}>
            <Card 
              className="shadow-sm border-slate-200 rounded-2xl overflow-hidden"
              styles={{ body: { padding: 0 } }}
            >
              <div className="h-[750px]">
                <WorkflowDesigner 
                  key={id}
                  initialXml={xml} 
                  onChange={handleXmlChange} 
                  onSave={(newXml: React.SetStateAction<string>) => {
                    setXml(newXml);
                    setMode('view');
                  }}
                  readOnly={mode === 'view'} 
                  workflowCode={watchedCode}
                  workflowName={watchedName}
                  workflowDescription={watchedDescription}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .workflow-segmented.ant-segmented {
          background: transparent;
        }
        .workflow-segmented .ant-segmented-item-selected {
          background: #ffffff !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
          color: #4f46e5 !important;
          font-weight: 600;
        }
      `}</style>
    </AppShell>
  );
}
