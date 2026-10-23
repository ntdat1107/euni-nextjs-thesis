'use client';

import React, { useState } from 'react';
import {
  Table,
  Tabs,
  Tag,
  Typography,
  Select,
  Alert,
  Tooltip,
  App,
  Spin,
  Button
} from 'antd';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  Grid,
  ListTree,
  Network
} from 'lucide-react';
import {
  ProgramObeMatrixData,
  PerformanceIndicator,
  ProgramLearningOutcome,
  ProgramObjective
} from '@/types/academic';
import { programService } from '@/services/programService';

const { Text, Title } = Typography;

interface ProgramObeTabsProps {
  programId: number;
  obeData: ProgramObeMatrixData | null;
  loading: boolean;
  onRefresh: () => void;
  readOnly?: boolean;
}

export default function ProgramObeTabs({
  programId,
  obeData,
  loading,
  onRefresh,
  readOnly = false
}: ProgramObeTabsProps) {
  const { message } = App.useApp();
  const [updatingMatrix, setUpdatingMatrix] = useState(false);

  if (loading || !obeData) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" tip="Đang tải dữ liệu chuẩn đầu ra OBE & Ma trận..." />
      </div>
    );
  }

  // Handle Level Change in Course-PI Matrix
  const handleMatrixCellChange = async (programCourseId: number, piId: number, level: number | null) => {
    try {
      setUpdatingMatrix(true);
      await programService.updateCoursePiMatrix(programId, {
        programCourseId,
        mappings: [{ piId, level }]
      });
      message.success('Cập nhật ma trận đóng góp thành công');
      onRefresh();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể lưu ma trận');
    } finally {
      setUpdatingMatrix(false);
    }
  };

  // Flatten all PIs across all PLOs for columns in Course-PI Matrix
  const allPis: { pi: PerformanceIndicator; plo: ProgramLearningOutcome }[] = [];
  obeData.learningOutcomes.forEach((plo) => {
    (plo.indicators || []).forEach((pi) => {
      allPis.push({ pi, plo });
    });
  });

  // Tab 1: Danh sách Phân cấp PO - PLO - PI
  const renderHierarchicalList = () => {
    return (
      <div className="space-y-4">
        {/* Objectives (PO) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <Title level={5} className="!mb-0 text-slate-800 text-sm">1. Mục tiêu Đào tạo (Program Objectives - PO)</Title>
            </div>
            <Tag color="blue" className="rounded-full px-2.5 py-0.5 border-none font-bold text-xs">
              {obeData.objectives.length} Mục tiêu
            </Tag>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {obeData.objectives.map((po) => (
              <div key={po.id} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70 space-y-1.5">
                <Tag color="cyan" className="font-mono font-bold text-xs rounded-md px-2 py-0.5">
                  {po.code}
                </Tag>
                <p className="text-slate-700 text-xs leading-relaxed font-medium">
                  {po.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Outcomes (PLO) & Performance Indicators (PI) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <Title level={5} className="!mb-0 text-slate-800 text-sm">2. Chuẩn đầu ra (PLO) &amp; Chỉ số thực hiện (PI)</Title>
            </div>
            <Tag color="green" className="rounded-full px-2.5 py-0.5 border-none font-bold text-xs">
              {obeData.learningOutcomes.length} PLO · {allPis.length} PI
            </Tag>
          </div>

          <div className="space-y-3">
            {obeData.learningOutcomes.map((plo) => (
              <div key={plo.id} className="rounded-xl border border-slate-200/70 p-3.5 bg-slate-50/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Tag color="blue" className="font-mono font-bold text-xs rounded-md px-2 py-0.5">
                      {plo.code}
                    </Tag>
                    <span className="font-bold text-slate-800 text-sm">{plo.name || plo.content}</span>
                  </div>
                  <Tag
                    color={
                      plo.domain === 'KNOWLEDGE'
                        ? 'blue'
                        : plo.domain === 'SKILL'
                        ? 'cyan'
                        : plo.domain === 'AUTONOMY'
                        ? 'purple'
                        : 'gold'
                    }
                    className="rounded-full font-semibold border-none text-[11px]"
                  >
                    {plo.domain === 'KNOWLEDGE'
                      ? 'Kiến thức'
                      : plo.domain === 'SKILL'
                      ? 'Kỹ năng'
                      : plo.domain === 'AUTONOMY'
                      ? 'Năng lực'
                      : 'Phẩm chất'}
                  </Tag>
                </div>

                <div className="text-slate-600 text-xs">
                  {plo.content}
                </div>

                {/* Sub-PIs */}
                <div className="pl-3 border-l-2 border-blue-200 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Chỉ số thực hiện cụ thể (PI):</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(plo.indicators || []).map((pi) => (
                      <div key={pi.id} className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-start gap-2">
                        <Tag color="purple" className="font-mono font-bold text-[11px] rounded px-1.5 shrink-0 mt-0.5">
                          {pi.code}
                        </Tag>
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed mb-0.5">{pi.content}</p>
                          {pi.bloomLevel && (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              Thang đo Bloom: {pi.bloomLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Tab 2: Ma trận PO <-> PI
  const renderPoPiMatrix = () => {
    const objPiSet = new Set(obeData.objectivePiMaps.map(m => `${m.objectiveId}_${m.piId}`));

    const columns = [
      {
        title: 'Chỉ số thực hiện (PI)',
        dataIndex: 'piCode',
        key: 'piCode',
        fixed: 'left' as const,
        width: 140,
        render: (_: any, record: any) => (
          <div>
            <Tag color="purple" className="font-mono font-bold">{record.pi.code}</Tag>
            <div className="text-[11px] text-slate-500 line-clamp-1">{record.plo.code}</div>
          </div>
        )
      },
      {
        title: 'Nội dung PI',
        dataIndex: 'piContent',
        key: 'piContent',
        width: 300,
        render: (_: any, record: any) => (
          <span className="text-xs text-slate-700 leading-snug">{record.pi.content}</span>
        )
      },
      ...obeData.objectives.map(po => ({
        title: (
          <div className="text-center">
            <Tag color="cyan" className="font-mono font-bold mx-0">{po.code}</Tag>
          </div>
        ),
        dataIndex: `po_${po.id}`,
        key: `po_${po.id}`,
        align: 'center' as const,
        width: 100,
        render: (_: any, record: any) => {
          const isMapped = objPiSet.has(`${po.id}_${record.pi.id}`);
          return isMapped ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
              ✓
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          );
        }
      }))
    ];

    const data = allPis.map(item => ({
      key: item.pi.id,
      pi: item.pi,
      plo: item.plo
    }));

    return (
      <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          scroll={{ x: 800 }}
          size="middle"
        />
      </div>
    );
  };

  // Tab 3: Ma trận đóng góp Học phần <-> PI (Course-PI Matrix)
  const renderCoursePiMatrix = () => {
    const columns: any[] = [
      {
        title: 'Mã HP',
        dataIndex: 'courseCode',
        key: 'courseCode',
        fixed: 'left' as const,
        width: 100,
        render: (code: string) => <Tag color="blue" className="font-mono font-bold">{code}</Tag>
      },
      {
        title: 'Tên Học phần',
        dataIndex: 'courseName',
        key: 'courseName',
        fixed: 'left' as const,
        width: 220,
        render: (name: string, record: any) => (
          <div>
            <div className="font-semibold text-slate-800 text-xs">{name}</div>
            <div className="text-[11px] text-slate-400">
              {record.credits} TC · HK {record.semester || 1} {record.structureName ? `· ${record.structureName}` : ''}
            </div>
          </div>
        )
      },
      ...allPis.map(({ pi }) => ({
        title: (
          <Tooltip title={pi.content}>
            <div className="text-center cursor-pointer">
              <span className="font-mono font-bold text-[11px] text-purple-700">{pi.code}</span>
            </div>
          </Tooltip>
        ),
        dataIndex: `pi_${pi.id}`,
        key: `pi_${pi.id}`,
        align: 'center' as const,
        width: 85,
        render: (_: any, record: any) => {
          const cell = record.cells.find((c: any) => c.piId === pi.id);
          const currentLevel = cell ? cell.level : 0;

          if (readOnly) {
            if (!currentLevel) return <span className="text-slate-300">-</span>;
            const levelLabel = currentLevel === 1 ? 'I' : currentLevel === 2 ? 'T' : 'U';
            const color = currentLevel === 1 ? 'blue' : currentLevel === 2 ? 'orange' : 'green';
            return <Tag color={color} className="font-bold text-xs">{levelLabel}</Tag>;
          }

          return (
            <Select
              size="small"
              value={currentLevel || 0}
              onChange={(val) => handleMatrixCellChange(record.programCourseId, pi.id, val > 0 ? val : null)}
              className="w-16 font-semibold"
              options={[
                { value: 0, label: '-' },
                { value: 1, label: '1 (I)' },
                { value: 2, label: '2 (T)' },
                { value: 3, label: '3 (U)' }
              ]}
            />
          );
        }
      }))
    ];

    return (
      <div className="space-y-4">
        {/* Coverage Alert - chỉ hiển thị cảnh báo khi còn PI chưa có học phần đảm nhiệm */}
        {obeData.uncoveredPiCodes && obeData.uncoveredPiCodes.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            message={<span className="font-bold text-amber-900">Cảnh báo độ phủ chuẩn đầu ra OBE</span>}
            description={
              <div className="text-xs text-amber-800 space-y-1 mt-1">
                <span>Còn <b>{obeData.uncoveredPiCodes.length}</b> Chỉ số thực hiện (PI) chưa có học phần nào đảm nhiệm: </span>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {obeData.uncoveredPiCodes.map((code) => (
                    <Tag key={code} color="error" className="font-mono font-bold text-xs">
                      {code}
                    </Tag>
                  ))}
                </div>
              </div>
            }
            className="rounded-2xl border-amber-200 bg-amber-50/70"
          />
        )}

        {/* Matrix Table */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Quy ước trọng số: <b>1 (I - Introduce)</b>: Giới thiệu · <b>2 (T - Teach)</b>: Giảng dạy / Phát triển · <b>3 (U - Utilize)</b>: Vận dụng / Thành thạo.
            </span>
            <Button size="small" onClick={onRefresh} loading={updatingMatrix}>
              Làm mới
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={obeData.courseMatrixRows}
            rowKey="programCourseId"
            pagination={false}
            scroll={{ x: 1200 }}
            size="small"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="py-2">
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: (
              <span className="flex items-center gap-2">
                <ListTree className="w-4 h-4" />
                Cấu trúc PO &amp; PLO &amp; PI
              </span>
            ),
            children: renderHierarchicalList()
          },
          {
            key: '2',
            label: (
              <span className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Ma trận PO ↔ PI
              </span>
            ),
            children: renderPoPiMatrix()
          },
          {
            key: '3',
            label: (
              <span className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                Ma trận Học phần ↔ PI
              </span>
            ),
            children: renderCoursePiMatrix()
          }
        ]}
      />
    </div>
  );
}
