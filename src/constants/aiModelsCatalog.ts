import { AiProvider } from '@/services/userAiService';

export interface ModelDetail {
  id: string;
  name: string;
  badge?: string;
  badgeType?: 'recommend' | 'new' | 'reason' | 'fast' | 'default';
  description: string;
  contextWindow?: string;
}

export interface ProviderMeta {
  provider: AiProvider;
  name: string;
  company: string;
  tagline: string;
  accentColor: string;
  accentBg: string;
  badgeBorder: string;
  keyPrefix: string;
  models: ModelDetail[];
}

export const AI_PROVIDERS_CATALOG: Record<AiProvider, ProviderMeta> = {
  GEMINI: {
    provider: 'GEMINI',
    name: 'Google Gemini',
    company: 'Google DeepMind',
    tagline: 'Đa phương thái, tốc độ cao & ngữ cảnh lên đến 1M tokens',
    accentColor: '#1A73E8',
    accentBg: 'bg-blue-50/70',
    badgeBorder: 'border-blue-200 text-blue-700 bg-blue-50',
    keyPrefix: 'AIzaSy...',
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        badge: 'Mới nhất',
        badgeType: 'new',
        description: 'Tốc độ cực nhanh, tư duy logic cải tiến, cân bằng chi phí tốt nhất',
        contextWindow: '1M tokens',
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        badge: 'Khuyên dùng',
        badgeType: 'recommend',
        description: 'Phản hồi tức thì, tối ưu tuyệt vời cho sinh đề cương & ma trận CLO',
        contextWindow: '1M tokens',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        badge: 'Suy luận sâu',
        badgeType: 'reason',
        description: 'Chuyên gia phân tích tài liệu dài, rà soát CTĐT quy mô lớn',
        contextWindow: '2M tokens',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        badge: 'Tiết kiệm',
        badgeType: 'fast',
        description: 'Gọn nhẹ, tiêu tốn ít quota, phản hồi nhanh cho các tác vụ ngắn',
        contextWindow: '1M tokens',
      },
    ],
  },
  OPENAI: {
    provider: 'OPENAI',
    name: 'OpenAI GPT',
    company: 'OpenAI',
    tagline: 'Tiêu chuẩn ngành cho lập luận và xử lý ngôn ngữ tự nhiên',
    accentColor: '#10A37F',
    accentBg: 'bg-emerald-50/70',
    badgeBorder: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    keyPrefix: 'sk-proj-...',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o (Omni)',
        badge: 'Mạnh nhất',
        badgeType: 'recommend',
        description: 'Trí tuệ nhân tạo toàn diện hàng đầu, độ chính xác cao nhất',
        contextWindow: '128K tokens',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        badge: 'Nhanh & Rẻ',
        badgeType: 'fast',
        description: 'Gọn nhẹ, tốc độ cao, cực kỳ tiết kiệm chi phí cho tác vụ thường nhật',
        contextWindow: '128K tokens',
      },
      {
        id: 'o3-mini',
        name: 'o3-mini (Reasoning)',
        badge: 'Lập luận',
        badgeType: 'reason',
        description: 'Mô hình chuỗi tư duy (CoT), giải quyết bài toán cấu trúc phức tạp',
        contextWindow: '200K tokens',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        badge: 'Ổn định',
        badgeType: 'default',
        description: 'Độ tin cậy cao, kiến thức sâu rộng về học thuật',
        contextWindow: '128K tokens',
      },
    ],
  },
  ANTHROPIC: {
    provider: 'ANTHROPIC',
    name: 'Anthropic Claude',
    company: 'Anthropic',
    tagline: 'Văn phong học thuật chuẩn mực, tư duy hệ thống và an toàn vượt trội',
    accentColor: '#D97757',
    accentBg: 'bg-amber-50/70',
    badgeBorder: 'border-amber-200 text-amber-800 bg-amber-50',
    keyPrefix: 'sk-ant-api03-...',
    models: [
      {
        id: 'claude-3-7-sonnet',
        name: 'Claude 3.7 Sonnet',
        badge: 'Mới nhất',
        badgeType: 'new',
        description: 'Mô hình lai thế hệ mới với khả năng chuyển đổi chế độ suy luận',
        contextWindow: '200K tokens',
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        badge: 'Khuyên dùng',
        badgeType: 'recommend',
        description: 'Khả năng viết học thuật và phân tích cấu trúc chương trình tốt nhất',
        contextWindow: '200K tokens',
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        badge: 'Siêu tốc',
        badgeType: 'fast',
        description: 'Tốc độ phản hồi cực nhanh, phù hợp tóm tắt và sinh nhanh mô tả',
        contextWindow: '200K tokens',
      },
    ],
  },
  DEEPSEEK: {
    provider: 'DEEPSEEK',
    name: 'DeepSeek AI',
    company: 'DeepSeek',
    tagline: 'Hiệu năng mã nguồn mở vượt trội, tối ưu chi phí và lập luận sâu',
    accentColor: '#0066FF',
    accentBg: 'bg-sky-50/70',
    badgeBorder: 'border-sky-200 text-sky-700 bg-sky-50',
    keyPrefix: 'sk-...',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek-V3 (Chat)',
        badge: 'V3 Mới nhất',
        badgeType: 'recommend',
        description: 'Kiến trúc MoE 671B mạnh mẽ, viết văn phong tự nhiên, chi phí thấp',
        contextWindow: '64K tokens',
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek-R1 (Reasoner)',
        badge: 'R1 Suy luận',
        badgeType: 'reason',
        description: 'Mô hình suy luận chuyên sâu theo từng bước chuỗi tư duy',
        contextWindow: '64K tokens',
      },
    ],
  },
  CUSTOM: {
    provider: 'CUSTOM',
    name: 'Custom / Local LLM',
    company: 'Ollama / vLLM / On-Premise',
    tagline: 'Kết nối máy chủ AI nội bộ bảo mật tuyệt đối dữ liệu trong trường',
    accentColor: '#64748B',
    accentBg: 'bg-slate-50',
    badgeBorder: 'border-slate-200 text-slate-700 bg-slate-100',
    keyPrefix: 'Tuỳ chọn...',
    models: [
      {
        id: 'llama3.3',
        name: 'Meta Llama 3.3',
        badge: 'Meta 70B',
        badgeType: 'recommend',
        description: 'Mô hình mã nguồn mở hàng đầu, tối ưu triển khai on-premise',
        contextWindow: '128K tokens',
      },
      {
        id: 'qwen2.5',
        name: 'Qwen 2.5',
        badge: 'Đa ngữ',
        badgeType: 'default',
        description: 'Hỗ trợ tiếng Việt và tư duy toán học, lập trình xuất sắc',
        contextWindow: '128K tokens',
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek-R1 Distill',
        badge: 'Suy luận Local',
        badgeType: 'reason',
        description: 'Mô hình suy luận R1 đóng gói cục bộ qua Ollama',
        contextWindow: '64K tokens',
      },
    ],
  },
};

export interface TaskDefinition {
  type: string;
  name: string;
  category: string;
  recommendedModelId: string;
  recommendedProvider: AiProvider;
  note: string;
}

export const AI_TASK_DEFINITIONS: TaskDefinition[] = [
  {
    type: 'DEFAULT',
    name: 'Tác vụ chung (Mặc định)',
    category: 'Chung',
    recommendedModelId: 'gemini-2.0-flash',
    recommendedProvider: 'GEMINI',
    note: 'Áp dụng cho các hội thoại trợ lý, gợi ý chung và các tính năng chưa gán riêng',
  },
  {
    type: 'SYLLABUS',
    name: 'Đề cương chi tiết (Syllabus)',
    category: 'Đào tạo',
    recommendedModelId: 'claude-3-5-sonnet',
    recommendedProvider: 'ANTHROPIC',
    note: 'Soạn thảo mục tiêu học phần, nội dung các tuần học và tài liệu tham khảo',
  },
  {
    type: 'CLO',
    name: 'Chuẩn đầu ra học phần (CLO)',
    category: 'OBE',
    recommendedModelId: 'deepseek-reasoner',
    recommendedProvider: 'DEEPSEEK',
    note: 'Áp dụng Bloom Taxonomy, sinh ma trận ánh xạ CLO - PLO chặt chẽ',
  },
  {
    type: 'PEO',
    name: 'Mục tiêu chương trình (PEO)',
    category: 'OBE',
    recommendedModelId: 'gpt-4o',
    recommendedProvider: 'OPENAI',
    note: 'Định hình mục tiêu nghề nghiệp dài hạn của người học sau 3-5 năm tốt nghiệp',
  },
  {
    type: 'PLO',
    name: 'Chuẩn đầu ra chương trình (PLO)',
    category: 'OBE',
    recommendedModelId: 'gemini-1.5-pro',
    recommendedProvider: 'GEMINI',
    note: 'Xây dựng bộ chuẩn năng lực cốt lõi theo tiêu chuẩn kiểm định chất lượng',
  },
  {
    type: 'COURSE_DESCRIPTION',
    name: 'Mô tả tổng quan học phần',
    category: 'Đào tạo',
    recommendedModelId: 'gemini-2.5-flash',
    recommendedProvider: 'GEMINI',
    note: 'Tóm lược cô đọng vị trí, vai trò và kiến thức tiền đề của môn học',
  },
  {
    type: 'ASSESSMENT',
    name: 'Phương pháp đánh giá học phần',
    category: 'Đào tạo',
    recommendedModelId: 'gpt-4o-mini',
    recommendedProvider: 'OPENAI',
    note: 'Xây dựng rubric đánh giá quá trình và thi kết thúc học phần',
  },
];
