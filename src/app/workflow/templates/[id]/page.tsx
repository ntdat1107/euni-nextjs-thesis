'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import WorkflowDesigner from '@/components/ui/WorkflowDesigner';
import {
  Typography, Card, Button, Space, Breadcrumb, Tag,
  Divider, Form, Input, Row, Col, Modal, App as AntdApp, Switch,
  Tabs, Table
} from 'antd';
import {
  Save, Edit3, Eye, ArrowLeft, Download, Upload,
  FileText, Code, Info, AlertCircle, History, Clock
} from 'lucide-react';
import workflowService, { WorkflowTemplateResponse, WorkflowDraftResponse } from '@/services/workflowService';

const { Title, Paragraph, Text } = Typography;

const DEFAULT_FLOW = JSON.stringify({
  type: 'linear',
  steps: [],
  nodes: [],
  edges: []
});

export default function WorkflowEditorPage() {
  const { message, modal } = AntdApp.useApp();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view');
  const [flowData, setFlowData] = useState(DEFAULT_FLOW);
  const [form] = Form.useForm();
  const [template, setTemplate] = useState<WorkflowTemplateResponse | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [history, setHistory] = useState<WorkflowTemplateResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'history'>('design');

  const isHistoryView = !!(template && !template.isActive);

  const fetchTemplate = useCallback(async (signal?: AbortSignal) => {
    if (isNew) return;
    setLoading(true);
    
    try {
      const data = await workflowService.getById(id, signal);
      setTemplate(data);
      setFlowData(data.jsonContent);
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
  }, [id, isNew, form, message]);

  const fetchHistory = useCallback(async () => {
    if (isNew) return;
    setLoadingHistory(true);
    try {
      const data = await workflowService.getHistory(id);
      setHistory(data);
    } catch (error) {
      message.error('Không thể tải lịch sử quy trình');
    } finally {
      setLoadingHistory(false);
    }
  }, [id, isNew, message]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTemplate(controller.signal);
    return () => controller.abort();
  }, [fetchTemplate]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

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
          setFlowData(draft.jsonContent);
          form.setFieldsValue({
            name: draft.name,
            code: draft.code,
            description: draft.description
          });
          setMode('edit');
          message.success('Đã tải bản nháp');
        },
        onCancel: () => {
          if (template) setFlowData(template.jsonContent);
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
      const result = await workflowService.saveOfficial({
        ...values,
        jsonContent: flowData,
        status: values.status || 'ACTIVE'
      });
      message.success('Đã lưu quy trình thành công');
      
      if (isNew) {
        router.push('/workflow/templates');
      } else {
        // Cập nhật URL sang ID mới (vì backend tạo record mới cho mỗi version)
        if (result.id !== id) {
          router.replace(`/workflow/templates/${result.id}`);
        }
        
        // Cập nhật state local ngay lập tức từ kết quả trả về
        setTemplate(result);
        setFlowData(result.jsonContent);
        form.setFieldsValue({
          name: result.name,
          code: result.code,
          description: result.description,
          status: result.status,
          version: result.version || 1
        });
        setMode('view');
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

  const handleFlowChange = useCallback((newData: string) => {
    setFlowData(newData);
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
                    {isNew ? 'Thiết kế Quy trình mới' : `Quy trình: ${watchedName || '...'} - ${watchedCode || '...'} (v${watchedVersion || '1'})`}
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
                    disabled={isHistoryView}
                    className={`rounded-xl px-8 h-11 font-medium ${isHistoryView ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'} border-none`}
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isHistoryView && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
              <div className="bg-amber-100 p-2 rounded-xl">
                <Clock className="text-amber-600" size={20} />
              </div>
              <div className="flex-1">
                <Text strong className="text-amber-900 block text-sm">Chế độ xem lịch sử (Read-only)</Text>
                <Text className="text-amber-700 text-xs">Bạn đang xem phiên bản v{template?.version} đã cũ. Mọi thay đổi đều không được phép ở chế độ này.</Text>
              </div>
              <Button 
                type="primary" 
                size="small" 
                className="bg-amber-600 border-none rounded-lg"
                onClick={() => router.push(`/workflow/templates`)}
              >
                Quay lại danh sách
              </Button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden" styles={{ body: { padding: '0 24px 24px 24px' } }}>
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as any)}
                className="workflow-tabs"
                items={[
                  {
                    key: 'design',
                    label: (
                      <Space className="py-2">
                        <FileText size={18} className="text-blue-500" />
                        <span>Thông tin cơ bản</span>
                      </Space>
                    ),
                    children: (
                      <div className="pt-4">
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
                          <Form.Item name="status" hidden><Input /></Form.Item>
                          <Row gutter={24}>
                            <Col span={8}>
                              <Form.Item
                                label={<Text strong className="text-slate-600">Tên quy trình</Text>}
                                name="name"
                                rules={[{ required: true, message: 'Nhập tên quy trình' }]}
                              >
                                <Input placeholder="VD: Quy trình Phê duyệt Đề tài" className="h-11 rounded-xl bg-slate-50/50 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all" />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                label={<Text strong className="text-slate-600">Mã quy trình (Unique ID)</Text>}
                                name="code"
                                rules={[{ required: true, message: 'Nhập mã định danh' }]}
                              >
                                <Input placeholder="VD: APPROVE_TOPIC_001" className="h-11 rounded-xl bg-slate-50/50 border-slate-200 font-mono text-blue-700 hover:border-blue-400 focus:border-blue-500 transition-all" />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item label={<Text strong className="text-slate-600">Phiên bản hiện tại</Text>} name="version">
                                <Input disabled className="h-11 rounded-xl bg-slate-100 border-none font-bold text-blue-600 px-4" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item label={<Text strong className="text-slate-600">Mô tả chi tiết</Text>} name="description" className="!mb-0">
                                <Input.TextArea rows={3} placeholder="Mô tả mục đích và phạm vi áp dụng của quy trình..." className="rounded-xl bg-slate-50/50 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all p-3" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form>
                      </div>
                    ),
                  },
                  ...(!isHistoryView && !isNew && mode === 'view' ? [{
                    key: 'history',
                    label: (
                      <Space className="py-2">
                        <History size={18} className="text-orange-500" />
                        <span>Lịch sử phiên bản</span>
                      </Space>
                    ),
                    children: (
                      <div className="pt-4">
                        <Table
                          loading={loadingHistory}
                          dataSource={history}
                          rowKey="id"
                          pagination={{ 
                            pageSize: 5,
                            showSizeChanger: false,
                            className: "mt-4"
                          }}
                          size="middle"
                          className="history-table"
                          columns={[
                            {
                              title: 'Phiên bản',
                              dataIndex: 'version',
                              key: 'version',
                              render: (v) => <Tag color="blue" className="rounded-lg px-3 font-bold m-0">v{v}</Tag>,
                              width: 120,
                            },
                            {
                              title: 'Tên quy trình',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text) => <Text strong className="text-slate-700">{text}</Text>
                            },
                            {
                              title: 'Trạng thái',
                              dataIndex: 'isActive',
                              key: 'isActive',
                              render: (isActive, record) => (
                                <Space>
                                  {isActive ? (
                                    <Tag color="success" className="border-none rounded-full px-3 uppercase text-[10px] font-bold">Current</Tag>
                                  ) : (
                                    <Tag className="border-none bg-slate-100 text-slate-500 rounded-full px-3 uppercase text-[10px] font-bold">History</Tag>
                                  )}
                                  {record.status === 'INACTIVE' && <Tag color="error" className="border-none rounded-full px-3 uppercase text-[10px] font-bold">Inactive</Tag>}
                                </Space>
                              ),
                            },
                            {
                              title: 'Thời gian cập nhật',
                              dataIndex: 'updatedAt',
                              key: 'updatedAt',
                              render: (date) => (
                                <Space size={4} className="text-slate-500">
                                  <Clock size={14} />
                                  <span>{new Date(date).toLocaleString('vi-VN')}</span>
                                </Space>
                              ),
                            },
                            {
                              title: 'Thao tác',
                              key: 'actions',
                              width: 100,
                              align: 'center',
                              render: (_, record) => (
                                <Button 
                                  size="small" 
                                  type="text"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center justify-center w-full"
                                  icon={<Eye size={16} />}
                                  onClick={() => router.push(`/workflow/templates/${record.id}`)}
                                >
                                  Xem
                                </Button>
                              ),
                            },
                          ]}
                        />
                      </div>
                    ),
                  }
                ] : [])
              ]}
            />
            </Card>
          </Col>

          <Col span={24}>
            <Card
              className="shadow-sm border-slate-200 rounded-2xl overflow-hidden"
              styles={{ body: { padding: 0 } }}
              title={
                <Space>
                  <Code size={18} className="text-indigo-500" />
                  <span>Thiết kế luồng nghiệp vụ</span>
                </Space>
              }
            >
              <div className="h-[750px]">
                <WorkflowDesigner
                  key={id}
                  initialData={flowData}
                  onChange={handleFlowChange}
                  onSave={(newData: string) => {
                    setFlowData(newData);
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
        .workflow-tabs.ant-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #f1f5f9;
        }
        .workflow-tabs.ant-tabs .ant-tabs-tab {
          margin: 0 12px 0 0 !important;
          padding: 16px 8px !important;
        }
        .workflow-tabs.ant-tabs .ant-tabs-tab-btn {
          color: #64748b;
          font-weight: 500;
          transition: all 0.2s;
        }
        .workflow-tabs.ant-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #3b82f6 !important;
          font-weight: 600;
        }
        .workflow-tabs.ant-tabs .ant-tabs-ink-bar {
          height: 3px !important;
          border-radius: 3px 3px 0 0;
          background: #3b82f6 !important;
        }
        
        .history-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }
        .history-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
        .history-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9/30 !important;
        }

        /* Custom style for disabled inputs to look readable */
        .ant-input[disabled], .ant-input-affix-wrapper-disabled, .ant-select-disabled .ant-select-selector {
          background-color: #f8fafc !important;
          color: #334155 !important;
          border-color: #e2e8f0 !important;
          cursor: default !important;
          opacity: 1 !important;
        }
        .ant-form-item-label > label {
          color: #64748b !important;
        }
      `}</style>
    </AppShell>
  );
}
