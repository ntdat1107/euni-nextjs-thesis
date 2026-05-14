'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Typography, Card, Button, Space, Breadcrumb, Form, Input,
  Select, Divider, Row, Col, DatePicker, App as AntdApp,
  Empty, Checkbox, Tag, Tooltip, Progress
} from 'antd';
import {
  ArrowLeft, Save, CheckCircle2,
  Settings, FileText, Users, Calendar, Info, Loader2,
  ChevronRight, PlayCircle, ClipboardList, Clock, AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { programService } from '@/services/programService';
import workflowService, { WorkflowTemplateResponse } from '@/services/workflowService';
import { surveyCampaignService, SurveyCampaignRequest } from '@/services/surveyCampaignService';
import { rbacService, Role } from '@/services/rbacService';
import { workflowDefinitionService, WorkflowStepDefinitionResponse } from '@/services/workflowDefinitionService';

const { Title, Text, Paragraph } = Typography;

export default function SurveyCampaignForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { message } = AntdApp.useApp();

  const id = params?.id as string;
  const isNew = !id || id === 'new';
  const mode = searchParams.get('mode');
  const isView = !isNew && mode !== 'edit';

  const [form] = Form.useForm();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [programs, setPrograms] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplateResponse[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stepDefinitions, setStepDefinitions] = useState<WorkflowStepDefinitionResponse[]>([]);
  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, wData, rData, dData] = await Promise.all([
          programService.getAll(),
          workflowService.getAll(),
          rbacService.getRoles(),
          workflowDefinitionService.getAll()
        ]);
        setPrograms(pData);
        setWorkflows(wData);
        setRoles(rData);
        setStepDefinitions(dData);
      } catch (error) {
        message.error('Lỗi khi tải dữ liệu khởi tạo');
      } finally {
        if (isNew) setIsLoading(false);
      }
    };
    fetchData();
  }, [isNew, message]);

  useEffect(() => {
    if (!isNew && id) {
      const fetchCampaign = async () => {
        try {
          setIsLoading(true);
          const data = await surveyCampaignService.getById(id);
          setCampaignData(data);
          form.setFieldsValue({
            ...data,
            range: [dayjs(data.startDate), dayjs(data.endDate)],
            workflowId: data.workflowTemplateId
          });
          setSelectedWorkflowId(data.workflowTemplateId);
          setWorkflowSteps(data.steps.map(s => ({
            id: s.id,
            title: s.stepName,
            deadline: s.deadline ? dayjs(s.deadline) : null,
            requiredDocuments: s.requiredDocuments,
            configuration: s.configuration
          })));
        } catch (error) {
          message.error('Lỗi khi tải chi tiết đợt khảo sát');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCampaign();
    }
  }, [id, isNew, form, message]);

  useEffect(() => {
    if (isNew && selectedWorkflowId && workflows.length > 0) {
      const wf = workflows.find(w => w.id === selectedWorkflowId);
      if (wf && wf.jsonContent) {
        try {
          const parsed = JSON.parse(wf.jsonContent);
          const nodes = parsed.nodes || [];
          const edges = parsed.edges || [];

          const startNode = nodes.find((n: any) => n.type === 'start');
          if (startNode) {
            const steps: any[] = [];
            let currentNodeId = startNode.id;
            const visited = new Set<string>();

            while (currentNodeId && !visited.has(currentNodeId)) {
              visited.add(currentNodeId);

              const outgoingEdge = edges.find((e: any) => e.source === currentNodeId);
              if (!outgoingEdge) break;

              const targetId = outgoingEdge.target;
              const taskNode = nodes.find((n: any) => n.id === targetId && n.type === 'state');

              if (taskNode) {
                const stepCode = taskNode.data.screenCode;
                const definition = stepDefinitions.find(d => d.stepCode === stepCode);

                steps.push({
                  title: taskNode.data.label || taskNode.id,
                  description: '',
                  configuration: {
                    taskId: taskNode.id,
                    performerRole: taskNode.data.performerRole || '',
                    approverRole: taskNode.data.approverRole || '',
                    screenCode: stepCode || ''
                  },
                  deadline: null,
                  requiredDocuments: taskNode.data.requiredDocuments || (definition ? definition.requiredDocuments : [])
                });
              }

              currentNodeId = targetId;
            }
            setWorkflowSteps(steps);
          }
        } catch (error) {
          console.error("Error parsing workflow JSON:", error);
        }
      }
    }
  }, [selectedWorkflowId, workflows, isNew, stepDefinitions]);

  const handleWorkflowChange = (value: string) => {
    setSelectedWorkflowId(value);
  };

  const onFinish = async (values: any) => {
    try {
      setIsSubmitting(true);
      const { range, workflowId, ...rest } = values;

      const requestData: SurveyCampaignRequest = {
        ...rest,
        code: values.code || `CAM-${Date.now()}`,
        status: isNew ? 'ACTIVE' : (values.status || 'ACTIVE'),
        startDate: range?.[0] ? range[0].toISOString() : dayjs().toISOString(),
        endDate: range?.[1] ? range[1].toISOString() : dayjs().add(1, 'month').toISOString(),
        steps: workflowSteps.map((s, idx) => ({
          stepIndex: idx,
          stepName: s.title,
          deadline: s.deadline?.toISOString(),
          requiredDocuments: s.requiredDocuments || [],
          configuration: s.configuration || {}
        }))
      };

      let result;
      if (isNew) {
        result = await surveyCampaignService.create({ ...requestData, workflowTemplateId: selectedWorkflowId! });
        message.success('Đã tạo đợt khảo sát thành công!');
      } else {
        result = await surveyCampaignService.update(id, requestData);
        message.success('Đã cập nhật đợt khảo sát!');
      }

      router.push(`/survey/campaigns/${result.id}?mode=view`);
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCampaignHeader = () => {
    const data = !isNew ? campaignData : form.getFieldsValue();
    const selectedProgram = programs.find(p => p.id === data?.programId);
    const programName = data?.programName || selectedProgram?.name || '---';
    const programCode = data?.programCode || selectedProgram?.code || '';
    const workflowName = data?.workflowTemplateName || workflows.find(w => w.id === (data?.workflowTemplateId || data?.workflowId))?.name || '---';

    return (
      <div className="bg-slate-50/80 px-12 py-6 border-b border-slate-100">
        <Row gutter={[32, 16]}>
          <Col span={8}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Chương trình đào tạo</Text>
            <Text className="text-slate-700 font-semibold flex items-center gap-2">
              <Info size={14} className="text-blue-500" />
              {programCode ? `[${programCode}] ` : ''}{programName}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mẫu quy trình</Text>
            <Text className="text-slate-700 font-semibold flex items-center gap-2">
              <Settings size={14} className="text-purple-500" />
              {workflowName}
            </Text>
          </Col>
          <Col span={8}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian hiệu lực</Text>
            <Text className="text-slate-700 font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-emerald-500" />
              {data?.startDate ? `${dayjs(data.startDate).format('DD/MM/YYYY')} - ${dayjs(data.endDate).format('DD/MM/YYYY')}` : '---'}
            </Text>
          </Col>
        </Row>
        {data?.description && (
          <div className="mt-4 pt-4 border-t border-slate-100/50">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mô tả chi tiết</Text>
            <Paragraph className="!mb-0 text-slate-600 text-sm italic">
              "{data.description}"
            </Paragraph>
          </div>
        )}
      </div>
    );
  };

  const renderExecutionProgress = () => {
    return (
      <div className="px-12 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="!mb-1">Tiến độ thực hiện</Title>
            <Text type="secondary" className="text-sm">Trạng thái các bước trong chương trình đào tạo</Text>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="text-right">
              <Text className="text-[10px] font-bold text-slate-400 uppercase block">Tổng tiến độ</Text>
              <Text className="text-sm font-bold text-blue-600">0/{workflowSteps.length} bước</Text>
            </div>
            <Progress type="circle" percent={0} size={40} strokeWidth={12} />
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <Text className="font-semibold text-slate-700 text-base">
                {campaignData?.programName || '---'}
              </Text>
            </div>
            <Tag color="blue" className="rounded-full px-3">
              {workflowSteps.length} bước
            </Tag>
          </div>

          <table className="w-full text-sm">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-center w-16">#</th>
                <th className="px-4 py-4 text-left">Tên bước thực hiện</th>
                <th className="px-4 py-4 text-left">Hồ sơ công việc</th>
                <th className="px-4 py-4 text-left">Người thực hiện</th>
                <th className="px-4 py-4 text-left">Hạn chót</th>
                <th className="px-4 py-4 text-left">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workflowSteps.length > 0 ? workflowSteps.map((step, idx) => (
                <tr key={step.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 text-center font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <Text className="font-semibold text-slate-700">{step.title}</Text>
                      {step.configuration?.screenCode && (
                        <Text className="text-[10px] text-slate-400 font-mono">CODE: {step.configuration.screenCode}</Text>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1">
                      {step.requiredDocuments?.map((doc: string, dIdx: number) => (
                        <Tag key={dIdx} className="bg-slate-50 border-slate-200 text-slate-500 text-[10px] rounded-md">
                          {doc}
                        </Tag>
                      ))}
                      {(!step.requiredDocuments || step.requiredDocuments.length === 0) && <Text type="secondary" className="text-xs italic">Không có</Text>}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <Tag color="blue" className="rounded-full border-blue-100 bg-blue-50 text-blue-600 font-medium">
                      {roles.find(r => r.code === step.configuration?.performerRole)?.name || '---'}
                    </Tag>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={14} className="text-slate-300" />
                      <Text className="text-sm">
                        {step.deadline ? dayjs(step.deadline).format('DD/MM/YYYY') : 'Chưa thiết lập'}
                      </Text>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <Tag icon={<AlertCircle size={12} />} className="rounded-full border-amber-100 bg-amber-50 text-amber-600 font-medium flex items-center gap-1 w-fit">
                      Chờ khởi tạo
                    </Tag>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Tooltip title="Xem chi tiết">
                      <Button
                        type="text"
                        icon={<ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                        className="flex items-center justify-center ml-auto hover:bg-blue-50 rounded-full w-9 h-9"
                        onClick={() => message.info('Chức năng xem chi tiết bước đang được phát triển')}
                      />
                    </Tooltip>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-12">
                    <Empty description="Không có bước nào được cấu hình" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderConfigSteps = () => {
    return (
      <div className="space-y-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="text-blue-500" size={20} />
          <Title level={4} className="!mb-0">Cấu hình chi tiết các bước</Title>
        </div>

        {workflowSteps.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {workflowSteps.map((step, idx) => (
              <Card key={idx} className="rounded-2xl border-slate-100 hover:border-blue-200 transition-all shadow-sm">
                <Row gutter={24} align="middle">
                  <Col span={1} className="text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                      {idx + 1}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text className="font-semibold text-slate-700 text-lg">{step.title}</Text>
                    <div className="flex gap-2 mt-2">
                      <Tag color="blue" size="small" className="text-[10px] rounded-md">
                        {roles.find(r => r.code === step.configuration?.performerRole)?.name || 'Performer'}
                      </Tag>
                      <Tag color="orange" size="small" className="text-[10px] rounded-md">
                        {roles.find(r => r.code === step.configuration?.approverRole)?.name || 'Approver'}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text className="text-sm font-semibold text-slate-500 block mb-2">Hạn chót (Deadline)</Text>
                    <DatePicker
                      className="w-full h-10 rounded-lg"
                      placeholder="Chọn ngày"
                      value={step.deadline}
                      onChange={(date) => {
                        const newSteps = [...workflowSteps];
                        newSteps[idx].deadline = date;
                        setWorkflowSteps(newSteps);
                      }}
                    />
                  </Col>
                  <Col span={7}>
                    <Text className="text-sm font-semibold text-slate-500 block mb-2">Hồ sơ công việc</Text>
                    <div className="flex flex-wrap gap-2">
                      {step.requiredDocuments?.map((doc: string, dIdx: number) => (
                        <Tag key={dIdx} color="cyan" className="rounded-md border-none bg-cyan-50 text-cyan-700 font-medium text-xs">
                          {doc}
                        </Tag>
                      ))}
                      {(!step.requiredDocuments || step.requiredDocuments.length === 0) && <Text type="secondary" className="text-xs italic">Không có yêu cầu</Text>}
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
            <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <Text className="text-slate-400 font-medium">Vui lòng chọn Mẫu quy trình để hiển thị danh sách các bước</Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { title: 'Trang chủ' },
          { title: 'Khảo sát' },
          { title: 'Đợt khảo sát' },
          { title: isNew ? 'Tạo mới' : (isView ? 'Chi tiết' : 'Chỉnh sửa') },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push('/survey/campaigns')}
            className="rounded-lg hover:bg-slate-100 border-none flex items-center"
          >
            Quay lại
          </Button>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div>
            <div className="flex items-center gap-3">
              <Title level={2} className="!mb-0 !text-slate-800 tracking-tight">
                {isNew ? 'Thiết lập Đợt Khảo sát mới' : (isView ? campaignData?.name : `Chỉnh sửa: ${campaignData?.name}`)}
              </Title>
              {!isNew && (
                <div className="mt-1">
                  {(() => {
                    const status = (isView ? campaignData?.status : form.getFieldValue('status')) || 'DRAFT';
                    const statusMap: any = {
                      'DRAFT': { color: 'default', text: 'Nháp' },
                      'ACTIVE': { color: 'processing', text: 'Đang hoạt động' },
                      'COMPLETED': { color: 'success', text: 'Hoàn thành' },
                      'CANCELLED': { color: 'error', text: 'Đã hủy' }
                    };
                    const config = statusMap[status] || statusMap['DRAFT'];
                    return (
                      <Tag color={config.color} className="rounded-full px-3 py-0.5 border-none font-bold text-[11px] uppercase tracking-wider shadow-sm">
                        {config.text}
                      </Tag>
                    );
                  })()}
                </div>
              )}
            </div>
            <Paragraph type="secondary" className="!mb-0 text-slate-500 font-medium">
              {isNew ? 'Khởi tạo đợt khảo sát và gán quy trình thực hiện' : (isView ? 'Theo dõi tiến độ và quản lý đợt khảo sát' : 'Cập nhật thông tin và cấu hình các bước')}
            </Paragraph>
          </div>
        </div>
        {!isView && (
          <Button
            type="primary"
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            onClick={() => form.submit()}
            disabled={isSubmitting || (isNew && !selectedWorkflowId)}
            className="rounded-xl px-8 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none transition-all"
          >
            {isSubmitting ? 'Đang xử lý...' : (isNew ? 'Khởi tạo đợt khảo sát' : 'Lưu thay đổi')}
          </Button>
        )}
      </div>

      <Card className="shadow-sm border-slate-200 rounded-3xl overflow-hidden min-h-[600px] relative" styles={{ body: { padding: 0 } }}>
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <Text className="text-slate-500 font-medium">Đang tải dữ liệu...</Text>
            </div>
          </div>
        )}

        {isView ? (
          <div className="flex flex-col h-full">
            {renderCampaignHeader()}
            {renderExecutionProgress()}
          </div>
        ) : (
          <div className="p-12">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={32}>
                <Col span={24}>
                  <div className="flex items-center gap-2 mb-6">
                    <Info className="text-blue-500" size={20} />
                    <Title level={4} className="!mb-0">Thông tin chung</Title>
                  </div>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label={<span className="text-sm font-semibold text-slate-700">Mã đợt khảo sát</span>}
                    rules={[{ required: isNew, message: 'Vui lòng nhập mã đợt' }]}
                  >
                    <Input placeholder="Ví dụ: KS-2026-SE" className="h-11 rounded-xl shadow-sm border-slate-200" disabled={!isNew} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label={<span className="text-sm font-semibold text-slate-700">Tên đợt khảo sát</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập tên đợt khảo sát' }]}
                  >
                    <Input placeholder="Ví dụ: Khảo sát CTĐT CNTT 2026" className="h-11 rounded-xl shadow-sm border-slate-200" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="programId"
                    label={<span className="text-sm font-semibold text-slate-700">Chương trình đào tạo</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn chương trình' }]}
                  >
                    <Select placeholder="Chọn chương trình đào tạo" className="h-11 shadow-sm border-slate-200 rounded-xl" styles={{ selector: { borderRadius: '12px' } }}>
                      {programs.map(p => (
                        <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="workflowId"
                    label={<span className="text-sm font-semibold text-slate-700">Mẫu quy trình áp dụng</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn mẫu quy trình' }]}
                  >
                    <Select
                      placeholder="Chọn mẫu quy trình"
                      className="h-11 shadow-sm border-slate-200 rounded-xl"
                      onChange={handleWorkflowChange}
                      disabled={!isNew}
                    >
                      {workflows.map(w => (
                        <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {!isNew && (
                  <Col span={24}>
                    <Form.Item
                      name="status"
                      label={<span className="text-sm font-semibold text-slate-700">Trạng thái đợt khảo sát</span>}
                    >
                      <Select className="h-11 shadow-sm border-slate-200 rounded-xl">
                        <Select.Option value="DRAFT">Nháp</Select.Option>
                        <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
                        <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
                        <Select.Option value="CANCELLED">Đã hủy</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                <Col span={24}>
                  <Form.Item
                    name="range"
                    label={<span className="text-sm font-semibold text-slate-700">Thời gian thực hiện</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                  >
                    <DatePicker.RangePicker className="w-full h-11 rounded-xl shadow-sm border-slate-200" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label={<span className="text-sm font-semibold text-slate-700">Mô tả chi tiết</span>}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập mô tả đợt khảo sát..." className="rounded-xl shadow-sm border-slate-200" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider className="my-8" />

              {renderConfigSteps()}
            </Form>
          </div>
        )}
      </Card>

      <style jsx global>{`
        .ant-form-item-label label {
          margin-bottom: 4px;
        }
        .ant-input-disabled, .ant-select-disabled .ant-select-selector, .ant-picker-disabled {
          background-color: #f8fafc !important;
          color: #1e293b !important;
          cursor: default !important;
          border-color: #e2e8f0 !important;
          opacity: 1 !important;
        }
        .ant-checkbox-disabled + span, .ant-radio-disabled + span {
           color: #1e293b !important;
           cursor: default !important;
           opacity: 1 !important;
        }
        .ant-select-disabled .ant-select-selection-item {
          color: #1e293b !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
