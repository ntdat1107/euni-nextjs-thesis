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
  Tag, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  App,
  Tooltip,
  Avatar,
  Divider
} from 'antd';
import { 
  Search, 
  UserPlus, 
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  RotateCcw,
  Edit3,
  Ban,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { useUsers, User } from '@/hooks/useUsers';
import { useRBAC } from '@/hooks/useRBAC';
import { useDepartments } from '@/hooks/useDepartments';
import TableSkeleton from '@/components/ui/TableSkeleton';

const { Title, Text } = Typography;

function UserManagementContent() {
  const { users = [], isLoading: loadingUsers, createUser, resetPassword, deleteUser, updateUser } = useUsers();
  const { roles = [], isLoading: loadingRBAC } = useRBAC();
  const { departments = [], isLoading: loadingDepts } = useDepartments();
  const { message, modal } = App.useApp();

  const isLoading = loadingUsers || loadingRBAC || loadingDepts;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const pendingUsers = users.filter(u => u.status === 'Pending').length;
  const disabledUsers = users.filter(u => u.status === 'Disabled').length;

  const handleCreateUser = async (values: any) => {
    try {
      const newUser = await createUser(values);
      setIsCreateModalOpen(false);
      createForm.resetFields();
      
      modal.success({
        title: 'Tài khoản đã được tạo thành công',
        content: (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="mb-2 text-slate-500">Vui lòng gửi thông tin sau cho người dùng:</p>
            <div className="space-y-1">
              <p><strong>Tên đăng nhập:</strong> {newUser.username}</p>
              <p><strong>Mật khẩu mặc định:</strong> <code className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded">EUni@2026</code></p>
            </div>
            <p className="mt-4 text-xs text-amber-600 font-medium">* Người dùng sẽ được yêu cầu đổi mật khẩu trong lần đăng nhập đầu tiên.</p>
          </div>
        ),
        okText: 'Đã hiểu',
        width: 500,
      });
    } catch (e) {}
  };

  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;
    try {
      updateUser(editingUser.id, values);
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (e) {}
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      ...user,
    });
    setIsEditModalOpen(true);
  };

  const handleResetPassword = (id: string) => {
    modal.confirm({
      title: 'Xác nhận cấp lại mật khẩu?',
      content: 'Mật khẩu của người dùng này sẽ được đặt lại về mặc định.',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        resetPassword(id);
      }
    });
  };

  const handleDeleteUser = (id: string) => {
    modal.confirm({
      title: 'Xác nhận xóa người dùng?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        deleteUser(id);
      }
    });
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Tag color="success" icon={<CheckCircle className="w-3 h-3" />} className="rounded-full px-3 font-bold border-0">
            Đã kích hoạt
          </Tag>
        );
      case 'Pending':
        return (
          <Tag color="processing" icon={<Clock className="w-3 h-3" />} className="rounded-full px-3 font-bold border-0">
            Chờ kích hoạt
          </Tag>
        );
      case 'Disabled':
        return (
          <Tag color="error" icon={<Ban className="w-3 h-3" />} className="rounded-full px-3 font-bold border-0">
            Đã vô hiệu
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Optimize lookups using Maps (O(1) instead of O(n) .find) - MUST be before columns
  const deptMap = React.useMemo(() => 
    new Map(departments.map(d => [d.code, d.name])),
    [departments]
  );
  
  const roleMap = React.useMemo(() => 
    new Map(roles.map(r => [r.code, r.name])),
    [roles]
  );

  const columns = React.useMemo(() => [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: any, record: User) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.username}`} 
            className="border border-slate-100 ring-2 ring-white shadow-sm"
          />
          <div>
            <div className="font-bold text-slate-900">{record.fullName}</div>
            <div className="text-xs text-slate-500 font-medium">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mã NV/GV',
      dataIndex: 'employeeId',
      key: 'employeeId',
      render: (text: string) => <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded text-xs">{text}</span>
    },
    {
      title: 'Phòng ban / Khoa',
      dataIndex: 'department',
      key: 'department',
      render: (code: string) => {
        const name = deptMap.get(code);
        return <span className="font-medium text-slate-600">{name || code}</span>;
      }
    },
    {
      title: 'Vai trò',
      dataIndex: 'roles',
      key: 'roles',
      render: (userRoles: string[]) => (
        <Space wrap>
          {userRoles.map(role => (
            <Tag key={role} color={role === 'ADMIN' ? 'volcano' : 'blue'} className="rounded-lg font-bold border-0 px-2 py-0.5 text-[10px] uppercase tracking-wider">
              {roleMap.get(role) || role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: User) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              icon={<Edit3 className="w-4 h-4 text-blue-500" />} 
              onClick={() => openEditModal(record)}
              className="hover:bg-blue-50 rounded-lg"
            />
          </Tooltip>
          <Tooltip title="Cấp lại mật khẩu">
            <Button 
              type="text" 
              icon={<RotateCcw className="w-4 h-4 text-amber-500" />} 
              onClick={() => handleResetPassword(record.id)}
              className="hover:bg-amber-50 rounded-lg"
            />
          </Tooltip>
          <Tooltip title="Xóa người dùng">
            <Button 
              type="text" 
              danger 
              icon={<Trash2 className="w-4 h-4" />} 
              onClick={() => handleDeleteUser(record.id)}
              className="hover:bg-rose-50 rounded-lg"
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [departments, roles, deptMap, roleMap]);

  if (isLoading) {
    return <TableSkeleton rows={10} columns={5} />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1 font-display tracking-tight">Quản lý người dùng</Title>
          <Text className="text-slate-500 font-medium">Hệ thống quản lý tài khoản cán bộ và giảng viên tập trung.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<UserPlus className="w-5 h-5" />} 
          onClick={() => setIsCreateModalOpen(true)}
          className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect"
        >
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={6}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số tài khoản</span>}
              value={totalUsers} 
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#0f172a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Đã kích hoạt</span>}
              value={activeUsers} 
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#059669' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Chờ kích hoạt</span>}
              value={pendingUsers} 
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="card-premium">
            <Statistic 
              title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Đã vô hiệu</span>}
              value={disabledUsers} 
              formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
              styles={{ content: { color: '#f43f5e' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* User Table */}
      <div className="flex flex-col gap-4">
        <Card className="card-premium overflow-hidden" styles={{ body: { padding: 0 } }}>
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
            <Input
              placeholder="Tìm kiếm người dùng, email, mã NV..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              className="max-w-md rounded-xl"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <Button icon={<RefreshCw className="w-4 h-4" />} type="text" className="rounded-lg" />
          </div>
          <Table 
            dataSource={filteredUsers} 
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
      </div>

      {/* Create User Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-display text-lg py-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-brand-600" />
            </div>
            <span>Tạo Tài Khoản Mới</span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        width={720}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        className="premium-modal"
        centered
        forceRender={true}
      >
        <div className="py-6">
          <Form form={createForm} layout="vertical" onFinish={handleCreateUser} requiredMark="optional">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item 
                  name="fullName" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Họ và tên</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input placeholder="Nguyễn Văn A" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="email" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>} 
                  rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                >
                  <Input placeholder="example@euni.edu.vn" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="username" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên đăng nhập</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                >
                  <Input placeholder="lecturer_a" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="employeeId" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã số NV/GV</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập mã số' }]}
                >
                  <Input placeholder="GV-001" className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="department" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đơn vị/Khoa</span>} 
                  rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
                >
                  <Select placeholder="Chọn phòng ban" className="rounded-xl h-11">
                    {departments.map(dept => (
                      <Select.Option key={dept.code} value={dept.code}>{dept.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="phone" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</span>}
                >
                  <Input placeholder="090..." className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item 
                  name="roles" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò hệ thống</span>} 
                  rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 vai trò' }]}
                >
                  <Select mode="multiple" placeholder="Chọn vai trò" className="rounded-xl min-h-[44px]">
                    {roles.map(r => (
                      <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-display text-lg py-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <span>Cập nhật thông tin: <span className="text-blue-600">{editingUser?.username}</span></span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
        width={720}
        okText="Cập nhật"
        cancelText="Hủy"
        className="premium-modal"
        centered
        forceRender={true}
      >
        <div className="py-6">
          <Form form={editForm} layout="vertical" onFinish={handleUpdateUser} requiredMark="optional">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item 
                  name="fullName" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Họ và tên</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="email" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>} 
                  rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                >
                  <Input className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="employeeId" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã số NV/GV</span>} 
                >
                  <Input className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="phone" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</span>}
                >
                  <Input className="rounded-xl h-11" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="department" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đơn vị/Khoa</span>} 
                >
                  <Select className="rounded-xl h-11">
                    {departments.map(dept => (
                      <Select.Option key={dept.code} value={dept.code}>{dept.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="status" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</span>} 
                >
                  <Select className="rounded-xl h-11">
                    <Select.Option value="Active">Đã kích hoạt</Select.Option>
                    <Select.Option value="Pending">Chờ kích hoạt</Select.Option>
                    <Select.Option value="Disabled">Đã vô hiệu</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item 
                  name="roles" 
                  label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò hệ thống</span>} 
                  rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 vai trò' }]}
                >
                  <Select mode="multiple" className="rounded-xl min-h-[44px]">
                    {roles.map(r => (
                      <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <AppShell>
      <UserManagementContent />
    </AppShell>
  );
}
