'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Cpu, Plus, Trash2, CheckCircle2, XCircle, RefreshCw, 
  ExternalLink, Sparkles, ShieldCheck, Zap, Globe 
} from 'lucide-react';
import { 
  Card, Table, Button, Tag, Modal, Form, Input, Select, 
  Switch, Slider, Typography, App, Popconfirm, Tooltip, Space, Badge 
} from 'antd';
import { 
  userAiService, 
  UserAiCredential, 
  UserAiModelConfig, 
  AiProvider 
} from '@/services/userAiService';

const { Title, Text, Paragraph } = Typography;

const PROVIDER_OPTIONS = [
  { value: 'GEMINI', label: 'Google Gemini', color: 'blue' },
  { value: 'OPENAI', label: 'OpenAI (GPT-4o / GPT-4o-mini)', color: 'green' },
  { value: 'ANTHROPIC', label: 'Anthropic Claude', color: 'purple' },
  { value: 'DEEPSEEK', label: 'DeepSeek', color: 'cyan' },
  { value: 'CUSTOM', label: 'Custom (Ollama / Local / Proxy)', color: 'orange' },
];

const TASK_TYPES = [
  { value: 'DEFAULT', label: 'Tác vụ chung (Mặc định)' },
  { value: 'SYLLABUS', label: 'Đề cương chi tiết (Syllabus)' },
  { value: 'CLO', label: 'Chuẩn đầu ra học phần (CLO)' },
  { value: 'PEO', label: 'Mục tiêu chương trình (PEO)' },
  { value: 'PLO', label: 'Chuẩn đầu ra chương trình (PLO)' },
  { value: 'COURSE_DESCRIPTION', label: 'Mô tả tổng quan học phần' },
  { value: 'ASSESSMENT', label: 'Phương pháp đánh giá' },
];

const PRESET_MODELS: Record<string, string[]> = {
  GEMINI: ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  OPENAI: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o3-mini'],
  ANTHROPIC: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  DEEPSEEK: ['deepseek-chat', 'deepseek-reasoner'],
  CUSTOM: ['llama3.2', 'qwen2.5', 'deepseek-r1'],
};

export default function AiSettingsSection() {
  const { message } = App.useApp();
  const [credentials, setCredentials] = useState<UserAiCredential[]>([]);
  const [modelConfigs, setModelConfigs] = useState<UserAiModelConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Credential
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<UserAiCredential | null>(null);
  const [savingCred, setSavingCred] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [form] = Form.useForm();
  const selectedProvider = Form.useWatch('provider', form);

  // Model Config Modal
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [modelForm] = Form.useForm();
  const selectedCredentialId = Form.useWatch('credentialId', modelForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [creds, models] = await Promise.all([
        userAiService.getCredentials(),
        userAiService.getModelConfigs(),
      ]);
      setCredentials(creds || []);
      setModelConfigs(models || []);
    } catch (err: any) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingCred(null);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({ provider: 'GEMINI', active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (cred: UserAiCredential) => {
    setEditingCred(cred);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({
      provider: cred.provider,
      keyAlias: cred.keyAlias,
      baseUrl: cred.baseUrl,
      active: cred.active,
    });
    setIsModalOpen(true);
  };

  const handleTestConnection = async () => {
    const values = form.getFieldsValue();
    if (!values.apiKey && !editingCred) {
      message.warning('Vui lòng nhập API Key để kiểm tra');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await userAiService.testConnection({
        provider: values.provider,
        apiKey: values.apiKey,
        credentialId: editingCred?.id,
        baseUrl: values.baseUrl,
      });
      if (res.success) {
        setTestResult({
          success: true,
          msg: `${res.message} (Độ trễ: ${res.latencyMs || 0}ms)` + 
               (res.availableModels?.length ? ` - ${res.availableModels.length} models sẵn sàng` : ''),
        });
      } else {
        setTestResult({ success: false, msg: res.message });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Lỗi kết nối' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCredential = async (values: any) => {
    setSavingCred(true);
    try {
      if (editingCred) {
        await userAiService.updateCredential(editingCred.id, values);
        message.success('Cập nhật API Key thành công');
      } else {
        await userAiService.createCredential(values);
        message.success('Thêm API Key mới thành công');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Không thể lưu API Key');
    } finally {
      setSavingCred(false);
    }
  };

  const handleDeleteCred = async (id: number) => {
    try {
      await userAiService.deleteCredential(id);
      message.success('Đã xóa API Key');
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa API Key');
    }
  };

  const openAddModelConfig = (initialTaskType?: string) => {
    modelForm.resetFields();
    modelForm.setFieldsValue({
      taskType: initialTaskType || 'DEFAULT',
      modelName: 'gemini-2.0-flash-lite',
      temperature: 0.5,
      maxTokens: 4096,
      active: true,
    });
    setIsModelModalOpen(true);
  };

  const handleSaveModelConfig = async (values: any) => {
    setSavingModel(true);
    try {
      await userAiService.saveModelConfig(values);
      message.success('Lưu cấu hình mô hình thành công');
      setIsModelModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingModel(false);
    }
  };

  const handleDeleteModelConfig = async (id: number) => {
    try {
      await userAiService.deleteModelConfig(id);
      message.success('Đã xóa cấu hình mô hình');
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa cấu hình');
    }
  };

  const credColumns = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'provider',
      key: 'provider',
      render: (p: AiProvider) => {
        const opt = PROVIDER_OPTIONS.find(o => o.value === p);
        return <Tag color={opt?.color || 'default'} className="font-medium px-2.5 py-0.5">{opt?.label || p}</Tag>;
      },
    },
    {
      title: 'Tên gợi nhớ',
      dataIndex: 'keyAlias',
      key: 'keyAlias',
      render: (text: string) => <span className="font-semibold text-slate-800">{text}</span>,
    },
    {
      title: 'API Key (Đã mã hóa)',
      dataIndex: 'maskedKey',
      key: 'maskedKey',
      render: (masked: string) => (
        <code className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono">{masked}</code>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        active ? <Badge status="success" text="Đang dùng" /> : <Badge status="default" text="Vô hiệu" />
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: UserAiCredential) => (
        <Space size="small">
          <Button size="small" onClick={() => openEditModal(record)}>Sửa</Button>
          <Popconfirm
            title="Xóa API Key"
            description="Bạn có chắc chắn muốn xóa key này? Các tác vụ sẽ chuyển về key mặc định của hệ thống."
            onConfirm={() => handleDeleteCred(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<Trash2 className="w-3.5 h-3.5" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modelColumns = [
    {
      title: 'Loại tác vụ',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (t: string) => {
        const item = TASK_TYPES.find(x => x.value === t);
        return <Tag color="geekblue" className="font-medium">{item?.label || t}</Tag>;
      },
    },
    {
      title: 'Mô hình (Model)',
      dataIndex: 'modelName',
      key: 'modelName',
      render: (m: string) => <span className="font-mono text-xs font-bold text-slate-700">{m}</span>,
    },
    {
      title: 'Khóa API sử dụng',
      dataIndex: 'credentialAlias',
      key: 'credentialAlias',
      render: (alias: string) => (
        <span className="text-slate-600 text-xs">{alias || 'Mặc định hệ thống'}</span>
      ),
    },
    {
      title: 'Nhiệt độ (Temp)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (temp: number) => <span className="text-slate-600">{temp ?? 0.5}</span>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: UserAiModelConfig) => (
        <Popconfirm
          title="Xóa cấu hình mô hình này?"
          onConfirm={() => handleDeleteModelConfig(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button size="small" type="text" danger icon={<Trash2 className="w-3.5 h-3.5" />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Alert Card */}
      <Card className="border-blue-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <Title level={4} className="!mb-1 !text-slate-800">Cấu hình API Key & Mô hình AI cá nhân (BYOK)</Title>
            <Paragraph className="!mb-0 text-slate-600 text-sm">
              Tính năng cho phép bạn sử dụng API Key cá nhân từ Google Gemini, OpenAI, Anthropic hoặc Local LLM. 
              API Key được bảo vệ bằng mã hóa <strong>AES-256-GCM</strong> và giải mã trực tiếp trong luồng gọi API.
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Section 1: API Keys */}
      <Card 
        className="shadow-sm border-slate-200"
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-edu-primary" />
            <span className="font-bold text-slate-800">Danh sách API Key cá nhân</span>
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<Plus className="w-4 h-4" />} 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 font-medium"
          >
            Thêm API Key
          </Button>
        }
      >
        <Table 
          columns={credColumns} 
          dataSource={credentials} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Chưa có API Key cá nhân nào. Hệ thống đang sử dụng Key mặc định.' }}
        />
      </Card>

      {/* Section 2: Model Configs */}
      <Card 
        className="shadow-sm border-slate-200"
        title={
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-edu-primary" />
            <span className="font-bold text-slate-800">Tùy biến Mô hình cho từng tác vụ</span>
          </div>
        }
        extra={
          <Button 
            icon={<Plus className="w-4 h-4" />} 
            onClick={() => openAddModelConfig()}
            className="font-medium"
          >
            Gán mô hình cho tác vụ
          </Button>
        }
      >
        <Table 
          columns={modelColumns} 
          dataSource={modelConfigs} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Chưa có cấu hình riêng cho tác vụ. Mọi tác vụ sẽ chạy với mô hình tiêu chuẩn.' }}
        />
      </Card>

      {/* Modal Add/Edit Credential */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span className="font-bold">{editingCred ? 'Chỉnh sửa API Key' : 'Thêm API Key cá nhân'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCredential} className="mt-4">
          <Form.Item 
            name="provider" 
            label="Nhà cung cấp (Provider)" 
            rules={[{ required: true }]}
          >
            <Select options={PROVIDER_OPTIONS} />
          </Form.Item>

          <Form.Item 
            name="keyAlias" 
            label="Tên gợi nhớ" 
            rules={[{ required: true, message: 'Vui lòng nhập tên gợi nhớ' }]}
          >
            <Input placeholder="Ví dụ: Gemini Pro Cá Nhân, OpenAI VIP" />
          </Form.Item>

          <Form.Item 
            name="apiKey" 
            label={editingCred ? "API Key (Để trống nếu không muốn đổi key)" : "API Key"} 
            rules={editingCred ? [] : [{ required: true, message: 'Vui lòng nhập API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          {(selectedProvider === 'CUSTOM' || selectedProvider === 'DEEPSEEK') && (
            <Form.Item name="baseUrl" label="Custom Base URL (Tùy chọn)">
              <Input placeholder="https://api.deepseek.com/v1 hoặc http://localhost:11434/v1" />
            </Form.Item>
          )}

          <Form.Item name="active" label="Kích hoạt sử dụng" valuePropName="checked">
            <Switch />
          </Form.Item>

          {/* Test Connection Button & Result */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Kiểm tra hợp lệ trước khi lưu:</span>
              <Button 
                size="small" 
                icon={<RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />}
                loading={testingConnection}
                onClick={handleTestConnection}
              >
                Kiểm tra kết nối
              </Button>
            </div>
            {testResult && (
              <div className={`mt-2 p-2 rounded text-xs flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={savingCred} className="bg-blue-600 hover:bg-blue-700">
              Lưu API Key
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Add/Edit Model Config */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="font-bold">Cấu hình mô hình cho tác vụ</span>
          </div>
        }
        open={isModelModalOpen}
        onCancel={() => setIsModelModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={modelForm} layout="vertical" onFinish={handleSaveModelConfig} className="mt-4">
          <Form.Item name="taskType" label="Loại tác vụ" rules={[{ required: true }]}>
            <Select options={TASK_TYPES} />
          </Form.Item>

          <Form.Item name="credentialId" label="API Key sử dụng">
            <Select 
              allowClear 
              placeholder="Chọn API Key (Để trống = Dùng default hệ thống)"
              options={credentials.map(c => ({
                value: c.id,
                label: `${c.keyAlias} (${c.provider})`
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="modelName" 
            label="Tên Mô hình (Model Name)" 
            rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập tên mô hình' }]}
          >
            <Select 
              showSearch 
              allowClear
              placeholder="Chọn mô hình đề xuất hoặc nhập tên"
              options={[
                ...PRESET_MODELS['GEMINI'].map(m => ({ value: m, label: `${m} (Google)` })),
                ...PRESET_MODELS['OPENAI'].map(m => ({ value: m, label: `${m} (OpenAI)` })),
                ...PRESET_MODELS['DEEPSEEK'].map(m => ({ value: m, label: `${m} (DeepSeek)` })),
              ]}
            />
          </Form.Item>

          <Form.Item name="temperature" label="Nhiệt độ sáng tạo (Temperature: 0.0 - 1.0)">
            <Slider min={0.0} max={1.0} step={0.1} />
          </Form.Item>

          <Form.Item name="maxTokens" label="Độ dài tối đa (Max Output Tokens)">
            <Select options={[
              { value: 2048, label: '2,048 tokens' },
              { value: 4096, label: '4,096 tokens (Chuẩn)' },
              { value: 8192, label: '8,192 tokens (Dài)' },
            ]} />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModelModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={savingModel} className="bg-blue-600 hover:bg-blue-700">
              Lưu cấu hình
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
