'use client';

import React, { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  App,
  Tooltip,
  Switch,
  Drawer,
  Segmented,
} from 'antd';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit3,
  Bot,
  FileCode2,
  Sparkles,
  Info,
  Layers,
  Eye,
  LayoutGrid,
  List,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAiPromptTemplates } from '@/hooks/useAiPromptTemplates';
import { AiPromptTemplate } from '@/services/aiPromptTemplateService';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SYSTEM_DEFAULT_CODES = [
  'BASE_SYSTEM',
  'PEO',
  'CLO',
  'PLO',
  'SYLLABUS',
  'COURSE_DESCRIPTION',
  'PREREQUISITES',
  'ASSESSMENT',
  'DEFAULT',
];

function AiPromptManagementContent() {
  const {
    templates = [],
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    toggleActive,
    deleteTemplate,
  } = useAiPromptTemplates();
  const { message, modal } = App.useApp();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AiPromptTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AiPromptTemplate | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Statistics
  const totalCount = templates.length;
  const activeCount = templates.filter((t) => t.active).length;
  const inactiveCount = templates.filter((t) => !t.active).length;
  const systemCount = templates.filter((t) => SYSTEM_DEFAULT_CODES.includes(t.code)).length;

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        t.code.toLowerCase().includes(searchText.toLowerCase()) ||
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchText.toLowerCase())) ||
        t.templateContent.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? t.active
          : !t.active;

      return matchSearch && matchStatus;
    });
  }, [templates, searchText, statusFilter]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      active: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (template: AiPromptTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      code: template.code,
      name: template.name,
      description: template.description,
      templateContent: template.templateContent,
      active: template.active,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmitForm = async (values: any) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, values);
      } else {
        await createTemplate(values);
      }
      setIsDrawerOpen(false);
      form.resetFields();
      setEditingTemplate(null);
    } catch (e) {}
  };

  const handleDelete = (template: AiPromptTemplate) => {
    if (SYSTEM_DEFAULT_CODES.includes(template.code)) {
      message.warning(`Prompt '${template.code}' là mặc định của hệ thống, chỉ cho phép chỉnh sửa hoặc tạm tắt, không thể xóa.`);
      return;
    }

    modal.confirm({
      title: `Xóa mẫu Prompt '${template.code}'?`,
      content: 'Hành động này sẽ đánh dấu xóa mẫu prompt này.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteTemplate(template.id);
      },
    });
  };

  const handleCopyContent = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    message.success(`Đã sao chép nội dung prompt '${code}'!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Compact Table Columns
  const columns = useMemo(
    () => [
      {
        title: 'Mã & Tên Template',
        key: 'templateInfo',
        render: (_: any, record: AiPromptTemplate) => {
          const isSystem = SYSTEM_DEFAULT_CODES.includes(record.code);
          return (
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded text-xs tracking-wide">
                  {record.code}
                </span>
                {isSystem && (
                  <Tag color="purple" className="rounded-full px-2 py-0 text-[10px] font-bold border-0">
                    Mặc định hệ thống
                  </Tag>
                )}
              </div>
              <span className="font-bold text-slate-900 text-sm">{record.name}</span>
            </div>
          );
        },
      },
      {
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
        render: (desc: string) => (
          <span className="text-xs text-slate-500 line-clamp-2">{desc || 'Chưa có mô tả'}</span>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'active',
        key: 'active',
        width: 140,
        render: (active: boolean, record: AiPromptTemplate) => (
          <div className="flex items-center gap-2">
            <Switch
              size="small"
              checked={active}
              onChange={() => toggleActive(record.id)}
            />
            {active ? (
              <Tag color="success" icon={<CheckCircle2 className="w-3 h-3" />} className="rounded-full px-2 font-bold border-0 text-[11px]">
                Đang bật
              </Tag>
            ) : (
              <Tag color="default" icon={<XCircle className="w-3 h-3" />} className="rounded-full px-2 font-bold border-0 text-[11px] text-slate-400">
                Tắt
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 130,
        align: 'right' as const,
        render: (_: any, record: AiPromptTemplate) => {
          const isSystem = SYSTEM_DEFAULT_CODES.includes(record.code);
          return (
            <Space size="small">
              <Tooltip title="Xem chi tiết prompt">
                <Button
                  type="text"
                  icon={<Eye className="w-4 h-4 text-slate-600" />}
                  onClick={() => setPreviewTemplate(record)}
                  className="hover:bg-slate-100 rounded-lg p-1.5"
                />
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  icon={<Edit3 className="w-4 h-4 text-blue-600" />}
                  onClick={() => handleOpenEdit(record)}
                  className="hover:bg-blue-50 rounded-lg p-1.5"
                />
              </Tooltip>
              {isSystem ? (
                <Tooltip title="Prompt mặc định hệ thống - Chỉ cho phép chỉnh sửa, không thể xóa">
                  <Button
                    type="text"
                    disabled
                    icon={<Trash2 className="w-4 h-4 text-slate-300" />}
                    className="opacity-40 cursor-not-allowed p-1.5"
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Xóa template tùy chỉnh">
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(record)}
                    className="hover:bg-rose-50 rounded-lg p-1.5"
                  />
                </Tooltip>
              )}
            </Space>
          );
        },
      },
    ],
    [toggleActive]
  );

  if (isLoading) {
    return <TableSkeleton rows={8} columns={4} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 shadow-sm shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <Title level={2} className="!mb-0 font-display tracking-tight text-xl sm:text-2xl">
                Quản lý AI Prompt Templates
              </Title>
              <Text className="text-slate-500 font-medium text-xs sm:text-sm block">
                Cấu hình hướng dẫn và quy tắc định dạng HTML cho Gemini AI trong các biểu mẫu khảo sát & đề cương.
              </Text>
            </div>
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
          className="h-10 px-5 shadow-md shadow-brand-100 btn-hover-effect flex items-center gap-2 font-medium"
        >
          Thêm Prompt Template
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="card-premium p-4">
            <Statistic
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Tổng số Template</span>}
              value={totalCount}
              prefix={<Layers className="w-4 h-4 mr-1.5 text-slate-400 inline" />}
              formatter={(val) => <span className="font-outfit font-extrabold text-lg">{val}</span>}
              styles={{ content: { color: '#0f172a' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="card-premium p-4">
            <Statistic
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Đang kích hoạt</span>}
              value={activeCount}
              prefix={<Sparkles className="w-4 h-4 mr-1.5 text-emerald-500 inline" />}
              formatter={(val) => <span className="font-outfit font-extrabold text-lg">{val}</span>}
              styles={{ content: { color: '#059669' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="card-premium p-4">
            <Statistic
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Đã tạm tắt</span>}
              value={inactiveCount}
              formatter={(val) => <span className="font-outfit font-extrabold text-lg">{val}</span>}
              styles={{ content: { color: '#64748b' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="card-premium p-4">
            <Statistic
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Mặc định hệ thống</span>}
              value={systemCount}
              formatter={(val) => <span className="font-outfit font-extrabold text-lg">{val}</span>}
              styles={{ content: { color: '#7c3aed' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Toolbar: Search, Filters & View Mode */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-lg">
          <Input
            placeholder="Tìm kiếm mã, tên, nội dung prompt..."
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-xl h-10"
            allowClear
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-40 h-10 rounded-xl"
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang kích hoạt' },
              { value: 'INACTIVE', label: 'Đã tạm tắt' },
            ]}
          />

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'TABLE' | 'GRID')}
            options={[
              {
                value: 'TABLE',
                icon: <List className="w-4 h-4 inline" />,
                label: 'Bảng',
              },
              {
                value: 'GRID',
                icon: <LayoutGrid className="w-4 h-4 inline" />,
                label: 'Thẻ',
              },
            ]}
            className="p-1 bg-slate-100 rounded-xl"
          />

          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchTemplates}
            type="text"
            className="rounded-xl h-10 hover:bg-slate-100"
          />
        </div>
      </div>

      {/* VIEW MODE 1: COMPACT TABLE (DEFAULT VIEW MODE) */}
      {viewMode === 'TABLE' && (
        <Card className="card-premium overflow-hidden" styles={{ body: { padding: 0 } }}>
          <Table
            dataSource={filteredTemplates}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              className: 'px-6 py-4',
            }}
            expandable={{
              expandIcon: ({ expanded, onExpand, record }) => (
                <button
                  type="button"
                  onClick={(e) => onExpand(record, e)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-all duration-200 flex items-center justify-center"
                  title={expanded ? 'Thu gọn' : 'Xem nội dung prompt'}
                >
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform duration-200 text-slate-500',
                      expanded && 'rotate-90 text-brand-600 font-bold'
                    )}
                  />
                </button>
              ),
              expandedRowRender: (record) => (
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-800 my-2">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-sans text-xs flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-brand-400" /> Nội dung Prompt ({record.code}):
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={copiedCode === record.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      onClick={() => handleCopyContent(record.templateContent, record.code)}
                      className="text-slate-300 hover:bg-slate-800"
                    >
                      Sao chép
                    </Button>
                  </div>
                  {record.templateContent}
                </div>
              ),
              rowExpandable: (record) => true,
            }}
            className="ant-table-custom"
          />
        </Card>
      )}

      {/* VIEW MODE 2: GRID CARDS */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200/80">
              <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Không tìm thấy mẫu AI Prompt nào phù hợp.</p>
            </div>
          ) : (
            filteredTemplates.map((item) => {
              const isSystem = SYSTEM_DEFAULT_CODES.includes(item.code);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    'card-premium flex flex-col justify-between transition-all duration-200 hover:shadow-md border-slate-200/80',
                    !item.active && 'opacity-75 bg-slate-50/50'
                  )}
                  styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200/80 px-2.5 py-1 rounded-lg text-xs tracking-wide">
                          {item.code}
                        </span>
                        {isSystem && (
                          <Tag color="purple" className="rounded-full px-2 py-0.5 text-[10px] font-bold border-0">
                            Mặc định hệ thống
                          </Tag>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          size="small"
                          checked={item.active}
                          onChange={() => toggleActive(item.id)}
                        />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold text-slate-900 text-base mb-1 leading-snug">{item.name}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">
                      {item.description || 'Chưa có mô tả ghi chú.'}
                    </p>

                    {/* Prompt Code Snippet Box */}
                    <div className="relative group bg-slate-950 text-slate-200 font-mono text-[11px] p-3 rounded-xl border border-slate-800 mb-4 leading-relaxed overflow-hidden">
                      <p className="whitespace-pre-wrap line-clamp-4 opacity-90">{item.templateContent}</p>
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button
                          type="text"
                          size="small"
                          icon={copiedCode === item.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          onClick={() => handleCopyContent(item.templateContent, item.code)}
                          className="h-7 w-7 p-0 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <Button
                      type="link"
                      size="small"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewTemplate(item)}
                      className="p-0 text-xs font-semibold text-slate-600 hover:text-brand-600 flex items-center gap-1"
                    >
                      Xem đầy đủ
                    </Button>

                    <Space size="small">
                      <Button
                        type="text"
                        size="small"
                        icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                        onClick={() => handleOpenEdit(item)}
                        className="hover:bg-blue-50 rounded-lg text-xs"
                      >
                        Sửa
                      </Button>
                      {isSystem ? (
                        <Tooltip title="Prompt mặc định hệ thống - Chỉ cho phép chỉnh sửa, không thể xóa">
                          <Button
                            type="text"
                            size="small"
                            disabled
                            icon={<Trash2 className="w-3.5 h-3.5 text-slate-300" />}
                            className="opacity-40 cursor-not-allowed text-xs"
                          >
                            Xóa
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleDelete(item)}
                          className="hover:bg-rose-50 rounded-lg text-xs"
                        >
                          Xóa
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Drawer: Create / Edit Template */}
      <Drawer
        title={
          <div className="flex items-center gap-2 font-display text-lg">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
              <Bot className="w-4 h-4" />
            </div>
            <span>
              {editingTemplate ? (
                <>
                  Chỉnh sửa Prompt: <span className="text-brand-600 font-mono">{editingTemplate.code}</span>
                </>
              ) : (
                'Tạo mới AI Prompt Template'
              )}
            </span>
          </div>
        }
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={640}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={() => form.submit()} className="bg-brand-600">
              {editingTemplate ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </Space>
        }
        className="custom-drawer"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm} requiredMark="optional">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mã Template (Code) <span className="text-rose-500">*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mã template' },
                  { pattern: /^[A-Z0-9_]+$/, message: 'Mã chỉ gồm chữ hoa, số và dấu gạch dưới (_)' },
                ]}
                extra="VD: PEO, PLO, CLO, SYLLABUS, BASE_SYSTEM..."
              >
                <Input
                  placeholder="PEO"
                  disabled={!!editingTemplate && SYSTEM_DEFAULT_CODES.includes(editingTemplate.code)}
                  className="rounded-xl h-10 font-mono font-bold uppercase"
                  onChange={(e) => {
                    form.setFieldValue('code', e.target.value.toUpperCase());
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tên hiển thị <span className="text-rose-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
              >
                <Input placeholder="Mục tiêu đào tạo (PEO)" className="rounded-xl h-10" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả ngắn</span>}
          >
            <Input placeholder="Hướng dẫn AI cách xây dựng các PEO/Mục tiêu chung..." className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item
            name="templateContent"
            label={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nội dung Prompt (Prompt Content) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-brand-600 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3" /> Hỗ trợ biến giữ chỗ [Tên ngành], HTML tags
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng nhập nội dung Prompt' }]}
          >
            <TextArea
              rows={12}
              placeholder="Nhập hướng dẫn chi tiết cho AI tại đây..."
              className="rounded-xl font-mono text-xs bg-slate-950 text-slate-100 p-4 leading-relaxed custom-scrollbar border-slate-800 focus:border-brand-500"
            />
          </Form.Item>

          <Form.Item
            name="active"
            valuePropName="checked"
            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kích hoạt sử dụng</span>}
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Mẹo viết Prompt hiệu quả cho eUni AI:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
              <li>Mô tả rõ định dạng HTML đầu ra (VD: dùng <code className="text-brand-700 bg-brand-50 px-1 rounded">&lt;p&gt;&lt;strong&gt;Mục tiêu chung:&lt;/strong&gt;...&lt;/p&gt;</code>).</li>
              <li>Sử dụng các thẻ danh sách <code className="text-brand-700 bg-brand-50 px-1 rounded">&lt;ul&gt;&lt;li&gt;</code> cho từng mục tiêu cụ thể PEO 1, CLO 1,...</li>
              <li>Bạn có thể bật/tắt kích hoạt bất kỳ lúc nào để chuyển đổi giữa prompt tùy chỉnh và prompt mặc định hệ thống.</li>
            </ul>
          </div>
        </Form>
      </Drawer>

      {/* Modal: Preview Full Prompt */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-display text-lg">
            <FileCode2 className="w-5 h-5 text-brand-600" />
            <span>Nội dung Prompt: {previewTemplate?.name}</span>
            <Tag color="blue" className="font-mono text-xs ml-2 border-0">
              {previewTemplate?.code}
            </Tag>
          </div>
        }
        open={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        footer={[
          <Button
            key="copy"
            icon={<Copy className="w-4 h-4" />}
            onClick={() => previewTemplate && handleCopyContent(previewTemplate.templateContent, previewTemplate.code)}
          >
            Sao chép nội dung
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewTemplate(null)} className="bg-brand-600">
            Đóng
          </Button>,
        ]}
        width={720}
        centered
      >
        {previewTemplate && (
          <div className="py-2 space-y-3">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span><strong>Mô tả:</strong> {previewTemplate.description || 'Không có'}</span>
              <span><strong>Trạng thái:</strong> {previewTemplate.active ? 'Đang bật' : 'Đã tắt'}</span>
            </div>
            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar border border-slate-800 whitespace-pre-wrap">
              {previewTemplate.templateContent}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AiPromptManagementPage() {
  return (
    <AppShell>
      <AiPromptManagementContent />
    </AppShell>
  );
}
