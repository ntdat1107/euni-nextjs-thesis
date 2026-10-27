'use client';

import React from 'react';
import { Typography, Tag, Button, Tooltip, Space } from 'antd';
import {
  BookOpen,
  Layers,
  GitFork,
  HelpCircle,
  Edit,
  Save,
  Send,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { CourseSyllabusData } from './types';

const { Title, Text } = Typography;

interface S5HeaderMetaProps {
  data: CourseSyllabusData;
  isEditing: boolean;
  isSaving: boolean;
  canEditRole?: boolean;
  canApproveRole?: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onSubmitReview: () => void;
  onRecallReview: () => void;
  onRejectCourse: () => void;
  onApproveCourse: () => void;
  onReopenCourse?: () => void;
}

export const S5HeaderMeta: React.FC<S5HeaderMetaProps> = ({
  data,
  isEditing,
  isSaving,
  canEditRole = true,
  canApproveRole = false,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSubmitReview,
  onRecallReview,
  onRejectCourse,
  onApproveCourse,
  onReopenCourse,
}) => {
  // Course hours calculation based on Circular 17/2021/TT-BGDĐT
  const theoryCredits = data.theoryCredits ?? Math.round((data.credits * 2) / 3);
  const practiceCredits = data.practiceCredits ?? Math.max(0, data.credits - theoryCredits);
  const ltHours = data.lectureHours ?? (theoryCredits * 15);
  const thHours = data.practiceHours ?? (practiceCredits * 30);
  const tuHocHours = data.selfStudyHours ?? (data.credits * 30);

  const status = data.status || 'DRAFT';

  const renderStatusTag = () => {
    switch (status) {
      case 'COMPLETED':
      case 'READY':
      case 'APPROVED':
        return (
          <Tag color="success" className="rounded text-xs font-semibold px-2 py-0.5 m-0">
            Đã hoàn thành đề cương
          </Tag>
        );
      case 'UNDER_REVIEW':
      case 'PENDING_REVIEW':
        return (
          <Tag color="processing" className="rounded text-xs font-semibold px-2 py-0.5 m-0">
            Chờ thẩm định & phê duyệt
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tag color="error" className="rounded text-xs font-semibold px-2 py-0.5 m-0">
            Yêu cầu chỉnh sửa lại
          </Tag>
        );
      case 'IN_PROGRESS':
        return (
          <Tag color="warning" className="rounded text-xs font-semibold px-2 py-0.5 m-0">
            Bản nháp đang soạn
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="rounded text-xs font-medium px-2 py-0.5 text-slate-500 m-0">
            Chưa khởi tạo đề cương
          </Tag>
        );
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 p-4 space-y-3">
      {/* Rejection / Review note Alert */}
      {status === 'REJECTED' && data.reviewNote && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2 rounded text-xs flex items-start gap-2">
          <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Ý kiến yêu cầu chỉnh sửa từ người duyệt: </span>
            <span>{data.reviewNote}</span>
            {data.reviewedAt && (
              <span className="text-[11px] text-rose-500 ml-2 italic">({data.reviewedAt})</span>
            )}
          </div>
        </div>
      )}

      {/* Main Header Row: Title on Left, Action Buttons ALWAYS PINNED TOP-RIGHT */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Code, Name, Status, Credit Badge */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
              {data.courseCode}
            </span>
            <Title level={4} className="!mb-0 text-slate-800 font-bold text-base tracking-tight truncate">
              {data.courseName}
            </Title>
            {renderStatusTag()}
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              {data.credits} Tín chỉ
            </span>
          </div>
          {data.courseNameEn && (
            <Text className="text-xs text-slate-500 italic block">
              {data.courseNameEn}
            </Text>
          )}
        </div>

        {/* Right: Granular Course-level Action Buttons (Always pinned right) */}
        <div className="shrink-0 ml-auto flex items-center">
          {isEditing ? (
            <Space size="small">
              <Button
                onClick={onCancelEdit}
                disabled={isSaving}
                icon={<X size={13} />}
                className="rounded text-xs font-medium h-8 px-3"
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                onClick={onSave}
                loading={isSaving}
                icon={<Save size={13} />}
                className="rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-8 px-3 shadow-xs"
              >
                Lưu học phần
              </Button>
            </Space>
          ) : (
            <Space size="small">
              {/* 1. When in UNDER_REVIEW */}
              {(status === 'UNDER_REVIEW' || status === 'PENDING_REVIEW') ? (
                <>
                  {/* Maker can recall */}
                  {canEditRole && (
                    <Button
                      onClick={onRecallReview}
                      disabled={isSaving}
                      icon={<RotateCcw size={13} />}
                      className="rounded text-xs font-medium h-8 px-3 text-slate-700 border-slate-300 hover:text-blue-600 hover:border-blue-500"
                    >
                      Thu hồi yêu cầu duyệt
                    </Button>
                  )}
                  {/* Approver / Admin can reject or approve */}
                  {canApproveRole && (
                    <>
                      <Button
                        danger
                        onClick={onRejectCourse}
                        disabled={isSaving}
                        icon={<AlertTriangle size={13} />}
                        className="rounded text-xs font-semibold h-8 px-3 border-rose-300 text-rose-600 hover:bg-rose-50"
                      >
                        Yêu cầu sửa
                      </Button>
                      <Button
                        type="primary"
                        onClick={onApproveCourse}
                        disabled={isSaving}
                        icon={<CheckCircle2 size={13} />}
                        className="rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 h-8 px-3 shadow-xs"
                      >
                        Phê duyệt môn
                      </Button>
                    </>
                  )}
                </>
              ) : status === 'COMPLETED' || status === 'APPROVED' ? (
                /* 2. When COMPLETED: Approver can reopen if needed */
                canApproveRole && onReopenCourse && (
                  <Button
                    onClick={onReopenCourse}
                    disabled={isSaving}
                    icon={<RotateCcw size={13} />}
                    className="rounded text-xs font-medium h-8 px-3 border-slate-300 text-slate-700 hover:text-blue-600"
                  >
                    Mở lại để sửa
                  </Button>
                )
              ) : (
                /* 3. When DRAFT, IN_PROGRESS, or REJECTED */
                <>
                  {canEditRole && (
                    <Button
                      onClick={onStartEdit}
                      icon={<Edit size={13} />}
                      className="rounded text-xs font-semibold h-8 px-3 border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600"
                    >
                      {status === 'REJECTED' ? 'Chỉnh sửa lại' : 'Chỉnh sửa'}
                    </Button>
                  )}
                  {canEditRole && (
                    <Button
                      type="primary"
                      onClick={onSubmitReview}
                      disabled={isSaving}
                      icon={<Send size={13} />}
                      className="rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 h-8 px-3 shadow-xs"
                    >
                      Nộp phê duyệt
                    </Button>
                  )}
                </>
              )}
            </Space>
          )}
        </div>
      </div>

      {/* Secondary Meta Row: Department, Hours breakdown (with TT17 Tooltip), Prerequisites */}
      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen size={13} className="text-slate-400" />
          <span>Bộ môn: <strong>{data.department || 'Bộ môn phụ trách'}</strong></span>
        </div>

        <div className="h-3 w-px bg-slate-200" />

        {/* Hours Breakdown Badge with Tooltip */}
        <Tooltip
          title="Quy đổi theo Điều 3 Thông tư 17/2021/TT-BGDĐT: 1 TC Lý thuyết = 15 tiết; 1 TC Thực hành = 30 tiết; 1 TC yêu cầu tối thiểu 30 giờ chuẩn bị cá nhân (tự học)."
          placement="bottom"
        >
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2 py-0.5 rounded cursor-help transition-colors">
            <span>LT: {ltHours}h ({theoryCredits}TC) • TH: {thHours}h ({practiceCredits}TC) • Tự học: {tuHocHours}h</span>
            <HelpCircle size={11} className="text-slate-400" />
          </div>
        </Tooltip>

        {data.prerequisites && (
          <>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <GitFork size={13} className="text-amber-500" />
              <span>Tiên quyết: <strong className="text-amber-700">{data.prerequisites}</strong></span>
            </div>
          </>
        )}
        {data.corequisites && (
          <>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-blue-500" />
              <span>Song hành: <strong>{data.corequisites}</strong></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
