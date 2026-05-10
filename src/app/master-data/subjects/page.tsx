'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Table, 
  Button, 
  Card, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  App,
  Tooltip
} from 'antd';
import { 
  Search, 
  Plus, 
  Trash2,
  RefreshCw,
  Edit3,
  Book
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Course } from '@/types/academic';

const { Title, Text } = Typography;

function CourseManagementContent() {
  const { courses = [], isLoading, createCourse, updateCourse, deleteCourse } = useCourses();
  const { modal } = App.useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      form.setFieldsValue({
        ...course,
      });
    } else {
      setEditingCourse(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCourse) {
        await updateCourse({ id: editingCourse.id, data: values });
      } else {
        await createCourse(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {}
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Xác nhận xóa học phần?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteCourse(id);
      }
    });
  };

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchText.toLowerCase()) ||
    course.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Học phần',
      key: 'course',
      render: (_: any, record: Course) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <Book className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{record.name}</div>
            <div className="text-xs text-slate-500 font-medium">Mã HP: {record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số tín chỉ',
      dataIndex: 'credits',
      key: 'credits',
      render: (credits: number) => <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded text-xs">{credits} tín chỉ</span>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <span className="text-slate-500 text-sm">{text || '---'}</span>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: Course) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<Edit3 className="w-4 h-4 text-blue-500" />} 
              onClick={() => handleOpenModal(record)}
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
          <Title level={2} className="mb-1! font-display tracking-tight">Quản lý Học phần</Title>
          <Text className="text-slate-500 font-medium">Danh mục các môn học/học phần trong toàn trường.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus className="w-5 h-5" />} 
          onClick={() => handleOpenModal()}
          className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect"
        >
          Thêm học phần
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số học phần</span>}
              value={courses.length} 
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#0f172a' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="card-premium overflow-hidden" styles={{ body: { padding: 0 } }}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <Input
            placeholder="Tìm kiếm theo tên hoặc mã học phần..."
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            className="max-w-md rounded-xl"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg" />
        </div>
        <Table 
          dataSource={filteredCourses} 
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

      {/* Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-display text-lg py-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Book className="w-4 h-4 text-indigo-600" />
            </div>
            <span>{editingCourse ? 'Cập Nhật Học Phần' : 'Thêm Học Phần Mới'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingCourse ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        className="premium-modal"
        centered
      >
        <div className="py-6">
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional" initialValues={{ credits: 3 }}>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item 
                  name="name" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên học phần</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập tên học phần' }]}
                >
                  <Input placeholder="Cấu trúc dữ liệu và giải thuật" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="code" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã học phần</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập mã học phần' }]}
                >
                  <Input placeholder="CS101" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="credits" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số tín chỉ</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập số tín chỉ' }]}
                >
                  <InputNumber min={1} max={10} className="w-full rounded-xl h-11 flex items-center" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item 
                  name="description" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả</span>}
                >
                  <Input.TextArea placeholder="Mô tả tóm tắt nội dung học phần..." className="rounded-xl" rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

export default function CourseManagementPage() {
  return (
    <AppShell>
      <CourseManagementContent />
    </AppShell>
  );
}
