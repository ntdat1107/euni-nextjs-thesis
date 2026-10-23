'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Typography,
  Button,
  Select,
  Tag,
  Space,
  Modal,
  Tabs,
  Spin,
  Empty,
  message,
} from 'antd';
import {
  Plus,
  Copy,
  ExternalLink,
  Share2,
  BarChart2,
  SlidersHorizontal,
  QrCode,
  Users,
  History,
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
  SurveyFormVersionItem,
} from '@/services/surveyFormService';
import { cleanHtml } from './s1/constants';
import { SurveyMetaHeader } from './s1/SurveyMetaHeader';
import { SurveySectionItem } from './s1/SurveySectionItem';
import { SurveySummaryTab } from './s1/SurveySummaryTab';
import { SurveySubmissionsTab } from './s1/SurveySubmissionsTab';
import { SurveyModals } from './s1/SurveyModals';

const { Text } = Typography;

export interface S1SurveyBuilderRef {
  saveForm: () => Promise<boolean>;
  submitReview: () => Promise<boolean>;
  recallSubmission: () => Promise<boolean>;
  approveDesign: () => Promise<boolean>;
  rejectDesign: () => void;
  publishForm: () => Promise<boolean>;
  requestRevision: () => void;
}

export interface S1SurveyBuilderRendererProps {
  step: any;
  readonly: boolean;
  data?: any;
  onChange?: (data: any) => void;
  onRefreshStep?: () => void;
  onFormLoaded?: (form: SurveyForm | null, versions: SurveyFormVersionItem[]) => void;
}

const S1SurveyBuilderRenderer = forwardRef<S1SurveyBuilderRef, S1SurveyBuilderRendererProps>(
  function S1SurveyBuilderRenderer(
    { step, readonly, onChange, onRefreshStep, onFormLoaded },
    ref
  ) {
    const stepId = step?.id;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'builder' | 'summary' | 'submissions'>('builder');
    const [formConfig, setFormConfig] = useState<SurveyForm | null>(null);
    const formConfigRef = useRef<SurveyForm | null>(null);

    const [versions, setVersions] = useState<SurveyFormVersionItem[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [, setIsPublishing] = useState(false);
    const [summary, setSummary] = useState<SurveySummary | null>(null);
    const [submissions, setSubmissions] = useState<SurveySubmissionItem[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [previewSubmission, setPreviewSubmission] = useState<SurveySubmissionItem | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Keep callback props in refs to completely decouple effect dependencies from parent renders
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const onFormLoadedRef = useRef(onFormLoaded);
    onFormLoadedRef.current = onFormLoaded;

    const onRefreshStepRef = useRef(onRefreshStep);
    onRefreshStepRef.current = onRefreshStep;

    const syncFormConfig = (next: SurveyForm | null) => {
      formConfigRef.current = next;
      setFormConfig(next);
    };

    const loadFormData = useCallback(
      async (targetFormId?: number) => {
        if (!stepId) return;
        try {
          setLoading(true);
          const res = targetFormId
            ? await surveyFormService.getFormById(targetFormId)
            : await surveyFormService.getFormByStep(stepId);

          const normalized: SurveyForm = {
            ...res,
            description: cleanHtml(res?.description),
            sections: (res?.sections || []).map((sec: any) => ({
              ...sec,
              description: cleanHtml(sec?.description),
            })),
            directQuestions: res?.directQuestions || [],
          };

          syncFormConfig(normalized);
          setSelectedVersionId(normalized.id);
          onChangeRef.current?.(normalized);

          const vList = await surveyFormService.getFormVersions(stepId);
          setVersions(vList);
          onFormLoadedRef.current?.(normalized, vList);
        } catch (err) {
          console.error('Failed to load survey form for step', err);
          message.error('Không thể tải cấu hình biểu mẫu khảo sát.');
        } finally {
          setLoading(false);
        }
      },
      [stepId]
    );

    const loadAnalytics = useCallback(
      async (targetFormId?: number) => {
        const fId = targetFormId || formConfigRef.current?.id;
        if (!fId) return;
        try {
          setLoadingAnalytics(true);
          const [sumRes, subRes] = await Promise.all([
            surveyFormService.getSummaryByFormId(fId),
            surveyFormService.getSubmissionsByFormId(fId),
          ]);
          setSummary(sumRes);
          setSubmissions(subRes);
        } catch (err) {
          console.error('Failed to load analytics', err);
        } finally {
          setLoadingAnalytics(false);
        }
      },
      []
    );

    useEffect(() => {
      if (stepId) {
        loadFormData();
      }
    }, [stepId, loadFormData]);

    useEffect(() => {
      if (activeTab === 'summary' || activeTab === 'submissions') {
        const targetId = selectedVersionId || formConfigRef.current?.id;
        if (targetId) {
          loadAnalytics(targetId);
        }
      }
    }, [activeTab, selectedVersionId, loadAnalytics]);

    // Fast Immediate Ref Updates (0ms latency for save guarantee)
    const onUpdateTitleImmediate = useCallback((val: string) => {
      if (formConfigRef.current) formConfigRef.current.title = val;
    }, []);

    const onUpdateTitle = useCallback((val: string) => {
      setFormConfig((prev) => (prev ? { ...prev, title: val } : prev));
    }, []);

    const onUpdateDescriptionImmediate = useCallback((val: string) => {
      if (formConfigRef.current) formConfigRef.current.description = val;
    }, []);

    const onUpdateDescription = useCallback((val: string) => {
      setFormConfig((prev) => (prev ? { ...prev, description: val } : prev));
    }, []);

    const onUpdateTargetAudienceImmediate = useCallback((val: string) => {
      if (formConfigRef.current) formConfigRef.current.targetAudience = val;
    }, []);

    const onUpdateTargetAudience = useCallback((val: string) => {
      setFormConfig((prev) => (prev ? { ...prev, targetAudience: val } : prev));
    }, []);

    const onUpdateAnonymous = useCallback((val: boolean) => {
      if (formConfigRef.current) formConfigRef.current.anonymous = val;
      setFormConfig((prev) => (prev ? { ...prev, anonymous: val } : prev));
    }, []);

    const onUpdateSectionTitleImmediate = useCallback((sIdx: number, val: string) => {
      if (formConfigRef.current?.sections?.[sIdx]) {
        formConfigRef.current.sections[sIdx].title = val;
      }
    }, []);

    const onUpdateSectionTitle = useCallback((sIdx: number, val: string) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((sec, i) =>
          i === sIdx ? { ...sec, title: val } : sec
        );
        return { ...prev, sections };
      });
    }, []);

    const onUpdateSectionDescImmediate = useCallback((sIdx: number, val: string) => {
      if (formConfigRef.current?.sections?.[sIdx]) {
        formConfigRef.current.sections[sIdx].description = val;
      }
    }, []);

    const onUpdateSectionDesc = useCallback((sIdx: number, val: string) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((sec, i) =>
          i === sIdx ? { ...sec, description: val } : sec
        );
        return { ...prev, sections };
      });
    }, []);

    const onUpdateQuestionContentImmediate = useCallback(
      (sIdx: number, qIdx: number, val: string) => {
        if (formConfigRef.current?.sections?.[sIdx]?.questions?.[qIdx]) {
          formConfigRef.current.sections[sIdx].questions[qIdx].content = val;
        }
      },
      []
    );

    const onUpdateQuestionContent = useCallback((sIdx: number, qIdx: number, val: string) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((sec, i) => {
          if (i !== sIdx) return sec;
          const questions = (sec.questions || []).map((q, j) =>
            j === qIdx ? { ...q, content: val } : q
          );
          return { ...sec, questions };
        });
        return { ...prev, sections };
      });
    }, []);

    const onChangeQuestionType = useCallback(
      (sIdx: number, qIdx: number, val: SurveyQuestionType) => {
        setFormConfig((prev) => {
          if (!prev) return prev;
          const sections = prev.sections.map((sec, i) => {
            if (i !== sIdx) return sec;
            const questions = (sec.questions || []).map((q, j) => {
              if (j !== qIdx) return q;
              const opts =
                (val === 'SINGLE_CHOICE' || val === 'MULTIPLE_CHOICE') &&
                (!q.options || q.options.length === 0)
                  ? [
                      { content: 'Lựa chọn 1', orderIndex: 1 },
                      { content: 'Lựa chọn 2', orderIndex: 2 },
                    ]
                  : q.options;
              return { ...q, questionType: val, options: opts };
            });
            return { ...sec, questions };
          });
          const next = { ...prev, sections };
          formConfigRef.current = next;
          return next;
        });
      },
      []
    );

    const onRemoveQuestion = useCallback((sIdx: number, qIdx: number) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((sec, i) => {
          if (i !== sIdx) return sec;
          return {
            ...sec,
            questions: (sec.questions || []).filter((_, j) => j !== qIdx),
          };
        });
        const next = { ...prev, sections };
        formConfigRef.current = next;
        return next;
      });
    }, []);

    const onAddQuestion = useCallback((sIdx: number) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((sec, i) => {
          if (i !== sIdx) return sec;
          const newQ: SurveyQuestion = {
            content: 'Câu hỏi mới...',
            questionType: 'LIKERT_SCALE',
            required: true,
            orderIndex: (sec.questions?.length || 0) + 1,
            minRating: 1,
            maxRating: 5,
            options: [],
          };
          return { ...sec, questions: [...(sec.questions || []), newQ] };
        });
        const next = { ...prev, sections };
        formConfigRef.current = next;
        return next;
      });
    }, []);

    const onAddOption = useCallback((sIdx: number, qIdx: number) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((sec, i) => {
          if (i !== sIdx) return sec;
          const questions = (sec.questions || []).map((q, j) => {
            if (j !== qIdx) return q;
            const newOpt: SurveyOption = {
              content: `Tùy chọn ${(q.options?.length || 0) + 1}`,
              orderIndex: (q.options?.length || 0) + 1,
            };
            return { ...q, options: [...(q.options || []), newOpt] };
          });
          return { ...sec, questions };
        });
        const next = { ...prev, sections };
        formConfigRef.current = next;
        return next;
      });
    }, []);

    const onUpdateOptionContentImmediate = useCallback(
      (sIdx: number, qIdx: number, optIdx: number, val: string) => {
        const opt = formConfigRef.current?.sections?.[sIdx]?.questions?.[qIdx]?.options?.[optIdx];
        if (opt) opt.content = val;
      },
      []
    );

    const onUpdateOptionContent = useCallback(
      (sIdx: number, qIdx: number, optIdx: number, val: string) => {
        setFormConfig((prev) => {
          if (!prev) return prev;
          const sections = prev.sections.map((sec, i) => {
            if (i !== sIdx) return sec;
            const questions = (sec.questions || []).map((q, j) => {
              if (j !== qIdx) return q;
              const options = q.options?.map((opt, k) =>
                k === optIdx ? { ...opt, content: val } : opt
              );
              return { ...q, options };
            });
            return { ...sec, questions };
          });
          return { ...prev, sections };
        });
      },
      []
    );

    const onRemoveOption = useCallback(
      (sIdx: number, qIdx: number, optIdx: number) => {
        setFormConfig((prev) => {
          if (!prev) return prev;
          const sections = prev.sections.map((sec, i) => {
            if (i !== sIdx) return sec;
            const questions = (sec.questions || []).map((q, j) => {
              if (j !== qIdx) return q;
              return {
                ...q,
                options: q.options?.filter((_, k) => k !== optIdx),
              };
            });
            return { ...sec, questions };
          });
          const next = { ...prev, sections };
          formConfigRef.current = next;
          return next;
        });
      },
      []
    );

    const handleAddSection = useCallback(() => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const newSec: SurveySection = {
          title: `Phần ${(prev.sections?.length || 0) + 1}: Nội dung mới`,
          description: '',
          orderIndex: (prev.sections?.length || 0) + 1,
          questions: [],
        };
        const next = { ...prev, sections: [...(prev.sections || []), newSec] };
        formConfigRef.current = next;
        return next;
      });
    }, []);

    const handleRemoveSection = useCallback((sectionIndex: number) => {
      setFormConfig((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          sections: prev.sections.filter((_, i) => i !== sectionIndex),
        };
        formConfigRef.current = next;
        return next;
      });
    }, []);

    // Form Server Actions
    const handleSaveForm = async (): Promise<boolean> => {
      const active = formConfigRef.current;
      if (!active || !stepId) return false;
      try {
        setIsSaving(true);
        const res = await surveyFormService.saveForm(stepId, {
          title: active.title,
          description: active.description,
          targetAudience: active.targetAudience,
          anonymous: active.anonymous,
          startDate: active.startDate,
          endDate: active.endDate,
          sections: active.sections || [],
          directQuestions: active.directQuestions || [],
        });
        const normalized: SurveyForm = {
          ...res,
          sections: res?.sections || [],
          directQuestions: res?.directQuestions || [],
        };
        syncFormConfig(normalized);
        setSelectedVersionId(normalized.id);

        if (active.id && normalized.version > (active.version || 1)) {
          message.success(
            `Do phiên bản cũ đã có phản hồi, hệ thống đã tạo mới Phiên bản v${normalized.version} để bảo toàn số liệu cũ!`
          );
        } else if (!active.id) {
          message.success('Đã lưu thiết kế biểu mẫu (Khởi tạo Phiên bản v1 thành công)');
        } else {
          message.success('Đã lưu bản nháp thiết kế biểu mẫu');
        }

        const vList = await surveyFormService.getFormVersions(stepId);
        setVersions(vList);
        onFormLoadedRef.current?.(normalized, vList);
        onChangeRef.current?.(normalized);
        onRefreshStepRef.current?.();
        return true;
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || 'Lỗi khi lưu biểu mẫu.');
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    const handleSubmitReview = async (): Promise<boolean> => {
      if (!stepId) return false;
      try {
        setIsSaving(true);
        await surveyFormService.submitReview(stepId);
        message.success('Đã nộp thiết kế biểu mẫu để cấp có thẩm quyền phê duyệt!');
        await loadFormData();
        onRefreshStepRef.current?.();
        return true;
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || 'Lỗi khi nộp duyệt');
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    const handleRecallSubmission = async (): Promise<boolean> => {
      if (!stepId) return false;
      try {
        setIsSaving(true);
        await surveyFormService.recallSubmission(stepId);
        message.success('Đã thu hồi yêu cầu phê duyệt!');
        await loadFormData();
        onRefreshStepRef.current?.();
        return true;
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || 'Lỗi khi thu hồi');
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    const handleApproveDesign = async (): Promise<boolean> => {
      if (!stepId) return false;
      try {
        setIsSaving(true);
        await surveyFormService.approveDesign(stepId);
        message.success('Đã phê duyệt thiết kế biểu mẫu! Giờ đây bạn có thể Xuất bản & Lấy link.');
        await loadFormData();
        onRefreshStepRef.current?.();
        return true;
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || 'Lỗi khi duyệt thiết kế');
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    const handleConfirmReject = async () => {
      if (!stepId) return;
      try {
        setIsSaving(true);
        await surveyFormService.rejectDesign(stepId, rejectReason);
        message.success('Đã gửi yêu cầu chỉnh sửa thiết kế biểu mẫu thành công!');
        setRejectModalOpen(false);
        setRejectReason('');
        await loadFormData();
        onRefreshStepRef.current?.();
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || 'Lỗi khi từ chối');
      } finally {
        setIsSaving(false);
      }
    };

    const handlePublish = async (): Promise<boolean> => {
      if (!stepId) return false;
      try {
        setIsPublishing(true);
        const res = await surveyFormService.publishForm(stepId);
        const normalized: SurveyForm = {
          ...res,
          sections: res?.sections || [],
          directQuestions: res?.directQuestions || [],
        };
        syncFormConfig(normalized);
        message.success('Đã xuất bản biểu mẫu! Link khảo sát công khai và QR code đã sẵn sàng.');
        const vList = await surveyFormService.getFormVersions(stepId);
        setVersions(vList);
        onRefreshStepRef.current?.();
        return true;
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || 'Lỗi khi xuất bản.');
        return false;
      } finally {
        setIsPublishing(false);
      }
    };

    const handleRequestRevision = () => {
      Modal.confirm({
        title: 'Cho phép chỉnh sửa biểu mẫu (Tạo phiên bản mới)',
        content: (
          <div className="py-2 text-xs space-y-2">
            <p className="text-slate-700 font-medium">Hệ thống sẽ thực hiện các thao tác sau:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>Khóa link khảo sát hiện tại</strong>.</li>
              <li>Tự động tạo <strong>Phiên bản mới (v{(formConfig?.version || 1) + 1})</strong>.</li>
              <li>Đưa biểu mẫu về trạng thái <strong>Bản nháp</strong>.</li>
            </ul>
          </div>
        ),
        okText: 'Xác nhận tạo phiên bản mới',
        cancelText: 'Hủy bỏ',
        centered: true,
        onOk: async () => {
          try {
            setIsSaving(true);
            await surveyFormService.requestRevision(stepId);
            message.success('Đã khóa link cũ và khởi tạo phiên bản mới!');
            await loadFormData();
            onRefreshStepRef.current?.();
          } catch (err: any) {
            message.error(err?.response?.data?.message || err?.message || 'Lỗi khi yêu cầu sửa đổi');
          } finally {
            setIsSaving(false);
          }
        },
      });
    };

    useImperativeHandle(ref, () => ({
      saveForm: handleSaveForm,
      submitReview: handleSubmitReview,
      recallSubmission: handleRecallSubmission,
      approveDesign: handleApproveDesign,
      rejectDesign: () => setRejectModalOpen(true),
      publishForm: handlePublish,
      requestRevision: handleRequestRevision,
    }));

    const getFullPublicUrl = () => {
      if (typeof window === 'undefined' || !formConfig?.publicSlug) return '';
      return `${window.location.origin}/public/survey/${formConfig.publicSlug}`;
    };

    const handleCopyLink = () => {
      const url = getFullPublicUrl();
      if (url) {
        navigator.clipboard.writeText(url);
        message.success('Đã sao chép link khảo sát!');
      }
    };

    const isFormLocked =
      readonly ||
      formConfig?.status === 'CLOSED' ||
      formConfig?.status === 'PUBLISHED' ||
      formConfig?.status === 'PENDING_REVIEW';
    const isPublished = formConfig?.status === 'PUBLISHED' && !!formConfig?.publicSlug;

    const versionSelectOptions = useMemo(
      () =>
        versions.map((v) => ({
          value: v.id,
          label: (
            <div className="flex items-center justify-between gap-2 text-xs py-0.5">
              <span className="font-semibold text-slate-800">
                Phiên bản v{v.version} {v.isCurrent ? '★ (Hiện tại)' : '(Lịch sử)'}
              </span>
              <Tag
                color={
                  v.status === 'PUBLISHED'
                    ? 'blue'
                    : v.status === 'CLOSED'
                    ? 'default'
                    : v.status === 'APPROVED'
                    ? 'green'
                    : v.status === 'PENDING_REVIEW'
                    ? 'orange'
                    : 'gold'
                }
                className="m-0 text-[10px] px-1.5 py-0 leading-normal"
              >
                {v.status === 'PUBLISHED'
                  ? 'Đang mở'
                  : v.status === 'CLOSED'
                  ? 'Đã đóng'
                  : v.status === 'APPROVED'
                  ? 'Đã duyệt'
                  : v.status === 'PENDING_REVIEW'
                  ? 'Chờ duyệt'
                  : 'Bản nháp'}{' '}
                • {v.totalSubmissions} phản hồi
              </Tag>
            </div>
          ),
        })),
      [versions]
    );

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

    return (
      <div className="space-y-5">
        {/* 1. VERSION HISTORY TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/90 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <History className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Phiên bản biểu mẫu:</span>
            <Select<number>
              value={versions.length === 0 ? undefined : selectedVersionId || formConfig.id}
              placeholder="Chưa có phiên bản (Bản nháp ban đầu)"
              onChange={(verId) => {
                setSelectedVersionId(verId);
                loadFormData(verId);
              }}
              className="min-w-[280px]"
              size="small"
              disabled={versions.length === 0}
              options={versionSelectOptions}
            />
          </div>

          <span className="text-xs text-slate-500">
            {formConfig.version ? (
              <>
                Số phản hồi phiên bản này:{' '}
                <strong className="text-slate-800">{formConfig.totalSubmissions || 0}</strong>
              </>
            ) : (
              <span className="text-slate-400 italic">Chưa lưu vào hệ thống</span>
            )}
          </span>
        </div>

        {/* 2. UNIFIED STATUS & CONTROL STRIP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5 flex-wrap">
            {(!formConfig.id || !formConfig.status) && (
              <Tag className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0 bg-slate-100 text-slate-600 border-slate-300">
                ● Chưa bắt đầu thiết kế (PENDING)
              </Tag>
            )}
            {formConfig.status === 'PUBLISHED' && (
              <Tag
                color={step?.status === 'COMPLETED' ? 'success' : 'processing'}
                className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0"
              >
                {step?.status === 'COMPLETED'
                  ? `● Đã hoàn thành khảo sát (v${formConfig.version})`
                  : `● Đang mở khảo sát (v${formConfig.version})`}
              </Tag>
            )}
            {formConfig.status === 'APPROVED' && (
              <Tag color="success" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
                ● Thiết kế đã duyệt (v{formConfig.version}) - Sẵn sàng tạo link
              </Tag>
            )}
            {formConfig.status === 'PENDING_REVIEW' && (
              <Tag color="warning" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
                ● Đang chờ phê duyệt thiết kế (v{formConfig.version})
              </Tag>
            )}
            {formConfig.status === 'DRAFT' && (
              <Tag color="default" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
                ● Bản nháp thiết kế (v{formConfig.version})
              </Tag>
            )}
            {formConfig.status === 'CLOSED' && (
              <Tag color="default" className="px-2.5 py-0.5 rounded-full font-semibold text-xs m-0">
                ● Đã đóng link khảo sát (v{formConfig.version})
              </Tag>
            )}

            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">
              Mục tiêu: <strong className="text-slate-800">{formConfig.targetAudience || 'Chưa đặt'}</strong>
            </span>
          </div>
        </div>

        {/* 3. PUBLIC LINK BAR */}
        {isPublished && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/80 border border-blue-200/90 px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-medium text-slate-600 shrink-0">
                Link khảo sát công khai (v{formConfig.version}):
              </span>
              <Text code className="text-xs text-blue-700 select-all truncate font-mono">
                {getFullPublicUrl()}
              </Text>
            </div>

            <Space size="small">
              <Button
                size="small"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyLink}
                className="rounded-lg text-xs font-medium bg-white"
              >
                Sao chép Link
              </Button>
              <Button
                size="small"
                icon={<QrCode className="w-3.5 h-3.5" />}
                onClick={() => setQrModalOpen(true)}
                className="rounded-lg text-xs font-medium bg-white"
              >
                QR Code
              </Button>
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
            </Space>
          </div>
        )}

        {/* 4. MAIN TABS */}
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
                  Thiết kế biểu mẫu {formConfig.version ? `(v${formConfig.version})` : ''}
                </span>
              ),
              children: (
                <div className="space-y-5 pt-1">
                  <SurveyMetaHeader
                    title={formConfig.title}
                    description={formConfig.description}
                    targetAudience={formConfig.targetAudience}
                    anonymous={formConfig.anonymous}
                    isFormLocked={isFormLocked}
                    onUpdateTitle={onUpdateTitle}
                    onUpdateTitleImmediate={onUpdateTitleImmediate}
                    onUpdateDescription={onUpdateDescription}
                    onUpdateDescriptionImmediate={onUpdateDescriptionImmediate}
                    onUpdateTargetAudience={onUpdateTargetAudience}
                    onUpdateTargetAudienceImmediate={onUpdateTargetAudienceImmediate}
                    onUpdateAnonymous={onUpdateAnonymous}
                  />

                  <div className="space-y-4">
                    {formConfig.sections?.map((section, sIdx) => (
                      <SurveySectionItem
                        key={section.id ? String(section.id) : `sec-${sIdx}`}
                        section={section}
                        sIdx={sIdx}
                        isFormLocked={isFormLocked}
                        onUpdateSectionTitle={onUpdateSectionTitle}
                        onUpdateSectionTitleImmediate={onUpdateSectionTitleImmediate}
                        onUpdateSectionDesc={onUpdateSectionDesc}
                        onUpdateSectionDescImmediate={onUpdateSectionDescImmediate}
                        onRemoveSection={handleRemoveSection}
                        onAddQuestion={onAddQuestion}
                        onUpdateQuestionContent={onUpdateQuestionContent}
                        onUpdateQuestionContentImmediate={onUpdateQuestionContentImmediate}
                        onChangeQuestionType={onChangeQuestionType}
                        onRemoveQuestion={onRemoveQuestion}
                        onAddOption={onAddOption}
                        onUpdateOptionContent={onUpdateOptionContent}
                        onUpdateOptionContentImmediate={onUpdateOptionContentImmediate}
                        onRemoveOption={onRemoveOption}
                      />
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
                  Tổng hợp & Báo cáo v{formConfig.version} ({formConfig.totalSubmissions || 0})
                </span>
              ),
              children:
                activeTab === 'summary' ? (
                  <SurveySummaryTab
                    summary={summary}
                    loadingAnalytics={loadingAnalytics}
                    formConfig={formConfig}
                  />
                ) : null,
            },
            {
              key: 'submissions',
              label: (
                <span className="flex items-center gap-2 px-1 py-0.5 text-xs font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  Danh sách phản hồi v{formConfig.version} ({submissions.length})
                </span>
              ),
              children:
                activeTab === 'submissions' ? (
                  <SurveySubmissionsTab
                    submissions={submissions}
                    onPreviewSubmission={setPreviewSubmission}
                  />
                ) : null,
            },
          ]}
        />

        <SurveyModals
          rejectModalOpen={rejectModalOpen}
          rejectReason={rejectReason}
          isSaving={isSaving}
          onCloseRejectModal={() => {
            setRejectModalOpen(false);
            setRejectReason('');
          }}
          onChangeRejectReason={setRejectReason}
          onConfirmReject={handleConfirmReject}
          qrModalOpen={qrModalOpen}
          onCloseQrModal={() => setQrModalOpen(false)}
          fullPublicUrl={getFullPublicUrl()}
          formVersion={formConfig.version}
          previewSubmission={previewSubmission}
          onClosePreviewSubmission={() => setPreviewSubmission(null)}
        />
      </div>
    );
  }
);

export default S1SurveyBuilderRenderer;
