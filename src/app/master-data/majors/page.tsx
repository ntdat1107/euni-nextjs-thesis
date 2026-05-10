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
  Select, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  App,
  Tooltip,
  Divider,
  Tag
} from 'antd';
import { 
  Search, 
  Plus, 
  Trash2,
  RefreshCw,
  Edit3,
  BookOpen,
  GraduationCap,
  FileText
} from 'lucide-react';
import { useMajors } from '@/hooks/useMajors';
import { useFaculties } from '@/hooks/useFaculties';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Major } from '@/types/academic';

const { Title, Text } = Typography;

function MajorManagementContent() {
  const { majors = [], isLoading: loadingMajors, createMajor, updateMajor, deleteMajor } = useMajors();
  const { faculties = [], isLoading: loadingDepts } = useFaculties();
  const { message, modal } = App.useApp();

  const isLoading = loadingMajors || loadingDepts;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const handleOpenModal = (major?: Major) => {
    if (major) {
      setEditingMajor(major);
      form.setFieldsValue({
        ...major,
      });
    } else {
      setEditingMajor(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingMajor) {
        await updateMajor({ id: editingMajor.id, data: values });
      } else {
        await createMajor(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {}
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Xác nhận xóa ngành học?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteMajor(id);
      }
    });
  };

  const filteredMajors = majors.filter(major => 
    major.name.toLowerCase().includes(searchText.toLowerCase()) ||
    major.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Ngành học',
      key: 'major',
      render: (_: any, record: Major) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
            <GraduationCap className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{record.name}</div>
            <div className="text-xs text-slate-500 font-medium">Mã ngành: {record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Khoa',
      dataIndex: 'facultyName',
      key: 'facultyName',
      render: (text: string) => <span className="font-medium text-slate-600">{text || 'N/A'}</span>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <span className="text-slate-500 text-sm">{text || '---'}</span>
    },
    {
      title: 'Số CTĐT',
      dataIndex: 'programCount',
      key: 'programCount',
      render: (count: number) => (
        <Tag color="blue" className="rounded-lg font-bold border-0 px-3 py-1">
          {count} chương trình
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: Major) => (
        <Space>
          <Tooltip title="Xem các CTĐT">
            <Button 
              type="text" 
              icon={<FileText className="w-4 h-4 text-brand-500" />} 
              onClick={() => window.location.href = `/master-data/programs?majorId=${record.id}`}
              className="hover:bg-brand-50 rounded-lg"
            />
          </Tooltip>
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
          <Title level={2} className="!mb-1 font-display tracking-tight">Quản lý Ngành học</Title>
          <Text className="text-slate-500 font-medium">Danh mục các ngành đào tạo chính thức của hệ thống.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<Plus className="w-5 h-5" />} 
          onClick={() => handleOpenModal()}
          className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect"
        >
          Thêm ngành học
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số ngành</span>}
              value={majors.length} 
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
            placeholder="Tìm kiếm theo tên hoặc mã ngành..."
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            className="max-w-md rounded-xl"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg" />
        </div>
        <Table 
          dataSource={filteredMajors} 
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
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-600" />
            </div>
            <span>{editingMajor ? 'Cập Nhật Ngành Học' : 'Thêm Ngành Học Mới'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingMajor ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        className="premium-modal"
        centered
      >
        <div className="py-6">
          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item 
                  name="name" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên ngành học</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập tên ngành' }]}
                >
                  <Input placeholder="Kỹ thuật phần mềm" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="code" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã ngành</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập mã ngành' }]}
                >
                  <Input placeholder="SE" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
               <Col span={12}>
                <Form.Item 
                  name="facultyId" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Khoa</span>} 
                >
                  <Select placeholder="Chọn khoa" className="rounded-xl h-11">
                    {faculties.map(f => (
                      <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item 
                  name="description" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả</span>}
                >
                  <Input.TextArea placeholder="Mô tả về ngành học..." className="rounded-xl" rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

export default function MajorManagementPage() {
  return (
    <AppShell>
      <MajorManagementContent />
    </AppShell>
  );
}
