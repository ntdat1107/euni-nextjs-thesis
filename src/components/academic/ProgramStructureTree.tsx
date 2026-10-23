'use client';

import React, { useState } from 'react';
import { Tree, Button, Modal, Form, Input, InputNumber, Typography, Tag, Tooltip, App, Empty } from 'antd';
import { Plus, Edit2, Trash2, Layers, BookOpen, GripVertical } from 'lucide-react';
import { ProgramStructure } from '@/types/academic';
import { programService } from '@/services/programService';
import ProgramElectiveGroupsModal from './ProgramElectiveGroupsModal';
import { cn } from '@/lib/utils';

const { Text, Title } = Typography;

interface ProgramStructureTreeProps {
  programId: number;
  structures: ProgramStructure[];
  onRefresh: () => void;
  readOnly?: boolean;
  onNavigateToCourses?: (structureId?: number) => void;
}

export default function ProgramStructureTree({
  programId,
  structures,
  onRefresh,
  readOnly = false,
  onNavigateToCourses
}: ProgramStructureTreeProps) {
  const { modal, message } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<ProgramStructure | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Elective groups management modal
  const [manageStructureId, setManageStructureId] = useState<number | null>(null);
  const [isElectiveModalOpen, setIsElectiveModalOpen] = useState(false);

  // Keep fresh structure object for elective groups modal
  const currentManageStructure = React.useMemo(() => {
    if (!manageStructureId) return null;
    const findInTree = (list: ProgramStructure[]): ProgramStructure | null => {
      for (const item of list) {
        if (item.id === manageStructureId) return item;
        if (item.children) {
          const found = findInTree(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInTree(structures);
  }, [manageStructureId, structures]);

  // Helper tìm danh sách anh em ruột (cùng parentId)
  const getSiblings = (items: ProgramStructure[], pId: number | null): ProgramStructure[] => {
    if (pId === null) return [...items];
    const findParent = (list: ProgramStructure[]): ProgramStructure | null => {
      for (const item of list) {
        if (item.id === pId) return item;
        if (item.children) {
          const found = findParent(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    const parent = findParent(items);
    return parent && parent.children ? [...parent.children] : [];
  };

  const handleOpenAdd = (parentId: number | null = null) => {
    setEditingStructure(null);
    setSelectedParentId(parentId);
    form.resetFields();
    form.setFieldsValue({
      parentId,
      creditRequired: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (struct: ProgramStructure) => {
    setEditingStructure(struct);
    setSelectedParentId(struct.parentId || null);
    form.setFieldsValue({
      code: struct.code,
      name: struct.name,
      creditRequired: struct.creditRequired,
      parentId: struct.parentId
    });
    setIsModalOpen(true);
  };

  const handleDelete = (struct: ProgramStructure) => {
    modal.confirm({
      title: 'Xác nhận xóa khối kiến thức',
      content: `Bạn có chắc muốn xóa "${struct.name}" (${struct.code})? Tất cả các khối con cũng sẽ bị xóa.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          await programService.deleteStructure(struct.id);
          message.success('Đã xóa khối kiến thức thành công');
          onRefresh();
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa khối kiến thức');
        }
      }
    });
  };

  const handleSaveStructure = async () => {
    try {
      const values = await form.validateFields();
      const creditRequiredNum = Number(values.creditRequired);
      if (!creditRequiredNum || creditRequiredNum <= 0) {
        message.error('Số tín chỉ yêu cầu phải lớn hơn 0');
        return;
      }

      setSubmitting(true);
      if (editingStructure) {
        await programService.updateStructure(editingStructure.id, {
          code: values.code,
          name: values.name,
          creditRequired: creditRequiredNum,
          parentId: editingStructure.parentId || null,
          orderIndex: editingStructure.orderIndex
        });
        message.success('Cập nhật khối kiến thức thành công');
      } else {
        const siblings = getSiblings(structures, selectedParentId);
        await programService.createStructure(programId, {
          code: values.code,
          name: values.name,
          creditRequired: creditRequiredNum,
          parentId: selectedParentId,
          orderIndex: siblings.length
        });
        message.success('Thêm khối kiến thức thành công');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.message || 'Không thể lưu khối kiến thức');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenManageGroups = (struct: ProgramStructure) => {
    setManageStructureId(struct.id);
    setIsElectiveModalOpen(true);
  };

  // Drag & Drop chỉ cho phép trong cùng 1 cấp (level)
  const allowDrop = ({ dropPosition, dragNode, dropNode }: any) => {
    if (dropPosition === 0) return false;
    return dragNode.parentId === dropNode.parentId;
  };

  const handleDrop = async (info: any) => {
    const dragKey = Number(info.dragNode.key);
    const dropKey = Number(info.node.key);
    const dragParentId = info.dragNode.parentId ?? null;
    const dropParentId = info.node.parentId ?? null;

    if (dragParentId !== dropParentId) {
      message.warning('Chỉ hỗ trợ kéo thả sắp xếp các khối trong cùng một cấp độ');
      return;
    }

    const siblings = getSiblings(structures, dragParentId);
    const dragIdx = siblings.findIndex(s => s.id === dragKey);
    if (dragIdx === -1) return;

    const [draggedItem] = siblings.splice(dragIdx, 1);
    const targetIdx = siblings.findIndex(s => s.id === dropKey);
    if (targetIdx === -1) return;

    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    if (dropPosition === -1) {
      siblings.splice(targetIdx, 0, draggedItem);
    } else {
      siblings.splice(targetIdx + 1, 0, draggedItem);
    }

    const newOrderedIds = siblings.map(s => s.id);
    try {
      await programService.reorderStructures(programId, newOrderedIds);
      message.success('Đã cập nhật thứ tự hiển thị khối kiến thức');
      onRefresh();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi cập nhật thứ tự khối kiến thức');
    }
  };

  // Convert structures into antd Tree data format
  const renderTreeData = (items: ProgramStructure[], parentId: number | null = null): any[] => {
    return items.map((item) => {
      const groups = item.electiveGroups || [];
      return {
        key: item.id.toString(),
        parentId: parentId,
        title: (
          <div className="flex items-center justify-between w-full py-1.5 px-2 hover:bg-slate-50/80 rounded-xl group transition-all gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              {!readOnly && (
                <Tooltip title="Kéo thả để sắp xếp thứ tự cùng cấp">
                  <span className="p-1 -ml-1 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-100 rounded flex items-center shrink-0">
                    <GripVertical size={14} />
                  </span>
                </Tooltip>
              )}
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0">
                {item.code}
              </span>
              <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
                {item.name}
              </span>
              <Tag color={item.calculatedCredits >= item.creditRequired ? 'success' : 'processing'} className="text-[11px] rounded-full border-none px-2.5 font-medium shrink-0 !mr-0">
                {item.calculatedCredits || 0} / {item.creditRequired} TC
              </Tag>
              {groups.length > 0 && (
                <Tooltip
                  title={
                    <div className="text-xs space-y-1 py-1">
                      <div className="font-bold border-b border-white/20 pb-1">
                        Hướng chuyên sâu tự chọn ({groups.length}):
                      </div>
                      {groups.map((eg) => (
                        <div key={eg.id} className="flex justify-between gap-3 text-[11px]">
                          <span>• {eg.name}</span>
                          <span className="text-purple-200">≥ {eg.minCredits} TC</span>
                        </div>
                      ))}
                      {!readOnly && <div className="text-[10px] text-purple-300 italic pt-1">Nhấp để quản lý / sửa / xóa</div>}
                    </div>
                  }
                >
                  <Tag
                    color="purple"
                    className={cn(
                      "text-[10px] rounded-full border-purple-200 bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 shrink-0 flex items-center gap-1",
                      !readOnly && "cursor-pointer hover:bg-purple-100 hover:border-purple-300 transition-colors"
                    )}
                    onClick={(e) => {
                      if (!readOnly) {
                        e.stopPropagation();
                        handleOpenManageGroups(item);
                      }
                    }}
                  >
                    <Layers size={11} className="text-purple-600 shrink-0" />
                    <span>{groups.length} hướng tự chọn</span>
                  </Tag>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!readOnly && onNavigateToCourses && (
                <Tooltip title="Xem / phân bổ học phần vào khối này">
                  <Button
                    type="text"
                    size="small"
                    icon={<BookOpen size={14} className="text-blue-600" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToCourses(item.id);
                    }}
                    className="hover:bg-blue-50 cursor-pointer"
                  />
                </Tooltip>
              )}
              {!readOnly && (
                <>
                  <Tooltip title="Thêm khối con">
                    <Button
                      type="text"
                      size="small"
                      icon={<Plus size={14} className="text-emerald-600" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAdd(item.id);
                      }}
                      className="cursor-pointer"
                    />
                  </Tooltip>
                  <Tooltip title="Quản lý hướng tự chọn">
                    <Button
                      type="text"
                      size="small"
                      icon={<Layers size={14} className="text-purple-600" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenManageGroups(item);
                      }}
                      className="cursor-pointer"
                    />
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <Button
                      type="text"
                      size="small"
                      icon={<Edit2 size={14} className="text-blue-600" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(item);
                      }}
                      className="cursor-pointer"
                    />
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      size="small"
                      icon={<Trash2 size={14} className="text-red-500" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="cursor-pointer"
                    />
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        ),
        children: item.children ? renderTreeData(item.children, item.id) : []
      };
    });
  };

  const totalRequiredCredits = React.useMemo(() => {
    const sumCredits = (list: ProgramStructure[]): number => {
      return list.reduce((acc, cur) => {
        return acc + (cur.children && cur.children.length > 0 ? sumCredits(cur.children) : cur.creditRequired);
      }, 0);
    };
    return sumCredits(structures);
  }, [structures]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Title level={5} className="!mb-0 text-slate-800">Cây Cấu trúc Khối kiến thức</Title>
            <Tag color="blue" className="rounded-full px-2.5 font-bold text-xs border-none">
              Yêu cầu: {totalRequiredCredits} Tín chỉ
            </Tag>
            {!readOnly && (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Kéo thả để sắp xếp vị trí các khối cùng cấp
              </span>
            )}
          </div>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Phân định tỷ trọng khối Đại cương, Cơ sở ngành, Chuyên ngành và các nhánh tự chọn theo TT 17/2021/TT-BGDĐT.
          </Text>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && onNavigateToCourses && (
            <Button
              type="default"
              icon={<BookOpen size={15} className="text-blue-600" />}
              onClick={() => onNavigateToCourses()}
              className="rounded-xl h-9 px-4 font-semibold text-xs border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
            >
              Phân bổ môn học vào khối &rarr;
            </Button>
          )}
          {!readOnly && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => handleOpenAdd(null)}
              className="rounded-xl h-9 px-4 font-semibold text-xs bg-blue-600 hover:bg-blue-700 shadow-sm border-none flex items-center gap-1.5 cursor-pointer"
            >
              Thêm khối gốc
            </Button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4">
        {structures.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có cấu trúc khối kiến thức nào được thiết lập"
          >
            {!readOnly && (
              <Button type="primary" onClick={() => handleOpenAdd(null)} className="rounded-xl cursor-pointer">
                Thêm khối kiến thức đầu tiên
              </Button>
            )}
          </Empty>
        ) : (
          <Tree
            showLine={{ showLeafIcon: false }}
            defaultExpandAll
            draggable={!readOnly ? { icon: false } : false}
            blockNode
            allowDrop={allowDrop}
            onDrop={handleDrop}
            treeData={renderTreeData(structures)}
            className="font-medium text-slate-700 select-none"
          />
        )}
      </div>

      {/* Modal Thêm/Sửa Khối kiến thức */}
      <Modal
        title={editingStructure ? 'Chỉnh sửa Khối kiến thức' : 'Thêm mới Khối kiến thức'}
        open={isModalOpen}
        onOk={handleSaveStructure}
        confirmLoading={submitting}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu khối kiến thức"
        cancelText="Hủy"
        className="rounded-2xl"
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="parentId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="code"
            label={<span className="text-xs font-semibold text-slate-700">Mã khối kiến thức</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mã khối (Ví dụ: STR-DC)' }]}
          >
            <Input placeholder="Ví dụ: STR-DC, STR-CSN, STR-CN" className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-700">Tên khối kiến thức</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên khối' }]}
          >
            <Input placeholder="Ví dụ: Khối kiến thức Giáo dục Đại cương" className="rounded-xl h-10" />
          </Form.Item>

          <Form.Item
            name="creditRequired"
            label={<span className="text-xs font-semibold text-slate-700">Số tín chỉ yêu cầu</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập số tín chỉ yêu cầu' },
              {
                validator: async (_, value) => {
                  if (value === undefined || value === null) {
                    return Promise.reject(new Error('Vui lòng nhập số tín chỉ yêu cầu'));
                  }
                  if (Number(value) <= 0) {
                    return Promise.reject(new Error('Số tín chỉ yêu cầu phải lớn hơn 0'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber min={1} max={250} placeholder="Ví dụ: 12" className="w-full rounded-xl h-10" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Quản lý Nhóm/Hướng Tự chọn */}
      <ProgramElectiveGroupsModal
        open={isElectiveModalOpen}
        structure={currentManageStructure}
        onClose={() => setIsElectiveModalOpen(false)}
        onRefresh={onRefresh}
        readOnly={readOnly}
      />
    </div>
  );
}
