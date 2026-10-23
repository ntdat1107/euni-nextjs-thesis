'use client';

import React from 'react';
import { Button } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import {
  SurveySection,
  SurveyQuestionType,
} from '@/services/surveyFormService';
import { FastInput } from './FastInputs';
import { SurveyQuestionItem } from './SurveyQuestionItem';

interface SurveySectionItemProps {
  section: SurveySection;
  sIdx: number;
  isFormLocked: boolean;
  onUpdateSectionTitle: (sIdx: number, val: string) => void;
  onUpdateSectionTitleImmediate: (sIdx: number, val: string) => void;
  onUpdateSectionDesc: (sIdx: number, val: string) => void;
  onUpdateSectionDescImmediate: (sIdx: number, val: string) => void;
  onRemoveSection: (sIdx: number) => void;
  onAddQuestion: (sIdx: number) => void;
  onUpdateQuestionContent: (sIdx: number, qIdx: number, val: string) => void;
  onUpdateQuestionContentImmediate: (sIdx: number, qIdx: number, val: string) => void;
  onChangeQuestionType: (sIdx: number, qIdx: number, val: SurveyQuestionType) => void;
  onRemoveQuestion: (sIdx: number, qIdx: number) => void;
  onAddOption: (sIdx: number, qIdx: number) => void;
  onUpdateOptionContent: (sIdx: number, qIdx: number, optIdx: number, val: string) => void;
  onUpdateOptionContentImmediate: (sIdx: number, qIdx: number, optIdx: number, val: string) => void;
  onRemoveOption: (sIdx: number, qIdx: number, optIdx: number) => void;
}

export const SurveySectionItem = React.memo(function SurveySectionItem({
  section,
  sIdx,
  isFormLocked,
  onUpdateSectionTitle,
  onUpdateSectionTitleImmediate,
  onUpdateSectionDesc,
  onUpdateSectionDescImmediate,
  onRemoveSection,
  onAddQuestion,
  onUpdateQuestionContent,
  onUpdateQuestionContentImmediate,
  onChangeQuestionType,
  onRemoveQuestion,
  onAddOption,
  onUpdateOptionContent,
  onUpdateOptionContentImmediate,
  onRemoveOption,
}: SurveySectionItemProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1">
          <span className="px-2.5 py-1 rounded-md bg-blue-100/70 text-blue-800 text-xs font-bold shrink-0">
            Phần {sIdx + 1}
          </span>
          <FastInput
            value={section.title}
            disabled={isFormLocked}
            onImmediateChange={(val) => onUpdateSectionTitleImmediate(sIdx, val)}
            onDebouncedChange={(val) => onUpdateSectionTitle(sIdx, val)}
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
            onClick={() => onRemoveSection(sIdx)}
            className="text-slate-400 hover:text-red-500 rounded-md"
          />
        )}
      </div>

      {/* Section Description */}
      <div>
        <FastInput
          value={section.description || ''}
          disabled={isFormLocked}
          onImmediateChange={(val) => onUpdateSectionDescImmediate(sIdx, val)}
          onDebouncedChange={(val) => onUpdateSectionDesc(sIdx, val)}
          placeholder="Mô tả bổ sung hoặc hướng dẫn thang đo cho phần này..."
          className="text-xs text-slate-600 border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 rounded-md px-2.5 py-1.5"
        />
      </div>

      {/* Questions in Section */}
      <div className="space-y-3 pt-1">
        {section.questions?.map((q, qIdx) => (
          <SurveyQuestionItem
            key={q.id ? String(q.id) : `q-${sIdx}-${qIdx}`}
            question={q}
            sIdx={sIdx}
            qIdx={qIdx}
            isFormLocked={isFormLocked}
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
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddQuestion(sIdx)}
            className="rounded-lg border-slate-300 text-slate-600 text-xs hover:border-blue-400 hover:text-blue-600 py-2 h-auto"
          >
            Thêm câu hỏi vào phần {sIdx + 1}
          </Button>
        )}
      </div>
    </div>
  );
});
