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
  Landmark,
  Building2
} from 'lucide-react';
import { useFaculties, Faculty } from '@/hooks/useFaculties';
import TableSkeleton from '@/components/ui/TableSkeleton';

const { Title, Text } = Typography;

function FacultyManagementContent() {
  const {
    faculties = [],
    isLoading,
    createFaculty,
    updateFaculty,
    deleteFaculty
  } = useFaculties();
  const { modal } = App.useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const handleOpenModal = (faculty?: Faculty) => {
    if (faculty) {
      setEditingFaculty(faculty);
      form.setFieldsValue({
        ...faculty,
      });
    } else {
      setEditingFaculty(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingFaculty) {
        await updateFaculty({ id: editingFaculty.id, data: values });
      } else {
        await createFaculty(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {}
  };

  const handleDelete = (id: number | string) => {
    modal.confirm({
      title: 'Xác nhận xóa khoa?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteFaculty(id);
      }
    });
  };

  const filteredFaculties = faculties.filter((faculty) =>
    (faculty.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (faculty.code || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Khoa',
      key: 'faculty',
      render: (_: any, record: Faculty) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 flex-shrink-0 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
            <Landmark className="w-5 h-5 text-brand-600 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{record.name}</div>
            <div className="text-xs text-slate-500 font-medium">Mã khoa: {record.code}</div>
          </div>
        </div>
      ),
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
      render: (_: any, record: Faculty) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit3 className="w-4 h-4 text-blue-500" />}
              onClick={() => handleOpenModal(record)}
              className="hover:bg-blue-50 rounded-lg cursor-pointer"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => handleDelete(record.id)}
              className="hover:bg-rose-50 rounded-lg cursor-pointer"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <TableSkeleton rows={10} columns={3} />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1 font-display tracking-tight">Danh mục Khoa</Title>
          <Text className="text-slate-500 font-medium">Quản lý danh sách các khoa thuộc trường.</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenModal()}
          className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect cursor-pointer"
        >
          Thêm khoa
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="card-premium">
            <Statistic
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số khoa</span>}
              value={faculties.length}
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
            placeholder="Tìm kiếm theo tên hoặc mã khoa..."
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            className="max-w-md rounded-xl"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg cursor-pointer" />
        </div>
        <Table
          dataSource={filteredFaculties}
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
              <Building2 className="w-4 h-4 text-brand-600" />
            </div>
            <span>{editingFaculty ? 'Cập Nhật Khoa' : 'Thêm Khoa Mới'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingFaculty ? 'Cập nhật' : 'Thêm mới'}
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
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên khoa</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên khoa' }]}
                >
                  <Input placeholder="Khoa Công nghệ Thông tin" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="code"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã khoa</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mã khoa' }]}
                >
                  <Input placeholder="FIT" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả</span>}
                >
                  <Input.TextArea placeholder="Mô tả về khoa..." className="rounded-xl" rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

export default function FacultyManagementPage() {
  return (
    <AppShell>
      <FacultyManagementContent />
    </AppShell>
  );
}
