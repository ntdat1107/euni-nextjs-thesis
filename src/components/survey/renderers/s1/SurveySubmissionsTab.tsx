'use client';

import React, { useMemo } from 'react';
import { Table, Button } from 'antd';
import { Eye } from 'lucide-react';
import { SurveySubmissionItem } from '@/services/surveyFormService';

interface SurveySubmissionsTabProps {
  submissions: SurveySubmissionItem[];
  onPreviewSubmission: (item: SurveySubmissionItem) => void;
}

export const SurveySubmissionsTab = React.memo(function SurveySubmissionsTab({
  submissions,
  onPreviewSubmission,
}: SurveySubmissionsTabProps) {
  const columns = useMemo(
    () => [
      {
        title: 'STT',
        key: 'index',
        width: 50,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: 'Người điền',
        dataIndex: 'respondentName',
        key: 'respondentName',
        render: (val: string, record: SurveySubmissionItem) => (
          <div>
            <div className="font-semibold text-slate-800 text-xs">{val || 'Khách ẩn danh'}</div>
            <div className="text-[11px] text-slate-400">{record.respondentEmail || 'N/A'}</div>
          </div>
        ),
      },
      {
        title: 'Cơ quan / Đơn vị',
        dataIndex: 'organization',
        key: 'organization',
        render: (val: string, record: SurveySubmissionItem) => (
          <div>
            <div className="text-xs text-slate-700">{val || 'Chưa ghi rõ'}</div>
            {record.position && <div className="text-[11px] text-slate-400">{record.position}</div>}
          </div>
        ),
      },
      {
        title: 'Thời gian',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        render: (val: string) => (
          <span className="text-xs text-slate-500">
            {val ? new Date(val).toLocaleString('vi-VN') : 'N/A'}
          </span>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 90,
        render: (_: any, record: SurveySubmissionItem) => (
          <Button
            size="small"
            icon={<Eye className="w-3 h-3" />}
            onClick={() => onPreviewSubmission(record)}
            className="rounded-md text-xs"
          >
            Xem
          </Button>
        ),
      },
    ],
    [onPreviewSubmission]
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs pt-1">
      <Table
        dataSource={submissions}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
        columns={columns}
      />
    </div>
  );
});
