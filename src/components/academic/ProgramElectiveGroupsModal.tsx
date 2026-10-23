'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, InputNumber, Table, Tag, Tooltip, App, Empty } from 'antd';
import { Plus, Edit2, Trash2, Layers, AlertCircle, Check, X } from 'lucide-react';
import { ProgramStructure, ProgramElectiveGroup } from '@/types/academic';
import { programService } from '@/services/programService';

interface ProgramElectiveGroupsModalProps {
  open: boolean;
  structure: ProgramStructure | null;
  onClose: () => void;
  onRefresh: () => void;
  readOnly?: boolean;
}

export default function ProgramElectiveGroupsModal({
  open,
  structure,
  onClose,
  onRefresh,
  readOnly = false
}: ProgramElectiveGroupsModalProps) {
  const { modal, message } = App.useApp();
  const [form] = Form.useForm();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProgramElectiveGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsFormOpen(false);
      setEditingGroup(null);
      form.resetFields();
    }
  }, [open, form]);

  const handleStartAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    form.setFieldsValue({ minCredits: 6, minCourses: 2 });
    setIsFormOpen(true);
  };

  const handleStartEdit = (group: ProgramElectiveGroup) => {
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      minCredits: group.minCredits,
      minCourses: group.minCourses
    });
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
    form.resetFields();
  };

  const handleSaveGroup = async () => {
    if (!structure) return;
    try {
      const values = await form.validateFields();
      const minCredits = Number(values.minCredits);
      if (!minCredits || minCredits <= 0) {
        message.error('Số tín chỉ tối thiểu phải lớn hơn 0');
        return;
      }
      setSubmitting(true);
      if (editingGroup) {
        await programService.updateElectiveGroup(editingGroup.id, {
          name: values.name.trim(),
          minCredits,
          minCourses: Number(values.minCourses || 0)
        });
        message.success('Cập nhật hướng tự chọn thành công');
      } else {
        await programService.addElectiveGroup(structure.id, {
          name: values.name.trim(),
          minCredits,
          minCourses: Number(values.minCourses || 0)
        });
        message.success('Thêm hướng tự chọn thành công');
      }
      handleCancelForm();
      onRefresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || 'Không thể lưu hướng tự chọn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = (group: ProgramElectiveGroup) => {
    modal.confirm({
      title: 'Xác nhận xóa hướng tự chọn',
      content: `Bạn có chắc muốn xóa "${group.name}"? Dữ liệu gán môn học vào hướng này cũng sẽ được cập nhật.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          await programService.deleteElectiveGroup(group.id);
          message.success('Đã xóa hướng tự chọn thành công');
          onRefresh();
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Không thể xóa hướng tự chọn');
        }
      }
    });
  };

  const groups = structure?.electiveGroups || [];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <Layers size={18} />
          </span>
          <div>
            <div className="font-bold text-sm">Quản lý Hướng / Nhóm tự chọn chuyên sâu</div>
            <div className="text-xs text-slate-500 font-normal">
              Khối: <span className="font-semibold text-slate-700">{structure?.name}</span> ({structure?.code})
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg">
          Đóng
        </Button>
      ]}
      width={680}
      centered
      destroyOnClose
    >
      <div className="space-y-4 pt-3">
        {/* Helper Note */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 text-xs text-purple-800 flex items-start gap-2">
          <AlertCircle size={16} className="text-purple-600 shrink-0 mt-0.5" />
          <span>
            Nhóm tự chọn định hình các hướng chuyên môn (theo TT 17/2021/TT-BGDĐT). Sinh viên phải tích lũy tối thiểu số tín chỉ của hướng đã chọn.
          </span>
        </div>

        {/* Action Header */}
        {!readOnly && !isFormOpen && (
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={handleStartAdd}
              className="rounded-lg h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 border-none flex items-center gap-1 cursor-pointer"
            >
              Thêm hướng tự chọn
            </Button>
          </div>
        )}

        {/* Inline Add / Edit Form */}
        {isFormOpen && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {editingGroup ? 'Chỉnh sửa hướng tự chọn' : 'Thêm mới hướng tự chọn'}
            </div>
            <Form form={form} layout="vertical" className="space-y-2">
              <Form.Item
                name="name"
                label={<span className="text-xs font-semibold text-slate-700">Tên hướng tự chọn / chuyên sâu</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên hướng tự chọn' }]}
                className="!mb-2"
              >
                <Input placeholder="Ví dụ: Hướng Trí tuệ Nhân tạo & Xử lý Dữ liệu" className="rounded-lg h-9 text-xs" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="minCredits"
                  label={<span className="text-xs font-semibold text-slate-700">Tối thiểu số tín chỉ</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập số tín chỉ tối thiểu' }]}
                  className="!mb-2"
                >
                  <InputNumber min={1} max={60} className="w-full rounded-lg h-9 text-xs" />
                </Form.Item>
                <Form.Item
                  name="minCourses"
                  label={<span className="text-xs font-semibold text-slate-700">Tối thiểu số môn học</span>}
                  className="!mb-2"
                >
                  <InputNumber min={0} max={20} className="w-full rounded-lg h-9 text-xs" />
                </Form.Item>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="small" onClick={handleCancelForm} className="rounded-lg text-xs">
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="small"
                  loading={submitting}
                  onClick={handleSaveGroup}
                  className="rounded-lg text-xs bg-purple-600 hover:bg-purple-700 border-none"
                >
                  {editingGroup ? 'Cập nhật' : 'Tạo nhóm'}
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* Groups List Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <Table
            dataSource={groups}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có hướng tự chọn nào cho khối kiến thức này"
                />
              )
            }}
            columns={[
              {
                title: 'Tên hướng tự chọn',
                dataIndex: 'name',
                key: 'name',
                render: (val: string) => <span className="font-semibold text-slate-800 text-xs">{val}</span>
              },
              {
                title: 'Tối thiểu tín chỉ',
                dataIndex: 'minCredits',
                key: 'minCredits',
                width: 140,
                align: 'center',
                render: (val: number) => (
                  <Tag color="purple" className="rounded-full text-xs font-bold border-none px-2.5">
                    ≥ {val || 0} TC
                  </Tag>
                )
              },
              {
                title: 'Tối thiểu môn',
                dataIndex: 'minCourses',
                key: 'minCourses',
                width: 110,
                align: 'center',
                render: (val: number) => <span className="text-xs text-slate-600">{val ? `${val} môn` : '-'}</span>
              },
              ...(!readOnly ? [
                {
                  title: 'Thao tác',
                  key: 'actions',
                  width: 90,
                  align: 'center' as const,
                  render: (_: any, record: ProgramElectiveGroup) => (
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip title="Chỉnh sửa">
                        <Button
                          type="text"
                          size="small"
                          icon={<Edit2 size={13} className="text-blue-600" />}
                          onClick={() => handleStartEdit(record)}
                          className="hover:bg-blue-50 rounded cursor-pointer"
                        />
                      </Tooltip>
                      <Tooltip title="Xóa hướng này">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<Trash2 size={13} />}
                          onClick={() => handleDeleteGroup(record)}
                          className="hover:bg-rose-50 rounded cursor-pointer"
                        />
                      </Tooltip>
                    </div>
                  )
                }
              ] : [])
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
