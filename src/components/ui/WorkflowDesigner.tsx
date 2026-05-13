'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Card, 
  Button, 
  Space, 
  Drawer, 
  Form, 
  Select, 
  Input, 
  Typography, 
  Divider, 
  Tag, 
  Switch, 
  App,
  Tooltip
} from 'antd';
import { 
  Settings, 
  Plus, 
  Trash2, 
  CircleStop,
  CirclePlay
} from 'lucide-react';
import { rbacService, Role } from '@/services/rbacService';

const { Title, Text } = Typography;

// --- CUSTOM NODES ---

const StartNode = ({ data }: any) => (
  <div className="px-4 py-2 rounded-full border-2 border-green-500 bg-white shadow-md flex items-center gap-2 min-w-[120px] justify-center relative">
    <CirclePlay className="text-green-500" size={16} />
    <span className="font-bold text-slate-700 text-sm">{data.label || 'Bắt đầu'}</span>
    <Handle type="source" position={Position.Right} className="!bg-green-500" />
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="px-4 py-2 rounded-full border-2 border-red-500 bg-white shadow-md flex items-center gap-2 min-w-[120px] justify-center relative">
    <CircleStop className="text-red-500" size={16} />
    <span className="font-bold text-slate-700 text-sm">{data.label || 'Kết thúc'}</span>
    <Handle type="target" position={Position.Left} className="!bg-red-500" />
  </div>
);

const StateNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-white shadow-lg min-w-[180px] hover:border-blue-400 transition-colors relative">
    <Handle type="target" position={Position.Left} className="!bg-slate-400" />
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-1">
        <span className="font-bold text-slate-800 text-sm">{data.label}</span>
        <Tag color="blue" className="text-[9px] font-bold border-none m-0 rounded-md uppercase">{data.screenCode || 'N/A'}</Tag>
      </div>
      <div className="flex flex-col gap-1">
        {data.performerRole && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Actor:</span>
            <span className="text-[10px] text-slate-600 font-medium">{data.performerRole}</span>
          </div>
        )}
        {data.approverRole && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Review:</span>
            <span className="text-[10px] text-slate-600 font-medium">{data.approverRole}</span>
          </div>
        )}
      </div>
    </div>
    <Handle type="source" position={Position.Right} className="!bg-slate-400" />
  </div>
);

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  state: StateNode,
};

// --- DATA CONSTANTS ---

const SCREEN_CODES = [
  { value: 'DASHBOARD', label: 'Bảng điều khiển (DASHBOARD)' },
  { value: 'REQUEST_FORM', label: 'Biểu mẫu yêu cầu (REQUEST_FORM)' },
  { value: 'REVIEW_STEP_1', label: 'Thẩm định hồ sơ (REVIEW_STEP_1)' },
  { value: 'REVIEW_STEP_2', label: 'Phê duyệt lãnh đạo (REVIEW_STEP_2)' },
  { value: 'APPROVAL_FINAL', label: 'Ban hành kết quả (APPROVAL_FINAL)' },
  { value: 'REVISION_REQUIRED', label: 'Bổ sung thông tin (REVISION_REQUIRED)' },
];

const ACTION_TYPES = [
  { value: 'CONFIRM', label: 'Xác nhận (Tiến tới)' },
  { value: 'RETURN', label: 'Trả về (Quay lui)' },
  { value: 'CUSTOM', label: 'Tùy chỉnh' },
];

const BUTTON_COLORS = [
  { value: 'primary', label: 'Xanh dương (Duyệt)', color: '#1677ff' },
  { value: 'success', label: 'Xanh lá (Hoàn thành)', color: '#52c41a' },
  { value: 'warning', label: 'Vàng (Bổ sung)', color: '#faad14' },
  { value: 'danger', label: 'Đỏ (Từ chối)', color: '#ff4d4f' },
  { value: 'default', label: 'Xám (Quay lại)', color: '#d9d9d9' }
];

// --- MAIN DESIGNER ---

function DesignerInner({
  initialData,
  onChange,
  readOnly = false,
}: {
  initialData?: string;
  onChange?: (json: string) => void;
  readOnly?: boolean;
}) {
  const { message } = App.useApp();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form] = Form.useForm();
  
  const lastEmittedData = useRef<string>('');

  // Initialize from initialData
  useEffect(() => {
    if (initialData && initialData !== lastEmittedData.current) {
      try {
        const parsed = JSON.parse(initialData);
        if (parsed.nodes && parsed.edges) {
          // Ensure edges have markers if they come from old data
          const edgesWithMarkers = parsed.edges.map((edge: any) => ({
            ...edge,
            markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 20, height: 20 }
          }));
          setNodes(parsed.nodes);
          setEdges(edgesWithMarkers);
          lastEmittedData.current = initialData;
        }
      } catch (e) {
        console.error('Failed to parse workflow JSON', e);
        if (nodes.length === 0) {
          setNodes([{ id: 'start', type: 'start', position: { x: 100, y: 150 }, data: { label: 'Bắt đầu' } }]);
        }
      }
    } else if (!initialData && nodes.length === 0) {
      setNodes([{ id: 'start', type: 'start', position: { x: 100, y: 150 }, data: { label: 'Bắt đầu' } }]);
    }
  }, [initialData, setNodes, setEdges]);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await rbacService.getRoles();
        setRoles(data);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };
    fetchRoles();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        label: 'Xác nhận',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 20, height: 20 },
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        data: {
          actionType: 'CONFIRM',
          buttonColor: 'primary',
          showConfirmation: false,
          requireComment: false,
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: any) => {
    if (selectedNodes.length > 0) {
      const node = selectedNodes[0];
      setSelectedElement({ type: 'node', ...node });
      form.setFieldsValue({
        id: node.id,
        name: node.data.label,
        screenCode: node.data.screenCode,
        performerRole: node.data.performerRole,
        approverRole: node.data.approverRole
      });
    } else if (selectedEdges.length > 0) {
      const edge = selectedEdges[0];
      setSelectedElement({ type: 'edge', ...edge });
      form.setFieldsValue({
        id: edge.id,
        name: edge.label,
        actionType: edge.data?.actionType || 'CONFIRM',
        role: edge.data?.role,
        buttonColor: edge.data?.buttonColor || 'primary',
        showConfirmation: !!edge.data?.showConfirmation,
        confirmationMessage: edge.data?.confirmationMessage,
        requireComment: !!edge.data?.requireComment,
      });
    } else {
      setSelectedElement(null);
    }
  }, [form]);

  // Handle auto-save
  useEffect(() => {
    if (!readOnly && (nodes.length > 0 || edges.length > 0)) {
      const timer = setTimeout(() => {
        const json = JSON.stringify({ nodes, edges });
        if (json !== lastEmittedData.current) {
          lastEmittedData.current = json;
          onChange?.(json);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, onChange, readOnly]);

  const addStateNode = () => {
    const newNode: Node = {
      id: `state-${Date.now()}`,
      type: 'state',
      position: { x: Math.random() * 200 + 300, y: Math.random() * 100 + 100 },
      data: { label: 'Trạng thái mới', screenCode: 'DASHBOARD' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addEndNode = () => {
    const newNode: Node = {
      id: `end-${Date.now()}`,
      type: 'end',
      position: { x: Math.random() * 200 + 600, y: Math.random() * 100 + 200 },
      data: { label: 'Kết thúc' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSaveProperties = async () => {
    if (!selectedElement) return;
    
    try {
      const values = await form.validateFields();
      if (selectedElement.type === 'node') {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedElement.id
              ? { ...node, data: { ...node.data, label: values.name, screenCode: values.screenCode, performerRole: values.performerRole, approverRole: values.approverRole } }
              : node
          )
        );
      } else {
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === selectedElement.id
              ? { 
                  ...edge, 
                  label: values.name, 
                  data: { 
                    ...edge.data, 
                    actionType: values.actionType, 
                    role: values.role, 
                    buttonColor: values.buttonColor, 
                    showConfirmation: values.showConfirmation, 
                    confirmationMessage: values.confirmationMessage, 
                    requireComment: values.requireComment 
                  } 
                }
              : edge
          )
        );
      }
      message.success('Đã cập nhật cấu hình');
      setIsDrawerOpen(false);
    } catch (e) {
      // Validation error
    }
  };

  const deleteElement = () => {
    if (!selectedElement) return;
    if (selectedElement.type === 'node') {
      if (selectedElement.id === 'start') {
        message.warning('Không thể xóa điểm bắt đầu');
        return;
      }
      setNodes((nds) => nds.filter((n) => n.id !== selectedElement.id));
    } else {
      setEdges((eds) => eds.filter((e) => e.id !== selectedElement.id));
    }
    setSelectedElement(null);
  };

  return (
    <div className="flex flex-col gap-0 h-full relative group">
      {/* Designer Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {!readOnly && (
          <Card size="small" className="shadow-lg border-slate-200 py-1 rounded-xl bg-white/90 backdrop-blur-sm">
            <Space direction="vertical" size="small">
              <Tooltip title="Thêm trạng thái mới" placement="right">
                <Button 
                  icon={<Plus size={18} />} 
                  onClick={addStateNode}
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border-none shadow-none"
                />
              </Tooltip>
              <Tooltip title="Thêm kết thúc" placement="right">
                <Button 
                  icon={<CircleStop size={18} />} 
                  onClick={addEndNode}
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all border-none shadow-none"
                />
              </Tooltip>
              <Divider className="my-1" />
              <Tooltip title="Xóa phần tử" placement="right">
                <Button 
                  danger 
                  icon={<Trash2 size={18} />} 
                  disabled={!selectedElement || selectedElement.id === 'start'}
                  onClick={deleteElement}
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-red-50 transition-all border-none shadow-none"
                />
              </Tooltip>
            </Space>
          </Card>
        )}

        {!readOnly && (
          <Card size="small" className="shadow-lg border-slate-200 py-1 rounded-xl bg-white/90 backdrop-blur-sm">
            <Tooltip title="Cấu hình chi tiết" placement="right">
              <Button 
                icon={<Settings size={18} />} 
                disabled={!selectedElement}
                onClick={() => setIsDrawerOpen(true)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border-none shadow-none ${selectedElement ? 'text-indigo-600 bg-indigo-50' : ''}`}
              />
            </Tooltip>
          </Card>
        )}
      </div>

      {/* Main Flow Canvas */}
      <div className="w-full h-full bg-slate-50 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          zoomOnScroll={false}
          panOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={false}
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls position="bottom-right" className="shadow-lg border-slate-200 rounded-lg overflow-hidden" />
        </ReactFlow>
      </div>

      {/* Properties Drawer */}
      <Drawer
        title={<Space><Settings size={18} className="text-indigo-600" /><span>{readOnly ? 'Thông tin cấu hình' : 'Cấu hình chi tiết'}</span></Space>}
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width={400}
        extra={!readOnly && <Button type="primary" className="bg-edu-primary" onClick={handleSaveProperties}>Lưu thay đổi</Button>}
        styles={{ body: { padding: '24px' } }}
      >
        <Form form={form} layout="vertical" disabled={readOnly}>
          {selectedElement?.type === 'node' && (
            <>
              <Form.Item label="ID Hệ thống" name="id"><Input disabled className="bg-slate-50 font-mono" /></Form.Item>
              <Form.Item label="Tên hiển thị" name="name" rules={[{ required: true, message: 'Nhập tên hiển thị' }]}>
                <Input placeholder="VD: Thẩm định hồ sơ" className="rounded-lg" />
              </Form.Item>
              
              {selectedElement.type === 'state' && (
                <>
                  <Form.Item label="Màn hình tích hợp" name="screenCode" rules={[{ required: true }]}>
                    <Select placeholder="Chọn màn hình frontend" className="rounded-lg">
                      {SCREEN_CODES.map(s => <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Người thực hiện" name="performerRole">
                    <Select placeholder="Chọn role người thực hiện" allowClear className="rounded-lg">
                      {roles.map(r => <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Người duyệt" name="approverRole">
                    <Select placeholder="Chọn role người duyệt" allowClear className="rounded-lg">
                      {roles.map(r => <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </>
              )}
            </>
          )}

          {selectedElement?.type === 'edge' && (
            <>
              <Form.Item label="Loại hành động" name="actionType">
                <Select className="rounded-lg">
                  {ACTION_TYPES.map(a => <Select.Option key={a.value} value={a.value}>{a.label}</Select.Option>)}
                </Select>
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.actionType !== cur.actionType}>
                {({ getFieldValue }) => (
                  <div className={`p-4 rounded-xl border border-slate-200 bg-slate-50 mb-4 flex flex-col gap-3 transition-all ${getFieldValue('actionType') === 'CUSTOM' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <Form.Item label="Tên nút bấm" name="name" className="mb-2">
                      <Input placeholder="VD: Gửi duyệt" className="rounded-lg bg-white" />
                    </Form.Item>
                    <Form.Item label="Màu sắc nút" name="buttonColor" className="mb-0">
                      <Select className="rounded-lg" dropdownStyle={{ borderRadius: '12px' }}>
                        {BUTTON_COLORS.map(c => (
                          <Select.Option key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                              <span className="text-sm">{c.label}</span>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                )}
              </Form.Item>

              <Form.Item label="Role được phép thực hiện" name="role" rules={[{ required: true }]}>
                <Select placeholder="Chọn role" allowClear className="rounded-lg">
                  {roles.map(r => <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>)}
                </Select>
              </Form.Item>

              <Divider className="my-4" />
              
              <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <Text strong className="text-sm">Yêu cầu xác nhận</Text>
                  <Text className="text-[11px] text-slate-500">Hiển thị popup trước khi chạy</Text>
                </div>
                <Form.Item name="showConfirmation" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>
              </div>

              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.showConfirmation !== cur.showConfirmation}>
                {({ getFieldValue }) => getFieldValue('showConfirmation') && (
                  <Form.Item label="Nội dung xác nhận" name="confirmationMessage">
                    <Input.TextArea rows={2} className="rounded-lg" placeholder="Bạn có chắc chắn muốn thực hiện?" />
                  </Form.Item>
                )}
              </Form.Item>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <Text strong className="text-sm">Bắt buộc nhập ý kiến</Text>
                  <Text className="text-[11px] text-slate-500">Yêu cầu lý do/nhận xét</Text>
                </div>
                <Form.Item name="requireComment" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>
              </div>
            </>
          )}
        </Form>
      </Drawer>

      <style jsx global>{`
        .react-flow__handle {
          width: 8px;
          height: 8px;
          background-color: #3b82f6;
          border: 2px solid white;
        }
        .react-flow__edge-path {
          stroke-width: 2;
          stroke: #94a3b8;
          transition: stroke 0.2s;
        }
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #3b82f6;
          stroke-width: 3;
        }
        .react-flow__edge-textbg {
          fill: #f8fafc;
          fill-opacity: 0.9;
        }
        .react-flow__edge-text {
          fill: #475569;
          font-weight: 600;
          font-size: 11px;
        }
        .react-flow__controls-button {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__panel.bottom.right {
          bottom: 20px;
          right: 20px;
        }
      `}</style>
    </div>
  );
}

export default function WorkflowDesigner(props: {
  initialData?: string;
  onChange?: (data: string) => void;
  onSave?: (data: string) => void;
  readOnly?: boolean;
  workflowCode?: string;
  workflowName?: string;
  workflowDescription?: string;
}) {
  return (
    <div className="h-full w-full border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-white">
      <App className="h-full">
        <ReactFlowProvider>
          <DesignerInner 
            initialData={props.initialData} 
            onChange={props.onChange}
            readOnly={props.readOnly}
          />
        </ReactFlowProvider>
      </App>
    </div>
  );
}
