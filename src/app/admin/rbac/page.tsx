'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
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
  Row, 
  Col, 
  Statistic,
  Divider
} from 'antd';
import { 
  Plus, 
  Trash2,
  Search,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { Role } from '@/services/rbacService';
import { useRBAC } from '@/hooks/useRBAC';
import { useUsers } from '@/hooks/useUsers';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { SIDEBAR_PAGES, NAV_PAGES, NavPageItem } from '@/constants/navigationPages';

const { Title, Text } = Typography;

export type PermissionState = Record<string, Record<string, { view: boolean; createUpdate: boolean }>>;

function getDefaultPagePermissions(roles: Role[]): PermissionState {
  const initialMap: PermissionState = {};

  SIDEBAR_PAGES.forEach((page) => {
    initialMap[page.id] = {};
    const navItem = NAV_PAGES.find((p) => p.id === page.id);

    roles.forEach((role) => {
      const code = role.code.replace(/^ROLE_/, '').toUpperCase();
      let view = false;
      let createUpdate = false;

      if (code === 'ADMIN') {
        view = true;
        createUpdate = true;
      } else if (navItem) {
        view = navItem.defaultRoles.includes(code);
        createUpdate = navItem.createUpdateRoles ? navItem.createUpdateRoles.includes(code) : false;
      }

      initialMap[page.id][code] = { view, createUpdate };
    });
  });

  return initialMap;
}

function RBACContent() {
  const { 
    roles = [], 
    isLoading: loadingRBAC,
    addRole, 
    updateRole,
    deleteRole
  } = useRBAC();
  const { users = [], isLoading: loadingUsers } = useUsers();
  const { message } = App.useApp();

  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [createRoleForm] = Form.useForm();
  const [editRoleForm] = Form.useForm();

  // Search filter for roles
  const [searchText, setSearchText] = useState('');
  
  // Page Permissions State
  const [pagePerms, setPagePerms] = useState<PermissionState>({});

  // Role being edited in modal
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const isLoading = loadingRBAC || loadingUsers;

  // Load / Initialize page permissions
  useEffect(() => {
    if (roles.length === 0) return;

    const savedStr = localStorage.getItem('euni_sidebar_page_permissions');
    const defaultPerms = getDefaultPagePermissions(roles);

    if (savedStr) {
      try {
        const savedPerms = JSON.parse(savedStr);
        const merged: PermissionState = { ...defaultPerms };
        Object.keys(savedPerms).forEach((pageId) => {
          if (!merged[pageId]) merged[pageId] = {};
          Object.keys(savedPerms[pageId]).forEach((roleCode) => {
            merged[pageId][roleCode] = savedPerms[pageId][roleCode];
          });
        });
        setPagePerms(merged);
        return;
      } catch (e) {}
    }

    setPagePerms(defaultPerms);
  }, [roles]);

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    editRoleForm.setFieldsValue({
      name: role.name,
      code: role.code,
    });
  };

  const handleTogglePermission = (pageId: string, roleCode: string, type: 'view' | 'createUpdate', checked: boolean) => {
    const normalizedCode = roleCode.replace(/^ROLE_/, '').toUpperCase();
    if (normalizedCode === 'ADMIN') return; // Admin always has full access

    setPagePerms((prev) => {
      const pagePerm = prev[pageId] || {};
      const currentRolePerm = pagePerm[normalizedCode] || { view: false, createUpdate: false };

      let newView = currentRolePerm.view;
      let newCU = currentRolePerm.createUpdate;

      if (type === 'createUpdate') {
        newCU = checked;
        if (checked) newView = true;
      } else if (type === 'view') {
        newView = checked;
        if (!checked) newCU = false;
      }

      return {
        ...prev,
        [pageId]: {
          ...pagePerm,
          [normalizedCode]: {
            view: newView,
            createUpdate: newCU,
          },
        },
      };
    });
  };

  const handleSaveRoleEdit = async () => {
    if (!editingRole) return;
    try {
      const values = await editRoleForm.validateFields();
      
      // Update role info
      updateRole(editingRole.id, values);

      // Save page permissions to localStorage
      localStorage.setItem('euni_sidebar_page_permissions', JSON.stringify(pagePerms));
      
      setEditingRole(null);
      message.success('Cập nhật thông tin vai trò và phân quyền trang thành công!');
    } catch (e) {}
  };

  const handleAddRole = (values: any) => {
    addRole(values);
    setIsCreateRoleModalOpen(false);
    createRoleForm.resetFields();
  };

  const handleDeleteRole = (id: number | string) => {
    Modal.confirm({
      title: 'Xóa vai trò?',
      content: 'Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteRole(id),
    });
  };

  const filteredRoles = useMemo(() => {
    if (!searchText) return roles;
    const query = searchText.toLowerCase();
    return roles.filter((r) => 
      r.name.toLowerCase().includes(query) || 
      r.code.toLowerCase().includes(query)
    );
  }, [roles, searchText]);

  const activeRoleCode = useMemo(() => {
    if (!editingRole) return '';
    return editingRole.code.replace(/^ROLE_/, '').toUpperCase();
  }, [editingRole]);

  if (isLoading) {
    return <TableSkeleton rows={8} columns={5} />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 font-display tracking-tight">Quản Trị Vai Trò & Phân Quyền (RBAC)</Title>
            <Text className="text-slate-500 font-medium">Quản lý danh sách vai trò hệ thống và phân quyền truy cập trang Sidebar cho từng vai trò.</Text>
          </div>
          <Button 
            type="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="h-11 px-6 shadow-lg shadow-brand-100 btn-hover-effect flex items-center gap-2"
          >
            Thêm Vai Trò Mới
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
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Số trang hệ thống</span>}
                value={SIDEBAR_PAGES.length} 
                formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
                styles={{ content: { color: '#2563eb' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="card-premium">
              <Statistic 
                title={<span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tài khoản đã gán vai trò</span>}
                value={users.filter(u => u.roles.length > 0).length} 
                formatter={(val) => <span className="font-outfit font-extrabold">{val}</span>}
                styles={{ content: { color: '#059669' } }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Roles List Table Card */}
        <Card className="card-premium overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50">
            <div>
              <Title level={4} className="!mb-0">Danh Sách Vai Trò Hệ Thống</Title>
              <Text type="secondary" className="text-xs">Bấm nút "Sửa" để thay đổi thông tin và phân quyền các trang Sidebar cho từng vai trò.</Text>
            </div>
            <Input
              placeholder="Tìm kiếm vai trò theo tên hay mã..."
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md rounded-xl"
            />
          </div>

          <Table 
            dataSource={filteredRoles} 
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={false}
            columns={[
              { 
                title: 'Tên vai trò', 
                dataIndex: 'name', 
                key: 'name', 
                width: 220,
                render: (text) => <span className="font-bold text-slate-900">{text}</span> 
              },
              { 
                title: 'Mã vai trò', 
                dataIndex: 'code', 
                key: 'code', 
                width: 140,
                render: (code) => <Tag color="orange" className="font-bold border-none px-2 py-0.5">{code}</Tag> 
              },
              { 
                title: 'Số trang có quyền truy cập', 
                key: 'pagesCount', 
                width: 220,
                render: (_, record) => {
                  const normalized = record.code.replace(/^ROLE_/, '').toUpperCase();
                  if (normalized === 'ADMIN') {
                    return <span className="font-semibold text-emerald-600">{SIDEBAR_PAGES.length} / {SIDEBAR_PAGES.length} trang (Tất cả)</span>;
                  }

                  const count = SIDEBAR_PAGES.filter((p) => pagePerms[p.id]?.[normalized]?.view).length;
                  return (
                    <span className="font-semibold text-slate-700">
                      {count} / {SIDEBAR_PAGES.length} trang
                    </span>
                  );
                } 
              },
              { 
                title: 'Số người dùng gán vai trò', 
                key: 'usersCount', 
                width: 200,
                render: (_, record) => {
                  const count = users.filter((u) => u.roles.includes(record.code)).length;
                  return <span className="font-medium text-slate-600">{count} người dùng</span>;
                } 
              },
              { 
                title: 'Thao tác', 
                key: 'action', 
                align: 'right' as const,
                width: 140,
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => openEditModal(record)}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Sửa
                    </Button>
                    <Button 
                      type="link" 
                      size="small" 
                      danger 
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => handleDeleteRole(record.id)}
                    >
                      Xóa
                    </Button>
                  </Space>
                ) 
              },
            ]}
          />
        </Card>
      </div>

      {/* Edit Role & Sidebar Permissions Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 font-display text-lg py-1">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <span>Chỉnh sửa vai trò & Cấu hình phân quyền trang</span>
          </div>
        }
        open={!!editingRole}
        onCancel={() => setEditingRole(null)}
        onOk={handleSaveRoleEdit}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={720}
        centered
        forceRender={true}
      >
        <div className="py-3 flex flex-col gap-5">
          {/* Role Info Form */}
          <Form form={editRoleForm} layout="vertical" requiredMark="optional">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="name" 
                  label={<span className="text-xs font-bold uppercase text-slate-500">Tên vai trò</span>} 
                  rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
                >
                  <Input placeholder="Ví dụ: Trưởng khoa" className="rounded-xl h-10" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="code" 
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold uppercase text-slate-500">Mã vai trò</span>
                      <span className="text-[10px] text-slate-400 font-normal italic">(Cố định)</span>
                    </div>
                  } 
                  rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}
                >
                  <Input placeholder="Ví dụ: DEAN" className="rounded-xl h-10 uppercase font-mono bg-slate-50 text-slate-700 cursor-not-allowed" disabled />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider className="my-0" />

          {/* Sidebar Pages Permission Panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Quyền Hạn Truy Cập Các Trang Sidebar</span>
                <span className="text-xs text-slate-500">Tích chọn quyền Xem (V) và Tạo & Sửa (C&U) cho vai trò <strong className="text-blue-600">{editingRole?.name}</strong>:</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
                <Tag color="blue" className="m-0 font-bold text-[10px]">V = Xem</Tag>
                <Tag color="gold" className="m-0 font-bold text-[10px]">C&U = Tạo & Sửa</Tag>
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl">
              <Table 
                dataSource={SIDEBAR_PAGES}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Trang hệ thống',
                    dataIndex: 'name',
                    key: 'name',
                    render: (_: string, record: any) => (
                      <div className="py-1">
                        <div className="font-bold text-slate-900 text-xs">{record.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Tag className="m-0 text-[9px] font-bold border-none px-1.5 py-0 bg-slate-100 text-slate-500">
                            {record.category}
                          </Tag>
                          <code className="text-[10px] text-slate-400 font-mono">{record.path}</code>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'Quyền thao tác',
                    key: 'permissions',
                    width: 220,
                    align: 'right' as const,
                    render: (_: any, record: any) => {
                      const current = pagePerms[record.id]?.[activeRoleCode] || { view: false, createUpdate: false };
                      const isAdmin = activeRoleCode === 'ADMIN';

                      return (
                        <div className="flex items-center justify-end gap-3 py-1">
                          <Checkbox
                            checked={isAdmin ? true : current.view}
                            disabled={isAdmin}
                            onChange={(e) => handleTogglePermission(record.id, activeRoleCode, 'view', e.target.checked)}
                          >
                            <span className={`text-xs ${current.view ? 'font-bold text-blue-700' : 'text-slate-500'}`}>
                              V <span className="text-[10px] text-slate-400">(Xem)</span>
                            </span>
                          </Checkbox>
                          <Checkbox
                            checked={isAdmin ? true : current.createUpdate}
                            disabled={isAdmin}
                            onChange={(e) => handleTogglePermission(record.id, activeRoleCode, 'createUpdate', e.target.checked)}
                          >
                            <span className={`text-xs ${current.createUpdate ? 'font-bold text-amber-700' : 'text-slate-500'}`}>
                              C&U <span className="text-[10px] text-slate-400">(Tạo/Sửa)</span>
                            </span>
                          </Checkbox>
                        </div>
                      );
                    },
                  },
                ]}
              />
            </div>

            <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-900">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Tự động đồng bộ: Tích chọn <strong>C&U</strong> sẽ tự động bật <strong>V (Xem)</strong>. Bỏ tích <strong>V</strong> sẽ tự động hủy <strong>C&U</strong>.
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Role Modal */}
      <Modal
        title="Tạo Vai Trò Mới"
        open={isCreateRoleModalOpen}
        onCancel={() => setIsCreateRoleModalOpen(false)}
        onOk={() => createRoleForm.submit()}
        forceRender={true}
      >
        <Form form={createRoleForm} layout="vertical" onFinish={handleAddRole}>
          <Form.Item name="name" label="Tên vai trò" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
            <Input placeholder="Ví dụ: Trưởng khoa" />
          </Form.Item>
          <Form.Item name="code" label="Mã vai trò" rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}>
            <Input placeholder="Ví dụ: DEAN" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function RBACPage() {
  return (
    <AppShell>
      <RBACContent />
    </AppShell>
  );
}
