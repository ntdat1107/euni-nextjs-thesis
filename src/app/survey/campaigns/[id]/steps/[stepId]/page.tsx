'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Button, Typography, Space, Tag, Breadcrumb, Card, message, Spin, Skeleton
} from 'antd';
import {
  ArrowLeft, Save, Edit, ChevronLeft, FileText, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ActionBar from '@/components/common/ActionBar';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { S2_PLO_Renderer, S5_CLO_Renderer, S6_MATRIX_Renderer } from '@/components/survey/StepRenderers';

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await surveyCampaignService.getById(id as string);
      setCampaign(data);
      
      const foundStep = data.steps.find((s: any) => s.id === stepId) || data.steps[parseInt(stepId as string)];
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
        
        const isCampaignApproved = (data?.status || '').toUpperCase() === 'APPROVED';
        const canEditByStatus = !isCampaignApproved && !isLockedByPrereq;

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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await surveyCampaignService.saveStepData(id as string, stepId as string, formData);
      message.success('Đã lưu thông tin bước khảo sát');
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
      case 'S2_PLO':
        return <S2_PLO_Renderer step={step} readonly={!isEdit} data={formData} onChange={setFormData} />;
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

  const hasActions = (campaign?.status !== 'APPROVED' && !isEdit && !prerequisiteLocked) || isEdit;

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
              <div className="flex items-center gap-3 mb-1 flex-wrap">
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
                  if (status === 'ACTIVE') {
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
              <Text className="text-slate-400 font-medium flex items-center gap-2 text-xs">
                <FileText size={14} />
                Mã màn hình: {step?.configuration?.screenCode}
              </Text>
            </div>
          </div>
        </div>

        {prerequisiteLocked && (
          <div className="mb-2 p-4 bg-amber-50 rounded-sm border border-amber-200 flex items-center gap-3 text-amber-900 shadow-none">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <Text strong className="text-amber-900 block font-bold text-base">Bước này chưa được phép thực hiện!</Text>
              <Text className="text-amber-700 text-sm font-medium">
                Theo quy trình, bạn cần phải hoàn thành bước <strong>"{prerequisiteStepName}"</strong> trước khi có thể mở khóa và chỉnh sửa bước này.
              </Text>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="bg-white rounded-md border border-slate-200/80 shadow-none overflow-hidden p-6 min-h-0 flex-1">
          {renderContent()}
        </div>

        {/* Floating Bottom Action Bar */}
        {hasActions && (
          <ActionBar
            actions={
              campaign?.status !== 'APPROVED' && !isEdit && !prerequisiteLocked
                ? [
                    {
                      key: 'edit',
                      label: 'Chỉnh sửa',
                      type: 'primary',
                      icon: <Edit size={14} />,
                      onClick: () => setIsEdit(true),
                    },
                  ]
                : isEdit
                ? [
                    {
                      key: 'cancel',
                      label: 'Hủy bỏ',
                      type: 'default',
                      onClick: () => {
                        if (step?.status === 'DRAFT' && !formData) {
                          router.push(`/survey/campaigns/${id}`);
                        } else {
                          setIsEdit(false);
                        }
                      },
                    },
                    {
                      key: 'save',
                      label: 'Lưu thông tin',
                      type: 'primary',
                      loading: isSaving,
                      icon: <Save size={14} />,
                      onClick: handleSave,
                    },
                  ]
                : undefined
            }
          />
        )}
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
