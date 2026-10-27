export const BLOOM_OPTIONS = [
  { label: 'L1 — Ghi nhớ (Remember)', value: '1' },
  { label: 'L2 — Thông hiểu (Understand)', value: '2' },
  { label: 'L3 — Vận dụng (Apply)', value: '3' },
  { label: 'L4 — Phân tích (Analyze)', value: '4' },
  { label: 'L5 — Đánh giá (Evaluate)', value: '5' },
  { label: 'L6 — Sáng tạo (Create)', value: '6' },
];

export const getBloomMeta = (level?: string) => {
  switch (level) {
    case '1':
      return { label: 'L1: Ghi nhớ', color: 'blue', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case '2':
      return { label: 'L2: Thông hiểu', color: 'cyan', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
    case '3':
      return { label: 'L3: Vận dụng', color: 'green', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case '4':
      return { label: 'L4: Phân tích', color: 'purple', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case '5':
      return { label: 'L5: Đánh giá', color: 'orange', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    case '6':
      return { label: 'L6: Sáng tạo', color: 'magenta', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: `L${level || 3}`, color: 'default', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export const CO_DOMAIN_OPTIONS = [
  { label: 'Kiến thức (Knowledge)', value: 'KNOWLEDGE', shortLabel: 'Kiến thức' },
  { label: 'Kỹ năng (Skill)', value: 'SKILL', shortLabel: 'Kỹ năng' },
  { label: 'Mức tự chủ & Trách nhiệm (Autonomy)', value: 'AUTONOMY', shortLabel: 'Tự chủ & Trách nhiệm' },
];

export const getCoDomainMeta = (domain?: string) => {
  switch (domain) {
    case 'KNOWLEDGE':
      return { label: 'Kiến thức', color: 'blue', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'SKILL':
      return { label: 'Kỹ năng', color: 'cyan', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'AUTONOMY':
      return { label: 'Tự chủ & Trách nhiệm', color: 'purple', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: 'Kiến thức', color: 'blue', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
};

export const MASTERY_OPTIONS = [
  { label: 'I — Giới thiệu (Introduce)', value: 'I' },
  { label: 'R — Củng cố (Reinforce)', value: 'R' },
  { label: 'M — Thành thạo (Master)', value: 'M' },
  { label: 'A — Đánh giá (Assess)', value: 'A' },
];

export const ASSESSMENT_METHODS = [
  { label: 'Chuyên cần / Tham gia', value: 'attendance' },
  { label: 'Bài tập / Tự học', value: 'assignment' },
  { label: 'Kiểm tra viết / Trắc nghiệm', value: 'written' },
  { label: 'Thực hành / Phòng Lab', value: 'lab' },
  { label: 'Tiểu luận / Đồ án môn', value: 'report' },
  { label: 'Thi vấn đáp', value: 'oral' },
  { label: 'Thi kết thúc học phần', value: 'final_exam' },
];

export const DEFAULT_ASSESSMENT_PRESET = [
  {
    name: 'Điểm chuyên cần',
    weight: 10,
    method: 'attendance',
    criteria: 'Số tiết tham dự học / tổng số tiết (tối thiểu 80% số tiết)',
    description: 'Đánh giá ý thức chuyên cần và tham gia trên lớp',
    mappedClos: ['CLO1'],
  },
  {
    name: 'Điểm tự học & bài tập',
    weight: 10,
    method: 'assignment',
    criteria: 'Làm phiếu chuẩn bị bài và hoàn thành bài tập được giao',
    description: 'Đánh giá tinh thần tự học và chuẩn bị trước bài giảng',
    mappedClos: ['CLO1', 'CLO2'],
  },
  {
    name: 'Điểm kiểm tra giữa kỳ',
    weight: 20,
    method: 'written',
    criteria: 'Thi viết tự luận / trắc nghiệm (45 - 60 phút)',
    description: 'Đánh giá mức độ nắm vững kiến thức nửa đầu học phần',
    mappedClos: ['CLO2', 'CLO3'],
  },
  {
    name: 'Điểm thi kết thúc học phần',
    weight: 60,
    method: 'final_exam',
    criteria: 'Thi viết (60 - 90 phút). Đạt điều kiện: tham dự ≥ 80% tiết lý thuyết',
    description: 'Đánh giá tổng hợp chuẩn đầu ra học phần',
    mappedClos: ['CLO1', 'CLO2', 'CLO3'],
  },
];

export const getDomainColor = (domain?: string) => {
  switch (domain) {
    case 'KNOWLEDGE':
      return { border: 'border-blue-200', bg: 'bg-blue-50/70', text: 'text-blue-800', headerBg: 'bg-blue-100/70' };
    case 'SKILL':
      return { border: 'border-sky-200', bg: 'bg-sky-50/70', text: 'text-sky-800', headerBg: 'bg-sky-100/70' };
    case 'AUTONOMY':
      return { border: 'border-purple-200', bg: 'bg-purple-50/70', text: 'text-purple-800', headerBg: 'bg-purple-100/70' };
    case 'ATTITUDE':
      return { border: 'border-amber-200', bg: 'bg-amber-50/70', text: 'text-amber-800', headerBg: 'bg-amber-100/70' };
    default:
      return { border: 'border-slate-200', bg: 'bg-slate-50/70', text: 'text-slate-800', headerBg: 'bg-slate-100/70' };
  }
};

export const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
