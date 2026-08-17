'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Tabs, 
  Table, 
  Button, 
  Card, 
  Modal, 
  Form, 
  Input, 
  Checkbox, 
  Tag, 
  Space, 
  Typography,
  App,
  Select,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Plus, 
  Save,
  Trash2,
  Settings2,
  ShieldAlert
} from 'lucide-react';
import { Role, Permission } from '@/services/rbacService';
import { User } from '@/services/userService';
import { useRBAC } from '@/hooks/useRBAC';
import { useUsers } from '@/hooks/useUsers';
import TableSkeleton from '@/components/ui/TableSkeleton';

const { Title, Text, Paragraph } = Typography;

function RBACContent() {
  const { 
    permissions = [], 
    roles = [], 
    isLoading: loadingRBAC,
    addPermission, 
    addRole, 
    updateRolePermissions,
    deleteRole,
    deletePermission
  } = useRBAC();
  const { users = [], isLoading: loadingUsers, updateUser } = useUsers();
  const { message } = App.useApp();

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  // --- User Assignment Logic ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const isLoading = loadingRBAC || loadingUsers;

  const openUserEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
  };

  const handleSaveUserRoles = () => {
    if (editingUser) {
      updateUser(editingUser.id, { roles: selectedRoles });
      setEditingUser(null);
    }
  };

  // --- Permission Matrix Logic (Memoized for performance) ---
  const matrixColumns = React.useMemo(() => [
    {
      title: 'Vai trò (Roles)',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 200,
      render: (text: string, record: Role) => (
        <div>
          <div className="font-semibold text-slate-900">{text}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{record.code}</div>
        </div>
      ),
    },
    ...permissions.map(perm => ({
      title: (
        <div className="text-center">
          <div className="text-xs font-medium text-slate-600 whitespace-nowrap">{perm.name}</div>
          <Tag className="text-[9px] m-0 border-none bg-slate-100 text-slate-400">{perm.code}</Tag>
        </div>
      ),
      key: perm.code,
      align: 'center' as const,
      render: (_: any, record: Role) => {
        const hasPermission = record.permissions?.some(p => p.code === perm.code);
        return (
          <Checkbox 
            checked={hasPermission}
            onChange={(e) => {
              const currentPermIds = record.permissions?.map(p => p.id) || [];
              const newPermIds = e.target.checked 
                ? [...currentPermIds, perm.id]
                : currentPermIds.filter(id => id !== perm.id);
              updateRolePermissions(record.id, newPermIds);
            }}
          />
        );
      },
    })),
  ], [permissions, updateRolePermissions]);

  if (isLoading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  const handleAddPerm = (values: any) => {
    addPermission(values);
    setIsPermModalOpen(false);
    form.resetFields();
  };

  const handleAddRole = (values: any) => {
    addRole(values);
    setIsRoleModalOpen(false);
    form.resetFields();
  };

  const handleDeleteRole = (id: number | string) => {
    Modal.confirm({
      title: 'Xóa vai trò?',
      content: 'Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteRole(id)
    });
  };

  const handleDeletePermission = (id: number | string) => {
    Modal.confirm({
      title: 'Xóa quyền hạn?',
      content: 'Bạn có chắc chắn muốn xóa quyền hạn này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deletePermission(id)
    });
  };

  // --- Action-Level 9 Step Matrix Data ---
  const stepMatrixData = [
    { step: 'B1: Khảo sát nhu cầu', DTDH: 'V', DEAN: 'V, C, U, A', HEAD_DEPT: 'V, C, U', LECTURER: 'V', COMMITTEE: 'V', COUNCIL: 'V', QA: 'V' },
    { step: 'B2: XD mục tiêu, chuẩn đầu ra (PLO)', DTDH: 'V', DEAN: 'V, A', HEAD_DEPT: 'V, C, U', LECTURER: 'V', COMMITTEE: 'V, C, U', COUNCIL: 'V', QA: '' },
    { step: 'B3: Cấu trúc, khối lượng kiến thức', DTDH: 'V', DEAN: 'V, A', HEAD_DEPT: 'V, A', LECTURER: 'V', COMMITTEE: 'V, C, U', COUNCIL: 'V', QA: '' },
    { step: 'B4: Đối chiếu, so sánh CTĐT', DTDH: 'V', DEAN: 'V', HEAD_DEPT: 'V', LECTURER: 'V', COMMITTEE: 'V, C, U', COUNCIL: 'V', QA: '' },
    { step: 'B5: Thiết kế đề cương học phần (CLO)', DTDH: 'V', DEAN: 'V, A', HEAD_DEPT: 'V, U, A', LECTURER: 'V, C, U*', COMMITTEE: 'V, C, U', COUNCIL: 'V', QA: '' },
    { step: 'B6: Ma trận phát triển kiến thức', DTDH: 'V', DEAN: 'V, A', HEAD_DEPT: 'V', LECTURER: 'V', COMMITTEE: 'V, C, U', COUNCIL: 'V', QA: '' },
    { step: 'B7: Tổ chức hội thảo lấy ý kiến', DTDH: 'V', DEAN: 'V, A', HEAD_DEPT: 'V', LECTURER: 'V', COMMITTEE: 'V, C, U', COUNCIL: 'V', QA: 'V, C, U' },
    { step: 'B8: HĐ Khoa chuyên môn thẩm định', DTDH: 'V', DEAN: 'V, A', HEAD_DEPT: 'V', LECTURER: 'V', COMMITTEE: 'V', COUNCIL: 'V, C, U, A', QA: '' },
    { step: 'B9: Trình HĐ Khoa học đào tạo Trường', DTDH: 'V, A', DEAN: 'V, U', HEAD_DEPT: 'V', LECTURER: 'V', COMMITTEE: 'V', COUNCIL: 'V', QA: '' },
  ];

  const renderActionBadges = (val: string) => {
    if (!val) return <span className="text-slate-300 font-mono text-xs">-</span>;
    const actions = val.replace('*', '').split(',').map(a => a.trim());
    const isDataAuth = val.includes('*');
    return (
      <div className="flex items-center justify-center gap-1">
        {actions.map((act) => {
          let color = 'bg-slate-100 text-slate-700';
          if (act === 'V') color = 'bg-blue-50 text-blue-700 border-blue-200';
          if (act === 'C') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          if (act === 'U') color = 'bg-amber-50 text-amber-700 border-amber-200';
          if (act === 'A') color = 'bg-purple-50 text-purple-700 border-purple-200';
          return (
            <Tag key={act} className={`m-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
              {act}
            </Tag>
          );
        })}
        {isDataAuth && (
          <Tooltip title="Data-level Authorization: Giảng viên chỉ có quyền C, U trên các học phần được phân công. Các học phần khác chỉ được View (V).">
            <Tag color="red" className="m-0 text-[10px] font-bold px-1 py-0 rounded cursor-pointer">*</Tag>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <Tabs
          defaultActiveKey="step-matrix"
          items={[
            {
              key: 'step-matrix',
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-edu-primary" />
                  Ma Trận Thao Tác 9 Bước (Action-Level)
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <Title level={4} className="!mb-1">Ma Trận Phân Quyền Thao Tác 9 Bước Nghiệp Vụ</Title>
                      <Paragraph className="text-slate-500 text-sm !mb-0">
                        Quy định quyền Xem (V), Tạo (C), Cập nhật (U), Phê duyệt (A) chi tiết bên trong màn hình Workspace cho quy trình mở mới và điều chỉnh CTĐT.
                      </Paragraph>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 mr-1">Chú thích:</span>
                      <Tag color="blue" className="m-0 text-[10px] font-bold">V = Xem</Tag>
                      <Tag color="green" className="m-0 text-[10px] font-bold">C = Tạo/Thêm mới</Tag>
                      <Tag color="gold" className="m-0 text-[10px] font-bold">U = Cập nhật/Sửa</Tag>
                      <Tag color="purple" className="m-0 text-[10px] font-bold">A = Phê duyệt</Tag>
                    </div>
                  </div>

                  <Table 
                    dataSource={stepMatrixData} 
                    pagination={false}
                    bordered
                    rowKey="step"
                    columns={[
                      {
                        title: 'Bước thực hiện theo Quy định',
                        dataIndex: 'step',
                        key: 'step',
                        fixed: 'left',
                        width: 260,
                        render: (text) => <span className="font-semibold text-slate-900 text-xs">{text}</span>
                      },
                      { title: 'Chuyên viên ĐTĐH', dataIndex: 'DTDH', key: 'DTDH', align: 'center', render: renderActionBadges },
                      { title: 'Trưởng Khoa', dataIndex: 'DEAN', key: 'DEAN', align: 'center', render: renderActionBadges },
                      { title: 'Trưởng Bộ môn', dataIndex: 'HEAD_DEPT', key: 'HEAD_DEPT', align: 'center', render: renderActionBadges },
                      { title: 'Giảng viên', dataIndex: 'LECTURER', key: 'LECTURER', align: 'center', render: renderActionBadges },
                      { title: 'Tổ soạn thảo', dataIndex: 'COMMITTEE', key: 'COMMITTEE', align: 'center', render: renderActionBadges },
                      { title: 'HĐ Thẩm định', dataIndex: 'COUNCIL', key: 'COUNCIL', align: 'center', render: renderActionBadges },
                      { title: 'Chuyên viên ĐBCL', dataIndex: 'QA', key: 'QA', align: 'center', render: renderActionBadges },
                    ]}
                  />

                  <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong>Quy tắc Nghiệp vụ Data-level Authorization áp dụng cho Giảng viên (LECTURER) tại Bước 5:</strong><br />
                      Giảng viên có quyền <strong>V, C, U</strong> tại Bước 5 (Thiết kế đề cương học phần CLO), nhưng hệ thống kiểm soát chỉ cho phép chỉnh sửa trên các Học phần (Môn học) được Trưởng bộ môn/Trưởng khoa gán quyền (assign). Các học phần của giảng viên khác sẽ tự động hiển thị ở chế độ Read-Only (Xem).
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'matrix',
              label: (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Ma Trận Quyền Hệ Thống
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="mb-6">
                    <Title level={4} className="!mb-0">Gán Quyền Chi Tiết Cho Vai Trò</Title>
                    <Paragraph className="text-slate-500 text-sm">Tích chọn các quyền hạn tương ứng cho từng vai trò trong hệ thống.</Paragraph>
                  </div>
                  <Table 
                    dataSource={roles} 
                    columns={matrixColumns} 
                    pagination={false} 
                    scroll={{ x: 'max-content' }}
                    bordered
                    rowKey="id"
                  />
                </div>
              ),
            },
            {
              key: 'roles-mgmt',
              label: (
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Danh mục Vai trò
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="flex justify-between items-center mb-6">
                    <Title level={4} className="!mb-0">Danh Sách Vai Trò</Title>
                    <Button 
                      type="primary" 
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setIsRoleModalOpen(true)}
                    >
                      Thêm Vai Trò
                    </Button>
                  </div>
                  <Table 
                    dataSource={roles} 
                    rowKey="id"
                    columns={[
                      { title: 'Tên vai trò', dataIndex: 'name', key: 'name' },
                      { title: 'Mã vai trò', dataIndex: 'code', key: 'code', render: (code) => <Tag color="orange">{code}</Tag> },
                      { 
                        title: 'Số lượng quyền', 
                        key: 'permsCount', 
                        render: (_, record) => <span>{(record.permissions || []).length} quyền</span> 
                      },
                      { 
                        title: 'Thao tác', 
                        key: 'action', 
                        render: (_, record) => (
                          <Space>
                            <Button type="link" size="small">Sửa</Button>
                            <Button 
                              type="link" 
                              size="small" 
                              danger 
                              icon={<Trash2 className="w-3 h-3" />}
                              onClick={() => handleDeleteRole(record.id)}
                            >
                              Xóa
                            </Button>
                          </Space>
                        ) 
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'permissions-mgmt',
              label: (
                <span className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Danh mục Quyền
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="flex justify-between items-center mb-6">
                    <Title level={4} className="!mb-0">Danh Sách Quyền Hạn</Title>
                    <Button 
                      type="primary" 
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setIsPermModalOpen(true)}
                    >
                      Thêm Quyền Mới
                    </Button>
                  </div>
                  <Table 
                    dataSource={permissions} 
                    rowKey="id"
                    columns={[
                      { title: 'Tên quyền', dataIndex: 'name', key: 'name' },
                      { title: 'Mã quyền', dataIndex: 'code', key: 'code', render: (code) => <Tag color="blue">{code}</Tag> },
                      { title: 'Mô tả', dataIndex: 'description', key: 'description' },
                      { 
                        title: 'Thao tác', 
                        key: 'action', 
                        render: (_, record: Permission) => (
                          <Space>
                            <Button type="link" size="small">Sửa</Button>
                            <Button 
                              type="link" 
                              size="small" 
                              danger 
                              icon={<Trash2 className="w-3 h-3" />}
                              onClick={() => handleDeletePermission(record.id)}
                            >
                              Xóa
                            </Button>
                          </Space>
                        ) 
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'users-assignment',
              label: (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gán Người Dùng
                </span>
              ),
              children: (
                <div className="py-4">
                  <div className="mb-6">
                    <Title level={4} className="!mb-0">Phân Vai Trò Cho Người Dùng</Title>
                    <Paragraph className="text-slate-500 text-sm">Gán một hoặc nhiều vai trò cho từng cán bộ, giảng viên.</Paragraph>
                  </div>
                  <Table 
                    dataSource={users} 
                    columns={[
                      {
                        title: 'Người dùng',
                        dataIndex: 'username',
                        key: 'username',
                        width: 250,
                        render: (text: string, record: User) => (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                              {text.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{text}</div>
                              <div className="text-xs text-slate-500">{record.email}</div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Vai trò đang gán',
                        dataIndex: 'roles',
                        key: 'roles',
                        render: (userRoles: string[]) => (
                          <div className="flex flex-col gap-1 py-1">
                            {userRoles.length > 0 ? (
                              userRoles.map(roleCode => {
                                const roleName = roles.find(r => r.code === roleCode)?.name || roleCode;
                                return (
                                  <div key={roleCode} className="flex">
                                    <Tag color="blue" className="m-0 border-none bg-blue-50 text-blue-700 text-xs px-2 py-0.5">
                                      {roleName}
                                    </Tag>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-slate-400 text-xs italic">Chưa gán vai trò</span>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'Thao tác',
                        key: 'action',
                        width: 120,
                        align: 'center' as const,
                        render: (_: any, record: User) => (
                          <Button 
                            type="link" 
                            icon={<Users className="w-4 h-4" />} 
                            onClick={() => openUserEdit(record)}
                          >
                            Sửa Vai Trò
                          </Button>
                        ),
                      },
                    ]} 
                    rowKey="id"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modals */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Chỉnh sửa vai trò: <span className="text-blue-600">{editingUser?.username}</span></span>
          </div>
        }
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        onOk={handleSaveUserRoles}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={400}
      >
        <div className="py-4">
          <Text type="secondary" className="block mb-4">
            Chọn các vai trò mà bạn muốn gán cho người dùng này:
          </Text>
          <Checkbox.Group 
            className="w-full" 
            value={selectedRoles}
            onChange={(values) => setSelectedRoles(values as string[])}
          >
            <div className="flex flex-col gap-3">
              {roles.map(role => (
                <div key={role.code} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <Checkbox value={role.code} className="w-full">
                    <span className="font-medium text-slate-700">{role.name}</span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-tighter">{role.code}</span>
                  </Checkbox>
                </div>
              ))}
            </div>
          </Checkbox.Group>
        </div>
      </Modal>

      <Modal
        title="Tạo Quyền Hạn Mới"
        open={isPermModalOpen}
        onCancel={() => setIsPermModalOpen(false)}
        onOk={() => form.submit()}
        forceRender={true}
      >
        <Form form={form} layout="vertical" onFinish={handleAddPerm}>
          <Form.Item name="name" label="Tên quyền" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Phê duyệt hồ sơ" />
          </Form.Item>
          <Form.Item name="code" label="Mã quyền" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: APPROVER" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Nhập mô tả quyền hạn..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo Vai Trò Mới"
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        onOk={() => form.submit()}
        forceRender={true}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRole}>
          <Form.Item name="name" label="Tên vai trò" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Trưởng khoa" />
          </Form.Item>
          <Form.Item name="code" label="Mã vai trò" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: DEAN" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function RBACPage() {
  const { permissions = [], roles = [] } = useRBAC();
  const { users = [] } = useUsers();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 font-display tracking-tight">Quản Trị Phân Quyền</Title>
            <Text className="text-slate-500 font-medium">Hệ thống quản lý ma trận gán quyền và phân vai trò người dùng tập trung.</Text>
          </div>
          <Button 
            type="primary" 
            icon={<Save className="w-5 h-5" />}
            className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect"
          >
            Lưu Thay Đổi
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card className="card-premium">
              <Statistic 
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tổng số vai trò</span>}
                value={roles.length} 
                formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
                styles={{ content: { color: '#0f172a' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="card-premium">
              <Statistic 
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Quyền hạn hệ thống</span>}
                value={permissions.length} 
                formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
                styles={{ content: { color: '#3b82f6' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="card-premium">
              <Statistic 
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tài khoản đã gán</span>}
                value={users.filter(u => u.roles.length > 0).length} 
                formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
                styles={{ content: { color: '#059669' } }}
              />
            </Card>
          </Col>
        </Row>

        <RBACContent />
      </div>
    </AppShell>
  );
}
