'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Typography, Card, Button, Space, Breadcrumb, Form, Input,
  Select, Divider, Row, Col, DatePicker, App as AntdApp,
  Empty, Checkbox, Tag, Tooltip, Progress,
  Modal, Collapse
} from 'antd';
import {
  ArrowLeft, Save, CheckCircle2,
  Settings, FileText, Users, Calendar, Info, Loader2,
  ChevronRight, ChevronUp, ChevronDown, PlayCircle, ClipboardList, Clock, AlertCircle, Edit, BookOpen, Ban
} from 'lucide-react';
import dayjs from 'dayjs';
import { programService } from '@/services/programService';
import { courseService } from '@/services/courseService';
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
  const isView = !isNew;

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
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

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

  const [programCourses, setProgramCourses] = useState<any[]>([]);

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
          const sortedSteps = [...(data.steps || [])].sort((a: any, b: any) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0));
          setWorkflowSteps(sortedSteps.map(s => {
            // Parse configuration if it's a string
            const config = typeof s.configuration === 'string' ? JSON.parse(s.configuration) : (s.configuration || {});
            return {
              id: s.id,
              stepIndex: s.stepIndex,
              title: s.stepName,
              deadline: s.deadline ? dayjs(s.deadline) : null,
              requiredDocuments: typeof s.requiredDocuments === 'string' ? JSON.parse(s.requiredDocuments) : (s.requiredDocuments || []),
              configuration: config,
              status: s.status,
              resultData: s.resultData
            };
          }));

          // Fetch courses for the program
          if (data.programId) {
            try {
              const [allCourses, assignedIds] = await Promise.all([
                courseService.getAll(),
                programService.getCourses(data.programId)
              ]);
              const filtered = allCourses.filter(c => assignedIds.includes(c.id));
              setProgramCourses(filtered);
            } catch (err) {
              console.error('Lỗi khi tải môn học của chương trình:', err);
            }
          }
        } catch (error) {
          message.error('Lỗi khi tải chi tiết đợt khảo sát');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCampaign();
    }

  }, [id, isNew, form, message]);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await surveyCampaignService.approve(id);
      message.success('Đã phê duyệt đợt khảo sát và đồng bộ dữ liệu Master Data thành công!');
      // Refresh data
      const data = await surveyCampaignService.getById(id);
      setCampaignData(data);
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi phê duyệt đợt khảo sát');
    } finally {
      setIsSubmitting(false);
    }
  };

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

                const prereqs = Array.isArray(taskNode.data?.prerequisiteStepCodes) 
                  ? taskNode.data.prerequisiteStepCodes 
                  : (taskNode.data?.prerequisiteStepCode ? [taskNode.data.prerequisiteStepCode] : []);

                steps.push({
                  title: taskNode.data.label || taskNode.id,
                  description: '',
                  configuration: {
                    taskId: taskNode.id,
                    performerRole: taskNode.data.performerRole || '',
                    approverRole: taskNode.data.approverRole || '',
                    screenCode: stepCode || '',
                    prerequisiteStepCodes: prereqs,
                    prerequisiteStepCode: prereqs.length > 0 ? prereqs[0] : ''
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
        programId: values.programId || campaignData?.programId,
        workflowTemplateId: workflowId || selectedWorkflowId || campaignData?.workflowTemplateId,
        code: values.code || `CAM-${Date.now()}`,
        status: isNew ? 'ACTIVE' : (values.status || 'ACTIVE'),
        startDate: range?.[0] ? range[0].toISOString() : dayjs().toISOString(),
        endDate: range?.[1] ? range[1].toISOString() : dayjs().add(1, 'month').toISOString(),
        steps: workflowSteps.map((s, idx) => ({
          stepIndex: idx,
          stepName: s.title,
          deadline: s.deadline?.toISOString ? s.deadline.toISOString() : s.deadline,
          requiredDocuments: s.requiredDocuments || [],
          configuration: s.configuration || {}
        }))
      };

      let result;
      if (isNew) {
        result = await surveyCampaignService.create(requestData);
        message.success('Đã tạo đợt khảo sát thành công!');
      } else {
        result = await surveyCampaignService.update(id, requestData);
        message.success('Đã cập nhật đợt khảo sát!');
      }


      router.push(`/survey/campaigns/${result.id}?mode=view`);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Lỗi khi lưu dữ liệu';
      Modal.error({
        title: 'Không thể tạo đợt khảo sát mới',
        content: (
          <div className="py-2">
            <p className="text-slate-600 text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        ),
        okText: 'Đã hiểu',
        centered: true,
      });
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
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian khảo sát</Text>
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

  const [courseSearchText, setCourseSearchText] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'ALL' | 'SET' | 'UNSET'>('ALL');
  const [isS5Expanded, setIsS5Expanded] = useState(true);

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
              {workflowSteps.length > 0 ? workflowSteps.map((step, idx) => {
                const stepResult = typeof step.resultData === 'string' ? JSON.parse(step.resultData) : (step.resultData || {});
                
                const filteredCourses = programCourses.filter((course: any) => {
                  const courseCloData = stepResult?.[course.id]?.clos || stepResult?.[course.id] || [];
                  const hasClo = Array.isArray(courseCloData) && courseCloData.length > 0;

                  // Status filter
                  if (courseStatusFilter === 'SET' && !hasClo) return false;
                  if (courseStatusFilter === 'UNSET' && hasClo) return false;

                  // Search term filter
                  if (!courseSearchText.trim()) return true;
                  const term = courseSearchText.toLowerCase();
                  return (
                    (course.name && course.name.toLowerCase().includes(term)) ||
                    (course.code && course.code.toLowerCase().includes(term))
                  );
                });

                return (
                  <React.Fragment key={step.id || idx}>
                    <tr 
                      className={`hover:bg-slate-50/50 transition-colors group ${
                        step.configuration?.screenCode === 'S5_CLO' ? 'cursor-pointer select-none bg-blue-50/20' : ''
                      }`}
                      onClick={() => {
                        if (step.configuration?.screenCode === 'S5_CLO') {
                          setIsS5Expanded(!isS5Expanded);
                        }
                      }}
                    >
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
                        {(() => {
                          const status = (step.status || '').toUpperCase();
                          if (status === 'COMPLETED') return <Tag icon={<CheckCircle2 size={12} />} color="success" className="rounded-full">Hoàn thành</Tag>;
                          if (status === 'ACTIVE') return <Tag icon={<Clock size={12} />} color="processing" className="rounded-full">Đang thực hiện</Tag>;
                          return <Tag icon={<AlertCircle size={12} />} color="default" className="rounded-full">Chờ khởi tạo</Tag>;
                        })()}
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {step.configuration?.screenCode === 'S5_CLO' && (
                            <Tooltip title={isS5Expanded ? "Thu gọn danh sách môn học" : "Mở rộng danh sách môn học"}>
                              <Button
                                type="text"
                                size="small"
                                icon={isS5Expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsS5Expanded(!isS5Expanded);
                                }}
                                className="flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 h-8 px-2.5 font-semibold text-xs gap-1 border border-blue-200/80 transition-all"
                              >
                                <span>{isS5Expanded ? 'Thu gọn' : 'Mở rộng'}</span>
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="Xem chi tiết bước">
                            <Button
                              type="text"
                              icon={<ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                              className="flex items-center justify-center hover:bg-blue-50 rounded-full w-8 h-8"
                              onClick={() => {
                                router.push(`/survey/campaigns/${id}/steps/${step.id || idx}`);
                              }}
                            />
                          </Tooltip>
                        </div>
                      </td>
                    </tr>

                    {step.configuration?.screenCode === 'S5_CLO' && isS5Expanded && (
                      <tr key={`sub-s5-${step.id || idx}`}>
                        <td colSpan={7} className="px-6 py-5 bg-slate-50/80 border-t border-b border-slate-200/80">
                          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-md space-y-4">
                            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100/70 flex items-center justify-center text-blue-600 font-bold shadow-2xs">
                                  <BookOpen size={20} />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-base flex items-center gap-2.5">
                                    <span>Danh sách Môn học thuộc CTĐT</span>
                                    <Tag color="blue" className="rounded-full font-bold text-xs px-3 py-0.5 border-none">
                                      {programCourses.length} môn học
                                    </Tag>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5">Thiết kế đề cương chi tiết và Chuẩn đầu ra (CLO) cho từng môn học</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Select
                                  value={courseStatusFilter}
                                  onChange={setCourseStatusFilter}
                                  size="middle"
                                  className="w-48 text-xs font-medium"
                                  options={[
                                    { value: 'ALL', label: 'Tất cả trạng thái' },
                                    { value: 'SET', label: 'Đã thiết lập CLO' },
                                    { value: 'UNSET', label: 'Chưa thiết lập CLO' },
                                  ]}
                                />
                                <Input.Search
                                  placeholder="Tìm môn học theo tên hoặc mã môn..."
                                  allowClear
                                  size="middle"
                                  value={courseSearchText}
                                  onChange={(e) => setCourseSearchText(e.target.value)}
                                  className="w-72 text-xs"
                                />
                              </div>
                            </div>

                            <div className="max-h-[480px] overflow-y-auto pr-1.5 space-y-3">
                              {filteredCourses.length > 0 ? filteredCourses.map((course: any) => {
                                const courseCloData = stepResult?.[course.id]?.clos || stepResult?.[course.id] || [];
                                const hasClo = Array.isArray(courseCloData) && courseCloData.length > 0;

                                return (
                                  <div 
                                    key={course.id} 
                                    className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-blue-400 hover:bg-white hover:shadow-md transition-all group/item"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs font-mono group-hover/item:bg-blue-600 group-hover/item:text-white transition-all shadow-2xs">
                                        {course.code || 'MH'}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-800 text-sm group-hover/item:text-blue-600 transition-colors">{course.name}</div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                                          <span>Mã môn: <span className="font-mono text-slate-600 font-semibold">{course.code}</span></span>
                                          <span>•</span>
                                          <span>Số tín chỉ: <span className="text-slate-600 font-semibold">{course.credits || 3}</span></span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      {hasClo ? (
                                        <Tag color="success" className="rounded-full px-3.5 py-1 border-none font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                                          {courseCloData.length} CLO đã thiết lập
                                        </Tag>
                                      ) : (
                                        <Tag color="default" className="rounded-full px-3.5 py-1 border-none font-medium text-[10px] text-slate-400 bg-slate-100">
                                          Chưa thiết lập CLO
                                        </Tag>
                                      )}

                                      <Button
                                        type="primary"
                                        size="middle"
                                        onClick={() => router.push(`/survey/campaigns/${id}/steps/${step.id || idx}?courseId=${course.id}&mode=edit`)}
                                        className="rounded-xl h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 border-none flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
                                      >
                                        <FileText size={15} />
                                        <span>Thiết kế đề cương / CLO</span>
                                        <ChevronRight size={14} className="opacity-70 group-hover/item:translate-x-0.5 transition-transform" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }) : (
                                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                                  {courseSearchText || courseStatusFilter !== 'ALL' ? 'Không tìm thấy môn học phù hợp với bộ lọc.' : 'Chương trình đào tạo này chưa có môn học nào được gán.'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) : (
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
                      <Tag color="blue" className="text-[10px] rounded-md">
                        {roles.find(r => r.code === step.configuration?.performerRole)?.name || 'Performer'}
                      </Tag>
                      <Tag color="orange" className="text-[10px] rounded-md">
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

  const [activeTabKey, setActiveTabKey] = useState<string>('steps');

  const renderWireframeHeader = () => {
    const data = !isNew ? campaignData : form.getFieldsValue();
    const status = (isView ? campaignData?.status : form.getFieldValue('status')) || 'DRAFT';
    const statusMap: any = {
      'DRAFT': { color: 'default', text: 'Bản nháp' },
      'ACTIVE': { color: 'processing', text: 'Đang diễn ra' },
      'COMPLETED': { color: 'success', text: 'Đã kết thúc' },
      'APPROVED': { color: 'gold', text: 'Đã phê duyệt (Synced)' },
      'CANCELLED': { color: 'error', text: 'Đã hủy' }
    };
    const config = statusMap[status] || statusMap['DRAFT'];

    const completedStepsCount = workflowSteps.filter(s => s.status === 'COMPLETED').length;
    const progressPercent = workflowSteps.length > 0 ? Math.round((completedStepsCount / workflowSteps.length) * 100) : 0;

    const totalCourses = programCourses.length;
    const s5Step = workflowSteps.find(s => s.configuration?.screenCode === 'S5_CLO');
    const s5Result = typeof s5Step?.resultData === 'string' ? JSON.parse(s5Step.resultData) : (s5Step?.resultData || {});
    const coursesWithClo = programCourses.filter(c => {
      const clos = s5Result?.[c.id]?.clos || s5Result?.[c.id] || [];
      return Array.isArray(clos) && clos.length > 0;
    }).length;
    const coursesUnset = totalCourses - coursesWithClo;

    return (
      <div className="bg-white p-6 border-b border-slate-200/90 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-4 flex-1">
            <Button
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.push('/survey/campaigns')}
              className="rounded-xl hover:bg-slate-100 border-slate-200 flex items-center h-10 px-3.5"
            >
              Quay lại
            </Button>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-3">
              <Title level={2} className="!mb-0 !text-slate-800 tracking-tight font-bold text-2xl">
                {isNew ? 'Thiết lập Đợt Khảo sát mới' : (isView ? campaignData?.name : `Chỉnh sửa: ${campaignData?.name}`)}
              </Title>
              {!isNew && (
                <Tag color={config.color} className="rounded-full px-3.5 py-1 border-none font-bold text-xs uppercase tracking-wider shadow-2xs">
                  🟢 {config.text}
                </Tag>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isView ? (
              <Button
                type="primary"
                size="large"
                icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                onClick={() => form.submit()}
                disabled={isSubmitting || (isNew && !selectedWorkflowId)}
                className="rounded-xl px-6 h-10 font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md border-none transition-all"
              >
                {isSubmitting ? 'Đang xử lý...' : (isNew ? 'Khởi tạo đợt khảo sát' : 'Lưu thay đổi')}
              </Button>
            ) : (
              <Space size="middle">
              {campaignData?.status !== 'APPROVED' && campaignData?.status !== 'CANCELLED' && (
                <Button
                  danger
                  size="middle"
                  icon={<Ban size={16} />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Xác nhận Hủy đợt khảo sát',
                      content: (
                        <div className="py-2">
                          <p className="text-slate-600 text-sm font-medium">Bạn có chắc chắn muốn hủy đợt khảo sát <strong>"{campaignData?.name}"</strong> không?</p>
                          <p className="text-slate-400 text-xs mt-1">Đợt khảo sát sau khi hủy sẽ dừng quy trình hiện tại và giải phóng Chương trình đào tạo để có thể tạo đợt khảo sát mới.</p>
                        </div>
                      ),
                      okText: 'Hủy đợt khảo sát',
                      okType: 'danger',
                      cancelText: 'Quay lại',
                      centered: true,
                      onOk: async () => {
                        try {
                          await surveyCampaignService.cancel(id as string);
                          message.success('Đã hủy đợt khảo sát thành công');
                          router.push('/survey/campaigns');
                        } catch (error: any) {
                          message.error(error.message || 'Lỗi khi hủy đợt khảo sát');
                        }
                      }
                    });
                  }}
                  className="rounded-xl px-4 h-10 font-semibold text-sm border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                >
                  Hủy đợt
                </Button>
              )}
              {campaignData?.status !== 'APPROVED' && campaignData?.status !== 'CANCELLED' && (
                <Button
                  type="default"
                  size="middle"
                  icon={<Edit size={16} />}
                  onClick={() => {
                    editForm.setFieldsValue({
                      description: campaignData?.description,
                      range: [dayjs(campaignData?.startDate), dayjs(campaignData?.endDate)]
                    });
                    setIsEditModalOpen(true);
                  }}
                  className="rounded-xl px-5 h-10 font-semibold text-sm border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-600 transition-all shadow-2xs"
                >
                  Chỉnh sửa
                </Button>
              )}
              {campaignData?.status !== 'APPROVED' && (
                <Button
                  type="primary"
                  size="middle"
                  icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={16} />}
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="rounded-xl px-6 h-10 font-bold text-sm bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 border-none transition-all"
                >
                  Phê duyệt & Đồng bộ
                </Button>
              )}
            </Space>
            )}
          </div>
        </div>

        {/* 5-Column KPI Metric Strip (Wireframe Row 2) */}
        {isView && (
          <Row gutter={[16, 16]}>
            <Col span={4} className="w-[20%]">
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái</Text>
                <Text className="text-base font-bold text-blue-600 block">{config.text}</Text>
              </div>
            </Col>
            <Col span={5}>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thời gian</Text>
                <Text className="text-sm font-bold text-slate-700 block">
                  {data?.startDate ? `${dayjs(data.startDate).format('DD/MM')} - ${dayjs(data.endDate).format('DD/MM/YYYY')}` : '---'}
                </Text>
              </div>
            </Col>
            <Col span={5}>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Học phần</Text>
                <Text className="text-base font-bold text-slate-800 block">{totalCourses} môn học</Text>
              </div>
            </Col>
            <Col span={5}>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
                <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Người dùng tham gia</Text>
                <Text className="text-base font-bold text-slate-800 block">Giảng viên / Khoa</Text>
              </div>
            </Col>
            <Col span={5}>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div>
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tiến độ quy trình</Text>
                  <Text className="text-base font-bold text-emerald-600 block">{progressPercent}% ({completedStepsCount}/{workflowSteps.length})</Text>
                </div>
                <Progress type="circle" percent={progressPercent} size={36} strokeWidth={12} />
              </div>
            </Col>
          </Row>
        )}

        {/* 2-Column Info & Progress Details (Wireframe Row 3) */}
        {isView && (
          <Row gutter={24}>
            <Col span={12}>
              <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 space-y-4 h-full shadow-2xs">
                <div className="flex items-center gap-2.5 border-b border-slate-200/90 pb-3.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center font-bold">
                    <Info size={16} />
                  </div>
                  <Title level={5} className="!mb-0 text-slate-800 font-bold tracking-tight text-base">
                    Thông tin chung
                  </Title>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chương trình đào tạo (CTĐT)</Text>
                    <Text className="font-semibold text-slate-800 text-sm block">
                      {campaignData?.programCode ? `[${campaignData.programCode}] ` : ''}{campaignData?.programName || '---'}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mẫu quy trình</Text>
                    <Text className="font-semibold text-slate-800 text-sm block">
                      {campaignData?.workflowTemplateName || '---'} ({workflowSteps.length} bước)
                    </Text>
                  </div>
                  <div>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Thời gian thực hiện</Text>
                    <Text className="font-semibold text-slate-800 block">
                      {data?.startDate ? `${dayjs(data.startDate).format('DD/MM/YYYY')} → ${dayjs(data.endDate).format('DD/MM/YYYY')}` : '---'}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả chi tiết</Text>
                    <Text className="text-slate-600 italic block">
                      "{campaignData?.description || 'Không có mô tả'}"
                    </Text>
                  </div>
                </div>
              </div>
            </Col>

            <Col span={12}>
              <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 space-y-4 h-full shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/90 pb-3.5 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold">
                      <BookOpen size={16} />
                    </div>
                    <Title level={5} className="!mb-0 text-slate-800 font-bold tracking-tight text-base">
                      Tiến độ thiết lập CLO & Môn học
                    </Title>
                  </div>
                  <Tag color="blue" className="rounded-full px-3 py-0.5 font-bold text-xs border-none">
                    {progressPercent}% Hoàn thành
                  </Tag>
                </div>

                <Progress percent={progressPercent} strokeColor={{ '0%': '#2563eb', '100%': '#059669' }} size={['100%', 12]} />

                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng môn học</Text>
                    <Text className="text-base font-bold text-slate-800 mt-0.5 block">{totalCourses} môn</Text>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Đã thiết lập CLO</Text>
                    <Text className="text-base font-bold text-emerald-600 mt-0.5 block">{coursesWithClo} môn</Text>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chưa thiết lập CLO</Text>
                    <Text className="text-base font-bold text-slate-500 mt-0.5 block">{coursesUnset} môn</Text>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* Tab Navigation (Wireframe Row 4) */}
        {isView && (
          <div className="pt-2 border-b border-slate-200">
            <div className="flex items-center gap-8 font-semibold text-sm">
              <button
                type="button"
                onClick={() => setActiveTabKey('steps')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  activeTabKey === 'steps' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview / Quy trình ({workflowSteps.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabKey('courses')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  activeTabKey === 'courses' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Học phần / Môn học ({totalCourses})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabKey('participants')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  activeTabKey === 'participants' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Người tham gia
              </button>
              <button
                type="button"
                onClick={() => setActiveTabKey('history')}
                className={`pb-3 border-b-2 transition-all cursor-pointer ${
                  activeTabKey === 'history' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Lịch sử tác nghiệp
              </button>
            </div>
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
            {renderWireframeHeader()}
            {activeTabKey === 'steps' && renderExecutionProgress()}
            {activeTabKey === 'courses' && (
              <div className="p-8">
                {/* Step 5 course view panel fallback */}
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <Title level={4} className="!mb-0">Danh sách Học phần / Môn học CTĐT</Title>
                      <Text type="secondary" className="text-sm">Tất cả {programCourses.length} môn học thuộc chương trình đào tạo</Text>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programCourses.map((c: any) => (
                      <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <Text className="font-bold text-slate-800 text-sm block">{c.name}</Text>
                          <Text className="text-xs text-slate-400">Mã môn: {c.code} • {c.credits || 3} tín chỉ</Text>
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            const s5Step = workflowSteps.find(s => s.configuration?.screenCode === 'S5_CLO');
                            if (s5Step) {
                              router.push(`/survey/campaigns/${id}/steps/${s5Step.id || 4}?courseId=${c.id}&mode=edit`);
                            }
                          }}
                          className="rounded-lg text-xs font-semibold bg-blue-600"
                        >
                          Thiết kế CLO
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTabKey === 'participants' && (
              <div className="p-12 text-center text-slate-400">
                <Text>Danh sách Giảng viên, Hội đồng ĐBCL và các bên liên quan tham gia đợt khảo sát.</Text>
              </div>
            )}
            {activeTabKey === 'history' && (
              <div className="p-12 text-center text-slate-400">
                <Text>Lịch sử ghi nhận tác nghiệp và nhật ký hệ thống.</Text>
              </div>
            )}
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
                    <Select placeholder="Chọn chương trình đào tạo" className="h-11 shadow-sm border-slate-200 rounded-xl">
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
                        <Select.Option value="DRAFT">Bản nháp</Select.Option>
                        <Select.Option value="ACTIVE">Đang diễn ra</Select.Option>
                        <Select.Option value="COMPLETED">Đã kết thúc</Select.Option>
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Edit className="text-blue-500" size={20} />
            <span className="text-lg font-bold text-slate-800">Chỉnh sửa thông tin đợt khảo sát</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => {
          editForm.validateFields().then(async (values) => {
            try {
              setIsSubmitting(true);
              const { range, ...rest } = values;
              const updateData = {
                ...campaignData,
                ...rest,
                startDate: range[0].toISOString(),
                endDate: range[1].toISOString(),
                steps: campaignData.steps.map((s: any) => ({
                  ...s,
                  deadline: s.deadline // Keep existing deadlines
                }))
              };
              await surveyCampaignService.update(id, updateData);
              message.success('Cập nhật thông tin thành công');
              setIsEditModalOpen(false);
              // Refresh data
              const refreshed = await surveyCampaignService.getById(id);
              setCampaignData(refreshed);
            } catch (error) {
              message.error('Lỗi khi cập nhật thông tin');
            } finally {
              setIsSubmitting(false);
            }
          });
        }}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        className="rounded-2xl"
        confirmLoading={isSubmitting}
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="text-sm font-semibold text-slate-700">Chương trình đào tạo</span>}>
                <Input value={campaignData?.programName || campaignData?.program?.name} disabled className="rounded-xl bg-slate-50 border-slate-200" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="text-sm font-semibold text-slate-700">Mẫu quy trình</span>}>
                <Input value={campaignData?.workflowTemplateName || campaignData?.workflow?.name} disabled className="rounded-xl bg-slate-50 border-slate-200" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="text-sm font-semibold text-slate-700">Trạng thái hiện tại</span>}>
                <Input value={campaignData?.status === 'DRAFT' ? 'Bản nháp' : (campaignData?.status === 'ACTIVE' ? 'Đang diễn ra' : 'Đã kết thúc')} disabled className="rounded-xl bg-slate-50 border-slate-200" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="range"
                label={<span className="text-sm font-semibold text-slate-700">Thời gian thực hiện khảo sát</span>}
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <DatePicker.RangePicker className="w-full h-11 rounded-xl" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={<span className="text-sm font-semibold text-slate-700">Mô tả chi tiết</span>}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả đợt khảo sát..." className="rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>

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
