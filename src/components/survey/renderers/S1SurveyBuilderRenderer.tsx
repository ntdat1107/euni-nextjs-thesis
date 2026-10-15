'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  Modal,
  Tabs,
  Table,
  Tooltip,
  QRCode,
  message,
  Spin,
  Progress,
  Empty,
  Divider,
} from 'antd';
import {
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Share2,
  BarChart2,
  CheckCircle2,
  Save,
  Globe,
  Lock,
  FileSpreadsheet,
  Users,
  Eye,
  CheckSquare,
  CircleDot,
  SlidersHorizontal,
  QrCode,
  Info,
  Type,
  AlignLeft,
  HelpCircle,
  FileText,
} from 'lucide-react';
import {
  surveyFormService,
  SurveyForm,
  SurveySection,
  SurveyQuestion,
  SurveyOption,
  SurveySubmissionItem,
  SurveySummary,
  SurveyQuestionType,
} from '@/services/surveyFormService';

const { Text, Title } = Typography;
const { TextArea } = Input;

const QUESTION_TYPE_CONFIG: Record<
  SurveyQuestionType,
  { label: string; badgeCls: string }
> = {
  LIKERT_SCALE: {
    label: '📊 Thang đo Likert (1-5)',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  SINGLE_CHOICE: {
    label: '🔘 Trắc nghiệm chọn 1',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  MULTIPLE_CHOICE: {
    label: '☑️ Chọn nhiều phương án',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  SHORT_TEXT: {
    label: '📝 Trả lời ngắn',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  LONG_TEXT: {
    label: '📄 Đoạn văn tự luận',
    badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
};

const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_CONFIG).map(
  ([value, cfg]) => ({
    value,
    label: cfg.label,
  })
);

interface S1SurveyBuilderRendererProps {
  step: any;
  readonly: boolean;
  data?: any;
  onChange?: (data: any) => void;
  onRefreshStep?: () => void;
}

export default function S1SurveyBuilderRenderer({
  step,
  readonly,
  data,
  onChange,
  onRefreshStep,
}: S1SurveyBuilderRendererProps) {
  const stepId = step?.id;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'builder' | 'summary' | 'submissions'>('builder');
  const [formConfig, setFormConfig] = useState<SurveyForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Analytics data
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [submissions, setSubmissions] = useState<SurveySubmissionItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState<SurveySubmissionItem | null>(null);

  // Utility to clean raw HTML tags from seeded descriptions
  const cleanHtml = (text?: string) => {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').trim();
  };

  // Load Form Data
  const loadFormData = async () => {
    if (!stepId) return;
    try {
      setLoading(true);
      const res = await surveyFormService.getFormByStep(stepId);
      const normalizedForm: SurveyForm = {
        ...res,
        description: cleanHtml(res?.description),
        sections: (res?.sections || []).map((sec: any) => ({
          ...sec,
          description: cleanHtml(sec?.description),
        })),
        directQuestions: res?.directQuestions || [],
      };
      setFormConfig(normalizedForm);
      if (onChange) {
        onChange(normalizedForm);
      }
    } catch (err) {
      console.error('Failed to load survey form for step', err);
      message.error('Không thể tải cấu hình biểu mẫu khảo sát.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!stepId) return;
    try {
      setLoadingAnalytics(true);
      const [sumRes, subRes] = await Promise.all([
        surveyFormService.getSummary(stepId),
        surveyFormService.getSubmissions(stepId),
      ]);
      setSummary(sumRes);
      setSubmissions(subRes);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadFormData();
  }, [stepId]);

  useEffect(() => {
    if (activeTab === 'summary' || activeTab === 'submissions') {
      loadAnalytics();
    }
  }, [activeTab, stepId]);

  // Form Mutations
  const handleSaveForm = async () => {
    if (!formConfig || !stepId) return;
    try {
      setIsSaving(true);
      const res = await surveyFormService.saveForm(stepId, {
        title: formConfig.title,
        description: formConfig.description,
        targetAudience: formConfig.targetAudience,
        anonymous: formConfig.anonymous,
        startDate: formConfig.startDate,
        endDate: formConfig.endDate,
        sections: formConfig.sections || [],
        directQuestions: formConfig.directQuestions || [],
      });
      const normalized: SurveyForm = {
        ...res,
        sections: res?.sections || [],
        directQuestions: res?.directQuestions || [],
      };
      setFormConfig(normalized);
      message.success('Đã lưu bản nháp thiết kế biểu mẫu');
      if (onChange) {
        onChange(normalized);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Lỗi khi lưu biểu mẫu khảo sát.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!stepId) return;
    try {
      setIsPublishing(true);
      const res = await surveyFormService.publishForm(stepId);
      const normalized: SurveyForm = {
        ...res,
        sections: res?.sections || [],
        directQuestions: res?.directQuestions || [],
      };
      setFormConfig(normalized);
      message.success('Đã xuất bản biểu mẫu! Link khảo sát công khai đã sẵn sàng.');
      if (onRefreshStep) {
        onRefreshStep();
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Lỗi khi xuất bản biểu mẫu.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCloseSurvey = async () => {
    if (!stepId) return;
    try {
      const res = await surveyFormService.closeForm(stepId);
      const normalized: SurveyForm = {
        ...res,
        sections: res?.sections || [],
        directQuestions: res?.directQuestions || [],
      };
      setFormConfig(normalized);
      message.info('Đã kết thúc đợt khảo sát.');
      if (onRefreshStep) {
        onRefreshStep();
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Lỗi khi đóng khảo sát.');
    }
  };

  const getFullPublicUrl = () => {
    if (typeof window === 'undefined' || !formConfig?.publicSlug) return '';
    return `${window.location.origin}/public/survey/${formConfig.publicSlug}`;
  };

  const handleCopyLink = () => {
    const url = getFullPublicUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      message.success('Đã sao chép link khảo sát vào bộ nhớ tạm!');
    }
  };

  const handleAddSection = () => {
    if (!formConfig) return;
    const newSection: SurveySection = {
      title: `Phần ${(formConfig.sections?.length || 0) + 1}: Nội dung mới`,
      description: '',
      orderIndex: (formConfig.sections?.length || 0) + 1,
      questions: [],
    };
    setFormConfig({
      ...formConfig,
      sections: [...(formConfig.sections || []), newSection],
    });
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (!formConfig) return;
    const updated = [...(formConfig.sections || [])];
    updated.splice(sectionIndex, 1);
    setFormConfig({ ...formConfig, sections: updated });
  };

  const handleAddQuestionToSection = (sectionIndex: number) => {
    if (!formConfig) return;
    const updated = [...formConfig.sections];
    const targetSec = updated[sectionIndex];
    const newQ: SurveyQuestion = {
      content: 'Câu hỏi mới...',
      questionType: 'LIKERT_SCALE',
      required: true,
      orderIndex: (targetSec.questions?.length || 0) + 1,
      minRating: 1,
      maxRating: 5,
      options: [],
    };
    targetSec.questions = [...(targetSec.questions || []), newQ];
    setFormConfig({ ...formConfig, sections: updated });
  };

  const handleRemoveQuestion = (sectionIndex: number, questionIndex: number) => {
    if (!formConfig) return;
    const updated = [...formConfig.sections];
    updated[sectionIndex].questions?.splice(questionIndex, 1);
    setFormConfig({ ...formConfig, sections: updated });
  };

  const handleAddOption = (sectionIndex: number, questionIndex: number) => {
    if (!formConfig) return;
    const updated = [...formConfig.sections];
    const q = updated[sectionIndex].questions?.[questionIndex];
    if (q) {
      const newOpt: SurveyOption = {
        content: `Tùy chọn ${(q.options?.length || 0) + 1}`,
        orderIndex: (q.options?.length || 0) + 1,
      };
      q.options = [...(q.options || []), newOpt];
      setFormConfig({ ...formConfig, sections: updated });
    }
  };

  const handleRemoveOption = (sectionIndex: number, questionIndex: number, optIndex: number) => {
    if (!formConfig) return;
    const updated = [...formConfig.sections];
    updated[sectionIndex].questions?.[questionIndex].options?.splice(optIndex, 1);
    setFormConfig({ ...formConfig, sections: updated });
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Spin size="large" />
        <p className="mt-3 text-slate-500 font-medium text-sm">Đang tải cấu hình khảo sát...</p>
      </div>
    );
  }

  if (!formConfig) {
    return <Empty description="Chưa có dữ liệu khảo sát cho bước này" />;
  }

  const isFormLocked = readonly || formConfig.status === 'CLOSED';
  const isPublished = formConfig.status === 'PUBLISHED' && !!formConfig.publicSlug;

  return (
    <div className="space-y-5">
      {/* 1. COMPACT UNIFIED CONTROL STRIP (Eliminates redundant banner card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          {formConfig.status === 'PUBLISHED' && (
            <Tag color="success" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
              ● Đang mở tiếp nhận
            </Tag>
          )}
          {formConfig.status === 'DRAFT' && (
            <Tag color="warning" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
              ● Bản nháp thiết kế
            </Tag>
          )}
          {formConfig.status === 'CLOSED' && (
            <Tag color="default" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
              ● Đã kết thúc
            </Tag>
          )}

          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-500 font-medium">
            Đã thu thập: <strong className="text-slate-800">{formConfig.totalSubmissions || 0}</strong> phản hồi
          </span>
        </div>

        {/* Action Buttons: Khi xuất bản rồi thì chỉ còn nút Đóng khảo sát */}
        {!readonly && (
          <Space size="small">
            {formConfig.status === 'DRAFT' && (
              <>
                <Button
                  icon={<Save className="w-3.5 h-3.5" />}
                  onClick={handleSaveForm}
                  loading={isSaving}
                  disabled={isFormLocked}
                  className="rounded-lg text-xs font-medium"
                >
                  Lưu bản nháp
                </Button>

                <Button
                  type="primary"
                  icon={<Globe className="w-3.5 h-3.5" />}
                  onClick={handlePublish}
                  loading={isPublishing}
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold shadow-xs"
                >
                  Xuất bản & Lấy link
                </Button>
              </>
            )}

            {formConfig.status === 'PUBLISHED' && (
              <Button
                danger
                icon={<Lock className="w-3.5 h-3.5" />}
                onClick={handleCloseSurvey}
                className="rounded-lg text-xs font-medium"
              >
                Đóng khảo sát
              </Button>
            )}
          </Space>
        )}
      </div>

      {/* 2. PUBLIC LINK BAR: Only appears when PUBLISHED (Rule: Draft mode has NO link) */}
      {isPublished ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/80 border border-blue-200/90 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Link khảo sát:</span>
            <Text code className="text-xs text-blue-700 select-all truncate font-mono">
              {getFullPublicUrl()}
            </Text>
          </div>

          <Space size="small">
            <Tooltip title="Sao chép đường dẫn gửi cho doanh nghiệp / cựu sinh viên">
              <Button
                size="small"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyLink}
                className="rounded-lg text-xs font-medium bg-white"
              >
                Sao chép Link
              </Button>
            </Tooltip>

            <Tooltip title="Mã QR tiện chia sẻ trên điện thoại">
              <Button
                size="small"
                icon={<QrCode className="w-3.5 h-3.5" />}
                onClick={() => setQrModalOpen(true)}
                className="rounded-lg text-xs font-medium bg-white"
              >
                QR Code
              </Button>
            </Tooltip>

            <Tooltip title="Mở trang điền thử nghiệm">
              <Button
                size="small"
                type="link"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                href={`/public/survey/${formConfig.publicSlug}`}
                target="_blank"
                className="text-xs text-blue-700 font-semibold p-0"
              >
                Mở trang
              </Button>
            </Tooltip>
          </Space>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-amber-50/70 border border-amber-200/70 px-4 py-2.5 rounded-xl text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Biểu mẫu đang ở <strong>Bản nháp</strong>. Link công khai sẽ được tạo tự động và mở quyền tiếp nhận khi bạn nhấn <strong>"Xuất bản & Lấy link"</strong>.
          </span>
        </div>
      )}

      {/* 3. MAIN TABS (Builder / Summary / Submissions) */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as any)}
        className="custom-survey-tabs"
        items={[
          {
            key: 'builder',
            label: (
              <span className="flex items-center gap-2 px-1 py-0.5 text-xs font-semibold text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                Thiết kế biểu mẫu
              </span>
            ),
            children: (
              <div className="space-y-5 pt-1">
                {/* 3.1 SURVEY META HEADER (With clear descriptive labels) */}
                <div className="bg-white border-t-4 border-blue-600 rounded-b-xl border-x border-b border-slate-200/90 p-5 shadow-xs space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Tên phiếu khảo sát <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formConfig.title}
                      disabled={isFormLocked}
                      onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                      placeholder="Nhập tên phiếu khảo sát (VD: Khảo sát Nhu cầu Đào tạo CTDT)..."
                      className="text-base font-bold text-slate-800 rounded-lg px-3 py-2 border border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-slate-50/40 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-blue-600" />
                      Mô tả & Hướng dẫn điền khảo sát
                    </label>
                    <TextArea
                      rows={3}
                      value={formConfig.description}
                      disabled={isFormLocked}
                      onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
                      placeholder="Nhập lời mở đầu, mục đích thu thập ý kiến và hướng dẫn người tham gia..."
                      className="text-xs text-slate-600 rounded-lg px-3 py-2 border border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-slate-50/40 focus:bg-white resize-y"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        Nhóm đối tượng khảo sát
                      </label>
                      <Input
                        size="middle"
                        value={formConfig.targetAudience}
                        disabled={isFormLocked}
                        onChange={(e) => setFormConfig({ ...formConfig, targetAudience: e.target.value })}
                        placeholder="VD: Doanh nghiệp, Cựu sinh viên, Chuyên gia đầu ngành..."
                        className="rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Khảo sát ẩn danh</div>
                        <div className="text-[11px] text-slate-400">Không bắt buộc ghi danh người trả lời</div>
                      </div>
                      <Switch
                        checked={formConfig.anonymous}
                        disabled={isFormLocked}
                        onChange={(v) => setFormConfig({ ...formConfig, anonymous: v })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3.2 SECTIONS & QUESTIONS LIST */}
                <div className="space-y-4">
                  {formConfig.sections?.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2.5 py-1 rounded-md bg-blue-100/70 text-blue-800 text-xs font-bold shrink-0">
                            Phần {sIdx + 1}
                          </span>
                          <Input
                            value={section.title}
                            disabled={isFormLocked}
                            onChange={(e) => {
                              const updated = [...formConfig.sections];
                              updated[sIdx].title = e.target.value;
                              setFormConfig({ ...formConfig, sections: updated });
                            }}
                            className="font-bold text-slate-800 text-sm border-slate-200 bg-transparent hover:bg-slate-50 focus:bg-white rounded-md px-2 py-1"
                            placeholder="Tiêu đề phần khảo sát..."
                          />
                        </div>

                        {!isFormLocked && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleRemoveSection(sIdx)}
                            className="text-slate-400 hover:text-red-500 rounded-md"
                          />
                        )}
                      </div>

                      {/* Section Description */}
                      <div>
                        <Input
                          value={section.description || ''}
                          disabled={isFormLocked}
                          onChange={(e) => {
                            const updated = [...formConfig.sections];
                            updated[sIdx].description = e.target.value;
                            setFormConfig({ ...formConfig, sections: updated });
                          }}
                          placeholder="Mô tả bổ sung hoặc hướng dẫn thang đo cho phần này..."
                          className="text-xs text-slate-600 border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 rounded-md px-2.5 py-1.5"
                        />
                      </div>

                      {/* Questions in Section */}
                      <div className="space-y-3 pt-1">
                        {section.questions?.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 shrink-0">
                                  Câu {qIdx + 1}
                                </span>
                                <Input
                                  value={q.content}
                                  disabled={isFormLocked}
                                  onChange={(e) => {
                                    const updated = [...formConfig.sections];
                                    updated[sIdx].questions![qIdx].content = e.target.value;
                                    setFormConfig({ ...formConfig, sections: updated });
                                  }}
                                  placeholder="Nhập nội dung câu hỏi..."
                                  className="font-medium text-slate-800 text-xs rounded-lg border-slate-200 py-1.5"
                                />
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isFormLocked ? (
                                  <div
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${
                                      QUESTION_TYPE_CONFIG[q.questionType]?.badgeCls ||
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {QUESTION_TYPE_CONFIG[q.questionType]?.label || q.questionType}
                                  </div>
                                ) : (
                                  <Select
                                    value={q.questionType}
                                    onChange={(val: SurveyQuestionType) => {
                                      const updated = [...formConfig.sections];
                                      const targetQ = updated[sIdx].questions![qIdx];
                                      targetQ.questionType = val;
                                      if (
                                        (val === 'SINGLE_CHOICE' || val === 'MULTIPLE_CHOICE') &&
                                        (!targetQ.options || targetQ.options.length === 0)
                                      ) {
                                        targetQ.options = [
                                          { content: 'Tùy chọn 1', orderIndex: 1 },
                                          { content: 'Tùy chọn 2', orderIndex: 2 },
                                        ];
                                      }
                                      setFormConfig({ ...formConfig, sections: updated });
                                    }}
                                    className="w-48 font-medium text-xs"
                                    size="middle"
                                    options={QUESTION_TYPE_OPTIONS}
                                  />
                                )}

                                {!isFormLocked && (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<Trash2 className="w-3.5 h-3.5" />}
                                    onClick={() => handleRemoveQuestion(sIdx, qIdx)}
                                    className="text-slate-400 hover:text-red-500"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Question Type Preview */}
                            {q.questionType === 'LIKERT_SCALE' && (
                              <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-slate-50/80 rounded-lg border border-slate-200/70 text-center text-xs">
                                <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                  <span className="block font-bold text-slate-800">1</span>
                                  <span className="text-[10px] text-slate-400">Rất không đồng ý</span>
                                </div>
                                <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                  <span className="block font-bold text-slate-800">2</span>
                                  <span className="text-[10px] text-slate-400">Không đồng ý</span>
                                </div>
                                <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                  <span className="block font-bold text-slate-800">3</span>
                                  <span className="text-[10px] text-slate-400">Phân vân</span>
                                </div>
                                <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                  <span className="block font-bold text-slate-800">4</span>
                                  <span className="text-[10px] text-slate-400">Đồng ý</span>
                                </div>
                                <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                  <span className="block font-bold text-slate-800">5</span>
                                  <span className="text-[10px] text-slate-400">Rất đồng ý</span>
                                </div>
                              </div>
                            )}

                            {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') && (
                              <div className="space-y-1.5 pl-5 pt-0.5">
                                {q.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2">
                                    {q.questionType === 'SINGLE_CHOICE' ? (
                                      <CircleDot className="w-3 h-3 text-slate-400 shrink-0" />
                                    ) : (
                                      <CheckSquare className="w-3 h-3 text-slate-400 shrink-0" />
                                    )}
                                    <Input
                                      size="small"
                                      value={opt.content}
                                      disabled={isFormLocked}
                                      onChange={(e) => {
                                        const updated = [...formConfig.sections];
                                        updated[sIdx].questions![qIdx].options![oIdx].content = e.target.value;
                                        setFormConfig({ ...formConfig, sections: updated });
                                      }}
                                      className="text-xs rounded-md"
                                    />
                                    {!isFormLocked && (
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<Trash2 className="w-3 h-3" />}
                                        onClick={() => handleRemoveOption(sIdx, qIdx, oIdx)}
                                      />
                                    )}
                                  </div>
                                ))}

                                {!isFormLocked && (
                                  <Button
                                    size="small"
                                    type="dashed"
                                    icon={<Plus className="w-3 h-3" />}
                                    onClick={() => handleAddOption(sIdx, qIdx)}
                                    className="text-[11px] text-blue-600 rounded-md mt-1"
                                  >
                                    Thêm lựa chọn
                                  </Button>
                                )}
                              </div>
                            )}

                            {q.questionType === 'SHORT_TEXT' && (
                              <Input disabled placeholder="Văn bản câu trả lời ngắn..." className="bg-white text-xs" size="small" />
                            )}

                            {q.questionType === 'LONG_TEXT' && (
                              <TextArea disabled rows={2} placeholder="Văn bản câu trả lời dài..." className="bg-white text-xs" />
                            )}

                            {/* Question Settings Row */}
                            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span>Bắt buộc</span>
                                <Switch
                                  size="small"
                                  checked={q.required}
                                  disabled={isFormLocked}
                                  onChange={(v) => {
                                    const updated = [...formConfig.sections];
                                    updated[sIdx].questions![qIdx].required = v;
                                    setFormConfig({ ...formConfig, sections: updated });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {!isFormLocked && (
                        <Button
                          type="dashed"
                          block
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => handleAddQuestionToSection(sIdx)}
                          className="rounded-lg text-blue-600 border-blue-200 hover:border-blue-500 text-xs py-1"
                        >
                          Thêm câu hỏi vào phần này
                        </Button>
                      )}
                    </div>
                  ))}

                  {!isFormLocked && (
                    <Button
                      type="dashed"
                      block
                      icon={<Plus className="w-4 h-4" />}
                      onClick={handleAddSection}
                      className="rounded-xl border-dashed border-slate-300 text-slate-600 font-semibold py-3 h-auto hover:border-blue-500 hover:text-blue-600 transition-colors text-xs"
                    >
                      Thêm phần khảo sát mới (New Section)
                    </Button>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'summary',
            label: (
              <span className="flex items-center gap-2 px-1 py-0.5 text-xs font-semibold text-slate-700">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                Tổng hợp & Báo cáo ({formConfig.totalSubmissions || 0})
              </span>
            ),
            children: (
              <div className="space-y-4 pt-1">
                {/* 3 Metric Stat Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Tổng phiếu phản hồi
                      </div>
                      <div className="text-2xl font-black text-blue-600 mt-1">
                        {summary?.totalSubmissions || formConfig.totalSubmissions || 0}
                      </div>
                    </div>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Trạng thái tiếp nhận
                      </div>
                      <div className="text-base font-bold text-slate-800 mt-1">
                        {formConfig.status === 'PUBLISHED' ? 'Đang mở' : formConfig.status === 'CLOSED' ? 'Đã đóng' : 'Bản nháp'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Hồ sơ Bước 1
                      </div>
                      <div className="mt-1">
                        {(formConfig.totalSubmissions || 0) > 0 ? (
                          <Tag color="green" className="rounded-md text-xs">Đủ điều kiện tổng hợp</Tag>
                        ) : (
                          <Tag color="orange" className="rounded-md text-xs">Chờ thu thập kết quả</Tag>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Question Analytics Breakdown */}
                {loadingAnalytics ? (
                  <div className="py-12 text-center">
                    <Spin />
                    <p className="mt-2 text-slate-400 text-xs">Đang tính toán số liệu thống kê...</p>
                  </div>
                ) : summary?.questionStats && summary.questionStats.length > 0 ? (
                  <div className="space-y-3">
                    {summary.questionStats.map((stat, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-xs">
                            {idx + 1}. {stat.content}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              QUESTION_TYPE_CONFIG[stat.questionType as SurveyQuestionType]?.badgeCls ||
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {QUESTION_TYPE_CONFIG[stat.questionType as SurveyQuestionType]?.label || stat.questionType}
                          </span>
                        </div>

                        {stat.questionType === 'LIKERT_SCALE' && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-3">
                              <div className="text-xl font-black text-blue-600">
                                {stat.averageScore != null ? stat.averageScore : '—'}
                                <span className="text-xs font-normal text-slate-400"> / 5.0</span>
                              </div>
                              <div className="flex-1">
                                <Progress
                                  percent={stat.averageScore ? (stat.averageScore / 5) * 100 : 0}
                                  showInfo={false}
                                  strokeColor="#2563eb"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 pt-1">
                              {Object.entries(stat.optionDistribution || {}).map(([key, val]) => (
                                <div key={key} className="text-center p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                  <div className="text-[10px] text-slate-500">{key}</div>
                                  <div className="font-bold text-xs text-slate-800 mt-0.5">{val} lượt</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(stat.questionType === 'SINGLE_CHOICE' || stat.questionType === 'MULTIPLE_CHOICE') && (
                          <div className="space-y-1.5 pt-1">
                            {Object.entries(stat.optionDistribution || {}).map(([opt, count]) => {
                              const total = summary.totalSubmissions || 1;
                              const pct = Math.round((count / total) * 100);
                              return (
                                <div key={opt} className="space-y-1">
                                  <div className="flex justify-between text-xs text-slate-600">
                                    <span>{opt}</span>
                                    <span className="font-semibold">{count} ({pct}%)</span>
                                  </div>
                                  <Progress percent={pct} size="small" strokeColor="#3b82f6" />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(stat.questionType === 'SHORT_TEXT' || stat.questionType === 'LONG_TEXT') && (
                          <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                            {stat.textSamples && stat.textSamples.length > 0 ? (
                              stat.textSamples.map((text, tIdx) => (
                                <div key={tIdx} className="p-2 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-100">
                                  "{text}"
                                </div>
                              ))
                            ) : (
                              <Text className="text-xs text-slate-400 italic">Chưa có ý kiến phản hồi nào.</Text>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="Chưa có dữ liệu phản hồi để hiển thị báo cáo" />
                )}
              </div>
            ),
          },
          {
            key: 'submissions',
            label: (
              <span className="flex items-center gap-2 px-1 py-0.5 text-xs font-semibold text-slate-700">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Danh sách phản hồi ({submissions.length})
              </span>
            ),
            children: (
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs pt-1">
                <Table
                  dataSource={submissions}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: 'STT',
                      key: 'index',
                      width: 50,
                      render: (_: any, __: any, index: number) => index + 1,
                    },
                    {
                      title: 'Người điền',
                      dataIndex: 'respondentName',
                      key: 'respondentName',
                      render: (val: string, record: SurveySubmissionItem) => (
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">{val || 'Khách ẩn danh'}</div>
                          <div className="text-[11px] text-slate-400">{record.respondentEmail || 'N/A'}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'Cơ quan / Đơn vị',
                      dataIndex: 'organization',
                      key: 'organization',
                      render: (val: string, record: SurveySubmissionItem) => (
                        <div>
                          <div className="text-xs text-slate-700">{val || 'Chưa ghi rõ'}</div>
                          {record.position && <div className="text-[11px] text-slate-400">{record.position}</div>}
                        </div>
                      ),
                    },
                    {
                      title: 'Thời gian',
                      dataIndex: 'submittedAt',
                      key: 'submittedAt',
                      render: (val: string) => (
                        <span className="text-xs text-slate-500">
                          {val ? new Date(val).toLocaleString('vi-VN') : 'N/A'}
                        </span>
                      ),
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      width: 90,
                      render: (_: any, record: SurveySubmissionItem) => (
                        <Button
                          size="small"
                          icon={<Eye className="w-3 h-3" />}
                          onClick={() => setPreviewSubmission(record)}
                          className="rounded-md text-xs"
                        >
                          Xem
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      {/* QR Code Modal */}
      <Modal
        title="Mã QR Khảo sát Công khai"
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalOpen(false)} className="rounded-lg text-xs">
            Đóng
          </Button>,
        ]}
        centered
      >
        <div className="text-center py-5 space-y-3">
          <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200 inline-block mx-auto shadow-xs">
            <QRCode value={getFullPublicUrl() || 'https://euni.edu.vn'} size={200} />
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Quét mã bằng điện thoại để mở trực tiếp trang điền khảo sát trực tuyến.
          </p>
        </div>
      </Modal>

      {/* Submission Detail Modal */}
      <Modal
        title={`Chi tiết phiếu khảo sát #${previewSubmission?.id || ''}`}
        open={!!previewSubmission}
        onCancel={() => setPreviewSubmission(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewSubmission(null)} className="rounded-lg text-xs">
            Đóng
          </Button>,
        ]}
        width={650}
        centered
      >
        {previewSubmission && (
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
              <div><strong>Họ tên:</strong> {previewSubmission.respondentName || 'Ẩn danh'}</div>
              <div><strong>Email:</strong> {previewSubmission.respondentEmail || 'N/A'}</div>
              <div><strong>Đơn vị:</strong> {previewSubmission.organization || 'N/A'} - {previewSubmission.position || ''}</div>
              <div><strong>Thời gian:</strong> {new Date(previewSubmission.submittedAt).toLocaleString('vi-VN')}</div>
            </div>

            <Divider className="my-2" />

            <div className="space-y-2">
              {previewSubmission.answers?.map((ans, aIdx) => (
                <div key={aIdx} className="p-3 bg-white rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">
                    {aIdx + 1}. {ans.questionContent}
                  </div>
                  <div className="text-slate-600">
                    {ans.questionType === 'LIKERT_SCALE' && (
                      <Tag color="blue" className="text-xs">Mức đánh giá: {ans.numericValue} / 5</Tag>
                    )}
                    {(ans.questionType === 'SINGLE_CHOICE' || ans.questionType === 'MULTIPLE_CHOICE') && (
                      <div>{ans.selectedOptions?.join(', ') || 'Không chọn'}</div>
                    )}
                    {(ans.questionType === 'SHORT_TEXT' || ans.questionType === 'LONG_TEXT') && (
                      <div>{ans.textValue || 'Không có câu trả lời'}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
