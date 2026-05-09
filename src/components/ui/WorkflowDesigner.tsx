'use client';

import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import { Card, Button, Space, Drawer, Form, Select, Input, Typography, Divider, Tooltip, Tag, App } from 'antd';
import { Settings, Play, Download, Trash2, Plus, Upload, Minus } from 'lucide-react';
import { rbacService, Role } from '@/services/rbacService';
import workflowService from '@/services/workflowService';

const { Title, Text } = Typography;

const DEFAULT_DIAGRAM = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Bắt đầu" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
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
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form] = Form.useForm();
  const lastXmlRef = useRef(initialXml);
  const [localIsReadOnly, setLocalIsReadOnly] = useState(readOnly);
  const isDraggingRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const diagramLoadedRef = useRef(false);

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

  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: {},
      zoomScroll: {
        enabled: false
      },
      moddleExtensions: {
        camunda: camundaModdleDescriptor
      },
      additionalModules: localIsReadOnly ? [
        {
          paletteProvider: ['value', null],
          contextPadProvider: ['value', null]
        }
      ] : []
    });

    modelerRef.current = modeler;

    const render = async () => {
      if (!modelerRef.current || diagramLoadedRef.current || !initialXml) return;
      try {
        await modelerRef.current.importXML(initialXml);
        diagramLoadedRef.current = true;
        const canvas = modelerRef.current.get('canvas') as any;
        if (canvas && canvas._container && canvas._container.clientWidth > 0) {
          canvas.zoom('fit-viewport');
        }
      } catch (err) {
        console.error('Error rendering BPMN:', err);
      }
    };

    const timer = setTimeout(render, 50);

    // Sự kiện thay đổi lựa chọn
    modeler.on('selection.changed', (e: any) => {
      // Nếu đang trong quá trình kéo thả, không cập nhật UI để tránh lag
      if (isDraggingRef.current) return;

      const selection = e.newSelection;
      
      // CHỈ hiển thị popup khi chọn DUY NHẤT 1 phần tử
      if (!selection || selection.length !== 1) {
        setSelectedElement(null);
        return;
      }

      const element = selection[0];
      
      // Nếu là nhãn (label), không hiện Panel
      if (element && (element.type === 'label' || element.labelTarget)) {
        setSelectedElement(null);
        return;
      }

      // Chỉ cập nhật nếu thực sự thay đổi phần tử để tránh re-render thừa
      setSelectedElement((current: any) => (current?.id === element?.id ? current : element));
      if (element) {
        const businessObject = element.businessObject;
        form.setFieldsValue({
          name: businessObject.name || '',
          id: businessObject.id,
          role: businessObject.get('camunda:candidateGroups') || '', 
          description: businessObject.get('camunda:description') || '',
          dueDate: businessObject.get('camunda:dueDate') || '',
          actionType: businessObject.get('camunda:actionType') || 'none',
          buttonColor: businessObject.get('camunda:buttonColor') || 'primary',
          camundaClass: businessObject.get('camunda:class') || ''
        });
      }
    });

    const handleChanged = async () => {
      if (!localIsReadOnly && onChange && modelerRef.current) {
        // Debounce: Chỉ lưu sau khi người dùng ngừng thao tác 500ms
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        
        saveTimerRef.current = setTimeout(async () => {
          try {
            const result = await modelerRef.current?.saveXML({ format: true });
            if (result?.xml && result.xml !== lastXmlRef.current) {
              lastXmlRef.current = result.xml;
              onChange(result.xml);
            }
          } catch (err) {
            console.error('Error saving XML on change:', err);
          }
        }, 500);
      }
    };

    modeler.on('commandStack.changed', handleChanged);

    const eventBus = modeler.get('eventBus') as any;

    // Thay vì chặn 'directEditing.activate' (gây kẹt tool), ta chặn 'element.dblclick' 
    // để ngăn người dùng mở trình soạn thảo bằng cách nhấp đúp.
    eventBus.on('element.dblclick', 1000, (e: any) => {
      // Cho phép di chuyển label nhưng không cho sửa text
      if (e.element.type === 'label' || e.element.labelTarget || ['bpmn:Task', 'bpmn:UserTask', 'bpmn:SequenceFlow'].includes(e.element.type)) {
        return false; // Chặn dblclick -> không kích hoạt soạn thảo
      }
    });

    // Chặn hiện Context Pad (nút xóa) CHỈ cho các nhãn văn bản
    eventBus.on('contextPad.create', (e: any) => {
      // Thêm kiểm tra e.element để tránh lỗi undefined
      if (e?.element?.type === 'label') {
        return false;
      }
    });

    // Manual Ctrl + Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (!modelerRef.current) return;
        const canvas = modelerRef.current.get('canvas') as any;
        const zoom = canvas.zoom();
        const delta = e.deltaY > 0 ? 0.8 : 1.2;
        canvas.zoom(zoom * delta);
      }
    };

    // Theo dõi trạng thái kéo thả để tối ưu hiệu năng UI
    eventBus.on('drag.start', () => {
      isDraggingRef.current = true;
    });

    eventBus.on('drag.end', () => {
      isDraggingRef.current = false;
      
      // Hoãn cập nhật state một chút để không xung đột với các sự kiện click/drag tiếp theo của Modeler
      setTimeout(() => {
        if (modelerRef.current) {
          const selection = modelerRef.current.get('selection') as any;
          const element = selection.get()[0];
          
          if (element && !(element.type === 'label' || element.labelTarget)) {
            // Chỉ cập nhật nếu element thực sự thay đổi hoặc chưa có element nào được chọn
            setSelectedElement((current: any) => (current?.id === element.id ? current : element));
          }
        }
      }, 50);
    });

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      clearTimeout(timer);
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (modelerRef.current) {
        modelerRef.current.off('commandStack.changed', handleChanged);
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [localIsReadOnly]);

  // Tự động đồng bộ bản Draft mỗi 30 giây (Đã đưa ra ngoài useEffect chính)
  useEffect(() => {
    if (localIsReadOnly || !workflowCode) return;

    const controller = new AbortController();

    const interval = setInterval(async () => {
      if (!modelerRef.current) return;
      try {
        const result = await modelerRef.current.saveXML({ format: true });
        if (result?.xml) {
          await workflowService.syncDraft({
            code: workflowCode,
            name: workflowName || 'Untitled Workflow',
            description: workflowDescription,
            xmlContent: result.xml
          }, controller.signal);
        }
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error('Failed to auto-sync draft:', err);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [workflowCode, workflowName, workflowDescription, localIsReadOnly]);

  const handleSaveProperties = () => {
    if (!modelerRef.current || !selectedElement || localIsReadOnly) return;

    const values = form.getFieldsValue();
    const modeling = modelerRef.current.get('modeling') as any;

    modeling.updateProperties(selectedElement, {
      name: values.name,
      'camunda:candidateGroups': values.role,
      'camunda:description': values.description,
      'camunda:dueDate': values.dueDate,
      'camunda:actionType': values.actionType,
      'camunda:buttonColor': values.buttonColor,
      'camunda:class': values.camundaClass
    });

    message.success('Đã cập nhật cấu hình bước');
    setIsDrawerOpen(false);
  };

  const handleZoom = (type: 'in' | 'out' | 'fit') => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas') as any;
    if (type === 'in') canvas.zoom(canvas.zoom() * 1.2);
    else if (type === 'out') canvas.zoom(canvas.zoom() * 0.8);
    else canvas.zoom('fit-viewport');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bpmn, .xml';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        const xmlContent = event.target.result;
        if (modelerRef.current) {
          try {
            await modelerRef.current.importXML(xmlContent);
            message.success('Đã nhập quy trình từ file thành công');
          } catch (err) {
            message.error('File không đúng định dạng BPMN 2.0');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };


  const handleExport = async () => {
    if (!modelerRef.current) return;
    try {
      const result = await modelerRef.current.saveXML({ format: true });
      if (result?.xml) {
        const blob = new Blob([result.xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workflow-template.bpmn';
        a.click();
        URL.revokeObjectURL(url);
        message.success('Đã xuất file sơ đồ thành công');
      }
    } catch (err) {
      message.error('Lỗi khi xuất file');
    }
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20 shadow-sm">
        <Space separator={<Divider orientation="vertical" className="bg-slate-200 h-6" />}>
          <div className="flex flex-col">
            <Text strong className="text-[13px] leading-tight">Sơ đồ Quy trình</Text>
            <Text type="secondary" className="text-[10px] leading-tight">Chuẩn BPMN 2.0</Text>
          </div>
          
          {!readOnly && (
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Space size={2}>
                <Button 
                  size="small" 
                  type={!localIsReadOnly ? "text" : "default"} 
                  className={`text-xs px-3 rounded-md transition-all ${!localIsReadOnly ? 'bg-white shadow-sm font-semibold text-blue-600' : 'text-slate-500'}`}
                  onClick={() => setLocalIsReadOnly(false)}
                >
                  Thiết kế
                </Button>
                <Button 
                  size="small" 
                  type={localIsReadOnly ? "text" : "default"} 
                  className={`text-xs px-3 rounded-md transition-all ${localIsReadOnly ? 'bg-white shadow-sm font-semibold text-blue-600' : 'text-slate-500'}`}
                  onClick={() => setLocalIsReadOnly(true)}
                >
                  Xem thử
                </Button>
              </Space>
            </div>
          )}

          {!localIsReadOnly && (
            <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 text-[11px] text-blue-600 flex items-center gap-2 animate-in fade-in zoom-in-95">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Kéo thả từ thanh công cụ bên trái
            </div>
          )}
        </Space>

        <Space size="small">
          <Tooltip title="Tải file sơ đồ từ máy tính lên">
            <Button 
              icon={<Upload size={14} />} 
              size="small" 
              onClick={handleImport}
              disabled={localIsReadOnly}
              className="flex items-center gap-2 text-xs border-slate-200"
            >
              Nhập XML
            </Button>
          </Tooltip>
          <Tooltip title="Tải file sơ đồ về máy">
            <Button 
              icon={<Download size={14} />} 
              onClick={handleExport}
              size="small"
              className="flex items-center gap-2 text-xs border-slate-200"
            >
              Xuất XML
            </Button>
          </Tooltip>
          
        </Space>
      </div>

      <div className="w-full grow bg-[#fcfdfe] relative designer-container">
        <div ref={containerRef} className="w-full h-full" />
        
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
          <Button icon={<Plus size={16} />} onClick={() => handleZoom('in')} className="shadow-md border-slate-200 bg-white" />
          <Button icon={<span className="text-xs">1:1</span>} onClick={() => handleZoom('fit')} className="shadow-md border-slate-200 bg-white" />
          <Button icon={<Minus size={16} />} onClick={() => handleZoom('out')} className="shadow-md border-slate-200 bg-white" />
        </div>

        {selectedElement && (
          <div className="absolute top-6 right-6 bg-white shadow-xl border border-slate-200 p-0 rounded-xl z-10 w-72 animate-in fade-in slide-in-from-top-4 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider">Cấu hình hiện tại</Text>
              <Tag color="blue" className="mr-0 text-[10px] uppercase font-medium">{selectedElement.type.split(':')[1]}</Tag>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Mã bước</Text>
                    <Text className="text-[12px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit">
                      {selectedElement.businessObject.id}
                    </Text>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Loại xử lý</Text>
                    <Tag color="default" className="m-0 text-[10px] w-fit border-slate-200">
                      {['bpmn:UserTask', 'bpmn:Task'].includes(selectedElement.type) ? 'Người dùng' : 
                       selectedElement.type === 'bpmn:ServiceTask' ? 'Tự động' : 
                       selectedElement.type === 'bpmn:SequenceFlow' ? 'Chuyển bước' : 'Hệ thống'}
                    </Tag>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Text type="secondary" className="text-[11px]">Tên hiển thị</Text>
                  <Text strong className="text-[13px] leading-tight text-slate-800">
                    {selectedElement.businessObject.name || <span className="text-slate-400 font-normal italic">Chưa đặt tên</span>}
                  </Text>
                </div>

                {['bpmn:UserTask', 'bpmn:Task'].includes(selectedElement.type) && (
                  <>
                    <div className="flex flex-col gap-1">
                      <Text type="secondary" className="text-[11px]">Hành động yêu cầu</Text>
                      <Tag color="orange" className="m-0 text-[11px] w-fit">
                        {selectedElement.businessObject.get('camunda:actionType') === 'upload' ? 'Upload tài liệu' :
                         selectedElement.businessObject.get('camunda:actionType') === 'form' ? 'Điền Form' :
                         selectedElement.businessObject.get('camunda:actionType') === 'both' ? 'Upload & Điền Form' : 'Chỉ xem'}
                      </Tag>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Text type="secondary" className="text-[11px]">Nhóm/Role thực hiện</Text>
                      <div className="flex items-center gap-1.5">
                        <Tag color="purple" className="m-0 text-[11px] font-medium border-purple-100">
                          {roles.find(r => r.code === selectedElement.businessObject.get('camunda:candidateGroups'))?.name || selectedElement.businessObject.get('camunda:candidateGroups') || 'Hệ thống/Tự động'}
                        </Tag>
                      </div>
                    </div>
                  </>
                )}

                {selectedElement.type === 'bpmn:SequenceFlow' && (
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Đích đến</Text>
                    <Text className="text-[12px] text-slate-700">
                      ➡️ {selectedElement.businessObject.targetRef?.name || selectedElement.businessObject.targetRef?.id}
                    </Text>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <Text type="secondary" className="text-[11px]">Thời hạn xử lý (Giờ)</Text>
                  <Text className="text-[12px] text-slate-700 flex items-center gap-1">
                    <Play size={10} className="text-blue-500" />
                    {selectedElement.businessObject.get('camunda:dueDate') ? `${selectedElement.businessObject.get('camunda:dueDate')} giờ` : 'Không giới hạn'}
                  </Text>
                </div>

                {selectedElement.businessObject.get('camunda:description') && (
                  <div className="flex flex-col gap-1">
                    <Text type="secondary" className="text-[11px]">Mô tả công việc</Text>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Text className="text-[12px] text-slate-600 italic block leading-relaxed">
                        "{selectedElement.businessObject.get('camunda:description')}"
                      </Text>
                    </div>
                  </div>
                )}
              </div>

              {!localIsReadOnly && (
                <Button 
                  block 
                  type="primary" 
                  icon={<Settings size={14} />} 
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 h-9 rounded-lg mt-2 shadow-sm"
                >
                  Chỉnh sửa cấu hình
                </Button>
              )}
            </div>
          </div>
        )}

      </div>

      <Drawer
        title="Cấu hình Chi tiết Bước"
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        size="large"
        forceRender={true}
        extra={
          <Button type="primary" onClick={() => setIsDrawerOpen(false)} className="rounded-lg">
            Hoàn tất
          </Button>
        }
        className="workflow-config-drawer"
      >
        <Form 
          form={form} 
          layout="vertical" 
          className="mt-2"
          initialValues={{ buttonColor: 'primary' }}
        >
          {selectedElement && (
            <>
              <Form.Item label="ID Bước" name="id">
                <Input disabled />
              </Form.Item>
              
              <Form.Item 
                label="Tên bước" 
                name="name" 
                rules={[{ required: true, message: 'Vui lòng nhập tên bước' }]}
              >
                <Input placeholder="VD: Thẩm định hồ sơ" />
              </Form.Item>

              {/* Cấu hình cho User Task hoặc Task mặc định */}
              {['bpmn:UserTask', 'bpmn:Task'].includes(selectedElement.type) && (
                <>
                  <Form.Item label="Nhóm/Role thực hiện" name="role">
                    <Select placeholder="Chọn Role có quyền thực hiện bước này">
                      {roles.map(role => (
                        <Select.Option key={role.code} value={role.code}>
                          {role.name} ({role.code})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Hành động bắt buộc" name="actionType">
                    <Select placeholder="User cần làm gì ở bước này?">
                      <Select.Option value="none">Chỉ xem và quyết định</Select.Option>
                      <Select.Option value="upload">Yêu cầu Upload tài liệu</Select.Option>
                      <Select.Option value="form">Yêu cầu điền Form thông tin</Select.Option>
                      <Select.Option value="both">Cả Upload và điền Form</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Mô tả công việc" name="description">
                    <Input.TextArea rows={4} placeholder="Mô tả chi tiết những gì role cần làm ở bước này..." />
                  </Form.Item>

                  <Divider />
                  <Title level={5}>Cấu hình Nâng cao</Title>
                  <Form.Item label="Thời hạn xử lý (Giờ)" name="dueDate">
                    <Input type="number" placeholder="24" />
                  </Form.Item>
                </>
              )}

              {/* Cấu hình cho Sequence Flow (Mũi tên) */}
              {selectedElement.type === 'bpmn:SequenceFlow' && (
                <>
                  <Form.Item 
                    label="Tên nút bấm hành động" 
                    name="name" 
                    help="Tên này sẽ hiển thị thành Button ở màn hình xử lý (VD: Duyệt, Từ chối)"
                  >
                    <Input placeholder="VD: Duyệt hồ sơ" />
                  </Form.Item>
                  <Form.Item label="Màu sắc nút" name="buttonColor">
                    <Select>
                      <Select.Option value="primary">Xanh dương (Duyệt/Tiếp tục)</Select.Option>
                      <Select.Option value="danger">Đỏ (Từ chối/Hủy)</Select.Option>
                      <Select.Option value="default">Xám (Bổ sung/Quay lại)</Select.Option>
                    </Select>
                  </Form.Item>
                </>
              )}

              {/* Cấu hình cho Service Task hoặc loại khác */}
              {selectedElement.type === 'bpmn:ServiceTask' && (
                <Form.Item label="Class xử lý tự động" name="camundaClass">
                  <Input placeholder="com.euni.workflow.service.AutoExecuteDelegate" />
                </Form.Item>
              )}

              {!['bpmn:UserTask', 'bpmn:SequenceFlow', 'bpmn:ServiceTask'].includes(selectedElement.type) && (
                <Form.Item label="Tên đối tượng" name="name">
                    <Input placeholder="Nhập tên..." />
                </Form.Item>
              )}
            </>
          )}
        </Form>
      </Drawer>

      <style jsx global>{`
        .designer-container .bjs-powered-by {
          display: none;
        }
        .designer-container .djs-palette {
          top: 20px !important;
          left: 20px !important;
          border-radius: 12px !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
        .designer-container .djs-context-pad {
          border-radius: 8px !important;
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
