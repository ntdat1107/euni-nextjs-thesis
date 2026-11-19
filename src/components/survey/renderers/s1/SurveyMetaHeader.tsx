'use client';

import React from 'react';
import { Switch, Button } from 'antd';
import { FileText, AlignLeft, Users, Sparkles } from 'lucide-react';
import { FastInput, FastTextArea } from './FastInputs';

interface SurveyMetaHeaderProps {
  title?: string;
  description?: string;
  targetAudience?: string;
  anonymous?: boolean;
  isFormLocked: boolean;
  onOpenAi?: () => void;
  onUpdateTitle: (val: string) => void;
  onUpdateTitleImmediate: (val: string) => void;
  onUpdateDescription: (val: string) => void;
  onUpdateDescriptionImmediate: (val: string) => void;
  onUpdateTargetAudience: (val: string) => void;
  onUpdateTargetAudienceImmediate: (val: string) => void;
  onUpdateAnonymous: (val: boolean) => void;
}

export const SurveyMetaHeader = React.memo(function SurveyMetaHeader({
  title = '',
  description = '',
  targetAudience = '',
  anonymous = false,
  isFormLocked,
  onOpenAi,
  onUpdateTitle,
  onUpdateTitleImmediate,
  onUpdateDescription,
  onUpdateDescriptionImmediate,
  onUpdateTargetAudience,
  onUpdateTargetAudienceImmediate,
  onUpdateAnonymous,
}: SurveyMetaHeaderProps) {
  return (
    <div className="bg-white border-t-4 border-blue-600 rounded-b-xl border-x border-b border-slate-200/90 p-5 shadow-xs space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Tên phiếu khảo sát <span className="text-red-500">*</span>
          </label>
          {!isFormLocked && onOpenAi && (
            <Button
              size="small"
              icon={<Sparkles size={13} className="text-indigo-600 animate-pulse" />}
              onClick={onOpenAi}
              className="bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md h-7 px-2.5 flex items-center gap-1 shadow-2xs"
            >
              Trợ lý AI gợi ý câu hỏi khảo sát
            </Button>
          )}
        </div>
        <FastInput
          value={title}
          disabled={isFormLocked}
          onImmediateChange={onUpdateTitleImmediate}
          onDebouncedChange={onUpdateTitle}
          placeholder="Nhập tên phiếu khảo sát (VD: Khảo sát Nhu cầu Đào tạo CTDT)..."
          className="text-base font-bold text-slate-800 rounded-lg px-3 py-2 border border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/40 focus:bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5 text-blue-600" />
          Mô tả & Hướng dẫn điền khảo sát
        </label>
        <FastTextArea
          rows={3}
          value={description}
          disabled={isFormLocked}
          onImmediateChange={onUpdateDescriptionImmediate}
          onDebouncedChange={onUpdateDescription}
          placeholder="Nhập lời mở đầu, mục đích thu thập ý kiến và hướng dẫn người tham gia..."
          className="text-xs text-slate-600 rounded-lg px-3 py-2 border border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/40 focus:bg-white resize-y"
        />
      </div>

      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Nhóm đối tượng khảo sát
          </label>
          <FastInput
            size="middle"
            value={targetAudience}
            disabled={isFormLocked}
            onImmediateChange={onUpdateTargetAudienceImmediate}
            onDebouncedChange={onUpdateTargetAudience}
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
            checked={anonymous}
            disabled={isFormLocked}
            onChange={onUpdateAnonymous}
          />
        </div>
      </div>
    </div>
  );
});
