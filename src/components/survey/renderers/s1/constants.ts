import { SurveyQuestionType } from '@/services/surveyFormService';

export const QUESTION_TYPE_CONFIG: Record<
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

export const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_CONFIG).map(
  ([value, cfg]) => ({
    value: value as SurveyQuestionType,
    label: cfg.label,
  })
);

export const cleanHtml = (text?: string) => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};
