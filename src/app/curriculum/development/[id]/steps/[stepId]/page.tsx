'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Button, Typography, Space, Tag, Breadcrumb, Card, message, Skeleton, Modal, Input, Tooltip
} from 'antd';
import {
  Save, Edit, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle, Send, Lock, RotateCcw, Globe
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { resolveStepStatus, getStepLockReason, WORKFLOW_STEP_STATUS_MAP, getStepCustomBadge } from '@/constants/workflowStepStatus';
import { 
  S1_KHAO_SAT_NHU_CAU_Renderer, 
  S1SurveyBuilderRef,
  S2_PLO_Renderer, 
  S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer,
  S5_CLO_Renderer, 
  S6_MATRIX_Renderer 
} from '@/components/survey/StepRenderers';
import { S2PLORef } from '@/components/survey/renderers/S2PLORenderer';
import { SurveyForm, SurveyFormVersionItem } from '@/services/surveyFormService';

const { Title, Text } = Typography;

export default function CurriculumDevelopmentStepPage() {
  const { id, stepId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams?.get('mode'); // 'view' | 'edit'

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [step, setStep] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [prerequisiteLocked, setPrerequisiteLocked] = useState(false);
  const [prerequisiteStepName, setPrerequisiteStepName] = useState('');
  const [canEditRole, setCanEditRole] = useState(true);
  const [canApproveRole, setCanApproveRole] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const s1Ref = useRef<S1SurveyBuilderRef | null>(null);
  const [s1Form, setS1Form] = useState<SurveyForm | null>(null);
  const [s1Versions, setS1Versions] = useState<SurveyFormVersionItem[]>([]);

  const handleS1FormLoaded = useCallback((form: SurveyForm | null, versions: SurveyFormVersionItem[]) => {
    setS1Form(form);
    setS1Versions(versions);
  }, []);

  const s1HasVersion = Boolean(s1Form?.id && s1Form?.status);

  const s2Ref = useRef<S2PLORef | null>(null);
  const s5Ref = useRef<any>(null);
  const s6Ref = useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await surveyCampaignService.getById(id as string);
      setCampaign(data);
      
      const foundStep = data.steps.find((s: any) => String(s.id) === String(stepId))
        || data.steps.find((s: any) => String(s.stepIndex) === String(stepId))
        || data.steps[parseInt(stepId as string) - 1]
        || data.steps[parseInt(stepId as string)];
      if (foundStep) {
        const config = typeof foundStep.configuration === 'string' ? JSON.parse(foundStep.configuration) : foundStep.configuration;
        const result = typeof foundStep.resultData === 'string' ? JSON.parse(foundStep.resultData) : (foundStep.resultData || {});
        
        setStep({ ...foundStep, configuration: config });
        setFormData(result);

        const prereqCodes: string[] = Array.isArray(config?.prerequisiteStepCodes) && config.prerequisiteStepCodes.length > 0
          ? config.prerequisiteStepCodes
          : (config?.prerequisiteStepCode ? [config.prerequisiteStepCode] : []);

        let isLockedByPrereq = false;
        const incompleteNames: string[] = [];

        if (prereqCodes.length > 0) {
          for (const prereqCode of prereqCodes) {
            const prereqStep = data.steps.find((s: any) => {
              const sc = typeof s.configuration === 'string' ? JSON.parse(s.configuration)?.screenCode : s.configuration?.screenCode;
              return sc === prereqCode;
            });

            if (prereqStep && (prereqStep.status || '').toUpperCase() !== 'COMPLETED') {
              isLockedByPrereq = true;
              incompleteNames.push(prereqStep.stepName || prereqCode);
            }
          }

          setPrerequisiteLocked(isLockedByPrereq);
          setPrerequisiteStepName(incompleteNames.join(', '));
        } else {
          setPrerequisiteLocked(false);
        }

        // Check RBAC permission for CU (Create/Update) based on user's roles
        let userRoles: string[] = [];
        try {
          const userStr = localStorage.getItem('euni_user');
          if (userStr) {
            const parsedUser = JSON.parse(userStr);
            userRoles = (parsedUser.roles || []).map((r: any) => {
              const raw = typeof r === 'string' ? r : (r?.code || r?.name || '');
              return raw.replace(/^ROLE_/, '').toUpperCase();
            }).filter(Boolean);
          }
        } catch (e) {
          console.error('Failed to parse logged in user roles', e);
        }

        const allowedPerformerRoles: string[] = (
          Array.isArray(config?.performerRoles) && config.performerRoles.length > 0
            ? config.performerRoles
            : (config?.performerRole ? [config.performerRole] : [])
        ).map((r: string) => r.toUpperCase());

        const allowedApproverRoles: string[] = (
          Array.isArray(config?.approverRoles) && config.approverRoles.length > 0
            ? config.approverRoles
            : (config?.approverRole ? [config.approverRole] : [])
        ).map((r: string) => r.toUpperCase());

        const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('ROLE_ADMIN');
        const hasPerformerRole = allowedPerformerRoles.length === 0 || isAdmin || userRoles.some(ur => allowedPerformerRoles.includes(ur));
        const hasApproverRole = allowedApproverRoles.length === 0 || isAdmin || userRoles.some(ur => allowedApproverRoles.includes(ur));

        setCanEditRole(hasPerformerRole);
        setCanApproveRole(hasApproverRole);
        
        const isCampaignApproved = (data?.status || '').toUpperCase() === 'APPROVED';
        const isStepUnderReview = (foundStep?.status || '').toUpperCase() === 'UNDER_REVIEW';
        const isStepCompleted = (foundStep?.status || '').toUpperCase() === 'COMPLETED';
        const canEditByStatus = !isCampaignApproved && !isLockedByPrereq && hasPerformerRole && !isStepUnderReview && !isStepCompleted;

        if (!canEditByStatus) {
          setIsEdit(false);
        } else if (urlMode === 'edit') {
          setIsEdit(true);
        } else {
          setIsEdit(false);
        }
      } else {
        message.error('Không tìm thấy bước thực hiện');
        router.push(`/curriculum/development/${id}`);
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [id, stepId, urlMode, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (targetStatus: string = 'IN_PROGRESS') => {
    const screenCode = step?.configuration?.screenCode;
    const currentStepDbId = step?.id || stepId;

    if (targetStatus === 'COMPLETED' || targetStatus === 'UNDER_REVIEW') {
      if (screenCode === 'S2_PLO' && s2Ref.current) {
        const isValid = s2Ref.current.validate();
        if (!isValid) {
          message.error('Vui lòng điền đầy đủ các thông tin bắt buộc trước khi nộp duyệt');
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      let dataToSave = formData;
      if (screenCode === 'S2_PLO' && s2Ref.current) {
        try {
          const latest = s2Ref.current.getData();
          if (latest) {
            dataToSave = latest;
          }
        } catch (err) {
          console.error('[S2PLO] Error retrieving latest data:', err);
        }
      }

      if (screenCode === 'S5_CLO') {
        if (dataToSave && typeof dataToSave === 'object') {
          if (dataToSave.courseId) {
            await surveyCampaignService.saveCourseDetail(
              id as string,
              dataToSave.courseId,
              dataToSave,
              targetStatus,
              currentStepDbId
            );
            message.success(`Đã lưu đề cương học phần [${dataToSave.courseCode || dataToSave.courseId}]`);
          } else {
            const entries = Object.entries(dataToSave);
            let savedCount = 0;
            for (const [cId, cData] of entries) {
              if (cData && typeof cData === 'object' && (cData as any).courseId) {
                await surveyCampaignService.saveCourseDetail(
                  id as string,
                  (cData as any).courseId || cId,
                  cData,
                  targetStatus,
                  currentStepDbId
                );
                savedCount++;
              }
            }
            if (savedCount > 0) {
              message.success(`Đã lưu đề cương cho ${savedCount} học phần`);
            } else {
              message.info('Không có thông tin học phần nào được thay đổi');
            }
          }
        }
      }

      if (screenCode === 'S6_MATRIX' && s6Ref.current) {
        try {
          const success = await s6Ref.current.saveMatrix();
          if (!success) {
            setIsSaving(false);
            return;
          }
          if (typeof s6Ref.current.getData === 'function') {
            dataToSave = s6Ref.current.getData();
          }
        } catch (err) {
          console.error('[S6Matrix] Error saving matrix:', err);
        }
      }

      await surveyCampaignService.saveStepData(
        id as string,
        currentStepDbId as string,
        dataToSave,
        targetStatus
      );

      if (targetStatus === 'UNDER_REVIEW') {
        message.success('Đã nộp kết quả bước và gửi yêu cầu phê duyệt thành công!');
      } else if (targetStatus === 'IN_PROGRESS') {
        message.success('Đã lưu bản nháp bước thực hiện');
      } else if (targetStatus === 'COMPLETED') {
        message.success('Đã hoàn thành bước thực hiện');
      } else {
        message.success('Đã lưu thông tin bước thực hiện');
      }

      setIsEdit(false);
      await fetchData();
    } catch (error: any) {
      console.error('Save step data error:', error);
      message.error(error?.response?.data?.message || error?.message || 'Lỗi khi lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReview = async (reviewStatus: 'COMPLETED' | 'REJECTED' | 'IN_PROGRESS', note?: string) => {
    try {
      setIsSaving(true);
      await surveyCampaignService.saveStepData(
        id as string,
        (step?.id || stepId) as string,
        formData,
        reviewStatus,
        note
      );
      if (reviewStatus === 'COMPLETED') {
        message.success('Đã phê duyệt bước thành công!');
      } else if (reviewStatus === 'REJECTED') {
        message.success('Đã gửi yêu cầu chỉnh sửa bước thành công!');
      } else {
        message.success('Đã mở lại bước để tiếp tục chỉnh sửa');
      }
      setIsRejectModalOpen(false);
      setRejectReason('');
      await fetchData();
    } catch (error: any) {
      message.error(error?.message || 'Lỗi khi xử lý phê duyệt');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1600px] mx-auto px-6 py-8 animate-pulse space-y-6">
          <div className="space-y-4">
            <Skeleton.Button active size="small" style={{ width: 250 }} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton.Avatar active size="large" shape="square" style={{ width: 40, height: 40, borderRadius: 12 }} />
                <div className="space-y-2">
                  <Skeleton.Input active style={{ width: 350, height: 32 }} />
                  <Skeleton.Input active size="small" style={{ width: 180 }} />
                </div>
              </div>
              <Skeleton.Button active style={{ width: 120, height: 44, borderRadius: 12 }} />
            </div>
          </div>

          <Card className="rounded-[32px] border-slate-100 shadow-sm p-10 min-h-[600px] bg-white">
            <div className="space-y-10">
              <div className="space-y-4">
                <Skeleton.Input active style={{ width: 300, height: 24 }} />
                <div className="h-44 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-6">
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  const resolvedStatus = resolveStepStatus(step, campaign?.steps || []);
  const statusMeta = getStepCustomBadge(step, campaign?.steps || []);
  const StatusIcon = statusMeta.icon;

  const hasStepData = (() => {
    if (!formData || typeof formData !== 'object') return false;
    if (step?.resultData && step.resultData !== '{}' && step.resultData.trim() !== '') return true;
    const screenCode = step?.configuration?.screenCode;
    if (screenCode === 'S2_PLO') {
      const source = (formData as any).ploBuilder || formData;
      const pos = source.pos || source.peos;
      const plos = source.plos;
      return (Array.isArray(pos) && pos.length > 0) || (Array.isArray(plos) && plos.length > 0);
    }
    return Object.keys(formData).length > 0;
  })();

  const handleSubmitStep = () => {
    const screenCode = step?.configuration?.screenCode;
    if (screenCode === 'S2_PLO' && s2Ref.current) {
      const isValid = s2Ref.current.validate();
      if (!isValid) {
        message.error('Vui lòng điền đầy đủ các thông tin bắt buộc trước khi nộp duyệt');
        return;
      }
    } else if (screenCode === 'S5_CLO' && s5Ref.current) {
      const isValid = s5Ref.current.validate();
      if (!isValid) return;
    } else if (screenCode === 'S6_MATRIX' && s6Ref.current) {
      const isValid = s6Ref.current.validate();
      if (!isValid) return;
    }
    Modal.confirm({
      title: `Xác nhận nộp phê duyệt: ${step?.stepName}`,
      content: 'Sau khi nộp, bước sẽ chuyển sang trạng thái Chờ duyệt để cấp có thẩm quyền (Trưởng khoa / Hội đồng) thẩm định và phê duyệt.',
      okText: 'Nộp phê duyệt',
      cancelText: 'Quay lại',
      centered: true,
      onOk: () => handleSave('UNDER_REVIEW')
    });
  };

  const canEditByStatus =
    campaign?.status !== 'APPROVED' &&
    !prerequisiteLocked &&
    canEditRole &&
    resolvedStatus !== 'UNDER_REVIEW' &&
    resolvedStatus !== 'COMPLETED' &&
    resolvedStatus !== 'LOCKED';

  const renderContent = () => {
    const screenCode = step?.configuration?.screenCode;

    switch (screenCode) {
      case 'S1_KHAO_SAT_NHU_CAU':
        return (
          <S1_KHAO_SAT_NHU_CAU_Renderer
            ref={s1Ref}
            step={step}
            readonly={!isEdit}
            data={formData}
            onChange={setFormData}
            onRefreshStep={fetchData}
            onFormLoaded={handleS1FormLoaded}
          />
        );
      case 'S2_PLO':
        return <S2_PLO_Renderer ref={s2Ref} step={step} campaign={campaign} readonly={!isEdit} data={formData} onChange={setFormData} />;
      case 'S3_XacDinhCauTruc_KhoiLuongKienThuc':
      case 'S3_STRUCTURE':
        return <S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer step={step} campaign={campaign} readonly={!isEdit} data={formData} onChange={setFormData} />;
      case 'S5_CLO':
        return (
          <S5_CLO_Renderer
            ref={s5Ref}
            step={step}
            campaign={campaign}
            canEditRole={canEditRole}
            canApproveRole={canApproveRole}
            onRefreshStep={fetchData}
            readonly={!canEditByStatus}
            data={formData}
            onChange={setFormData}
          />
        );
      case 'S6_MATRIX':
        return <S6_MATRIX_Renderer ref={s6Ref} step={step} campaign={campaign} readonly={!isEdit} data={formData} onChange={setFormData} />;
      default:
        return (
          <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <Title level={4} className="text-slate-400">Giao diện đang được phát triển</Title>
            <Text className="text-slate-400">Mã màn hình: {screenCode || 'N/A'}</Text>
          </div>
        );
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 min-h-full">
        <Breadcrumb 
          className="text-slate-400 text-xs"
          items={[
            { title: <a onClick={() => router.push('/')} className="hover:text-blue-600">Trang chủ</a> },
            { title: <a onClick={() => router.push('/curriculum/programs')} className="hover:text-blue-600">Đào tạo</a> },
            { title: <a onClick={() => router.push('/curriculum/development')} className="hover:text-blue-600">Xây dựng & Rà soát CTĐT</a> },
            { title: <a onClick={() => router.push(`/curriculum/development/${id}`)} className="hover:text-blue-600">{campaign?.name}</a> },
            { title: step?.stepName }
          ]}
        />
        
        <div className="flex items-center justify-between bg-white p-5 rounded-md border border-slate-200/80 shadow-none">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <Title level={2} className="!mb-0 text-slate-800 font-bold tracking-tight text-xl">
                  {step?.stepName}
                </Title>
                {(() => {
                  const lockReason = resolvedStatus === 'LOCKED' ? getStepLockReason(step, campaign?.steps || []) : null;
                  const badgeNode = (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder} ${lockReason ? 'cursor-help' : ''}`}>
                      <StatusIcon size={12} className="flex-shrink-0" />
                      <span>{statusMeta.label}</span>
                    </div>
                  );
                  if (lockReason) {
                    return (
                      <Tooltip title={lockReason} placement="bottomLeft">
                        {badgeNode}
                      </Tooltip>
                    );
                  }
                  return badgeNode;
                })()}
              </div>
            </div>
          </div>
          {/* Top Action Buttons */}
          <div className="flex items-center gap-2.5">
            {campaign?.status !== 'APPROVED' && (
              <>
                {/* 1. SPECIALIZED WORKFLOW FOR S1_KHAO_SAT_NHU_CAU */}
                {step?.configuration?.screenCode === 'S1_KHAO_SAT_NHU_CAU' ? (
                  <>
                    {/* A. When in Edit mode: Only [ Hủy bỏ ] and [ Lưu ] */}
                    {isEdit ? (
                      <Space size="small">
                        <Button
                          onClick={() => setIsEdit(false)}
                          disabled={isSaving}
                          className="rounded-lg text-xs font-medium h-9 px-4"
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          type="primary"
                          icon={<Save size={14} />}
                          loading={isSaving}
                          onClick={async () => {
                            setIsSaving(true);
                            try {
                              const success = await s1Ref.current?.saveForm();
                              if (success) {
                                setIsEdit(false);
                                await fetchData();
                              }
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                        >
                          Lưu
                        </Button>
                      </Space>
                    ) : (
                      /* B. When in Detail mode */
                      <Space size="small">
                        {/* B1. Step Completed: Only Approver/Admin can Reopen step */}
                        {resolvedStatus === 'COMPLETED' ? (
                          canApproveRole && (
                            <Button
                              icon={<RotateCcw size={14} />}
                              onClick={() => {
                                Modal.confirm({
                                  title: `Mở lại bước: ${step?.stepName}`,
                                  content: 'Mở lại bước này có thể ảnh hưởng đến dữ liệu của các bước kế tiếp đã phụ thuộc vào bước này. Bạn có chắc chắn muốn mở lại?',
                                  okText: 'Mở lại bước',
                                  cancelText: 'Hủy',
                                  centered: true,
                                  onOk: () => handleReview('IN_PROGRESS')
                                });
                              }}
                              loading={isSaving}
                              className="rounded-lg text-xs font-medium h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                            >
                              Mở lại bước
                            </Button>
                          )
                        ) : (
                          <>
                            {/* B2. Under Review */}
                            {s1Form?.status === 'PENDING_REVIEW' && (
                              <>
                                {/* Maker có thể chủ động thu hồi đơn để chỉnh sửa tiếp */}
                                {canEditRole && (
                                  <Button
                                    icon={<RotateCcw size={14} />}
                                    onClick={() => {
                                      Modal.confirm({
                                        title: 'Thu hồi yêu cầu phê duyệt',
                                        content: 'Bạn có chắc chắn muốn thu hồi yêu cầu phê duyệt biểu mẫu này? Biểu mẫu sẽ trở về trạng thái Bản nháp để bạn có thể tiếp tục chỉnh sửa.',
                                        okText: 'Xác nhận thu hồi',
                                        cancelText: 'Hủy bỏ',
                                        centered: true,
                                        onOk: async () => {
                                          setIsSaving(true);
                                          try {
                                            await s1Ref.current?.recallSubmission();
                                            await fetchData();
                                          } finally {
                                            setIsSaving(false);
                                          }
                                        }
                                      });
                                    }}
                                    disabled={isSaving}
                                    className="rounded-lg text-xs font-semibold h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                                  >
                                    Thu hồi yêu cầu duyệt
                                  </Button>
                                )}

                                {/* Cấp Approver có quyền yêu cầu sửa hoặc duyệt */}
                                {canApproveRole && (
                                  <>
                                    <Button
                                      danger
                                      icon={<AlertTriangle size={14} />}
                                      onClick={() => s1Ref.current?.rejectDesign()}
                                      disabled={isSaving}
                                      className="rounded-lg text-xs font-semibold h-9 px-4 border-rose-200 text-rose-600 hover:bg-rose-50"
                                    >
                                      Yêu cầu chỉnh sửa
                                    </Button>
                                    <Button
                                      type="primary"
                                      icon={<CheckCircle2 size={14} />}
                                      onClick={() => {
                                        Modal.confirm({
                                          title: 'Phê duyệt thiết kế biểu mẫu khảo sát',
                                          content: 'Bạn có chắc chắn muốn phê duyệt thiết kế biểu mẫu này? Sau khi duyệt, biểu mẫu có thể được xuất bản và tạo link khảo sát.',
                                          okText: 'Xác nhận duyệt',
                                          cancelText: 'Quay lại',
                                          centered: true,
                                          onOk: async () => {
                                            setIsSaving(true);
                                            try {
                                              await s1Ref.current?.approveDesign();
                                              await fetchData();
                                            } finally {
                                              setIsSaving(false);
                                            }
                                          }
                                        });
                                      }}
                                      loading={isSaving}
                                      className="rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 h-9 px-4 shadow-xs"
                                    >
                                      Phê duyệt thiết kế
                                    </Button>
                                  </>
                                )}
                              </>
                            )}

                            {/* B3. Approved Design -> Ready to publish */}
                            {s1Form?.status === 'APPROVED' && (
                              <>
                                {canEditByStatus && (
                                  <Button
                                    icon={<Edit size={14} />}
                                    onClick={() => setIsEdit(true)}
                                    className="rounded-lg text-xs font-medium h-9 px-4 border-slate-300 text-slate-700 hover:border-blue-500"
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                                <Button
                                  type="primary"
                                  icon={<Globe size={14} />}
                                  onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                      await s1Ref.current?.publishForm();
                                      await fetchData();
                                    } finally {
                                      setIsSaving(false);
                                    }
                                  }}
                                  loading={isSaving}
                                  className="rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 h-9 px-4 shadow-xs"
                                >
                                  Xuất bản & Lấy link khảo sát
                                </Button>
                              </>
                            )}

                            {/* B4. Published -> Live Survey */}
                            {s1Form?.status === 'PUBLISHED' && (
                              <>
                                <Button
                                  icon={<RotateCcw size={14} />}
                                  onClick={() => s1Ref.current?.requestRevision()}
                                  disabled={isSaving}
                                  className="rounded-lg text-xs font-medium h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                                >
                                  Cho phép sửa biểu mẫu (Tạo v{(s1Form?.version || 1) + 1})
                                </Button>
                                {canApproveRole && (
                                  <Button
                                    type="primary"
                                    icon={<CheckCircle2 size={14} />}
                                    onClick={() => {
                                      Modal.confirm({
                                        title: `Nghiệm thu hoàn thành bước: ${step?.stepName}`,
                                        content: 'Đợt khảo sát đã hoàn tất thu thập ý kiến. Bạn có chắc chắn muốn chốt hoàn thành bước này?',
                                        okText: 'Xác nhận hoàn thành',
                                        cancelText: 'Hủy',
                                        centered: true,
                                        onOk: () => handleReview('COMPLETED')
                                      });
                                    }}
                                    loading={isSaving}
                                    className="rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 h-9 px-4 shadow-xs"
                                  >
                                    Hoàn thành bước
                                  </Button>
                                )}
                              </>
                            )}

                            {/* B5. Default/Draft/Pending/Rejected:
                                - Chưa có version: Chỉnh sửa (enable), Nộp phê duyệt (disable + tooltip)
                                - Đã có version: Chỉnh sửa (enable), Nộp phê duyệt (enable) */}
                            {(!s1Form?.status || s1Form?.status === 'DRAFT' || resolvedStatus === 'REJECTED') && (
                          <>
                            <Button
                              icon={<Edit size={14} />}
                              onClick={() => setIsEdit(true)}
                              disabled={!canEditRole}
                              className="rounded-lg text-xs font-semibold h-9 px-4 border-slate-300 text-slate-700 hover:border-blue-500"
                            >
                              {resolvedStatus === 'REJECTED' ? 'Chỉnh sửa lại' : 'Chỉnh sửa'}
                            </Button>

                            {!s1HasVersion ? (
                              <Tooltip title="Vui lòng chỉnh sửa và lưu biểu mẫu trước khi nộp duyệt">
                                <span>
                                  <Button
                                    type="primary"
                                    icon={<Send size={14} />}
                                    disabled
                                    className="rounded-lg text-xs font-semibold h-9 px-4"
                                  >
                                    Nộp phê duyệt
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Button
                                type="primary"
                                icon={<Send size={14} />}
                                loading={isSaving}
                                disabled={!canEditRole}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Xác nhận nộp phê duyệt thiết kế biểu mẫu',
                                    content: 'Sau khi nộp, biểu mẫu sẽ chuyển sang trạng thái chờ duyệt và gửi tới cấp có thẩm quyền kiểm tra.',
                                    okText: 'Nộp phê duyệt',
                                    cancelText: 'Quay lại',
                                    centered: true,
                                    onOk: async () => {
                                      setIsSaving(true);
                                      try {
                                        await s1Ref.current?.submitReview();
                                        await fetchData();
                                      } finally {
                                        setIsSaving(false);
                                      }
                                    }
                                  });
                                }}
                                className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                              >
                                Nộp phê duyệt
                              </Button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </Space>
                  )}
                  </>
                ) : step?.configuration?.screenCode === 'S5_CLO' ? (
                  /* 2. SPECIALIZED WORKFLOW FOR S5_CLO (Per-Course Lifecycle & Batch Step Acceptance) */
                  <Space size="small">
                    {/* B1. Step Completed: Approver can reopen step */}
                    {resolvedStatus === 'COMPLETED' ? (
                      canApproveRole && (
                        <Button
                          icon={<RotateCcw size={14} />}
                          onClick={() => {
                            Modal.confirm({
                              title: `Mở lại bước: ${step?.stepName}`,
                              content: 'Mở lại bước này có thể ảnh hưởng đến dữ liệu của các bước kế tiếp đã phụ thuộc vào bước này. Bạn có chắc chắn muốn mở lại?',
                              okText: 'Mở lại bước',
                              cancelText: 'Hủy',
                              centered: true,
                              onOk: () => handleReview('IN_PROGRESS')
                            });
                          }}
                          loading={isSaving}
                          className="rounded-lg text-xs font-medium h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                        >
                          Mở lại bước
                        </Button>
                      )
                    ) : resolvedStatus === 'UNDER_REVIEW' ? (
                      /* B2. Under Review */
                      <>
                        {canEditRole && (
                          <Button
                            icon={<RotateCcw size={14} />}
                            onClick={() => {
                              Modal.confirm({
                                title: 'Thu hồi yêu cầu phê duyệt Bước 5',
                                content: 'Bạn có chắc chắn muốn thu hồi yêu cầu nghiệm thu bước này? Bước sẽ trở về trạng thái Đang thực hiện.',
                                okText: 'Xác nhận thu hồi',
                                cancelText: 'Hủy bỏ',
                                centered: true,
                                onOk: () => handleReview('IN_PROGRESS')
                              });
                            }}
                            disabled={isSaving}
                            className="rounded-lg text-xs font-semibold h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                          >
                            Thu hồi nghiệm thu bước
                          </Button>
                        )}
                        {canApproveRole && (
                          <>
                            <Button
                              danger
                              icon={<AlertTriangle size={14} />}
                              onClick={() => setIsRejectModalOpen(true)}
                              disabled={isSaving}
                              className="rounded-lg text-xs font-semibold h-9 px-4 border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              Yêu cầu chỉnh sửa
                            </Button>
                            <Button
                              type="primary"
                              icon={<CheckCircle2 size={14} />}
                              onClick={() => {
                                Modal.confirm({
                                  title: `Phê duyệt hoàn thành bước: ${step?.stepName}`,
                                  content: 'Toàn bộ đề cương chi tiết học phần đã được thẩm định đạt yêu cầu. Bạn có chắc chắn muốn phê duyệt hoàn thành bước này?',
                                  okText: 'Phê duyệt hoàn thành',
                                  cancelText: 'Quay lại',
                                  centered: true,
                                  onOk: () => handleReview('COMPLETED')
                                });
                              }}
                              loading={isSaving}
                              className="rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 h-9 px-4 shadow-xs"
                            >
                              Phê duyệt bước
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      /* B3. In Progress / Draft / Rejected */
                      (() => {
                        const s5CompletedCount = campaign?.courses?.filter((c: any) => {
                          const st = c.status;
                          return st === 'COMPLETED' || st === 'READY' || st === 'APPROVED';
                        }).length || 0;
                        const s5TotalCount = campaign?.courses?.length || 0;
                        const isS5AllCompleted = s5TotalCount > 0 && s5CompletedCount === s5TotalCount;

                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                              Đã duyệt: <strong className="text-emerald-700">{s5CompletedCount}</strong>/{s5TotalCount} môn
                            </span>
                            {!isS5AllCompleted ? (
                              <Tooltip title={`Vui lòng hoàn tất phê duyệt đề cương tất cả các học phần trước khi nghiệm thu bước (còn ${s5TotalCount - s5CompletedCount} môn chưa duyệt)`}>
                                <span>
                                  <Button
                                    type="primary"
                                    icon={<Send size={14} />}
                                    disabled
                                    className="rounded-lg text-xs font-semibold h-9 px-4"
                                  >
                                    Nghiệm thu hoàn thành Bước 5
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Button
                                type="primary"
                                icon={<Send size={14} />}
                                loading={isSaving}
                                disabled={!canEditRole}
                                onClick={handleSubmitStep}
                                className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                              >
                                Nghiệm thu hoàn thành Bước 5
                              </Button>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </Space>
                ) : (
                  /* 3. GENERAL WORKFLOW FOR OTHER STEPS (S2, S3, S6...) */
                  <>
                    {/* A. When in Edit mode: strictly ONLY [ Hủy bỏ ] and [ Lưu ] */}
                    {isEdit ? (
                      <Space size="small">
                        <Button
                          onClick={() => {
                            if (step?.status === 'DRAFT' && !formData) {
                              router.push(`/curriculum/development/${id}`);
                            } else {
                              setIsEdit(false);
                            }
                          }}
                          disabled={isSaving}
                          className="rounded-lg text-xs font-medium h-9 px-4"
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          type="primary"
                          icon={<Save size={14} />}
                          loading={isSaving}
                          onClick={() => handleSave('IN_PROGRESS')}
                          className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                        >
                          Lưu
                        </Button>
                      </Space>
                    ) : (
                      /* B. When in Detail mode */
                      <Space size="small">
                        {/* B1. Under Review */}
                        {resolvedStatus === 'UNDER_REVIEW' && (
                          <>
                            {/* Maker có thể chủ động thu hồi đơn để chỉnh sửa tiếp */}
                            {canEditRole && (
                              <Button
                                icon={<RotateCcw size={14} />}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Thu hồi yêu cầu phê duyệt',
                                    content: 'Bạn có chắc chắn muốn thu hồi yêu cầu phê duyệt bước này? Bước sẽ trở về trạng thái Đang thực hiện để bạn có thể tiếp tục chỉnh sửa.',
                                    okText: 'Xác nhận thu hồi',
                                    cancelText: 'Hủy bỏ',
                                    centered: true,
                                    onOk: () => handleReview('IN_PROGRESS')
                                  });
                                }}
                                disabled={isSaving}
                                className="rounded-lg text-xs font-semibold h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                              >
                                Thu hồi yêu cầu duyệt
                              </Button>
                            )}

                            {/* Cấp Approver có quyền yêu cầu sửa hoặc duyệt */}
                            {canApproveRole && (
                              <>
                                <Button
                                  danger
                                  icon={<AlertTriangle size={14} />}
                                  onClick={() => setIsRejectModalOpen(true)}
                                  disabled={isSaving}
                                  className="rounded-lg text-xs font-semibold h-9 px-4 border-rose-200 text-rose-600 hover:bg-rose-50"
                                >
                                  Yêu cầu chỉnh sửa
                                </Button>
                                <Button
                                  type="primary"
                                  icon={<CheckCircle2 size={14} />}
                                  onClick={() => {
                                    Modal.confirm({
                                      title: `Phê duyệt bước: ${step?.stepName}`,
                                      content: 'Bạn có chắc chắn muốn phê duyệt bước này? Sau khi phê duyệt, bước sẽ chuyển sang trạng thái Hoàn thành và dữ liệu sẽ được đồng bộ vào hệ thống đào tạo.',
                                      okText: 'Xác nhận duyệt',
                                      cancelText: 'Quay lại',
                                      centered: true,
                                      onOk: () => handleReview('COMPLETED')
                                    });
                                  }}
                                  loading={isSaving}
                                  className="rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 h-9 px-4 shadow-xs"
                                >
                                  Phê duyệt bước
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {/* B2. Completed: Approver có thể mở lại bước */}
                        {resolvedStatus === 'COMPLETED' && canApproveRole && (
                          <Button
                            icon={<RotateCcw size={14} />}
                            onClick={() => {
                              Modal.confirm({
                                title: `Mở lại bước: ${step?.stepName}`,
                                content: 'Mở lại bước này có thể ảnh hưởng đến dữ liệu của các bước kế tiếp đã phụ thuộc vào bước này. Bạn có chắc chắn muốn mở lại?',
                                okText: 'Mở lại bước',
                                cancelText: 'Hủy',
                                centered: true,
                                onOk: () => handleReview('IN_PROGRESS')
                              });
                            }}
                            loading={isSaving}
                            className="rounded-lg text-xs font-medium h-9 px-4 border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-500"
                          >
                            Mở lại bước
                          </Button>
                        )}

                        {/* B3. Default/Draft/InProgress/Rejected */}
                        {resolvedStatus !== 'UNDER_REVIEW' && resolvedStatus !== 'COMPLETED' && (
                          <>
                            {canEditByStatus && (
                              <Button
                                icon={<Edit size={14} />}
                                onClick={() => setIsEdit(true)}
                                className="rounded-lg text-xs font-semibold h-9 px-4 border-slate-300 text-slate-700 hover:border-blue-500"
                              >
                                {resolvedStatus === 'REJECTED' ? 'Chỉnh sửa lại' : 'Chỉnh sửa'}
                              </Button>
                            )}

                            {!hasStepData ? (
                              <Tooltip title="Vui lòng chỉnh sửa và lưu trước khi nộp duyệt">
                                <span>
                                  <Button
                                    type="primary"
                                    icon={<Send size={14} />}
                                    disabled
                                    className="rounded-lg text-xs font-semibold h-9 px-4"
                                  >
                                    Nộp phê duyệt
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : !canEditRole ? (
                              <Tooltip title="Bạn không có quyền nộp phê duyệt bước này">
                                <span>
                                  <Button
                                    type="primary"
                                    icon={<Send size={14} />}
                                    disabled
                                    className="rounded-lg text-xs font-semibold h-9 px-4"
                                  >
                                    Nộp phê duyệt
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Button
                                type="primary"
                                icon={<Send size={14} />}
                                loading={isSaving}
                                onClick={handleSubmitStep}
                                className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                              >
                                Nộp phê duyệt
                              </Button>
                            )}
                          </>
                        )}
                      </Space>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {prerequisiteLocked && (
          <div className="mb-2 px-4 py-2.5 bg-slate-100/90 rounded-lg border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Chưa mở khóa:</strong> Bạn cần hoàn thành bước <strong>&quot;{prerequisiteStepName}&quot;</strong> trước khi có thể thực hiện bước này.
            </span>
          </div>
        )}

        {!prerequisiteLocked && resolvedStatus === 'REJECTED' && (
          <div className="mb-2 px-4 py-2.5 bg-rose-50/90 rounded-lg border border-rose-200/90 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Yêu cầu chỉnh sửa{step?.configuration?.reviewedBy ? ` từ ${step.configuration.reviewedBy}` : ''}:</strong>{' '}
              {step?.configuration?.reviewNote || 'Bước này đã bị người duyệt trả về để điều chỉnh. Vui lòng cập nhật và nộp lại.'}
            </span>
          </div>
        )}

        {!prerequisiteLocked && (resolvedStatus === 'UNDER_REVIEW' || resolvedStatus === 'IN_PROGRESS') && step?.configuration?.previousReviewNote && (
          <div className="mb-2 px-4 py-2.5 bg-slate-100/90 rounded-lg border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Lưu ý từ lần đánh giá trước{step?.configuration?.previousReviewedBy ? ` (${step.configuration.previousReviewedBy})` : ''}:</strong>{' '}
              {step.configuration.previousReviewNote}
            </span>
          </div>
        )}

        {/* Content Section */}
        <div className="bg-white rounded-md border border-slate-200/80 shadow-none overflow-hidden p-6 min-h-0 flex-1">
          {renderContent()}
        </div>
      </div>

      <Modal
        title="Yêu cầu chỉnh sửa bước thực hiện"
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectReason('');
        }}
        onOk={() => {
          if (!rejectReason.trim()) {
            message.error('Vui lòng nhập lý do hoặc nội dung yêu cầu chỉnh sửa');
            return;
          }
          handleReview('REJECTED', rejectReason.trim());
        }}
        okText="Gửi yêu cầu chỉnh sửa"
        okButtonProps={{ danger: true, loading: isSaving }}
        cancelText="Hủy bỏ"
        centered
      >
        <div className="py-2 space-y-3">
          <p className="text-slate-600 text-sm">
            Vui lòng nhập lý do hoặc hướng dẫn cụ thể để người biên soạn/thực hiện nắm rõ và điều chỉnh lại bước này:
          </p>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Cần bổ sung thêm chỉ số đo lường PLO và rà soát lại môn học điều kiện tiên quyết..."
            className="rounded-lg text-sm"
          />
        </div>
      </Modal>
    </AppShell>
  );
}
