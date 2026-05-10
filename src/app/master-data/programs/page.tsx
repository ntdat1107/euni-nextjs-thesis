'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useSearchParams } from 'next/navigation';
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
  Alert
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
  Eye
} from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useMajors } from '@/hooks/useMajors';
import { useCourses } from '@/hooks/useCourses';
import { programService } from '@/services/programService';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Program } from '@/types/academic';

const { Title, Text } = Typography;

function ProgramManagementContent() {
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
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [isEditMode, setIsEditMode] = useState(false);

  const handleOpenDetail = async (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setIsEditMode(false);
      form.setFieldsValue(program);
      // Fetch courses for this program
      try {
        const currentCourseIds = await programService.getCourses(program.id);
        setSelectedCourseIds(currentCourseIds);
      } catch (e) {
        message.error('Không thể tải danh sách môn học');
      }
    } else {
      setEditingProgram(null);
      setIsEditMode(true);
      form.resetFields();
      setSelectedCourseIds([]);
    }
    setViewState('EDIT');
    setActiveTab('1');
  };

  const handleBackToList = () => {
    setViewState('LIST');
    setEditingProgram(null);
  };

  const handleSubmit = async (values: any) => {
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
    } catch (e) { }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Xác nhận xóa chương trình đào tạo?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteProgram(id);
      }
    });
  };


  const handleAssignCourses = async (courseIds: string[]) => {
    if (!isEditMode) return;
    
    if (!editingProgram) {
      message.warning('Vui lòng lưu thông tin chung trước khi gán môn học');
      setActiveTab('1');
      return;
    }
    try {
      await assignCourses({ id: editingProgram.id, courseIds });
      setSelectedCourseIds(courseIds);
    } catch (e) { }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Tag color="success" icon={<CheckCircle className="w-3 h-3" />} className="rounded-full px-3 font-bold border-0">
            Đang áp dụng
          </Tag>
        );
      case 'DRAFT':
        return (
          <Tag color="warning" icon={<Clock className="w-3 h-3" />} className="rounded-full px-3 font-bold border-0">
            Bản nháp
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
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
            <div className="font-bold text-slate-900">{record.name}</div>
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
      render: (status: string) => getStatusTag(status)
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
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => handleDelete(record.id)}
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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="mb-1! font-display tracking-tight">Quản lý Chương trình đào tạo</Title>
          <Text className="text-slate-500 font-medium">Danh mục các chương trình đào tạo chính quy của nhà trường.</Text>
        </div>
        {viewState === 'LIST' && (
          <Button
            type="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => handleOpenDetail()}
            className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect"
          >
            Tạo chương trình
          </Button>
        )}
      </div>

      {viewState === 'LIST' ? (
        <>
          {/* Stats Section */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Card className="card-premium">
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
          <Card className="card-premium overflow-hidden" styles={{ body: { padding: 0 } }}>
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
        /* Integrated Detail & Course Management View */
        <Card 
          className="card-premium animate-in fade-in slide-in-from-bottom-4 duration-500"
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 py-2">
                <Button 
                  icon={<ArrowLeft className="w-4 h-4" />} 
                  onClick={handleBackToList}
                  className="rounded-lg hover:bg-slate-100 border-none flex items-center"
                >
                  Quay lại
                </Button>
                <div className="h-6 w-[1px] bg-slate-200" />
                <span className="font-display font-bold text-lg">
                  {editingProgram ? (isEditMode ? `Chỉnh sửa: ${editingProgram.name}` : `Chi tiết: ${editingProgram.name}`) : 'Thiết lập Chương trình mới'}
                </span>
              </div>
              {editingProgram && !isEditMode && (
                <Button 
                  type="primary" 
                  ghost
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => setIsEditMode(true)}
                  className="rounded-xl border-brand-200 text-brand-600 hover:text-brand-700 hover:border-brand-300"
                >
                  Chỉnh sửa thông tin
                </Button>
              )}
            </div>
          }
        >
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <div className="md:col-span-2">
                          <Form.Item
                            name="name"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên chương trình</span>}
                            rules={[{ required: true, message: 'Vui lòng nhập tên chương trình' }]}
                          >
                            <Input placeholder="Ví dụ: Công nghệ thông tin (Chương trình tiên tiến)" className="rounded-xl h-11" disabled={!isEditMode} />
                          </Form.Item>
                        </div>
                        <Form.Item
                          name="code"
                          label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã chương trình</span>}
                          rules={[{ required: true, message: 'Vui lòng nhập mã chương trình' }]}
                        >
                          <Input placeholder="Ví dụ: CTDT-IT-2026" className="rounded-xl h-11" disabled={!isEditMode} />
                        </Form.Item>
                        <Form.Item
                          name="majorId"
                          label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ngành học trực thuộc</span>}
                          rules={[{ required: true, message: 'Vui lòng chọn ngành' }]}
                        >
                          <Select placeholder="Chọn ngành học" className="rounded-xl h-11" disabled={!isEditMode}>
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
                          <Select className="rounded-xl h-11" disabled={!isEditMode}>
                            <Select.Option value="DRAFT">Bản nháp (Đang xây dựng)</Select.Option>
                            <Select.Option value="ACTIVE">Đang áp dụng (Chính thức)</Select.Option>
                          </Select>
                        </Form.Item>
                        <div className="md:col-span-2">
                          <Form.Item
                            name="description"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả tổng quát</span>}
                          >
                            <Input.TextArea placeholder="Tóm tắt về chương trình đào tạo..." className="rounded-xl" rows={3} disabled={!isEditMode} />
                          </Form.Item>
                        </div>
                        <div className="md:col-span-2 mt-4">
                          <Title level={5} className="!mb-6 text-brand-600 border-b pb-2">Mục tiêu & Chuẩn đầu ra</Title>
                        </div>
                        <div className="md:col-span-2">
                          <Form.Item
                            name="generalObjective"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mục tiêu chung</span>}
                          >
                            <Input.TextArea className="rounded-xl" rows={4} placeholder="Nêu khái quát mục tiêu đào tạo..." disabled={true} />
                          </Form.Item>
                        </div>
                        <div className="md:col-span-2">
                          <Form.Item
                            name="specificObjectives"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mục tiêu cụ thể</span>}
                          >
                            <Input.TextArea className="rounded-xl" rows={4} placeholder="Các mục tiêu chi tiết cần đạt được..." disabled={true} />
                          </Form.Item>
                        </div>
                        <div className="md:col-span-2">
                          <Form.Item
                            name="learningOutcomes"
                            label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chuẩn đầu ra (PLO)</span>}
                          >
                            <Input.TextArea className="rounded-xl" rows={4} placeholder="Các năng lực sinh viên đạt được sau khi tốt nghiệp..." disabled={true} />
                          </Form.Item>
                        </div>
                      </div>
                      {isEditMode && (
                        <div className="flex justify-end gap-3 pt-8 border-t border-slate-100 mt-8">
                          <Button onClick={() => editingProgram ? setIsEditMode(false) : handleBackToList()} className="rounded-xl h-11 px-8 hover:bg-slate-50">Hủy bỏ</Button>
                          <Button type="primary" htmlType="submit" className="rounded-xl h-11 px-10 shadow-md" loading={isCreating || isUpdating}>
                            {editingProgram ? 'Cập nhật thông tin' : 'Tạo và tiếp tục'}
                          </Button>
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
                  <div className="max-w-5xl mx-auto py-8">
                    <div className="mb-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <Title level={4} className="!mb-1 text-emerald-900">Thiết kế khung chương trình</Title>
                        <Text className="text-emerald-700">Chọn và sắp xếp các học phần bắt buộc và tự chọn cho chương trình này.</Text>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">Tìm và thêm môn học</span>
                        <Select
                          mode="multiple"
                          placeholder={isEditMode ? "Nhập mã hoặc tên môn học để tìm kiếm..." : "Đang ở chế độ xem chi tiết"}
                          className="w-full rounded-xl"
                          style={{ minHeight: '48px' }}
                          value={selectedCourseIds}
                          onChange={handleAssignCourses}
                          disabled={!isEditMode}
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={courses.map(c => ({
                            value: c.id,
                            label: `${c.code} - ${c.name} (${c.credits} tín chỉ)`
                          }))}
                        />
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                          <Title level={5} className="!mb-0 flex items-center gap-2">
                            Môn học đã chọn 
                            <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {selectedCourseIds.length}
                            </span>
                          </Title>
                          {selectedCourseIds.length > 0 && (
                            <Text className="text-slate-400 text-xs italic">* Dữ liệu được lưu tự động khi thay đổi</Text>
                          )}
                        </div>
                        <Table 
                          dataSource={courses.filter(c => selectedCourseIds.includes(c.id))}
                          pagination={false}
                          loading={isAssigning}
                          columns={[
                            { 
                              title: 'STT', 
                              key: 'index', 
                              width: 60, 
                              render: (_, __, index) => <span className="text-slate-400 font-medium">{index + 1}</span> 
                            },
                            { 
                              title: 'Mã HP', 
                              dataIndex: 'code', 
                              key: 'code', 
                              width: 140,
                              render: (code) => <code className="bg-slate-100 px-2 py-1 rounded text-brand-700 font-bold text-xs">{code}</code>
                            },
                            { 
                              title: 'Tên học phần', 
                              dataIndex: 'name', 
                              key: 'name',
                              render: (name) => <span className="font-medium text-slate-700">{name}</span>
                            },
                            { 
                              title: 'Số tín chỉ', 
                              dataIndex: 'credits', 
                              key: 'credits', 
                              width: 100, 
                              align: 'center' 
                            },
                            { 
                              title: 'Loại HP', 
                              key: 'type', 
                              width: 120,
                              render: () => <span className="text-slate-500 text-xs uppercase font-bold tracking-tighter">Bắt buộc</span>
                            },
                            ...(isEditMode ? [{ 
                              title: 'Gỡ bỏ', 
                              key: 'action', 
                              width: 80, 
                              align: 'center' as const,
                              render: (_: any, record: any) => (
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<Trash2 className="w-4 h-4" />} 
                                  onClick={() => handleAssignCourses(selectedCourseIds.filter(id => id !== record.id))}
                                  className="hover:bg-rose-50"
                                />
                              )
                            }] : [])
                          ]}
                          rowKey="id"
                          locale={{ emptyText: <div className="py-12 text-slate-400 italic">Chưa có môn học nào được chọn</div> }}
                        />
                      </div>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </Card>
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
