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
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | string | null>(null);
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
  const [activeTabKey, setActiveTabKey] = useState<string>('steps');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isNew) {
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
        } else {
          const [rData, dData] = await Promise.all([
            rbacService.getRoles(),
            workflowDefinitionService.getAll()
          ]);
          setRoles(rData);
          setStepDefinitions(dData);
        }
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
          if (data.program) {
            setPrograms([data.program]);
          }
          if (data.workflowTemplate) {
            setWorkflows([data.workflowTemplate]);
          }
          form.setFieldsValue({
            ...data,
            range: [dayjs(data.startDate), dayjs(data.endDate)],
            workflowId: data.workflowTemplateId
          });
          setSelectedWorkflowId(data.workflowTemplateId);
          const sortedSteps = [...(data.steps || [])].sort((a: any, b: any) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0));
          setWorkflowSteps(sortedSteps.map(s => {
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

          if (data.courses) {
            setProgramCourses(data.courses.map(c => ({
              id: c.courseId,
              code: c.courseCode,
              name: c.courseName,
              credits: c.credits,
              status: c.status
            })));
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
      const wf = workflows.find(w => String(w.id) === String(selectedWorkflowId));
      if (wf && wf.jsonContent) {
        try {
          const parsed = JSON.parse(wf.jsonContent);
          const nodes = parsed.nodes || [];
          const edges = parsed.edges || [];

          if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            const steps: any[] = parsed.steps.map((s: any) => {
              const prereqs = Array.isArray(s.prerequisiteStepCodes) 
                ? s.prerequisiteStepCodes 
                : (s.prerequisiteStepCode ? [s.prerequisiteStepCode] : []);
              const execRoles = Array.isArray(s.executorRoles) && s.executorRoles.length > 0 
                ? s.executorRoles 
                : (s.executorRole ? [s.executorRole] : []);
              const appRoles = Array.isArray(s.approverRoles) && s.approverRoles.length > 0 
                ? s.approverRoles 
                : (s.approverRole ? [s.approverRole] : []);
              const definition = stepDefinitions.find(d => d.stepCode === s.screenCode || d.stepCode === s.code);

              return {
                title: s.name || s.code,
                description: '',
                configuration: {
                  taskId: s.tempId,
                  performerRole: execRoles[0] || '',
                  performerRoles: execRoles,
                  approverRole: appRoles[0] || '',
                  approverRoles: appRoles,
                  screenCode: s.screenCode || s.code || '',
                  prerequisiteStepCodes: prereqs,
                  prerequisiteStepCode: prereqs.length > 0 ? prereqs[0] : ''
                },
                deadline: null,
                requiredDocuments: s.requiredDocuments || (definition ? definition.requiredDocuments : [])
              };
            });
            setWorkflowSteps(steps);
          } else {
            const stateNodes = nodes.filter((n: any) => n.type === 'state');
            const steps: any[] = stateNodes.map((taskNode: any) => {
              const stepCode = taskNode.data.screenCode;
              const definition = stepDefinitions.find(d => d.stepCode === stepCode);

              const prereqs = Array.isArray(taskNode.data?.prerequisiteStepCodes) 
                ? taskNode.data.prerequisiteStepCodes 
                : (taskNode.data?.prerequisiteStepCode ? [taskNode.data.prerequisiteStepCode] : []);

              return {
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
              };
            });
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

  const [courseSearchText, setCourseSearchText] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'ALL' | 'SET' | 'UNSET'>('ALL');
  const [isS5Expanded, setIsS5Expanded] = useState(false);

  const renderExecutionProgress = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ClipboardList size={16} />
              </div>
              <Title level={5} className="!mb-0 text-slate-800 font-bold tracking-tight text-base">
                Tiến độ các bước ({workflowSteps.length})
              </Title>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-white border-b border-slate-100">
              <tr>
                <th className="px-3 py-3.5 text-center w-9">#</th>
                <th className="px-3 py-3.5 text-left w-[26%]">Tên bước thực hiện</th>
                <th className="px-3 py-3.5 text-left w-[20%]">Hồ sơ công việc</th>
                <th className="px-3 py-3.5 text-left w-[18%]">Người thực hiện</th>
                <th className="px-3 py-3.5 text-left w-[13%]">Hạn chót</th>
                <th className="px-3 py-3.5 text-left w-[14%]">Trạng thái</th>
                <th className="px-3 py-3.5 text-right w-20 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workflowSteps.length > 0 ? workflowSteps.map((step, idx) => {
                const stepResult = typeof step.resultData === 'string' ? JSON.parse(step.resultData) : (step.resultData || {});
                
                const filteredCourses = programCourses.filter((course: any) => {
                  const courseCloData = stepResult?.[course.id]?.clos || stepResult?.[course.id] || [];
                  const hasClo = Array.isArray(courseCloData) && courseCloData.length > 0;

                  if (courseStatusFilter === 'SET' && !hasClo) return false;
                  if (courseStatusFilter === 'UNSET' && hasClo) return false;

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
                      <td className="px-3 py-4 text-center font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col pr-2">
                          <Text className="font-semibold text-slate-700 leading-snug line-clamp-2">{step.title}</Text>
                          {step.configuration?.screenCode && (
                            <Text className="text-[10px] text-slate-400 font-mono mt-0.5">CODE: {step.configuration.screenCode}</Text>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-1 items-start max-w-full">
                          {step.requiredDocuments?.map((doc: string, dIdx: number) => (
                            <Tag 
                              key={dIdx} 
                              className="bg-slate-50 border-slate-200 text-slate-600 text-[11px] rounded-md max-w-full truncate m-0 font-normal py-0.5 px-2"
                              title={doc}
                            >
                              {doc}
                            </Tag>
                          ))}
                          {(!step.requiredDocuments || step.requiredDocuments.length === 0) && (
                            <Text type="secondary" className="text-xs italic">Không có</Text>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(step.configuration?.performerRoles) && step.configuration.performerRoles.length > 0 ? (
                            step.configuration.performerRoles.map((rCode: string, rIdx: number) => (
                              <Tag key={rIdx} color="emerald" className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-800 font-medium text-xs m-0">
                                {roles.find(r => r.code === rCode)?.name || rCode}
                              </Tag>
                            ))
                          ) : (
                            <Tag color="blue" className="rounded-full border-blue-100 bg-blue-50 text-blue-600 font-medium text-xs max-w-full truncate m-0">
                              {roles.find(r => r.code === step.configuration?.performerRole)?.name || '---'}
                            </Tag>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock size={13} className="text-slate-300 flex-shrink-0" />
                          <Text className="text-xs font-medium truncate">
                            {step.deadline ? dayjs(step.deadline).format('DD/MM/YYYY') : 'Chưa thiết lập'}
                          </Text>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {(() => {
                          const status = (step.status || '').toUpperCase();
                          if (status === 'COMPLETED') {
                            return (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[11px]">
                                <CheckCircle2 size={12} className="flex-shrink-0" />
                                <span className="truncate">Hoàn thành</span>
                              </div>
                            );
                          }
                          if (status === 'ACTIVE') {
                            return (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[11px]">
                                <Clock size={12} className="flex-shrink-0" />
                                <span className="truncate">Đang thực hiện</span>
                              </div>
                            );
                          }
                          return (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[11px]">
                              <AlertCircle size={12} className="flex-shrink-0" />
                              <span className="truncate">Chờ khởi tạo</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
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

                    {step.configuration?.screenCode === 'S5_CLO' && !isS5Expanded && (
                      <tr key={`sub-s5-bar-${step.id || idx}`} className="bg-blue-50/20">
                        <td colSpan={7} className="px-4 py-2 border-t border-b border-blue-100/70 border-l-4 border-l-blue-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                              <BookOpen size={14} className="text-blue-600" />
                              <span>Danh sách Môn học thuộc CTĐT ({programCourses.length} môn)</span>
                            </div>
                            <Button
                              type="text"
                              size="small"
                              icon={<ChevronDown size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsS5Expanded(true);
                              }}
                              className="flex items-center justify-center rounded-lg bg-white hover:bg-blue-50 text-blue-600 h-7 px-3 font-semibold text-xs gap-1.5 border border-blue-200 shadow-2xs transition-all"
                            >
                              <span>Mở rộng xem danh sách môn học</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {step.configuration?.screenCode === 'S5_CLO' && isS5Expanded && (
                      <tr key={`sub-s5-${step.id || idx}`}>
                        <td colSpan={7} className="p-0 border-b border-slate-200">
                          <div className="bg-slate-50/70 border-l-2 border-l-blue-500 p-3.5 space-y-3 border-t border-slate-200/60">
                            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/60 flex-wrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-100/80 flex items-center justify-center text-blue-600 font-bold">
                                  <BookOpen size={15} />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-700 text-xs flex items-center gap-2">
                                    <span>Danh sách Môn học thuộc CTĐT</span>
                                    <Tag color="blue" className="rounded-full font-bold text-[10px] px-2 py-0 border-none">
                                      {programCourses.length} môn học
                                    </Tag>
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium">Thiết kế đề cương chi tiết và Chuẩn đầu ra (CLO) cho từng môn học</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Select
                                  value={courseStatusFilter}
                                  onChange={setCourseStatusFilter}
                                  size="small"
                                  className="w-40 text-xs font-medium"
                                  options={[
                                    { value: 'ALL', label: 'Tất cả trạng thái' },
                                    { value: 'SET', label: 'Đã thiết lập CLO' },
                                    { value: 'UNSET', label: 'Chưa thiết lập CLO' },
                                  ]}
                                />
                                <Input.Search
                                  placeholder="Tìm môn học..."
                                  allowClear
                                  size="small"
                                  value={courseSearchText}
                                  onChange={(e) => setCourseSearchText(e.target.value)}
                                  className="w-56 text-xs"
                                />
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<ChevronUp size={14} />}
                                  onClick={() => setIsS5Expanded(false)}
                                  className="flex items-center justify-center rounded-md bg-white hover:bg-slate-100 text-slate-600 h-7 px-2.5 font-medium text-[11px] gap-1 border border-slate-200 transition-all ml-1"
                                >
                                  <span>Thu gọn</span>
                                </Button>
                              </div>
                            </div>

                            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                              {filteredCourses.length > 0 ? filteredCourses.map((course: any) => {
                                const courseCloData = stepResult?.[course.id]?.clos || stepResult?.[course.id] || [];
                                const hasClo = Array.isArray(courseCloData) && courseCloData.length > 0;

                                return (
                                  <div 
                                    key={course.id} 
                                    className="py-2 px-3 bg-white rounded-md border border-slate-200/70 flex items-center justify-between hover:border-blue-400 hover:shadow-xs transition-all group/item"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-[11px] font-mono">
                                        {course.code || 'MH'}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-slate-800 text-xs group-hover/item:text-blue-600 transition-colors">{course.name}</div>
                                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                                          <span>Mã môn: <span className="font-mono text-slate-600 font-semibold">{course.code}</span></span>
                                          <span>•</span>
                                          <span>Số tín chỉ: <span className="text-slate-600 font-semibold">{course.credits || 3}</span></span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {hasClo ? (
                                        <Tag color="success" className="rounded-full px-2.5 py-0.5 border-none font-bold text-[10px] uppercase tracking-wider">
                                          {courseCloData.length} CLO đã thiết lập
                                        </Tag>
                                      ) : (
                                        <Tag color="default" className="rounded-full px-2.5 py-0.5 border-none font-medium text-[10px] text-slate-400 bg-slate-100">
                                          Chưa thiết lập CLO
                                        </Tag>
                                      )}

                                      <Tooltip title="Thiết kế đề cương / CLO">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<ChevronRight size={15} className="text-slate-400 group-hover/item:text-blue-500 transition-colors" />}
                                          className="flex items-center justify-center hover:bg-blue-50 rounded-md w-7 h-7"
                                          onClick={() => router.push(`/survey/campaigns/${id}/steps/${step.id || idx}?courseId=${course.id}&mode=edit`)}
                                        />
                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              }) : (
                                <div className="text-center py-8 bg-white rounded-md border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ClipboardList size={16} />
          </div>
          <Title level={5} className="!mb-0 text-slate-800 font-bold tracking-tight text-base">
            Cấu hình chi tiết các bước
          </Title>
        </div>

        {workflowSteps.length > 0 ? (
          <div className="space-y-4">
            {workflowSteps.map((step, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-blue-300 transition-all shadow-2xs"
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={2} md={1} className="flex justify-center sm:justify-start">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm shadow-2xs">
                      {idx + 1}
                    </div>
                  </Col>
                  <Col xs={24} sm={22} md={11}>
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 text-sm leading-snug">
                        {step.title}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(step.configuration?.performerRoles) && step.configuration.performerRoles.length > 0 ? (
                          step.configuration.performerRoles.map((rCode: string, rIdx: number) => (
                            <span key={rIdx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {roles.find(r => r.code === rCode)?.name || rCode}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {roles.find(r => r.code === step.configuration?.performerRole)?.name || '---'}
                          </span>
                        )}

                        {Array.isArray(step.configuration?.approverRoles) && step.configuration.approverRoles.length > 0 ? (
                          step.configuration.approverRoles.map((rCode: string, rIdx: number) => (
                            <span key={rIdx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                              {roles.find(r => r.code === rCode)?.name || rCode}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                            {roles.find(r => r.code === step.configuration?.approverRole)?.name || '---'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Hạn chót (Deadline)</div>
                      <DatePicker
                        className="w-full h-9 rounded-lg text-xs"
                        placeholder="Chọn ngày"
                        format="DD/MM/YYYY"
                        value={step.deadline}
                        onChange={(date) => {
                          const newSteps = [...workflowSteps];
                          newSteps[idx].deadline = date;
                          setWorkflowSteps(newSteps);
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-500">Hồ sơ công việc</div>
                      <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                        {step.requiredDocuments?.map((doc: string, dIdx: number) => (
                          <span 
                            key={dIdx} 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/60"
                          >
                            {doc}
                          </span>
                        ))}
                        {(!step.requiredDocuments || step.requiredDocuments.length === 0) && (
                          <Text type="secondary" className="text-xs italic">Không có hồ sơ</Text>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/70 rounded-xl p-8 text-center border border-dashed border-slate-200 space-y-2">
            <Settings className="w-10 h-10 text-slate-300 mx-auto" />
            <Text className="text-slate-500 font-medium text-xs block">
              Vui lòng chọn Mẫu quy trình khảo sát ở trên để tự động hiển thị cấu hình chi tiết các bước.
            </Text>
          </div>
        )}
      </div>
    );
  };

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
      <div className="flex flex-col gap-6">
        <Breadcrumb 
          className="text-slate-400 text-xs"
          items={[
            { title: <a onClick={() => router.push('/survey/campaigns')} className="hover:text-blue-600">Đợt khảo sát</a> },
            { title: campaignData?.name || 'Chi tiết đợt khảo sát' }
          ]}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
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

        {/* Integrated General Info Section */}
        {isView && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Info size={16} />
                </div>
                <Title level={5} className="!mb-0 text-slate-800 font-bold tracking-tight text-base">
                  Thông tin chung đợt khảo sát
                </Title>
              </div>
              <div className="flex items-center gap-2">
                <Text className="text-xs text-slate-400 font-medium">Tiến độ quy trình:</Text>
                <Tag color="emerald" className="rounded-full font-bold text-xs px-3 py-0.5 border-none">
                  {progressPercent}% ({completedStepsCount}/{workflowSteps.length} bước)
                </Tag>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Text className="w-36 font-semibold text-slate-400 flex-shrink-0">Chương trình đào tạo:</Text>
                <Text className="font-bold text-slate-800 text-sm">
                  {campaignData?.programCode ? `[${campaignData.programCode}] ` : ''}{campaignData?.programName || '---'}
                </Text>
              </div>

              <div className="flex items-start gap-3">
                <Text className="w-36 font-semibold text-slate-400 flex-shrink-0">Thời gian thực hiện:</Text>
                <Text className="font-bold text-slate-800 text-sm">
                  {data?.startDate ? `${dayjs(data.startDate).format('DD/MM/YYYY')} — ${dayjs(data.endDate).format('DD/MM/YYYY')}` : '---'}
                </Text>
              </div>

              <div className="flex items-start gap-3">
                <Text className="w-36 font-semibold text-slate-400 flex-shrink-0">Mẫu quy trình áp dụng:</Text>
                <Text className="font-bold text-slate-800 text-sm">
                  {campaignData?.workflowTemplateName || '---'}
                </Text>
              </div>

              <div className="flex items-start gap-3">
                <Text className="w-36 font-semibold text-slate-400 flex-shrink-0">Học phần thuộc CTĐT:</Text>
                <Text className="font-bold text-slate-800 text-sm">
                  {totalCourses} môn học
                </Text>
              </div>

              <div className="flex items-start gap-3">
                <Text className="w-36 font-semibold text-slate-400 flex-shrink-0">Người dùng tham gia:</Text>
                <Text className="font-bold text-slate-800 text-sm">
                  Giảng viên / Khoa chuyên môn
                </Text>
              </div>

              <div className="flex items-start gap-3">
                <Text className="w-36 font-semibold text-slate-400 flex-shrink-0">Mô tả chi tiết:</Text>
                <Text className="text-slate-600 italic text-xs leading-relaxed">
                  {campaignData?.description || 'Không có mô tả'}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <Text className="text-slate-400 font-medium text-sm">Đang tải dữ liệu đợt khảo sát...</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {renderWireframeHeader()}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'ACTIVE'
        }}
      >
        {!isView ? (
          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200/90 shadow-2xs p-6 bg-white space-y-6">
              <div className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Thông tin Đợt khảo sát mới
              </div>
              
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label={<span className="font-semibold text-slate-700 text-sm">Tên đợt khảo sát</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập tên đợt khảo sát' }]}
                    className="!mb-0"
                  >
                    <Input placeholder="Nhập tên đợt khảo sát" className="h-10 rounded-lg text-sm" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="programId"
                    label={<span className="font-semibold text-slate-700 text-sm">Chương trình đào tạo</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn chương trình đào tạo' }]}
                    className="!mb-0"
                  >
                    <Select
                      placeholder="Chọn chương trình đào tạo"
                      className="h-10 rounded-lg text-sm"
                      options={programs.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="workflowId"
                    label={<span className="font-semibold text-slate-700 text-sm">Mẫu quy trình khảo sát</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn mẫu quy trình khảo sát' }]}
                    className="!mb-0"
                  >
                    <Select
                      placeholder="Chọn mẫu quy trình khảo sát"
                      className="h-10 rounded-lg text-sm"
                      onChange={handleWorkflowChange}
                      options={workflows.map(w => ({ label: `${w.name} (v${w.version})`, value: w.id }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="range"
                    label={<span className="font-semibold text-slate-700 text-sm">Thời gian thực hiện</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn thời gian khảo sát' }]}
                    className="!mb-0"
                  >
                    <DatePicker.RangePicker 
                      className="h-10 w-full rounded-lg text-sm" 
                      format="DD/MM/YYYY" 
                      placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item 
                    name="description" 
                    label={<span className="font-semibold text-slate-700 text-sm">Mô tả chi tiết</span>}
                    className="!mb-0"
                  >
                    <Input.TextArea 
                      placeholder="Nhập mô tả chi tiết..." 
                      rows={3} 
                      className="rounded-lg text-sm resize-y" 
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {renderConfigSteps()}
          </div>
        ) : (
          <div>
            {activeTabKey === 'steps' && renderExecutionProgress()}
          </div>
        )}
      </Form>

      <Modal
        title="Chỉnh sửa Đợt Khảo sát"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={async () => {
          try {
            const values = await editForm.validateFields();
            const range = values.range;
            await surveyCampaignService.update(id as string, {
              code: campaignData?.code,
              name: campaignData?.name,
              description: values.description,
              programId: campaignData?.programId,
              workflowTemplateId: campaignData?.workflowTemplateId,
              startDate: range?.[0] ? range[0].toISOString() : campaignData?.startDate,
              endDate: range?.[1] ? range[1].toISOString() : campaignData?.endDate,
              steps: workflowSteps.map((s, idx) => ({
                stepIndex: idx,
                stepName: s.title,
                deadline: s.deadline?.toISOString ? s.deadline.toISOString() : s.deadline,
                requiredDocuments: s.requiredDocuments || [],
                configuration: s.configuration || {}
              }))
            });
            message.success('Đã cập nhật thông tin đợt khảo sát!');
            setIsEditModalOpen(false);
            const data = await surveyCampaignService.getById(id as string);
            setCampaignData(data);
          } catch (err: any) {
            message.error(err?.message || 'Lỗi khi cập nhật');
          }
        }}
        okText="Lưu thay đổi"
        cancelText="Hủy bỏ"
        centered
      >
        <Form form={editForm} layout="vertical" className="pt-3">
          <Form.Item name="range" label="Thời gian thực hiện" rules={[{ required: true }]}>
            <DatePicker.RangePicker className="w-full h-10 rounded-lg" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea rows={3} className="rounded-lg" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
