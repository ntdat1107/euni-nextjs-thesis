'use client';

import React from 'react';
import { Typography, Tag, Progress, Spin, Empty } from 'antd';
import { Users, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import {
  SurveySummary,
  SurveyForm,
  SurveyQuestionType,
} from '@/services/surveyFormService';
import { QUESTION_TYPE_CONFIG } from './constants';

const { Text } = Typography;

interface SurveySummaryTabProps {
  summary: SurveySummary | null;
  loadingAnalytics: boolean;
  formConfig: SurveyForm;
}

export const SurveySummaryTab = React.memo(function SurveySummaryTab({
  summary,
  loadingAnalytics,
  formConfig,
}: SurveySummaryTabProps) {
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Đang mở';
      case 'CLOSED':
        return 'Đã đóng link';
      case 'APPROVED':
        return 'Đã duyệt thiết kế';
      case 'PENDING_REVIEW':
        return 'Chờ duyệt';
      default:
        return 'Bản nháp';
    }
  };

  return (
    <div className="space-y-4 pt-1">
      {/* 3 Metric Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tổng phiếu phản hồi (v{formConfig.version})
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {summary?.totalSubmissions || formConfig.totalSubmissions || 0}
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Trạng thái phiên bản v{formConfig.version}
            </div>
            <div className="text-base font-bold text-slate-800 mt-1">
              {getStatusLabel(formConfig.status)}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Hồ sơ dữ liệu
            </div>
            <div className="mt-1">
              {(formConfig.totalSubmissions || 0) > 0 ? (
                <Tag color="green" className="rounded-md text-xs">
                  Đủ điều kiện phân tích
                </Tag>
              ) : (
                <Tag color="orange" className="rounded-md text-xs">
                  Chờ thu thập kết quả
                </Tag>
              )}
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Question Analytics Breakdown */}
      {loadingAnalytics ? (
        <div className="py-12 text-center">
          <Spin />
          <p className="mt-2 text-slate-400 text-xs">Đang tính toán số liệu thống kê...</p>
        </div>
      ) : summary?.questionStats && summary.questionStats.length > 0 ? (
        <div className="space-y-3">
          {summary.questionStats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs">
                  {idx + 1}. {stat.content}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    QUESTION_TYPE_CONFIG[stat.questionType as SurveyQuestionType]?.badgeCls ||
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {QUESTION_TYPE_CONFIG[stat.questionType as SurveyQuestionType]?.label || stat.questionType}
                </span>
              </div>

              {stat.questionType === 'LIKERT_SCALE' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-black text-blue-600">
                      {stat.averageScore != null ? stat.averageScore : '—'}
                      <span className="text-xs font-normal text-slate-400"> / 5.0</span>
                    </div>
                    <div className="flex-1">
                      <Progress
                        percent={stat.averageScore ? (stat.averageScore / 5) * 100 : 0}
                        showInfo={false}
                        strokeColor="#2563eb"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {Object.entries(stat.optionDistribution || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="text-center p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="text-[10px] text-slate-500">{key}</div>
                        <div className="font-bold text-xs text-slate-800 mt-0.5">{val} lượt</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(stat.questionType === 'SINGLE_CHOICE' || stat.questionType === 'MULTIPLE_CHOICE') && (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(stat.optionDistribution || {}).map(([opt, count]) => {
                    const total = summary.totalSubmissions || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>{opt}</span>
                          <span className="font-semibold">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <Progress percent={pct} size="small" strokeColor="#3b82f6" />
                      </div>
                    );
                  })}
                </div>
              )}

              {(stat.questionType === 'SHORT_TEXT' || stat.questionType === 'LONG_TEXT') && (
                <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                  {stat.textSamples && stat.textSamples.length > 0 ? (
                    stat.textSamples.map((text, tIdx) => (
                      <div
                        key={tIdx}
                        className="p-2 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-100"
                      >
                        &quot;{text}&quot;
                      </div>
                    ))
                  ) : (
                    <Text className="text-xs text-slate-400 italic">
                      Chưa có ý kiến phản hồi nào.
                    </Text>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty description="Chưa có dữ liệu phản hồi để hiển thị báo cáo cho phiên bản này" />
      )}
    </div>
  );
});
