'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  App,
  Tooltip,
  Tag,
  Tabs,
  message,
  Alert,
  Breadcrumb
} from 'antd';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  FileText,
  CheckCircle,
  Clock,
  Layout,
  BookOpen,
  ArrowLeft,
  Eye,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useMajors } from '@/hooks/useMajors';
import { useCourses } from '@/hooks/useCourses';
import { programService } from '@/services/programService';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Program } from '@/types/academic';

const { Title, Text } = Typography;

function ProgramManagementContent() {
  const router = useRouter();
  const { 
    programs = [], 
    isLoading: loadingPrograms, 
    createProgram, 
    updateProgram, 
    deleteProgram, 
    assignCourses,
    isCreating,
    isUpdating,
    isAssigning
  } = usePrograms();
  const { majors = [], isLoading: loadingMajors } = useMajors();
  const { courses = [], isLoading: loadingCourses } = useCourses();
  const { modal } = App.useApp();
  const searchParams = useSearchParams();
  const initialMajorId = searchParams.get('majorId') || undefined;

  const isLoading = loadingPrograms || loadingMajors;
  const [viewState, setViewState] = useState<'LIST' | 'EDIT'>('LIST');
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedMajorId, setSelectedMajorId] = useState<string | undefined>(initialMajorId);
  const [searchText, setSearchText] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [draftCourseIds, setDraftCourseIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [isEditMode, setIsEditMode] = useState(false);

  const hasCourseChanges = React.useMemo(() => {
    if (selectedCourseIds.length !== draftCourseIds.length) return true;
    const setA = new Set(selectedCourseIds);
    return draftCourseIds.some(id => !setA.has(id));
  }, [selectedCourseIds, draftCourseIds]);

  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [selectedCoursesToAdd, setSelectedCoursesToAdd] = useState<string[]>([]);

  const handleOpenDetail = async (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setIsEditMode(false);
      form.setFieldsValue(program);
      try {
        const currentCourseIds = await programService.getCourses(program.id);
        setSelectedCourseIds(currentCourseIds);
        setDraftCourseIds(currentCourseIds);
      } catch (e) {
        message.error('Không thể tải danh sách môn học');
      }
    } else {
      setEditingProgram(null);
      setIsEditMode(true);
      form.resetFields();
      setSelectedCourseIds([]);
      setDraftCourseIds([]);
    }
    setViewState('EDIT');
    setActiveTab('1');
  };



  const handleBackToList = () => {
    setViewState('LIST');
    setEditingProgram(null);
  };

  const handleSubmit = async (values: any) => {
    if (editingProgram?.hasUncompletedCampaign) {
      message.error('Chương trình đào tạo đang có đợt khảo sát chưa hoàn thành, không thể chỉnh sửa!');
      return;
    }
    try {
      const metadata = {
        name: values.name,
        code: values.code,
        majorId: values.majorId,
        status: values.status,
        description: values.description
      };

      if (editingProgram) {
        await updateProgram({ id: editingProgram.id, data: metadata });
        setIsEditMode(false);
      } else {
        const newProgram = await createProgram(metadata);
        setEditingProgram(newProgram);
      }
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi cập nhật chương trình');
    }
  };

  const handleDelete = (program: Program) => {
    if (program.hasUncompletedCampaign) {
      message.error('Không thể xóa chương trình đào tạo đang có đợt khảo sát chưa hoàn thành!');
      return;
    }
    modal.confirm({
      title: 'Xác nhận xóa chương trình đào tạo?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteProgram(program.id);
      }
    });
  };

  const handleSaveCourses = async () => {
    if (!editingProgram) {
      message.warning('Vui lòng lưu thông tin chung trước khi gán môn học');
      setActiveTab('1');
      return;
    }
    if (editingProgram.hasUncompletedCampaign) {
      message.error('Chương trình đào tạo đang có đợt khảo sát chưa hoàn thành, không thể chỉnh sửa môn học!');
      return;
    }
    try {
      await assignCourses({ id: editingProgram.id, courseIds: draftCourseIds });
      setSelectedCourseIds(draftCourseIds);
      message.success('Đã lưu danh sách môn học thành công!');
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi lưu danh sách môn học');
    }
  };

  const handleCancelCourseChanges = () => {
    setDraftCourseIds(selectedCourseIds);
    message.info('Đã hủy bỏ các thay đổi môn học chưa lưu');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase whitespace-nowrap border border-emerald-100">
            <CheckCircle size={12} className="flex-shrink-0" />
            <span>Đang áp dụng</span>
          </div>
        );
      case 'DRAFT':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] uppercase whitespace-nowrap border border-amber-100">
            <Clock size={12} className="flex-shrink-0" />
            <span>Bản nháp</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase whitespace-nowrap">
            <span>{status}</span>
          </div>
        );
    }
  };

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.code.toLowerCase().includes(searchText.toLowerCase());
    const matchesMajor = !selectedMajorId || p.majorId === selectedMajorId;
    return matchesSearch && matchesMajor;
  });

  const columns = [
    {
      title: 'Chương trình đào tạo',
      key: 'program',
      render: (_: any, record: Program) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
            <Layout className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900">
              {record.name}
              {record.hasUncompletedCampaign && (
                <Tooltip title="Đang có đợt khảo sát chưa hoàn thành (Không được chỉnh sửa/xóa)">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Đang khảo sát</span>
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium">Mã CT: {record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ngành',
      dataIndex: 'majorName',
      key: 'majorName',
      render: (text: string) => <span className="font-medium text-slate-600">{text}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: Program) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye className="w-4 h-4 text-blue-500" />}
              onClick={() => handleOpenDetail(record)}
              className="hover:bg-blue-50 rounded-lg"
            />
          </Tooltip>
          <Tooltip title={record.hasUncompletedCampaign ? "Chương trình đang có đợt khảo sát chưa hoàn thành" : "Xóa"}>
            <Button
              type="text"
              danger
              disabled={record.hasUncompletedCampaign}
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => handleDelete(record)}
              className="hover:bg-rose-50 rounded-lg"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <TableSkeleton rows={10} columns={4} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Breadcrumb Standard */}
      <Breadcrumb
        className="text-slate-400 text-xs"
        items={[
          { title: <a onClick={() => router.push('/')} className="hover:text-blue-600">Trang chủ</a> },
          { title: <a onClick={() => setViewState('LIST')} className="hover:text-blue-600">Dữ liệu gốc</a> },
          { title: viewState === 'LIST' ? 'Chương trình đào tạo' : (editingProgram?.name || 'Thêm chương trình mới') }
        ]}
      />

      {/* 2. Header Card Standard */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Title level={2} className="!mb-0 !text-slate-800 tracking-tight font-bold text-2xl">
                {viewState === 'LIST' 
                  ? 'Quản lý Chương trình đào tạo' 
                  : (editingProgram ? (isEditMode ? `Chỉnh sửa: ${editingProgram.name}` : editingProgram.name) : 'Thiết lập Chương trình mới')
                }
              </Title>
              {viewState === 'EDIT' && editingProgram?.status && getStatusBadge(editingProgram.status)}
            </div>
            <Text className="text-slate-500 font-medium text-xs mt-1 block">
              {viewState === 'LIST'
                ? 'Danh mục các chương trình đào tạo chính quy của nhà trường.'
                : 'Thông tin chi tiết và danh mục học phần thuộc chương trình đào tạo.'
              }
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewState === 'LIST' ? (
            <Button
              type="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => handleOpenDetail()}
              className="h-10 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 border-none transition-all"
            >
              Tạo chương trình
            </Button>
          ) : (
            <>
              {editingProgram && !isEditMode && (
                <Tooltip title={editingProgram.hasUncompletedCampaign ? "Chương trình đang có đợt khảo sát chưa hoàn thành, không thể chỉnh sửa" : ""}>
                  <Button 
                    type="primary" 
                    disabled={editingProgram.hasUncompletedCampaign}
                    icon={<Edit3 className="w-4 h-4" />}
                    onClick={() => setIsEditMode(true)}
                    className="rounded-xl h-10 px-5 font-semibold text-sm bg-blue-600 hover:bg-blue-700 shadow-md border-none transition-all"
                  >
                    Chỉnh sửa thông tin
                  </Button>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>

      {viewState === 'LIST' ? (
        <>
          {/* Stats Section */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Card className="rounded-2xl border border-slate-200/90 shadow-2xs">
                <Statistic
                  title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số chương trình</span>}
                  value={programs.length}
                  formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
                  styles={{ content: { color: '#0f172a' } }}
                />
              </Card>
            </Col>
          </Row>

          {/* Table Section */}
          <Card className="rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden" styles={{ body: { padding: 0 } }}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50 gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Input
                  placeholder="Tìm kiếm theo tên hoặc mã chương trình..."
                  prefix={<Search className="w-4 h-4 text-slate-400" />}
                  className="max-w-md rounded-xl"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                <Select
                  placeholder="Lọc theo ngành học"
                  className="w-64 rounded-xl"
                  allowClear
                  value={selectedMajorId}
                  onChange={setSelectedMajorId}
                >
                  {majors.map(m => (
                    <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
                  ))}
                </Select>
              </div>
              <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg" />
            </div>
            <Table
              dataSource={filteredPrograms}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                className: "px-6"
              }}
              className="ant-table-custom"
            />
          </Card>
        </>
      ) : (
        /* 3. Content Cards Standard */
        <Card 
          className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white"
        >
          {editingProgram?.hasUncompletedCampaign && (
            <Alert
              message="Đang có đợt khảo sát chưa hoàn thành"
              description="Chương trình đào tạo này đang liên kết với một Đợt khảo sát chưa hoàn thành (chưa Phê duyệt). Để đảm bảo tính nhất quán dữ liệu khảo sát, việc chỉnh sửa thông tin chương trình hoặc thay đổi môn học tạm thời bị khóa."
              type="warning"
              showIcon
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              className="rounded-2xl border-amber-200 bg-amber-50/80 mb-6 text-amber-900 shadow-sm"
            />
          )}

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="premium-tabs"
            items={[
              {
                key: '1',
                label: (
                  <span className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Thông tin & Mục tiêu
                  </span>
                ),
                children: (
                  <div className="max-w-5xl mx-auto py-8">
                    <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
                      {!isEditMode ? (
                        /* Premium View-Only Readout */
                        <div className="space-y-8">
                          <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin cơ bản</span>
                              {editingProgram?.status && getStatusBadge(editingProgram.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                              <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">Tên chương trình đào tạo</span>
                                <span className="font-bold text-slate-900 text-base">{form.getFieldValue('name') || '---'}</span>
                              </div>

                              <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">Mã chương trình</span>
                                <code className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-brand-700 font-bold text-sm font-mono inline-block">
                                  {form.getFieldValue('code') || '---'}
                                </code>
                              </div>

                              <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">Ngành học trực thuộc</span>
                                <span className="font-semibold text-slate-700">
                                  {majors.find(m => m.id === form.getFieldValue('majorId'))?.name || '---'}
                                </span>
                              </div>

                              <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">Trạng thái vận hành</span>
                                <span className="font-semibold text-slate-700">
                                  {form.getFieldValue('status') === 'ACTIVE' ? 'Đang áp dụng (Chính thức)' : 'Bản nháp (Đang xây dựng)'}
                                </span>
                              </div>

                              <div className="md:col-span-2">
                                <span className="text-xs font-semibold text-slate-400 block mb-1">Mô tả tổng quát</span>
                                <p className="text-slate-600 leading-relaxed italic bg-white p-3.5 rounded-xl border border-slate-100 text-xs">
                                  {form.getFieldValue('description') || 'Chưa có mô tả'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6 pt-2">
                            <Title level={5} className="!mb-0 text-brand-600 border-b border-slate-200 pb-3 flex items-center gap-2">
                              <span>Mục tiêu &amp; Chuẩn đầu ra</span>
                            </Title>

                            <div className="space-y-5">
                              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Mục tiêu chung</span>
                                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                  {form.getFieldValue('generalObjective') || <span className="text-slate-400 italic">Chưa cập nhật nội dung mục tiêu chung</span>}
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Mục tiêu cụ thể</span>
                                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                  {form.getFieldValue('specificObjectives') || <span className="text-slate-400 italic">Chưa cập nhật nội dung mục tiêu cụ thể</span>}
                                </div>
                              </div>

                              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Chuẩn đầu ra (PLO)</span>
                                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                  {form.getFieldValue('learningOutcomes') || <span className="text-slate-400 italic">Chưa cập nhật nội dung chuẩn đầu ra</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode Form Inputs */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                          <div className="md:col-span-2">
                            <Form.Item
                              name="name"
                              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên chương trình</span>}
                              rules={[{ required: true, message: 'Vui lòng nhập tên chương trình' }]}
                            >
                              <Input placeholder="Ví dụ: Công nghệ thông tin (Chương trình tiên tiến)" className="rounded-xl h-11" disabled={editingProgram?.hasUncompletedCampaign} />
                            </Form.Item>
                          </div>
                          <Form.Item
                            name="code"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã chương trình</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập mã chương trình' }]}
                          >
                            <Input placeholder="Ví dụ: CTDT-IT-2026" className="rounded-xl h-11" disabled={editingProgram?.hasUncompletedCampaign} />
                          </Form.Item>
                          <Form.Item
                            name="majorId"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ngành học trực thuộc</span>}
                            rules={[{ required: true, message: 'Vui lòng chọn ngành' }]}
                          >
                            <Select placeholder="Chọn ngành học" className="rounded-xl h-11" disabled={editingProgram?.hasUncompletedCampaign}>
                              {majors.map(m => (
                                <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="status"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái vận hành</span>}
                            initialValue="DRAFT"
                          >
                            <Select className="rounded-xl h-11" disabled={editingProgram?.hasUncompletedCampaign}>
                              <Select.Option value="DRAFT">Bản nháp (Đang xây dựng)</Select.Option>
                              <Select.Option value="ACTIVE">Đang áp dụng (Chính thức)</Select.Option>
                            </Select>
                          </Form.Item>
                          <div className="md:col-span-2">
                            <Form.Item
                              name="description"
                              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả tổng quát</span>}
                            >
                              <Input.TextArea placeholder="Tóm tắt về chương trình đào tạo..." className="rounded-xl" rows={3} disabled={editingProgram?.hasUncompletedCampaign} />
                            </Form.Item>
                          </div>
                          <div className="md:col-span-2 mt-4">
                            <Title level={5} className="!mb-6 text-brand-600 border-b pb-2">Mục tiêu &amp; Chuẩn đầu ra</Title>
                          </div>
                          <div className="md:col-span-2">
                            <Form.Item
                              name="generalObjective"
                              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mục tiêu chung</span>}
                            >
                              <Input.TextArea className="rounded-xl" rows={4} placeholder="Nêu khái quát mục tiêu đào tạo..." disabled={editingProgram?.hasUncompletedCampaign} />
                            </Form.Item>
                          </div>
                          <div className="md:col-span-2">
                            <Form.Item
                              name="specificObjectives"
                              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mục tiêu cụ thể</span>}
                            >
                              <Input.TextArea className="rounded-xl" rows={4} placeholder="Các mục tiêu chi tiết cần đạt được..." disabled={editingProgram?.hasUncompletedCampaign} />
                            </Form.Item>
                          </div>
                          <div className="md:col-span-2">
                            <Form.Item
                              name="learningOutcomes"
                              label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chuẩn đầu ra (PLO)</span>}
                            >
                              <Input.TextArea className="rounded-xl" rows={4} placeholder="Các năng lực sinh viên đạt được sau khi tốt nghiệp..." disabled={editingProgram?.hasUncompletedCampaign} />
                            </Form.Item>
                          </div>
                        </div>
                      )}
                    </Form>
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Khung chương trình (Môn học)
                  </span>
                ),
                children: (
                  <div className="py-6 space-y-6">
                    {/* Top Action & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-sm">Tổng số môn học:</span>
                        <span className="font-extrabold text-blue-600 text-sm bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {draftCourseIds.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isEditMode && !editingProgram?.hasUncompletedCampaign && (
                          <Button
                            type="primary"
                            icon={<Plus size={16} />}
                            onClick={() => setIsAddCourseModalOpen(true)}
                            className="rounded-xl h-10 px-5 font-semibold text-xs bg-blue-600 hover:bg-blue-700 shadow-md border-none flex items-center gap-1.5"
                          >
                            Thêm môn học
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Single Full-width Course Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                      <Table
                        dataSource={courses.filter(c => draftCourseIds.includes(c.id))}
                        rowKey="id"
                        pagination={{
                          pageSize: 20,
                          showSizeChanger: true,
                          pageSizeOptions: ['10', '20', '50'],
                          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} môn học`,
                          className: 'px-6 py-4'
                        }}
                        className="ant-table-custom"
                        columns={[
                          {
                            title: 'STT',
                            key: 'idx',
                            width: 70,
                            render: (_, __, idx) => <span className="text-slate-400 font-bold text-xs">{idx + 1}</span>
                          },
                          {
                            title: 'Mã HP',
                            dataIndex: 'code',
                            key: 'code',
                            width: 120,
                            render: (code) => <code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold text-xs font-mono">{code}</code>
                          },
                          {
                            title: 'Tên học phần',
                            dataIndex: 'name',
                            key: 'name',
                            render: (name) => <span className="font-bold text-slate-800 text-xs">{name}</span>
                          },
                          {
                            title: 'Số tín chỉ',
                            dataIndex: 'credits',
                            key: 'credits',
                            width: 100,
                            align: 'center',
                            render: (tc) => <span className="font-bold text-slate-700 text-xs">{tc || 3}</span>
                          },
                          {
                            title: 'Loại HP',
                            key: 'required',
                            width: 130,
                            render: () => (
                              <Tag color="blue" className="rounded-full px-3 py-0.5 border-none font-bold text-[11px]">
                                Bắt buộc
                              </Tag>
                            )
                          },
                          ...((isEditMode && !editingProgram?.hasUncompletedCampaign) ? [{
                            title: 'Thao tác',
                            key: 'action',
                            width: 100,
                            align: 'center' as const,
                            render: (_: any, record: any) => (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="text"
                                  icon={<Trash2 size={15} />}
                                  onClick={() => setDraftCourseIds(draftCourseIds.filter(id => id !== record.id))}
                                  className="text-rose-500 hover:bg-rose-50 rounded-lg w-8 h-8 flex items-center justify-center"
                                />
                              </div>
                            )
                          }] : [])
                        ]}
                      />
                    </div>
                    {/* Modal Thêm môn học mới bằng Bảng tick chọn & Phân trang */}
                    <Modal
                      title={<span className="font-bold text-slate-800 text-base">Thêm môn học mới vào chương trình</span>}
                      open={isAddCourseModalOpen}
                      onCancel={() => {
                        setIsAddCourseModalOpen(false);
                        setSelectedCoursesToAdd([]);
                      }}
                      onOk={() => {
                        if (selectedCoursesToAdd.length === 0) {
                          message.warning('Vui lòng tích chọn ít nhất một môn học!');
                          return;
                        }
                        const combined = Array.from(new Set([...draftCourseIds, ...selectedCoursesToAdd]));
                        setDraftCourseIds(combined);
                        setIsAddCourseModalOpen(false);
                        setSelectedCoursesToAdd([]);
                        message.success(`Đã thêm ${selectedCoursesToAdd.length} môn học vào chương trình!`);
                      }}
                      okText={`Thêm ${selectedCoursesToAdd.length > 0 ? `(${selectedCoursesToAdd.length})` : ''} môn học`}
                      cancelText="Hủy bỏ"
                      width={750}
                      centered
                      okButtonProps={{ className: 'rounded-xl h-10 px-6 font-semibold bg-blue-600 hover:bg-blue-700 border-none' }}
                      cancelButtonProps={{ className: 'rounded-xl h-10 px-6 font-medium' }}
                    >
                      <div className="py-3 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Danh sách môn học khả dụng ({courses.filter(c => !draftCourseIds.includes(c.id)).length})
                          </span>
                          <Input.Search
                            placeholder="Tìm kiếm môn học..."
                            allowClear
                            size="middle"
                            className="w-64 text-xs"
                            onChange={(e) => setSearchText(e.target.value)}
                          />
                        </div>

                        <Table
                          dataSource={courses
                            .filter(c => !draftCourseIds.includes(c.id))
                            .filter(c => !searchText || c.name.toLowerCase().includes(searchText.toLowerCase()) || c.code.toLowerCase().includes(searchText.toLowerCase()))
                          }
                          rowKey="id"
                          rowSelection={{
                            type: 'checkbox',
                            selectedRowKeys: selectedCoursesToAdd,
                            onChange: (selectedKeys) => setSelectedCoursesToAdd(selectedKeys as string[])
                          }}
                          pagination={{
                            pageSize: 6,
                            showSizeChanger: false,
                            className: 'px-4 py-2'
                          }}
                          size="small"
                          className="ant-table-custom border border-slate-200/80 rounded-xl overflow-hidden"
                          columns={[
                            {
                              title: 'Mã HP',
                              dataIndex: 'code',
                              key: 'code',
                              width: 110,
                              render: (code) => <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-xs font-mono">{code}</code>
                            },
                            {
                              title: 'Tên học phần',
                              dataIndex: 'name',
                              key: 'name',
                              render: (name) => <span className="font-bold text-slate-800 text-xs">{name}</span>
                            },
                            {
                              title: 'Số tín chỉ',
                              dataIndex: 'credits',
                              key: 'credits',
                              width: 90,
                              align: 'center',
                              render: (tc) => <span className="font-semibold text-slate-700 text-xs">{tc || 3}</span>
                            }
                          ]}
                        />
                      </div>
                    </Modal>
                  </div>
                )
              }
            ]}
          />
        </Card>
      )}

      {/* Unified Fixed Bottom Page Action Bar for EDIT mode */}
      {viewState === 'EDIT' && isEditMode && !editingProgram?.hasUncompletedCampaign && (
        <div className="sticky bottom-0 z-20 -mx-6 -mb-6 mt-6 px-8 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {activeTab === '1' 
              ? 'Nhấn "Cập nhật thông tin" để lưu các thông tin chung của chương trình.' 
              : 'Nhấn "Lưu môn học" để áp dụng danh sách môn học mới cho chương trình.'
            }
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              onClick={() => editingProgram ? setIsEditMode(false) : handleBackToList()}
              className="rounded-xl h-11 px-7 font-semibold text-slate-700 hover:bg-slate-50 border-slate-300 transition-all"
            >
              Hủy bỏ
            </Button>

            {activeTab === '1' ? (
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={isCreating || isUpdating}
                className="rounded-xl h-11 px-8 font-semibold shadow-md bg-blue-600 hover:bg-blue-700 border-none transition-all"
              >
                {editingProgram ? 'Cập nhật thông tin' : 'Tạo và tiếp tục'}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSaveCourses}
                disabled={!hasCourseChanges}
                loading={isAssigning}
                className="rounded-xl h-11 px-8 font-semibold shadow-md bg-blue-600 hover:bg-blue-700 border-none transition-all"
              >
                Lưu môn học
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function ProgramManagementPage() {
  return (
    <AppShell>
      <React.Suspense fallback={<TableSkeleton rows={10} columns={4} />}>
        <ProgramManagementContent />
      </React.Suspense>
    </AppShell>
  );
}
