import { AiProvider } from '@/services/userAiService';

export interface AiParsedResult {
  rawHtml: string;
  mucTieuChung?: string;
  pos?: Array<{ code: string; content: string }>;
  peos?: string[];
  chuanDauRaChung?: string;
  plos?: Array<{
    code: string;
    domain: any;
    content: string;
    pis: Array<{ code: string; content: string }>;
  }>;
  cos?: Array<{
    code: string;
    domain: 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY';
    content: string;
  }>;
  clos?: Array<{
    code: string;
    content: string;
    bloomLevel?: string;
    masteryLevel?: string;
    mappedPlos?: string[];
  }>;
  courseDescription?: string;
  matrix?: boolean[][][];
  mappings?: Record<string, string[]>;
  isMatrixValid?: boolean;
  matrixErrorMessage?: string;
  facilitiesRequirements?: string;
  facilitiesJson?: any;
  materials?: any;
  chapters?: any;
  assessmentComponents?: any;
  surveyForm?: {
    title?: string;
    description?: string;
    targetAudience?: string;
    sections: Array<{
      title: string;
      description?: string;
      questions: Array<{
        content: string;
        helpText?: string;
        questionType: 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'LIKERT_SCALE';
        required: boolean;
        minRating?: number;
        maxRating?: number;
        options?: Array<{ content: string; orderIndex: number }>;
      }>;
    }>;
  };
}

export interface AiAssistantModalProps {
  open: boolean;
  onClose: () => void;
  contentType: 'PEO' | 'PO' | 'PLO' | 'CLO' | 'COURSE_DESCRIPTION' | 'SYLLABUS' | 'ASSESSMENT' | 'PO_PI_MATRIX' | 'S2_ALL' | 'GENERAL' | string;
  metadata?: Record<string, any>;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  quickPrompts?: string[];
  placeholder?: string;
  applyButtonText?: string;
  onApply: (result: AiParsedResult) => void;
}

export interface DisplayModelInfo {
  isByok: boolean;
  provider?: AiProvider | '';
  modelName: string;
  keyAlias?: string;
  source?: string;
  hasKey?: boolean;
}

export const SYSTEM_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Mới nhất', desc: 'Tốc độ cao, tư duy logic cải tiến' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Khuyên dùng', desc: 'Phản hồi tức thì, chuẩn AUN-QA' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Suy luận sâu', desc: 'Chuyên gia phân tích tài liệu dài' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'Tiết kiệm', desc: 'Gọn nhẹ, tiêu tốn ít quota' },
];
