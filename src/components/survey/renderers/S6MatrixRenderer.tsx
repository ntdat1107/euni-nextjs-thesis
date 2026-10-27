'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Spin, message } from 'antd';
import { programService } from '@/services/programService';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { S6CourseRow, S6PloGroup, S6RendererRef } from './s6/types';
import { S6KpiStrip } from './s6/S6KpiStrip';
import { S6MatrixTable } from './s6/S6MatrixTable';

interface S6MatrixRendererProps {
  step?: any;
  campaign?: any;
  readonly?: boolean;
  data?: any;
  onChange?: (data: any) => void;
}

export const S6MatrixRenderer = forwardRef<S6RendererRef, S6MatrixRendererProps>(({
  step,
  campaign: propCampaign,
  readonly = false,
  data,
  onChange,
}, ref) => {
  const params = useParams();
  const campaignId = (params?.id as string) || propCampaign?.id;

  const [loading, setLoading] = useState(false);
  const [isDeriving, setIsDeriving] = useState(false);
  const [programId, setProgramId] = useState<number | null>(null);
  const [rows, setRows] = useState<S6CourseRow[]>([]);
  const [ploGroups, setPloGroups] = useState<S6PloGroup[]>([]);
  const [uncoveredPiCodes, setUncoveredPiCodes] = useState<string[]>([]);

  // Load Program ID & OBE Matrix
  useEffect(() => {
    if (!campaignId) return;
    const init = async () => {
      try {
        setLoading(true);
        const camp = propCampaign || (await surveyCampaignService.getById(campaignId));
        const pId = camp?.programId || camp?.program?.id;
        if (!pId) return;
        setProgramId(pId);

        const obeData = await programService.getObeMatrix(pId);

        // 1. Locate Step 2 (S2_PLO) in current campaign to extract configured PLOs & PIs
        const s2Step = (camp?.steps || []).find((s: any) => {
          let sc = '';
          try {
            const parsedConfig = typeof s.configuration === 'string' ? JSON.parse(s.configuration) : s.configuration;
            sc = parsedConfig?.screenCode || parsedConfig?.stepCode || '';
          } catch (e) {}
          return sc === 'S2_PLO' || s.stepCode === 'S2_PLO' || s.stepIndex === 2;
        });

        let s2Plos: any[] | null = null;
        if (s2Step?.resultData) {
          try {
            const parsed = typeof s2Step.resultData === 'string' ? JSON.parse(s2Step.resultData) : s2Step.resultData;
            const candidate = parsed?.plos || parsed?.ploBuilder?.plos;
            if (Array.isArray(candidate) && candidate.length > 0) {
              s2Plos = candidate;
            }
          } catch (ignored) {}
        }

        let groups: S6PloGroup[] = [];

        if (s2Plos && s2Plos.length > 0) {
          // Use EXACT PLO and PI list configured in Step 2 of this campaign
          groups = s2Plos.map((plo: any, ploIdx: number) => {
            const ploCode = plo.code || `PLO${ploIdx + 1}`;
            const ploName = plo.content || plo.name || ploCode;
            const domain = plo.domain || 'KNOWLEDGE';

            // Match with DB PLO if available to preserve relational ID
            const dbPlo = (obeData.learningOutcomes || []).find(
              (p: any) => p.code === ploCode || p.id === plo.id
            );
            const ploId = dbPlo?.id || plo.id || (ploIdx + 1);

            const rawPis = Array.isArray(plo.pis) ? plo.pis : [];
            const indicators = rawPis.map((pi: any, piIdx: number) => {
              const piCode = pi.code || `PI${ploIdx + 1}.${piIdx + 1}`;
              const dbPi = (dbPlo?.indicators || []).find(
                (dpi: any) => dpi.code === piCode || dpi.id === pi.id
              );
              const piId = dbPi?.id || pi.id || piCode;

              return {
                piId,
                piCode,
                content: pi.content || dbPi?.content || '',
                bloomLevel: pi.bloomLevel || dbPi?.bloomLevel || 'APPLY',
              };
            });

            return {
              ploId,
              ploCode,
              ploName,
              domain,
              indicators,
            };
          });
        } else {
          // Fallback to base DB learning outcomes
          groups = (obeData.learningOutcomes || []).map((plo: any) => ({
            ploId: plo.id,
            ploCode: plo.code,
            ploName: plo.name || plo.content || plo.code,
            domain: plo.domain || 'KNOWLEDGE',
            indicators: (plo.indicators || []).map((pi: any) => ({
              piId: pi.id,
              piCode: pi.code,
              content: pi.content || '',
              bloomLevel: pi.bloomLevel || 'APPLY',
            })),
          }));
        }

        setPloGroups(groups);
        setUncoveredPiCodes(obeData.uncoveredPiCodes || []);

        // Initial rows from backend
        const stepMapping = data?.mapping || (step?.resultData ? (typeof step.resultData === 'string' ? JSON.parse(step.resultData)?.mapping : step.resultData?.mapping) : null);

        const courseRows: S6CourseRow[] = (obeData.courseMatrixRows || []).map((r: any) => {
          const cellsMap: Record<string | number, number> = {};
          (r.cells || []).forEach((c: any) => {
            cellsMap[c.piId] = c.level;
          });

          // Also map by piCode for indicators that have numeric piId matching DB
          groups.forEach(g => {
            g.indicators.forEach(ind => {
              if (typeof ind.piId === 'number' && cellsMap[ind.piId]) {
                cellsMap[ind.piCode] = cellsMap[ind.piId];
              }
            });
          });

          // Override from step resultData if available
          if (stepMapping && stepMapping[r.programCourseId]) {
            Object.assign(cellsMap, stepMapping[r.programCourseId]);
          }

          return {
            programCourseId: r.programCourseId,
            courseId: r.courseId,
            courseCode: r.courseCode,
            courseName: r.courseName,
            semester: r.semester,
            credits: r.credits,
            structureName: r.structureName,
            cells: cellsMap,
          };
        });
        setRows(courseRows);
      } catch (err) {
        console.error('Failed to load OBE matrix for Step 6', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [campaignId, propCampaign, data, step]);

  const handleCellChange = useCallback((programCourseId: number, piId: any, level: number) => {
    setRows(prevRows => {
      const updated = prevRows.map(r => {
        if (r.programCourseId !== programCourseId) return r;
        const newCells = { ...r.cells, [piId]: level };
        return { ...r, cells: newCells };
      });

      if (onChange) {
        const mapping: Record<string, Record<string, number>> = {};
        updated.forEach(r => {
          mapping[r.programCourseId] = r.cells;
        });
        onChange({ mapping });
      }
      return updated;
    });
  }, [onChange]);

  const handleAutoDerive = async () => {
    if (!programId) return;
    try {
      setIsDeriving(true);
      const res = await programService.autoDeriveMatrix(programId);
      message.success('Đã tính toán ma trận tự động từ Đề cương học phần (CLO)!');

      const updatedRows: S6CourseRow[] = (res.courseMatrixRows || []).map((r: any) => {
        const cellsMap: Record<string | number, number> = {};
        (r.cells || []).forEach((c: any) => {
          cellsMap[c.piId] = c.level;
        });
        return {
          programCourseId: r.programCourseId,
          courseId: r.courseId,
          courseCode: r.courseCode,
          courseName: r.courseName,
          semester: r.semester,
          credits: r.credits,
          structureName: r.structureName,
          cells: cellsMap,
        };
      });
      setRows(updatedRows);
      setUncoveredPiCodes(res.uncoveredPiCodes || []);

      if (onChange) {
        const mapping: Record<string, Record<string, number>> = {};
        updatedRows.forEach(r => {
          mapping[r.programCourseId] = r.cells;
        });
        onChange({ mapping });
      }
    } catch (e) {
      message.error('Lỗi khi tính toán tự động ma trận');
    } finally {
      setIsDeriving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const allPis = ploGroups.flatMap(p => p.indicators);
      const uncovered = allPis.filter(pi => !rows.some(r => (r.cells[pi.piId] || r.cells[pi.piCode] || 0) > 0));
      if (uncovered.length > 0) {
        message.error(`Ma trận chưa hoàn thành: Còn ${uncovered.length} chuẩn đầu ra PI chưa có môn học nào đảm nhiệm (vd: ${uncovered[0].piCode})`);
        return false;
      }
      return true;
    },
    saveMatrix: async () => {
      if (!programId) return true;
      try {
        const batchPayload = rows.map(r => ({
          programCourseId: r.programCourseId,
          mappings: Object.entries(r.cells)
            .filter(([piKey, level]) => Number(level) > 0 && !isNaN(Number(piKey)))
            .map(([piId, level]) => ({
              piId: Number(piId),
              level: Number(level),
            })),
        }));
        await programService.batchUpdateCoursePiMatrix(programId, batchPayload);
        return true;
      } catch (e) {
        message.error('Lỗi khi lưu ma trận');
        return false;
      }
    },
    getData: () => {
      const mapping: Record<string, Record<string, number>> = {};
      rows.forEach(r => {
        mapping[r.programCourseId] = r.cells;
      });
      return { mapping };
    },
  }));

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Spin tip="Đang tải dữ liệu ma trận chuẩn đầu ra..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <S6KpiStrip
        rows={rows}
        ploGroups={ploGroups}
        readonly={readonly}
        onAutoDerive={handleAutoDerive}
        isDeriving={isDeriving}
      />

      <S6MatrixTable
        rows={rows}
        ploGroups={ploGroups}
        readonly={readonly}
        onCellChange={handleCellChange}
      />
    </div>
  );
});

S6MatrixRenderer.displayName = 'S6MatrixRenderer';
export default S6MatrixRenderer;
