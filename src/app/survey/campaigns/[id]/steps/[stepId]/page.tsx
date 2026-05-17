'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Typography, Space, Tag, Breadcrumb, Card, message, Spin, Skeleton
} from 'antd';
import {
  ArrowLeft, Save, Edit, ChevronLeft, FileText, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { S2_PLO_Renderer, S5_CLO_Renderer, S6_MATRIX_Renderer } from '@/components/survey/StepRenderers';

const { Title, Text } = Typography;

export default function SurveyStepPage() {
  const { id, stepId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [step, setStep] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await surveyCampaignService.getById(id as string);
      setCampaign(data);
      
      const foundStep = data.steps.find((s: any) => s.id === stepId) || data.steps[parseInt(stepId as string)];
      if (foundStep) {
        // Parse configuration and resultData from string if needed
        const config = typeof foundStep.configuration === 'string' ? JSON.parse(foundStep.configuration) : foundStep.configuration;
        const result = typeof foundStep.resultData === 'string' ? JSON.parse(foundStep.resultData) : (foundStep.resultData || {});
        
        setStep({ ...foundStep, configuration: config });
        setFormData(result);
        
        const status = (foundStep.status || '').toUpperCase();
        if ((status === 'DRAFT' || !foundStep.status) && data.status !== 'APPROVED') {
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
      await fetchData(); // Refresh data to get updated status
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
          {/* Breadcrumb & Navigation Skeleton */}
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

          {/* Main Card Skeleton */}
          <Card className="rounded-[32px] border-slate-100 shadow-sm p-10 min-h-[600px] bg-white">
            <div className="space-y-10">
              {/* Part 1: Objectives Skeleton */}
              <div className="space-y-4">
                <Skeleton.Input active style={{ width: 300, height: 24 }} />
                <div className="h-44 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-6">
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-4 items-center">
                    <Skeleton.Button active size="small" style={{ width: 60 }} />
                    <Skeleton.Input active style={{ width: '100%', height: 60 }} />
                  </div>
                  <div className="flex gap-4 items-center">
                    <Skeleton.Button active size="small" style={{ width: 60 }} />
                    <Skeleton.Input active style={{ width: '100%', height: 60 }} />
                  </div>
                </div>
              </div>

              {/* Part 2: PLOs Skeleton */}
              <div className="space-y-4 pt-8 border-t border-slate-100">
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

  const statusConfig: any = {
    'DRAFT': { color: 'default', text: 'Bản nháp', icon: <Clock size={14} /> },
    'ACTIVE': { color: 'processing', text: 'Đang thực hiện', icon: <AlertCircle size={14} /> },
    'COMPLETED': { color: 'success', text: 'Hoàn thành', icon: <CheckCircle2 size={14} /> }
  };
  const currentStatus = statusConfig[step?.status] || statusConfig['DRAFT'];

  return (
    <AppShell>
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Breadcrumb 
            className="mb-4 text-slate-400"
            items={[
              { title: <a onClick={() => router.push('/survey/campaigns')}>Đợt khảo sát</a> },
              { title: <a onClick={() => router.push(`/survey/campaigns/${id}`)}>{campaign?.name}</a> },
              { title: step?.stepName }
            ]}
          />
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button 
                icon={<ChevronLeft size={20} />} 
                onClick={() => router.push(`/survey/campaigns/${id}`)}
                className="flex items-center justify-center w-10 h-10 rounded-xl border-slate-200 hover:border-blue-500 hover:text-blue-500 transition-all"
              />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Title level={2} className="!mb-0 text-slate-800 font-bold tracking-tight">
                    {step?.stepName}
                  </Title>
                  <Tag color={currentStatus.color} className="rounded-full border-none px-3 font-bold flex items-center gap-1.5 uppercase text-[10px]">
                    {currentStatus.icon}
                    {currentStatus.text}
                  </Tag>
                </div>
                <Text className="text-slate-400 font-medium flex items-center gap-2">
                  <FileText size={14} />
                  Mã màn hình: {step?.configuration?.screenCode}
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {campaign?.status !== 'APPROVED' && !isEdit ? (
                <Button 
                  type="primary" 
                  icon={<Edit size={18} />}
                  onClick={() => setIsEdit(true)}
                  className="rounded-xl px-6 h-11 font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 border-none transition-all flex items-center gap-2"
                >
                  Chỉnh sửa
                </Button>
              ) : isEdit ? (
                <>
                  <Button 
                    onClick={() => {
                      if (step?.status === 'DRAFT' && !formData) {
                        router.push(`/survey/campaigns/${id}`);
                      } else {
                        setIsEdit(false);
                      }
                    }}
                    className="rounded-xl px-6 h-11 font-semibold border-slate-200"
                  >
                    Hủy bỏ
                  </Button>
                  <Button 
                    type="primary" 
                    icon={isSaving ? <Spin size="small" /> : <Save size={18} />}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl px-8 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none transition-all flex items-center gap-2"
                  >
                    Lưu thông tin
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-10 min-h-[600px]">
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
