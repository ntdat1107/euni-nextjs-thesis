'use client';

import React from 'react';
import { Button, Select, Tag } from 'antd';
import {
  Trash2,
  CircleDot,
  CheckSquare,
  Plus,
} from 'lucide-react';
import {
  SurveyQuestion,
  SurveyQuestionType,
} from '@/services/surveyFormService';
import { QUESTION_TYPE_CONFIG, QUESTION_TYPE_OPTIONS } from './constants';
import { FastInput } from './FastInputs';

interface SurveyQuestionItemProps {
  question: SurveyQuestion;
  sIdx: number;
  qIdx: number;
  isFormLocked: boolean;
  onUpdateQuestionContent: (sIdx: number, qIdx: number, val: string) => void;
  onUpdateQuestionContentImmediate: (sIdx: number, qIdx: number, val: string) => void;
  onChangeQuestionType: (sIdx: number, qIdx: number, val: SurveyQuestionType) => void;
  onRemoveQuestion: (sIdx: number, qIdx: number) => void;
  onAddOption: (sIdx: number, qIdx: number) => void;
  onUpdateOptionContent: (sIdx: number, qIdx: number, optIdx: number, val: string) => void;
  onUpdateOptionContentImmediate: (sIdx: number, qIdx: number, optIdx: number, val: string) => void;
  onRemoveOption: (sIdx: number, qIdx: number, optIdx: number) => void;
}

export const SurveyQuestionItem = React.memo(function SurveyQuestionItem({
  question: q,
  sIdx,
  qIdx,
  isFormLocked,
  onUpdateQuestionContent,
  onUpdateQuestionContentImmediate,
  onChangeQuestionType,
  onRemoveQuestion,
  onAddOption,
  onUpdateOptionContent,
  onUpdateOptionContentImmediate,
  onRemoveOption,
}: SurveyQuestionItemProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-colors space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 shrink-0">
            Câu {qIdx + 1}
          </span>
          <FastInput
            value={q.content}
            disabled={isFormLocked}
            onImmediateChange={(val) => onUpdateQuestionContentImmediate(sIdx, qIdx, val)}
            onDebouncedChange={(val) => onUpdateQuestionContent(sIdx, qIdx, val)}
            placeholder="Nhập nội dung câu hỏi..."
            className="font-medium text-slate-800 text-xs rounded-lg border-slate-200 py-1.5"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isFormLocked ? (
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${
                QUESTION_TYPE_CONFIG[q.questionType]?.badgeCls ||
                'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {QUESTION_TYPE_CONFIG[q.questionType]?.label || q.questionType}
            </div>
          ) : (
            <Select
              value={q.questionType}
              onChange={(val) => onChangeQuestionType(sIdx, qIdx, val)}
              options={QUESTION_TYPE_OPTIONS}
              className="w-56 text-xs"
              size="middle"
            />
          )}

          {!isFormLocked && (
            <Button
              type="text"
              danger
              size="small"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => onRemoveQuestion(sIdx, qIdx)}
              className="text-slate-400 hover:text-red-500 rounded-md"
            />
          )}
        </div>
      </div>

      {/* Options for Choice types */}
      {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') && (
        <div className="pl-4 border-l-2 border-slate-200 space-y-2 pt-1">
          {q.options?.map((opt, optIdx) => (
            <div key={opt.id ? String(opt.id) : `opt-${optIdx}`} className="flex items-center gap-2">
              {q.questionType === 'SINGLE_CHOICE' ? (
                <CircleDot className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <FastInput
                size="small"
                value={opt.content}
                disabled={isFormLocked}
                onImmediateChange={(val) =>
                  onUpdateOptionContentImmediate(sIdx, qIdx, optIdx, val)
                }
                onDebouncedChange={(val) =>
                  onUpdateOptionContent(sIdx, qIdx, optIdx, val)
                }
                className="text-xs rounded-md border-slate-200"
                placeholder={`Tùy chọn ${optIdx + 1}...`}
              />
              {!isFormLocked && (q.options?.length || 0) > 1 && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 className="w-3 h-3" />}
                  onClick={() => onRemoveOption(sIdx, qIdx, optIdx)}
                  className="text-slate-300 hover:text-red-500 rounded-md p-1 h-auto"
                />
              )}
            </div>
          ))}

          {!isFormLocked && (
            <Button
              type="dashed"
              size="small"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => onAddOption(sIdx, qIdx)}
              className="text-xs rounded-md text-blue-600 hover:text-blue-700 border-blue-200 mt-1"
            >
              Thêm tùy chọn
            </Button>
          )}
        </div>
      )}

      {/* Likert Scale Display */}
      {q.questionType === 'LIKERT_SCALE' && (
        <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs text-blue-800">
          <span>Thang đo chuẩn 5 mức độ: 1: Rất không đồng ý → 5: Rất đồng ý</span>
          <Tag color="blue" className="rounded-md m-0 text-[11px]">1 đến 5 sao</Tag>
        </div>
      )}

      {/* Short / Long text placeholder */}
      {(q.questionType === 'SHORT_TEXT' || q.questionType === 'LONG_TEXT') && (
        <div className="p-2 rounded-lg bg-slate-100/60 text-xs text-slate-400 italic">
          [Vùng nhập câu trả lời của người tham gia khảo sát]
        </div>
      )}
    </div>
  );
});
