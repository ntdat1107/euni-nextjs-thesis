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
  Tooltip
} from 'antd';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Network,
  Briefcase
} from 'lucide-react';
import { useDepartments } from '@/hooks/useDepartments';
import { useFaculties } from '@/hooks/useFaculties';
import { Department } from '@/types/academic';

const { Title, Text } = Typography;

function DepartmentManagementContent() {
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<number | undefined>(undefined);
  const {
    departments = [],
    isLoading: loadingDepts,
    createDepartment,
    updateDepartment,
    deleteDepartment
  } = useDepartments(selectedFacultyFilter);
  const { faculties = [], isLoading: loadingFaculties } = useFaculties();
  const { modal } = App.useApp();

  const isLoading = loadingDepts || loadingFaculties;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDepartment(dept);
      form.setFieldsValue({
        ...dept,
      });
    } else {
      setEditingDepartment(null);
      form.resetFields();
      if (selectedFacultyFilter) {
        form.setFieldValue('facultyId', selectedFacultyFilter);
      }
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDepartment) {
        await updateDepartment({ id: editingDepartment.id, data: values });
      } else {
        await createDepartment(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {}
  };

  const handleDelete = (id: number | string) => {
    modal.confirm({
      title: 'Xác nhận xóa bộ môn?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteDepartment(id);
      }
    });
  };

  const filteredDepartments = departments.filter((dept) =>
    (dept.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (dept.code || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Bộ môn',
      key: 'department',
      render: (_: any, record: Department) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 flex-shrink-0 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
            <Network className="w-5 h-5 text-brand-600 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{record.name}</div>
            <div className="text-xs text-slate-500 font-medium">Mã bộ môn: {record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Khoa trực thuộc',
      dataIndex: 'facultyName',
      key: 'facultyName',
      render: (text: string) => <span className="font-medium text-slate-700">{text || '---'}</span>
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
      render: (_: any, record: Department) => (
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

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1 font-display tracking-tight">Danh mục Bộ môn</Title>
          <Text className="text-slate-500 font-medium">Quản lý các bộ môn trực thuộc khoa.</Text>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenModal()}
          className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect cursor-pointer"
        >
          Thêm bộ môn
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card className="card-premium">
            <Statistic
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số bộ môn</span>}
              value={departments.length}
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#0f172a' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="card-premium overflow-hidden" styles={{ body: { padding: 0 } }}>
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-white/50">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã bộ môn..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              className="rounded-xl"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              allowClear
              placeholder="Lọc theo khoa"
              className="w-56 h-10 rounded-xl"
              value={selectedFacultyFilter}
              onChange={(val) => setSelectedFacultyFilter(val)}
            >
              {faculties.map((f) => (
                <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
              ))}
            </Select>
          </div>
          <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg cursor-pointer" />
        </div>
        <Table
          loading={isLoading}
          dataSource={filteredDepartments}
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
              <Briefcase className="w-4 h-4 text-brand-600" />
            </div>
            <span>{editingDepartment ? 'Cập Nhật Bộ Môn' : 'Thêm Bộ Môn Mới'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        okText={editingDepartment ? 'Cập nhật' : 'Thêm mới'}
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
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên bộ môn</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên bộ môn' }]}
                >
                  <Input placeholder="Công nghệ phần mềm" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã bộ môn</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mã bộ môn' }]}
                >
                  <Input placeholder="SE_DEPT" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="facultyId"
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Khoa trực thuộc</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn khoa' }]}
                >
                  <Select placeholder="Chọn khoa" className="rounded-xl h-11">
                    {faculties.map((f) => (
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
                  <Input.TextArea placeholder="Mô tả về bộ môn..." className="rounded-xl" rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

export default function DepartmentManagementPage() {
  return (
    <AppShell>
      <DepartmentManagementContent />
    </AppShell>
  );
}
