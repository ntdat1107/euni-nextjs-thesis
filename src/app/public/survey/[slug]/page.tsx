'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  Typography,
  Button,
  Input,
  Radio,
  Checkbox,
  message,
  Spin,
  Alert,
  Result,
  Divider,
} from 'antd';
import {
  GraduationCap,
  Send,
  Building2,
  Mail,
  User,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  surveyFormService,
  SurveyForm,
  SurveySubmissionRequest,
} from '@/services/surveyFormService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function PublicSurveyPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SurveyForm | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Respondent info state
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [respondentPhone, setRespondentPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [position, setPosition] = useState('');

  // Answers state: questionId -> answer
  // For text: string
  // For Likert: number (1-5)
  // For single: string
  // For multi: string[]
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [invalidQuestionIds, setInvalidQuestionIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!slug) return;
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const data = await surveyFormService.getPublicForm(slug);
        setForm(data);
      } catch (err: any) {
        console.error('Failed to load public survey', err);
        setErrorMsg('Không tìm thấy phiếu khảo sát hoặc khảo sát đã bị đóng.');
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [slug]);

  const clearInvalidQuestion = (qId: number) => {
    setInvalidQuestionIds((prev) => {
      if (!prev.has(qId)) return prev;
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
  };

  const handleLikertChange = (qId: number, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    clearInvalidQuestion(qId);
  };

  const handleSingleChoiceChange = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    clearInvalidQuestion(qId);
  };

  const handleMultiChoiceChange = (qId: number, checkedValues: string[]) => {
    setAnswers((prev) => ({ ...prev, [qId]: checkedValues }));
    if (checkedValues.length > 0) {
      clearInvalidQuestion(qId);
    }
  };

  const handleTextChange = (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    if (val.trim()) {
      clearInvalidQuestion(qId);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    // Validate required questions
    const allQuestions = [
      ...(form.sections || []).flatMap((s) => s.questions || []),
      ...(form.directQuestions || []),
    ];

    const missingIds: number[] = [];
    for (const q of allQuestions) {
      if (q.required && q.id) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          missingIds.push(q.id);
        }
      }
    }

    if (missingIds.length > 0) {
      setInvalidQuestionIds(new Set(missingIds));
      message.error(`Vui lòng hoàn thành ${missingIds.length} câu hỏi bắt buộc còn trống.`);

      // Smooth scroll to the first invalid field
      const firstInvalidId = missingIds[0];
      const targetElement = document.getElementById(`question-card-${firstInvalidId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setInvalidQuestionIds(new Set());

    try {
      setSubmitting(true);
      const submissionAnswers: SurveySubmissionRequest['answers'] = [];

      for (const q of allQuestions) {
        if (!q.id) continue;
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') continue;

        if (q.questionType === 'LIKERT_SCALE') {
          submissionAnswers.push({
            questionId: q.id,
            numericValue: Number(val),
          });
        } else if (q.questionType === 'SINGLE_CHOICE') {
          submissionAnswers.push({
            questionId: q.id,
            selectedOptions: [String(val)],
          });
        } else if (q.questionType === 'MULTIPLE_CHOICE') {
          submissionAnswers.push({
            questionId: q.id,
            selectedOptions: Array.isArray(val) ? val : [String(val)],
          });
        } else {
          submissionAnswers.push({
            questionId: q.id,
            textValue: String(val),
          });
        }
      }

      await surveyFormService.submitPublicSurvey(slug, {
        respondentName,
        respondentEmail,
        respondentPhone,
        organization,
        position,
        answers: submissionAnswers,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi bài khảo sát.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Spin size="large" />
          <p className="text-slate-600 font-medium">Đang tải phiếu khảo sát trực tuyến...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center rounded-3xl shadow-sm p-6 border-slate-200">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <Title level={4} className="text-slate-800">Thông báo</Title>
          <p className="text-slate-500 text-sm mb-6">{errorMsg || 'Khảo sát không khả dụng.'}</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full text-center rounded-3xl shadow-lg border-slate-100 p-8">
          <Result
            status="success"
            title="Đã gửi phiếu khảo sát thành công!"
            subTitle="Chân thành cảm ơn Quý vị đã dành thời gian quý báu đóng góp ý kiến cho Chương trình đào tạo của Nhà trường. Ý kiến của Quý vị là cơ sở thực tiễn quan trọng để cải tiến chất lượng đào tạo."
            extra={[
              <Button
                key="back"
                type="primary"
                onClick={() => window.location.reload()}
                className="bg-blue-600 rounded-xl px-6"
              >
                Gửi thêm một phản hồi khác
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {/* Header Branding Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-700">
                <GraduationCap className="w-7 h-7" />
              </span>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-blue-700">
                  Hệ thống Quản lý CTĐT Đại học
                </span>
                <div className="text-xs text-slate-400">Khảo sát & Thu thập ý kiến bên liên quan</div>
              </div>
            </div>

            <Title level={3} className="!text-slate-900 !mb-2 font-black leading-tight">
              {form.title}
            </Title>

            {form.description && (
              <div
                className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: form.description }}
              />
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {form.targetAudience && (
                <span className="px-3 py-1 rounded-full bg-slate-100 font-medium">
                  Đối tượng: {form.targetAudience}
                </span>
              )}
              <span className="text-red-500 font-semibold">* Mục bắt buộc</span>
            </div>
          </div>
        </div>

        {/* Respondent Info Card */}
        <Card className="rounded-3xl border-slate-200/80 shadow-sm p-2 sm:p-4">
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Thông tin người tham gia khảo sát
              </h3>
              <p className="text-xs text-slate-500">
                {form.anonymous
                  ? 'Khảo sát này hỗ trợ ẩn danh, bạn có thể để trống nếu không muốn cung cấp danh tính.'
                  : 'Vui lòng cung cấp thông tin liên hệ để Nhà trường tổng hợp danh sách đối tượng khảo sát.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Họ và tên
                </label>
                <Input
                  prefix={<User className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Địa chỉ Email
                </label>
                <Input
                  prefix={<Mail className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="nguyenvana@gmail.com"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Số điện thoại
                </label>
                <Input
                  prefix={<Phone className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                  value={respondentPhone}
                  onChange={(e) => setRespondentPhone(e.target.value)}
                  placeholder="0987654321"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Cơ quan / Doanh nghiệp công tác
                </label>
                <Input
                  prefix={<Building2 className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Công ty Cổ phần / Viện nghiên cứu..."
                  className="rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Chức vụ / Vị trí chuyên môn
                </label>
                <Input
                  prefix={<Briefcase className="w-3.5 h-3.5 text-slate-400 mr-1" />}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Giám đốc công nghệ, Trưởng nhóm phần mềm, Giảng viên..."
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Survey Sections & Questions */}
        {form.sections?.map((section, sIdx) => (
          <div key={sIdx} className="w-full">
            <Card className="rounded-3xl border-slate-200/80 shadow-sm p-2 sm:p-4 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
              {section.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{section.description}</p>
              )}
            </div>

            <div className="space-y-6 pt-2">
              {section.questions?.map((q, qIdx) => {
                const isInvalid = !!q.id && invalidQuestionIds.has(q.id);

                return (
                  <div
                    key={qIdx}
                    id={`question-card-${q.id}`}
                    className={`space-y-3 p-4 rounded-2xl transition-all duration-300 border ${
                      isInvalid
                        ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/20'
                        : 'border-transparent hover:border-slate-100 pb-5 border-b-slate-100/60 last:border-b-0'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 text-sm leading-snug flex items-start gap-1">
                      <span className="text-blue-700 shrink-0">{qIdx + 1}.</span>
                      <div className="flex-1">
                        <span>{q.content}</span>
                        {q.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                      </div>
                    </div>
                    {q.helpText && <p className="text-xs text-slate-400">{q.helpText}</p>}

                    {/* Invalid helper alert */}
                    {isInvalid && (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Đây là câu hỏi bắt buộc, vui lòng chọn hoặc nhập câu trả lời.</span>
                      </div>
                    )}

                    {/* LIKERT SCALE (1 to 5 Pill Buttons) */}
                    {q.questionType === 'LIKERT_SCALE' && (
                      <div className="pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 max-w-lg">
                          {[1, 2, 3, 4, 5].map((lvl) => {
                            const isSelected = answers[q.id!] === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleLikertChange(q.id!, lvl)}
                                className={`cursor-pointer flex-1 min-w-[50px] py-2.5 rounded-xl border text-center transition-all duration-150 font-bold text-sm ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30'
                                    : isInvalid
                                    ? 'bg-white border-red-300 text-slate-700 hover:border-red-500 hover:bg-red-50/50'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                }`}
                              >
                                {lvl}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between max-w-lg mt-2 text-[11px] text-slate-400">
                          <span>1: Hoàn toàn không đồng ý</span>
                          <span>5: Hoàn toàn đồng ý</span>
                        </div>
                      </div>
                    )}

                    {/* SINGLE CHOICE (Radio) */}
                    {q.questionType === 'SINGLE_CHOICE' && (
                      <Radio.Group
                        value={answers[q.id!]}
                        onChange={(e) => handleSingleChoiceChange(q.id!, e.target.value)}
                        className="space-y-2 w-full pt-1"
                      >
                        {q.options?.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                              isInvalid
                                ? 'border-red-200 bg-white hover:border-red-400'
                                : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/30'
                            }`}
                            onClick={() => handleSingleChoiceChange(q.id!, opt.content)}
                          >
                            <Radio value={opt.content} className="text-sm text-slate-700">
                              {opt.content}
                            </Radio>
                          </div>
                        ))}
                      </Radio.Group>
                    )}

                    {/* MULTIPLE CHOICE (Checkbox) */}
                    {q.questionType === 'MULTIPLE_CHOICE' && (
                      <Checkbox.Group
                        value={answers[q.id!] || []}
                        onChange={(vals) => handleMultiChoiceChange(q.id!, vals as string[])}
                        className="space-y-2 w-full pt-1"
                      >
                        {q.options?.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                              isInvalid
                                ? 'border-red-200 bg-white hover:border-red-400'
                                : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/30'
                            }`}
                          >
                            <Checkbox value={opt.content} className="text-sm text-slate-700">
                              {opt.content}
                            </Checkbox>
                          </div>
                        ))}
                      </Checkbox.Group>
                    )}

                    {/* SHORT TEXT */}
                    {q.questionType === 'SHORT_TEXT' && (
                      <Input
                        status={isInvalid ? 'error' : ''}
                        value={answers[q.id!] || ''}
                        onChange={(e) => handleTextChange(q.id!, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="rounded-xl text-sm"
                      />
                    )}

                    {/* LONG TEXT */}
                    {q.questionType === 'LONG_TEXT' && (
                      <TextArea
                        status={isInvalid ? 'error' : ''}
                        rows={3}
                        value={answers[q.id!] || ''}
                        onChange={(e) => handleTextChange(q.id!, e.target.value)}
                        placeholder="Nhập ý kiến đóng góp chi tiết..."
                        className="rounded-xl text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ))}

        {/* Submit Button Toolbar */}
        <div className="flex items-center justify-between pt-4 pb-12">
          <Button
            type="primary"
            size="large"
            icon={<Send className="w-5 h-5" />}
            onClick={handleSubmit}
            loading={submitting}
            className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-2xl text-base font-bold shadow-lg shadow-blue-500/25"
          >
            Gửi phiếu khảo sát
          </Button>

          <Button
            type="text"
            onClick={() => setAnswers({})}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Xóa hết câu trả lời
          </Button>
        </div>
      </div>
    </div>
  );
}
