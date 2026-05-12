'use client';

import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import { Card, Button, Space, Drawer, Form, Select, Input, Typography, Divider, Tooltip, Tag, App, Switch, Alert } from 'antd';
import { Settings, Play, Download, Trash2, Plus, Upload, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { rbacService, Role } from '@/services/rbacService';
import workflowService from '@/services/workflowService';
import { XMLParser } from 'fast-xml-parser';

const { Title, Text } = Typography;

// --- HARDCODED CONSTANTS ---
const SCREEN_CODES = [
  { value: 'DASHBOARD', label: 'Bảng điều khiển (DASHBOARD)' },
  { value: 'REQUEST_FORM', label: 'Biểu mẫu yêu cầu (REQUEST_FORM)' },
  { value: 'REVIEW_STEP_1', label: 'Thẩm định hồ sơ (REVIEW_STEP_1)' },
  { value: 'REVIEW_STEP_2', label: 'Phê duyệt lãnh đạo (REVIEW_STEP_2)' },
  { value: 'APPROVAL_FINAL', label: 'Ban hành kết quả (APPROVAL_FINAL)' },
  { value: 'REVISION_REQUIRED', label: 'Bổ sung thông tin (REVISION_REQUIRED)' },
];

const BUTTON_COLORS = [
  { value: 'primary', label: 'Xanh dương (Duyệt)', color: '#1677ff' },
  { value: 'success', label: 'Xanh lá (Hoàn thành)', color: '#52c41a' },
  { value: 'warning', label: 'Vàng (Bổ sung)', color: '#faad14' },
  { value: 'danger', label: 'Đỏ (Từ chối)', color: '#ff4d4f' },
  { value: 'default', label: 'Xám (Quay lại)', color: '#d9d9d9' }
];

const ACTION_TYPES = [
  { value: 'CONFIRM', label: 'Xác nhận (Tiến tới)' },
  { value: 'RETURN', label: 'Trả về (Quay lui)' },
  { value: 'CUSTOM', label: 'Tùy chỉnh' },
];

const DEFAULT_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Bắt đầu">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Activity_1" name="Nhiệm vụ mới">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="EndEvent_1" name="Kết thúc">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="171" y="145" width="40" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1_di" bpmnElement="Activity_1">
        <dc:Bounds x="260" y="80" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="422" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="419" y="145" width="43" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="209" y="120" />
        <di:waypoint x="260" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="120" />
        <di:waypoint x="422" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

function DesignerInner({
  initialXml = DEFAULT_DIAGRAM,
  onChange,
  onSave,
  readOnly = false,
  workflowCode,
  workflowName,
  workflowDescription
}: {
  initialXml?: string;
  onChange?: (xml: string) => void;
  onSave?: (xml: string) => void;
  readOnly?: boolean;
  workflowCode?: string;
  workflowName?: string;
  workflowDescription?: string;
}) {
  const { message } = App.useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form] = Form.useForm();
  const lastXmlRef = useRef(initialXml);
  const [localIsReadOnly, setLocalIsReadOnly] = useState(readOnly);
  const isDraggingRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const diagramLoadedRef = useRef(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [isReady, setIsReady] = useState(false);
  const isInitialRender = useRef(true);

  // Đồng bộ prop initialXml khi nó thay đổi từ phía ngoài (ví dụ: sau khi fetch API)
  useEffect(() => {
    if (initialXml && modelerRef.current && isReady) {
      // Chỉ tự động load lại nếu XML từ prop khác với XML hiện tại trong Ref
      // và đây không phải là do chính chúng ta vừa save xong
      if (initialXml !== lastXmlRef.current) {
        lastXmlRef.current = initialXml;
        modelerRef.current.importXML(initialXml).then(() => {
          const canvas = modelerRef.current?.get('canvas') as any;
          if (canvas) canvas.zoom('fit-viewport');
          validateWorkflow(initialXml);
        });
      }
    }
  }, [initialXml, isReady]);

  useEffect(() => {
    setLocalIsReadOnly(readOnly);
  }, [readOnly]);

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

  // Hàm validate cấu hình 1 Start 1 End
  const validateWorkflow = (xml: string) => {
    const errors: string[] = [];
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(xml);
    
    const process = jsonObj['bpmn:definitions']?.['bpmn:process'];
    if (!process) return ['Sơ đồ không hợp lệ'];

    const startEvents = Array.isArray(process['bpmn:startEvent']) ? process['bpmn:startEvent'] : (process['bpmn:startEvent'] ? [process['bpmn:startEvent']] : []);
    const endEvents = Array.isArray(process['bpmn:endEvent']) ? process['bpmn:endEvent'] : (process['bpmn:endEvent'] ? [process['bpmn:endEvent']] : []);

    if (endEvents.length !== 1) errors.push(`Quy trình phải có DUY NHẤT 1 điểm kết thúc (Hiện có: ${endEvents.length})`);

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Logic xử lý lăn chuột: Chỉ zoom khi nhấn Ctrl, còn lại để trình duyệt cuộn trang tự nhiên
  const handleWheelAction = (e: React.WheelEvent | WheelEvent) => {
    const canvas = modelerRef.current?.get('canvas') as any;
    if (!canvas) return;

    if (e.ctrlKey) {
      e.preventDefault();
      canvas.zoom(canvas.zoom() * (e.deltaY > 0 ? 0.8 : 1.2));
    }
    // Không preventDefault ở đây để trình duyệt cuộn trang "ngoài" bình thường
  };

  useEffect(() => {
    if (!containerRef.current) return;
    setIsReady(false);

    // Khởi tạo Modeler hoặc Viewer tùy theo chế độ
    const ModelerClass = localIsReadOnly ? BpmnViewer : BpmnModeler;
    const modeler = new ModelerClass({
      container: containerRef.current,
      keyboard: localIsReadOnly ? {} : { bindTo: window },
      moddleExtensions: { camunda: camundaModdleDescriptor },
      zoomScroll: { enabled: false },
    });

    modelerRef.current = modeler;

    const render = async () => {
      if (!modelerRef.current) return;
      
      const xmlToLoad = lastXmlRef.current || initialXml;
      
      try {
        await modelerRef.current.importXML(xmlToLoad);
        setIsReady(true);
        const canvas = modelerRef.current.get('canvas') as any;
        if (canvas?._container?.clientWidth > 0) canvas.zoom('fit-viewport');
        validateWorkflow(xmlToLoad);
      } catch (err) {
        console.error('Error rendering BPMN:', err);
      }
    };

    const timer = setTimeout(render, 50);

    modeler.on('selection.changed', (e: any) => {
      if (isDraggingRef.current) return;
      const selection = e.newSelection;
      if (!selection || selection.length !== 1) {
        setSelectedElement(null);
        return;
      }

      const element = selection[0];
      // Bỏ qua Edge (SequenceFlow) và Label - không hiển thị popup cấu hình
      if (element?.type === 'label' || element?.labelTarget || element?.type === 'bpmn:SequenceFlow') {
        setSelectedElement(null);
        return;
      }

      setSelectedElement((current: any) => (current?.id === element?.id ? current : element));
      
      const bo = element.businessObject;
      form.setFieldsValue({
        name: bo.name || '',
        id: bo.id,
        screenCode: bo.get('camunda:formKey') || '',
        role: bo.get('camunda:candidateGroups') || '',
        actionType: bo.get('camunda:actionType') || 'CONFIRM',
        buttonColor: bo.get('camunda:buttonColor') || 'primary',
        showConfirmation: bo.get('camunda:showConfirmation') === 'true',
        confirmationMessage: bo.get('camunda:confirmationMessage') || 'Bạn có chắc chắn muốn thực hiện hành động này?',
        requireComment: bo.get('camunda:requireComment') === 'true',
        performerRole: bo.get('camunda:performerRole') || '',
        approverRole: bo.get('camunda:approverRole') || '',
      });
    });

    const handleChanged = async () => {
      if (!localIsReadOnly && modelerRef.current) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
          try {
            const result = await modelerRef.current?.saveXML({ format: true });
            if (result?.xml) {
              lastXmlRef.current = result.xml;
              validateWorkflow(result.xml);
              if (onChange) onChange(result.xml);
            }
          } catch (err) {
            console.error('Error saving XML:', err);
          }
        }, 500);
      }
    };

    modeler.on('commandStack.changed', handleChanged);

    const eventBus = modeler.get('eventBus') as any;
    eventBus.on('element.dblclick', 1000, (e: any) => {
      if (['bpmn:Task', 'bpmn:UserTask', 'bpmn:SequenceFlow', 'bpmn:StartEvent', 'bpmn:EndEvent'].includes(e.element.type)) {
        return false;
      }
    });

    const container = containerRef.current;
    const handleWheelRaw = (e: WheelEvent) => handleWheelAction(e);
    if (container) container.addEventListener('wheel', handleWheelRaw, { passive: false });

    return () => {
      clearTimeout(timer);
      if (container) container.removeEventListener('wheel', handleWheelRaw);
      if (modelerRef.current) {
        modelerRef.current.off('commandStack.changed', handleChanged);
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [localIsReadOnly]);

  // Tự động đóng drawer khi chuyển sang chế độ xem
  useEffect(() => {
    if (localIsReadOnly) {
      setIsDrawerOpen(false);
    }
  }, [localIsReadOnly]);

  const handleSaveProperties = () => {
    if (!modelerRef.current || !selectedElement || localIsReadOnly) return;
    const values = form.getFieldsValue();
    const modeling = modelerRef.current.get('modeling') as any;

    const props: any = { name: values.name };

    if (['bpmn:UserTask', 'bpmn:Task'].includes(selectedElement.type)) {
      props['camunda:formKey'] = values.screenCode;
      props['camunda:performerRole'] = values.performerRole;
      props['camunda:approverRole'] = values.approverRole;
    }

    if (selectedElement.type === 'bpmn:SequenceFlow') {
      props['camunda:candidateGroups'] = values.role;
      props['camunda:actionType'] = values.actionType;
      props['camunda:buttonColor'] = values.buttonColor;
      props['camunda:showConfirmation'] = String(!!values.showConfirmation);
      props['camunda:confirmationMessage'] = values.confirmationMessage;
      props['camunda:requireComment'] = String(!!values.requireComment);

      if (values.actionType === 'CONFIRM') props.name = 'Xác nhận';
      if (values.actionType === 'RETURN') props.name = 'Trả về';
    }

    modeling.updateProperties(selectedElement, props);
    message.success('Đã cập nhật cấu hình');
    setIsDrawerOpen(false);
  };

  const handleExportConsole = async () => {
    if (!modelerRef.current || !isReady) return;
    try {
      const result = await modelerRef.current.saveXML({ format: true });
      if (result?.xml) console.log(result.xml);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20 shadow-sm">
        <Space separator={<Divider orientation="vertical" className="bg-slate-200 h-6" />}>
          <div className="flex flex-col">
            <Text strong className="text-[13px] leading-tight">Thiết kế Quy trình</Text>
            <Text type="secondary" className="text-[10px] leading-tight">Workflow Logic v2</Text>
          </div>

          <div className="flex items-center gap-2">
            {validationErrors.length === 0 ? (
              <Tag color="success" icon={<CheckCircle2 size={12} />} className="m-0 text-[11px] py-0.5 px-2 rounded-full border-green-100">Hợp lệ</Tag>
            ) : (
              <Tooltip title={validationErrors.join(', ')}>
                <Tag color="error" icon={<AlertCircle size={12} />} className="m-0 text-[11px] py-0.5 px-2 rounded-full border-red-100">Lỗi cấu hình</Tag>
              </Tooltip>
            )}
          </div>
        </Space>

        <Space size="small">
          {!readOnly && (
            <Button
              size="small"
              type={!localIsReadOnly ? "primary" : "default"}
              onClick={() => setLocalIsReadOnly(!localIsReadOnly)}
              className="text-xs"
              loading={!isReady}
            >
              {localIsReadOnly ? 'Chế độ chỉnh sửa' : 'Xem trước'}
            </Button>
          )}
          <Button 
            icon={<Download size={14} />} 
            size="small" 
            onClick={handleExportConsole} 
            disabled={!isReady}
          />
        </Space>
      </div>

      <div className="w-full grow bg-[#fcfdfe] relative designer-container">
        <div ref={containerRef} className="w-full h-full" />

        {validationErrors.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
            <Alert
              message="Yêu cầu cấu hình"
              description={validationErrors.map((e, i) => <div key={i}>• {e}</div>)}
              type="error"
              showIcon
              className="shadow-lg border-red-200"
            />
          </div>
        )}

        {selectedElement && (
          <div className="absolute top-6 right-6 bg-white shadow-xl border border-slate-200 p-0 rounded-xl z-10 w-72 animate-in fade-in slide-in-from-top-4 overflow-hidden"
            onWheel={(e) => handleWheelAction(e)}>
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider">Thông tin bước</Text>
              <Tag color="blue" className="mr-0 text-[10px] uppercase font-medium">{selectedElement.type.split(':')[1]}</Tag>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Text type="secondary" className="text-[11px]">Tên hiển thị</Text>
                <Text strong className="text-[13px] text-slate-800">{selectedElement.businessObject.name || 'N/A'}</Text>
              </div>

              {['bpmn:UserTask', 'bpmn:Task'].includes(selectedElement.type) && (
                <>
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Màn hình hiển thị</Text>
                    <Tag color="cyan" className="w-fit text-[11px]">{SCREEN_CODES.find(s => s.value === selectedElement.businessObject.get('camunda:formKey'))?.label || 'Chưa cấu hình'}</Tag>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Người thực hiện</Text>
                    <Tag color="blue" className="w-fit text-[11px]">{roles.find(r => r.code === selectedElement.businessObject.get('camunda:performerRole'))?.name || 'Chưa gán'}</Tag>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Người duyệt</Text>
                    <Tag color="orange" className="w-fit text-[11px]">{roles.find(r => r.code === selectedElement.businessObject.get('camunda:approverRole'))?.name || 'Chưa gán'}</Tag>
                  </div>
                </>
              )}

              {selectedElement.type === 'bpmn:SequenceFlow' && (
                <>
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Loại nút</Text>
                    <Tag color="purple" className="w-fit text-[11px]">{ACTION_TYPES.find(a => a.value === selectedElement.businessObject.get('camunda:actionType'))?.label || 'Xác nhận'}</Tag>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Quyền thực hiện</Text>
                    <Tag color="orange" className="w-fit text-[11px]">{roles.find(r => r.code === selectedElement.businessObject.get('camunda:candidateGroups'))?.name || 'Chưa gán role'}</Tag>
                  </div>
                </>
              )}

              {!localIsReadOnly && (
                <Button block type="primary" size="small" onClick={() => setIsDrawerOpen(true)} className="mt-2">Cấu hình</Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Drawer
        title={localIsReadOnly ? "Chi tiết Quy trình (Chế độ xem)" : "Cấu hình Quy trình"}
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width={400}
        styles={{ body: { overflow: 'hidden', padding: 0 } }}
        extra={!localIsReadOnly && <Button type="primary" onClick={handleSaveProperties}>Lưu thay đổi</Button>}
      >
        <div className="h-full w-full overflow-hidden p-6" onWheel={(e) => handleWheelAction(e)}>
          <Form form={form} layout="vertical" disabled={localIsReadOnly}>
            {selectedElement && (
              <>
                <Form.Item label="ID (Hệ thống)" name="id"><Input disabled /></Form.Item>

                {/* CONFIG FOR NODES (STATES) */}
                {['bpmn:UserTask', 'bpmn:Task'].includes(selectedElement.type) && (
                  <>
                    <Form.Item label="Tên trạng thái" name="name" rules={[{ required: true }]}>
                      <Input placeholder="VD: Đang thẩm định" />
                    </Form.Item>
                    <Form.Item label="Màn hình tích hợp" name="screenCode" rules={[{ required: true }]}>
                      <Select placeholder="Chọn màn hình frontend">
                        {SCREEN_CODES.map(s => <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Người thực hiện" name="performerRole">
                      <Select placeholder="Chọn role người thực hiện" allowClear>
                        {roles.map(r => <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Người duyệt" name="approverRole">
                      <Select placeholder="Chọn role người duyệt" allowClear>
                        {roles.map(r => <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  </>
                )}

                {/* CONFIG FOR EDGES (BUTTONS) */}
                {selectedElement.type === 'bpmn:SequenceFlow' && (
                  <>
                    <Form.Item label="Loại hành động" name="actionType">
                      <Select>
                        {ACTION_TYPES.map(a => <Select.Option key={a.value} value={a.value}>{a.label}</Select.Option>)}
                      </Select>
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.actionType !== cur.actionType}>
                      {({ getFieldValue }) => getFieldValue('actionType') === 'CUSTOM' && (
                        <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                          <Form.Item label="Tên nút bấm" name="name" rules={[{ required: true }]}>
                            <Input placeholder="VD: Gửi duyệt" />
                          </Form.Item>
                          <Form.Item label="Màu sắc nút" name="buttonColor">
                            <Select>
                              {BUTTON_COLORS.map(c => <Select.Option key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                  {c.label}
                                </div>
                              </Select.Option>)}
                            </Select>
                          </Form.Item>
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item label="Role được phép thực hiện" name="role" rules={[{ required: true }]}>
                      <Select placeholder="Chọn role">
                        {roles.map(r => <Select.Option key={r.code} value={r.code}>{r.name}</Select.Option>)}
                      </Select>
                    </Form.Item>

                    <Divider className="my-2" />
                    <div className="flex items-center justify-between mb-4">
                      <Text>Yêu cầu xác nhận</Text>
                      <Form.Item name="showConfirmation" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>
                    </div>

                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.showConfirmation !== cur.showConfirmation}>
                      {({ getFieldValue }) => getFieldValue('showConfirmation') && (
                        <Form.Item label="Nội dung xác nhận" name="confirmationMessage">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      )}
                    </Form.Item>

                    <div className="flex items-center justify-between">
                      <Text>Bắt buộc nhập ý kiến</Text>
                      <Form.Item name="requireComment" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>
                    </div>
                  </>
                )}

                {/* FOR START/END EVENTS */}
                {['bpmn:StartEvent', 'bpmn:EndEvent'].includes(selectedElement.type) && (
                  <Form.Item label="Tên hiển thị" name="name"><Input /></Form.Item>
                )}
              </>
            )}
          </Form>
        </div>
      </Drawer>

      <style jsx global>{`
        .designer-container .bjs-powered-by { display: none; }
        .designer-container .djs-palette {
          top: 20px !important;
          left: 20px !important;
          border-radius: 12px !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default function WorkflowDesigner(props: any) {
  return (
    <App className="h-full">
      <DesignerInner {...props} />
    </App>
  );
}
