'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Button, Typography, Space, Tag, Breadcrumb, Card, message, Spin, Skeleton
} from 'antd';
import {
  ArrowLeft, Save, Edit, ChevronLeft, FileText, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { 
  S1_KHAO_SAT_NHU_CAU_Renderer, 
  S2_PLO_Renderer, 
  S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer,
  S5_CLO_Renderer, 
  S6_MATRIX_Renderer 
} from '@/components/survey/StepRenderers';
import { S2PLORef } from '@/components/survey/renderers/S2PLORenderer';

const { Title, Text } = Typography;

export default function SurveyStepPage() {
  const { id, stepId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams?.get('mode'); // 'view' | 'edit'
  const courseIdParam = searchParams?.get('courseId');

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [step, setStep] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [prerequisiteLocked, setPrerequisiteLocked] = useState(false);
  const [prerequisiteStepName, setPrerequisiteStepName] = useState('');
  const [canEditRole, setCanEditRole] = useState(true);

  const s2Ref = useRef<S2PLORef | null>(null);

  const fetchData = async () => {
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

        // Admin always has full edit rights. If allowedPerformerRoles is empty, default to allow.
        const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('ROLE_ADMIN');
        const hasPerformerRole = allowedPerformerRoles.length === 0 || isAdmin || userRoles.some(ur => allowedPerformerRoles.includes(ur));

        setCanEditRole(hasPerformerRole);
        
        const isCampaignApproved = (data?.status || '').toUpperCase() === 'APPROVED';
        const canEditByStatus = !isCampaignApproved && !isLockedByPrereq && hasPerformerRole;

        if (!canEditByStatus) {
          setIsEdit(false);
        } else if (urlMode === 'edit') {
          setIsEdit(true);
        } else {
          setIsEdit(false);
        }
      } else {
        message.error('Không tìm thấy bước khảo sát');
        router.push(`/survey/campaigns/${id}`);
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, stepId]);

  const handleSave = async (targetStatus: string = 'COMPLETED') => {
    const screenCode = step?.configuration?.screenCode;
    const currentStepDbId = step?.id || stepId;

    if (targetStatus === 'COMPLETED') {
      if (screenCode === 'S2_PLO' && s2Ref.current) {
        const isValid = s2Ref.current.validate();
        if (!isValid) {
          message.error('Vui lòng điền đầy đủ các thông tin bắt buộc trước khi lưu');
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      let dataToSave = formData;
      if (screenCode === 'S2_PLO' && s2Ref.current) {
        const latest = s2Ref.current.getData();
        if (latest) {
          dataToSave = latest;
        }
      }

      if (screenCode === 'S5_CLO') {
        if (dataToSave && typeof dataToSave === 'object') {
          if (dataToSave.courseId) {
            // Single course object in formData
            await surveyCampaignService.saveCourseDetail(
              id as string,
              dataToSave.courseId,
              dataToSave,
              targetStatus,
              currentStepDbId
            );
            message.success(`Đã lưu đề cương học phần [${dataToSave.courseCode || dataToSave.courseId}]`);
          } else {
            // Map of courses: call saveCourseDetail API for each course individually
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
        // Also update step status
        await surveyCampaignService.saveStepData(id as string, (step?.id || stepId) as string, dataToSave, targetStatus);
      } else {
        // Default: save step-level result data
        await surveyCampaignService.saveStepData(id as string, (step?.id || stepId) as string, dataToSave, targetStatus);
        message.success(targetStatus === 'COMPLETED' ? 'Đã lưu thông tin bước khảo sát' : 'Đã lưu bản nháp bước khảo sát');
      }

      setIsEdit(false);
      await fetchData();
    } catch (error) {
      message.error('Lỗi khi lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    const screenCode = step?.configuration?.screenCode;

    switch (screenCode) {
      case 'S1_KHAO_SAT_NHU_CAU':
        return (
          <S1_KHAO_SAT_NHU_CAU_Renderer
            step={step}
            readonly={!isEdit}
            data={formData}
            onChange={setFormData}
            onRefreshStep={fetchData}
          />
        );
      case 'S2_PLO':
        return <S2_PLO_Renderer ref={s2Ref} step={step} readonly={!isEdit} data={formData} onChange={setFormData} />;
      case 'S3_XacDinhCauTruc_KhoiLuongKienThuc':
      case 'S3_STRUCTURE':
        return <S3_XacDinhCauTruc_KhoiLuongKienThuc_Renderer step={step} campaign={campaign} readonly={!isEdit} data={formData} onChange={setFormData} />;
      case 'S5_CLO':
        return <S5_CLO_Renderer step={step} readonly={!isEdit} data={formData} onChange={setFormData} />;
      case 'S6_MATRIX':
        return <S6_MATRIX_Renderer step={step} readonly={!isEdit} data={formData} onChange={setFormData} />;
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

  const isStepCompleted = (step?.status || '').toUpperCase() === 'COMPLETED';
  const hasActions =
    (campaign?.status !== 'APPROVED' && !isEdit && !prerequisiteLocked && canEditRole) || isEdit;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 min-h-full">
        <Breadcrumb 
          className="text-slate-400 text-xs"
          items={[
            { title: <a onClick={() => router.push('/survey/campaigns')}>Đợt khảo sát</a> },
            { title: <a onClick={() => router.push(`/survey/campaigns/${id}`)}>{campaign?.name}</a> },
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
                  const status = (step?.status || '').toUpperCase();
                  if (status === 'COMPLETED') {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-600 font-semibold uppercase text-[10px] whitespace-nowrap">
                        <CheckCircle2 size={12} className="flex-shrink-0" />
                        <span>Hoàn thành</span>
                      </div>
                    );
                  }
                  if (status === 'ACTIVE' || status === 'IN_PROGRESS') {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 font-semibold uppercase text-[10px] whitespace-nowrap">
                        <Clock size={12} className="flex-shrink-0" />
                        <span>Đang thực hiện</span>
                      </div>
                    );
                  }
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 font-semibold uppercase text-[10px] whitespace-nowrap">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>Chờ khởi tạo</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          {/* Top Action Buttons */}
          {hasActions && (
            <div className="flex items-center gap-2.5">
              {campaign?.status !== 'APPROVED' && !isEdit && !prerequisiteLocked && canEditRole ? (
                <Button
                  type="primary"
                  icon={<Edit size={14} />}
                  onClick={() => setIsEdit(true)}
                  className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                >
                  Chỉnh sửa
                </Button>
              ) : isEdit ? (
                <Space size="small">
                  <Button
                    onClick={() => {
                      if (step?.status === 'DRAFT' && !formData) {
                        router.push(`/survey/campaigns/${id}`);
                      } else {
                        setIsEdit(false);
                      }
                    }}
                    className="rounded-lg text-xs font-medium h-9 px-4"
                  >
                    Hủy bỏ
                  </Button>
                  {step?.configuration?.screenCode !== 'S1_KHAO_SAT_NHU_CAU' && (
                    <>
                      {step?.status !== 'COMPLETED' && (
                        <Button
                          onClick={() => handleSave('IN_PROGRESS')}
                          loading={isSaving}
                          className="rounded-lg text-xs font-medium h-9 px-4 border-slate-300 text-slate-700 hover:border-blue-500 bg-white"
                        >
                          Lưu bản nháp
                        </Button>
                      )}
                      <Button
                        type="primary"
                        icon={<Save size={14} />}
                        loading={isSaving}
                        onClick={() => handleSave('COMPLETED')}
                        className="rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-9 px-4 shadow-xs"
                      >
                        {step?.status === 'COMPLETED' ? 'Lưu cập nhật' : 'Hoàn thành bước'}
                      </Button>
                    </>
                  )}
                </Space>
              ) : null}
            </div>
          )}
        </div>

        {prerequisiteLocked && (
          <div className="mb-2 p-4 bg-amber-50 rounded-sm border border-amber-200 flex items-center gap-3 text-amber-900 shadow-none">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <Text strong className="text-amber-900 block font-bold text-base">Bước này chưa được phép thực hiện!</Text>
              <Text className="text-amber-700 text-sm font-medium">
                Theo quy trình, bạn cần phải hoàn thành bước <strong>&quot;{prerequisiteStepName}&quot;</strong> trước khi có thể mở khóa và chỉnh sửa bước này.
              </Text>
            </div>
          </div>
        )}

        {!prerequisiteLocked && !canEditRole && campaign?.status !== 'APPROVED' && (
          <div className="mb-2 p-4 bg-blue-50/80 rounded-sm border border-blue-200 flex items-center gap-3 text-blue-900 shadow-none">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <Text strong className="text-blue-900 block font-bold text-sm">Chế độ xem (View-only)</Text>
              <Text className="text-blue-700 text-xs font-medium">
                Tài khoản của bạn không nằm trong <strong>Nhóm Thực hiện / Biên soạn</strong> được phân công cho bước này nên không thể thực hiện chỉnh sửa (CU).
              </Text>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="bg-white rounded-md border border-slate-200/80 shadow-none overflow-hidden p-6 min-h-0 flex-1">
          {renderContent()}
        </div>
      </div>

      <style jsx global>{`
        .ant-input, .ant-input-affix-wrapper {
          border-color: #f1f5f9;
        }
        .ant-input:hover, .ant-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
      `}</style>
    </AppShell>
  );
}
