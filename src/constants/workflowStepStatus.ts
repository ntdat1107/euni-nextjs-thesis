import React from 'react';
import { 
  Lock, 
  Clock, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';

export type WorkflowStepStatusType = 
  | 'LOCKED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'REJECTED'
  | 'COMPLETED';

export interface WorkflowStepStatusMeta {
  code: WorkflowStepStatusType;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

export const WORKFLOW_STEP_STATUS_MAP: Record<WorkflowStepStatusType, WorkflowStepStatusMeta> = {
  LOCKED: {
    code: 'LOCKED',
    label: 'Chưa mở',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-500',
    badgeBorder: 'border-slate-200',
    icon: Lock,
    description: 'Bị khóa do bước tiền đề chưa hoàn thành'
  },
  PENDING: {
    code: 'PENDING',
    label: 'Chưa bắt đầu',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    icon: Clock,
    description: 'Đã sẵn sàng nhưng chưa có dữ liệu thực hiện'
  },
  IN_PROGRESS: {
    code: 'IN_PROGRESS',
    label: 'Đang thực hiện',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
    badgeBorder: 'border-blue-200',
    icon: Edit3,
    description: 'Người thực hiện đang soạn thảo hoặc lưu nháp'
  },
  UNDER_REVIEW: {
    code: 'UNDER_REVIEW',
    label: 'Chờ duyệt',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    icon: Clock,
    description: 'Đã nộp kết quả, chờ người có thẩm quyền phê duyệt'
  },
  REJECTED: {
    code: 'REJECTED',
    label: 'Yêu cầu chỉnh sửa',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-600',
    badgeBorder: 'border-rose-200',
    icon: AlertTriangle,
    description: 'Bị từ chối hoặc yêu cầu chỉnh sửa, bổ sung'
  },
  COMPLETED: {
    code: 'COMPLETED',
    label: 'Hoàn thành',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    badgeBorder: 'border-emerald-200',
    icon: CheckCircle2,
    description: 'Bước đã hoàn thành và được phê duyệt'
  }
};

/**
 * Phân giải trạng thái hiển thị của một bước dựa trên tiến độ thực tế và ràng buộc tiên đề
 */
export function resolveStepStatus(step: any, allSteps: any[] = []): WorkflowStepStatusType {
  if (!step) return 'PENDING';

  const rawStatus = (step.status || '').toUpperCase();
  if (rawStatus === 'COMPLETED') {
    return 'COMPLETED';
  }

  // 1. Kiểm tra bước điều kiện tiên quyết (Prerequisites)
  let config = step.configuration;
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch {
      config = {};
    }
  }

  const prereqCodes: string[] = Array.isArray(config?.prerequisiteStepCodes) && config.prerequisiteStepCodes.length > 0
    ? config.prerequisiteStepCodes
    : (config?.prerequisiteStepCode ? [config.prerequisiteStepCode] : []);

  if (prereqCodes.length > 0 && allSteps.length > 0) {
    for (const prereqCode of prereqCodes) {
      const prereqStep = allSteps.find((s: any) => {
        let sCfg = s.configuration;
        if (typeof sCfg === 'string') {
          try {
            sCfg = JSON.parse(sCfg);
          } catch {
            sCfg = {};
          }
        }
        return sCfg?.screenCode === prereqCode || sCfg?.stepCode === prereqCode;
      });

      if (prereqStep && (prereqStep.status || '').toUpperCase() !== 'COMPLETED') {
        return 'LOCKED';
      }
    }
  }

  // 2. Nếu không bị khóa bởi tiền đề, dựa vào rawStatus
  if (rawStatus === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (rawStatus === 'REJECTED') return 'REJECTED';
  if (rawStatus === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (rawStatus === 'LOCKED') return 'LOCKED';

  // 3. Nếu là DRAFT / ACTIVE / PENDING, kiểm tra xem đã có dữ liệu thực tế hay chưa
  let hasData = false;
  const res = step.resultData;
  if (res) {
    if (typeof res === 'object') {
      hasData = Object.keys(res).length > 0;
    } else if (typeof res === 'string' && res.trim() !== '' && res.trim() !== '{}' && res.trim() !== '[]') {
      hasData = true;
    }
  }

  if (hasData) {
    return 'IN_PROGRESS';
  }

  return 'PENDING';
}

/**
 * Lấy lý do bước bị khóa dựa trên các bước tiền đề chưa hoàn thành
 */
export function getStepLockReason(step: any, allSteps: any[] = []): string | null {
  if (!step) return null;

  const rawStatus = (step.status || '').toUpperCase();
  if (rawStatus === 'COMPLETED') return null;

  let config = step.configuration;
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch {
      config = {};
    }
  }

  const prereqCodes: string[] = Array.isArray(config?.prerequisiteStepCodes) && config.prerequisiteStepCodes.length > 0
    ? config.prerequisiteStepCodes
    : (config?.prerequisiteStepCode ? [config.prerequisiteStepCode] : []);

  if (prereqCodes.length > 0 && allSteps.length > 0) {
    const incompletePrereqs: string[] = [];
    for (const prereqCode of prereqCodes) {
      const prereqStep = allSteps.find((s: any) => {
        let sCfg = s.configuration;
        if (typeof sCfg === 'string') {
          try {
            sCfg = JSON.parse(sCfg);
          } catch {
            sCfg = {};
          }
        }
        return sCfg?.screenCode === prereqCode || sCfg?.stepCode === prereqCode;
      });

      if (!prereqStep || (prereqStep.status || '').toUpperCase() !== 'COMPLETED') {
        incompletePrereqs.push(prereqStep?.stepName || prereqStep?.title || prereqCode);
      }
    }

    if (incompletePrereqs.length > 0) {
      return `Chưa mở: Cần hoàn thành bước "${incompletePrereqs.join('", "')}" trước khi thực hiện.`;
    }
  }

  if (rawStatus === 'LOCKED') {
    return 'Bước này hiện đang bị khóa trong quy trình.';
  }

  return null;
}

/**
 * Lấy nhãn và badge chi tiết theo nghiệp vụ thực tế từng loại bước (VD: Bước 1 khảo sát)
 */
export function getStepCustomBadge(step: any, allSteps: any[] = []): WorkflowStepStatusMeta {
  const resolvedCode = resolveStepStatus(step, allSteps);
  const baseMeta = WORKFLOW_STEP_STATUS_MAP[resolvedCode] || WORKFLOW_STEP_STATUS_MAP.PENDING;

  let config = step?.configuration;
  if (typeof config === 'string') {
    try { config = JSON.parse(config); } catch { config = {}; }
  }

  let resultData = step?.resultData;
  if (typeof resultData === 'string') {
    try { resultData = JSON.parse(resultData); } catch { resultData = {}; }
  }

  const screenCode = config?.screenCode || step?.screenCode;

  if (screenCode === 'S1_KHAO_SAT_NHU_CAU') {
    if (resolvedCode === 'PENDING') {
      return {
        ...baseMeta,
        label: 'Chưa bắt đầu thiết kế',
        description: 'Chưa có bản thiết kế biểu mẫu khảo sát nào được lưu'
      };
    }
    if (resolvedCode === 'UNDER_REVIEW') {
      return {
        ...baseMeta,
        label: 'Chờ duyệt thiết kế',
        description: 'Đã nộp bản thiết kế biểu mẫu khảo sát, chờ người có thẩm quyền phê duyệt'
      };
    }
    if (resolvedCode === 'REJECTED') {
      return {
        ...baseMeta,
        label: 'Yêu cầu sửa thiết kế',
        description: 'Thiết kế khảo sát bị từ chối hoặc yêu cầu điều chỉnh'
      };
    }
    if (resolvedCode === 'IN_PROGRESS') {
      if (resultData?.status === 'PUBLISHED') {
        const v = resultData?.currentVersion ? `v${resultData.currentVersion} • ` : '';
        const subs = resultData?.totalSubmissions != null ? `${resultData.totalSubmissions} phản hồi` : 'Đang mở';
        return {
          ...baseMeta,
          label: `Đang khảo sát (${v}${subs})`,
          badgeBg: 'bg-indigo-50',
          badgeText: 'text-indigo-700',
          badgeBorder: 'border-indigo-200',
          description: 'Khảo sát đang mở công khai tiếp nhận ý kiến'
        };
      }
      if (config?.designApproved) {
        return {
          ...baseMeta,
          label: 'Đã duyệt thiết kế',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          badgeBorder: 'border-emerald-200',
          description: 'Thiết kế biểu mẫu đã được phê duyệt, sẵn sàng xuất bản và tạo link khảo sát'
        };
      }
      return {
        ...baseMeta,
        label: 'Đang soạn thảo thiết kế'
      };
    }
  }

  return baseMeta;
}
