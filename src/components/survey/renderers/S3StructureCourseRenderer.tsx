'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Table,
  Button,
  Card,
  Modal,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Tooltip,
  Tag,
  Tabs,
  Alert,
  Spin,
  App,
  Progress
} from 'antd';
import {
  Plus,
  Trash2,
  BookOpen,
  Layers,
  CheckCircle,
  AlertCircle,
  Save,
  Search,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ProgramStructure } from '@/types/academic';
import { programService } from '@/services/programService';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { useCourses } from '@/hooks/useCourses';
import ProgramStructureTree from '@/components/academic/ProgramStructureTree';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;

export interface ProgramCourseItem {
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  structureId?: number | null;
  structureName?: string | null;
  electiveGroupId?: number | null;
  electiveGroupName?: string | null;
  semester?: number;
  required?: boolean;
  data?: any;
}

interface S3StructureCourseRendererProps {
  step?: any;
  campaign?: any;
  readonly?: boolean;
  data?: any;
  onChange?: (data: any) => void;
}

export default function S3StructureCourseRenderer({
  step,
  campaign: propCampaign,
  readonly = false,
  data,
  onChange
}: S3StructureCourseRendererProps) {
  const params = useParams();
  const campaignId = (params?.id as string) || propCampaign?.id;
  const { message, modal } = App.useApp();

  const [campaign, setCampaign] = useState<any>(propCampaign || null);
  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<ProgramStructure[]>([]);
  const [programCourses, setProgramCourses] = useState<ProgramCourseItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('structure');

  // Course addition modal state
  const { courses = [], isLoading: loadingCourses } = useCourses();
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [selectedCoursesToAdd, setSelectedCoursesToAdd] = useState<(number | string)[]>([]);
  const [selectedStructureIdForAdd, setSelectedStructureIdForAdd] = useState<number | undefined>(undefined);
  const [addCourseSearchText, setAddCourseSearchText] = useState('');
  const [defaultSemesterForAdd, setDefaultSemesterForAdd] = useState<number>(1);
  const [defaultRequiredForAdd, setDefaultRequiredForAdd] = useState<boolean>(true);

  // Fetch campaign if not provided
  useEffect(() => {
    if (!campaign && campaignId) {
      surveyCampaignService.getById(campaignId)
        .then(res => setCampaign(res))
        .catch(err => console.error('Failed to load campaign in Step 3', err));
    }
  }, [campaign, campaignId]);

  const programId = campaign?.program?.id || campaign?.programId;
  const programTargetCredits = Number(campaign?.program?.totalCredits) || 130;

  // Load structures & courses from backend
  const loadData = useCallback(async () => {
    if (!programId) return;
    try {
      setLoading(true);
      const [structs, details] = await Promise.all([
        programService.getStructures(programId),
        programService.getCoursesDetail(programId)
      ]);

      setStructures(structs || []);

      const items: ProgramCourseItem[] = (details || []).map((d: any) => ({
        courseId: Number(d.courseId),
        courseCode: d.courseCode || '',
        courseName: d.courseName || '',
        credits: d.credits || 3,
        structureId: d.structureId ? Number(d.structureId) : null,
        structureName: d.structureName || null,
        electiveGroupId: d.electiveGroupId ? Number(d.electiveGroupId) : null,
        electiveGroupName: d.electiveGroupName || null,
        semester: d.semester || 1,
        required: d.required !== false,
        data: d.data || null,
      }));

      setProgramCourses(items);

      // Notify parent of current state snapshot
      if (onChange) {
        onChange({
          totalCredits: items.reduce((sum, i) => sum + (Number(i.credits) || 0), 0),
          totalCourses: items.length,
          structuresCount: structs?.length || 0,
          structures: structs,
          courses: items,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || 'Lỗi khi tải cấu trúc và môn học của CTĐT');
    } finally {
      setLoading(false);
    }
  }, [programId, message, onChange]);

  useEffect(() => {
    if (programId) {
      loadData();
    }
  }, [programId, loadData]);

  // Flatten structures tree helper
  const flatStructures = useMemo(() => {
    const result: { id: number; name: string; code: string; creditRequired: number; fullName: string }[] = [];
    const recurse = (list: ProgramStructure[], prefix = '') => {
      for (const s of list) {
        const displayName = prefix ? `${prefix} › ${s.name}` : s.name;
        result.push({
          id: s.id,
          name: s.name,
          code: s.code,
          creditRequired: s.creditRequired || 0,
          fullName: displayName
        });
        if (s.children && s.children.length > 0) {
          recurse(s.children, displayName);
        }
      }
    };
    recurse(structures);
    return result;
  }, [structures]);

  // Total allocated credits
  const totalCredits = useMemo(() => {
    return programCourses.reduce((sum, item) => sum + (Number(item.credits) || 0), 0);
  }, [programCourses]);

  // Save courses to backend
  const saveCoursesToBackend = async (newCourses: ProgramCourseItem[]) => {
    if (!programId) return;
    try {
      setIsSaving(true);
      const payload = {
        items: newCourses.map(i => ({
          courseId: i.courseId,
          structureId: i.structureId || null,
          electiveGroupId: i.electiveGroupId || null,
          semester: i.semester || 1,
          required: i.required !== false
        }))
      };
      await programService.assignCourses(programId, payload);
      setProgramCourses(newCourses);
      message.success('Cập nhật khung môn học thành công!');

      if (onChange) {
        onChange({
          totalCredits: newCourses.reduce((sum, i) => sum + (Number(i.credits) || 0), 0),
          totalCourses: newCourses.length,
          structuresCount: structures.length,
          structures: structures,
          courses: newCourses,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi lưu phân bổ môn học');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding courses from modal
  const handleAddCoursesConfirm = async () => {
    if (selectedCoursesToAdd.length === 0) {
      message.warning('Vui lòng chọn ít nhất một môn học!');
      return;
    }

    const targetStruct = flatStructures.find(s => s.id === selectedStructureIdForAdd);
    const newItems: ProgramCourseItem[] = selectedCoursesToAdd.map(cid => {
      const foundCourse = courses.find(c => c.id === cid);
      return {
        courseId: Number(cid),
        courseCode: foundCourse?.code || '',
        courseName: foundCourse?.name || '',
        credits: foundCourse?.credits || 3,
        structureId: selectedStructureIdForAdd || null,
        structureName: targetStruct ? targetStruct.name : null,
        electiveGroupId: null,
        electiveGroupName: null,
        semester: defaultSemesterForAdd || 1,
        required: defaultRequiredForAdd,
        data: null
      };
    });

    const updated = [...programCourses, ...newItems];
    await saveCoursesToBackend(updated);

    setIsAddCourseModalOpen(false);
    setSelectedCoursesToAdd([]);
    setAddCourseSearchText('');
  };

  // Remove a course
  const handleRemoveCourse = (courseId: number) => {
    modal.confirm({
      title: 'Xác nhận gỡ môn học',
      content: 'Bạn có chắc chắn muốn gỡ môn học này khỏi chương trình đào tạo?',
      okText: 'Gỡ môn',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        const updated = programCourses.filter(c => c.courseId !== courseId);
        saveCoursesToBackend(updated);
      }
    });
  };

  // Available courses filtering for modal
  const availableCourses = useMemo(() => {
    return courses.filter(c => !programCourses.some(pc => pc.courseId === c.id));
  }, [courses, programCourses]);

  const filteredAvailableCourses = useMemo(() => {
    if (!addCourseSearchText.trim()) return availableCourses;
    const q = addCourseSearchText.toLowerCase();
    return availableCourses.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [availableCourses, addCourseSearchText]);

  // Group courses by structure
  const groupedEntries = useMemo(() => {
    const structMap = new Map<number | 'ungrouped', ProgramCourseItem[]>();
    flatStructures.forEach(s => {
      structMap.set(s.id, []);
    });
    structMap.set('ungrouped', []);

    programCourses.forEach(item => {
      const sid = item.structureId;
      if (sid && structMap.has(sid)) {
        structMap.get(sid)!.push(item);
      } else {
        structMap.get('ungrouped')!.push(item);
      }
    });

    const result: {
      id: number | 'ungrouped';
      code?: string;
      name: string;
      fullName: string;
      creditRequired: number;
      items: ProgramCourseItem[];
      totalCredits: number;
    }[] = [];

    flatStructures.forEach(s => {
      const items = structMap.get(s.id) || [];
      result.push({
        id: s.id,
        code: s.code,
        name: s.name,
        fullName: s.fullName,
        creditRequired: s.creditRequired,
        items,
        totalCredits: items.reduce((sum, i) => sum + (Number(i.credits) || 0), 0)
      });
    });

    const ungroupedItems = structMap.get('ungrouped') || [];
    if (ungroupedItems.length > 0) {
      result.push({
        id: 'ungrouped',
        code: '',
        name: 'Học phần chưa phân khối kiến thức',
        fullName: 'Học phần chưa phân khối kiến thức (Cần gán khối theo TT 17)',
        creditRequired: 0,
        items: ungroupedItems,
        totalCredits: ungroupedItems.reduce((sum, i) => sum + (Number(i.credits) || 0), 0)
      });
    }

    return result;
  }, [flatStructures, programCourses]);

  if (loading && !campaign) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span className="text-xs text-slate-500 font-medium">Đang tải dữ liệu cấu trúc và môn học...</span>
      </div>
    );
  }

  const creditPercentage = Math.min(100, Math.round((totalCredits / (programTargetCredits || 130)) * 100));

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Dashboard Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-6 rounded-2xl border border-blue-100 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                <Layers className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight !mb-0">
                Xác định Cấu trúc &amp; Khối lượng kiến thức (TT 17/2021/TT-BGDĐT)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Xây dựng cây phân cấp khối kiến thức (Đại cương, Cơ sở ngành, Chuyên ngành,...) và phân bổ danh mục môn học tương ứng phục vụ mục tiêu chuẩn đầu ra CTĐT.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {readonly ? (
              <Tag color="blue" className="px-3 py-1 text-xs font-semibold rounded-lg border-none">
                Chế độ chỉ xem
              </Tag>
            ) : (
              <Tag color="green" className="px-3 py-1 text-xs font-semibold rounded-lg border-none flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Đang biên soạn
              </Tag>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-blue-100/80">
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Định mức tín chỉ</div>
            <div className="text-xl font-extrabold text-slate-800 mt-1">
              {totalCredits} <span className="text-xs font-normal text-slate-400">/ {programTargetCredits} TC</span>
            </div>
            <Progress percent={creditPercentage} size="small" status={creditPercentage >= 100 ? 'success' : 'active'} className="mt-1 !mb-0" />
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng số học phần</div>
            <div className="text-xl font-extrabold text-blue-700 mt-1">
              {programCourses.length} <span className="text-xs font-normal text-slate-400">môn</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {programCourses.filter(c => c.required).length} bắt buộc &bull; {programCourses.filter(c => !c.required).length} tự chọn
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Số khối kiến thức</div>
            <div className="text-xl font-extrabold text-purple-700 mt-1">
              {flatStructures.length} <span className="text-xs font-normal text-slate-400">khối</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {structures.length} nhóm gốc cấp 1
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tiến độ quy định</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">
              {creditPercentage >= 100 ? 'Đạt chuẩn' : `${creditPercentage}%`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalCredits >= programTargetCredits ? 'Đã đủ số tín chỉ' : `Cần thêm ${programTargetCredits - totalCredits} TC`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Tabs: Structure Tree vs Course Allocation */}
      <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white overflow-hidden p-0">
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          className="premium-tabs px-6 pt-4"
          items={[
            // TAB 1: CÂY CẤU TRÚC KHỐI KIẾN THỨC
            {
              key: 'structure',
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <Layers className="w-4 h-4 text-blue-600" />
                  1. Cây Cấu trúc Khối kiến thức (TT 17)
                </span>
              ),
              children: (
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">
                      {!readonly 
                        ? 'Nhấn các nút thao tác trên cây cấu trúc để Thêm khối, Sửa tên, Gán định mức tín chỉ hoặc Xóa khối.'
                        : 'Cấu trúc khối kiến thức đang ở chế độ xem.'}
                    </span>
                  </div>
                  {programId ? (
                    <ProgramStructureTree
                      programId={programId}
                      structures={structures}
                      onRefresh={loadData}
                      readOnly={readonly}
                      onNavigateToCourses={(structId) => {
                        setActiveTabKey('courses');
                        if (structId) {
                          setSelectedStructureIdForAdd(structId);
                        }
                      }}
                    />
                  ) : null}
                </div>
              )
            },

            // TAB 2: PHÂN BỔ MÔN HỌC THEO KHỐI
            {
              key: 'courses',
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  2. Phân bổ Môn học theo Khối kiến thức ({programCourses.length})
                </span>
              ),
              children: (
                <div className="py-4 space-y-6">
                  {/* Action Bar for Courses Tab */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Danh mục học phần trong CTĐT
                      </div>
                      <div className="text-xs text-slate-500">
                        Gán các học phần vào khối kiến thức tương ứng, thiết lập học kỳ và tính chất bắt buộc / tự chọn.
                      </div>
                    </div>

                    {!readonly && (
                      <div className="flex items-center gap-3">
                        <Button
                          type="primary"
                          icon={<Plus size={16} />}
                          onClick={() => {
                            setSelectedStructureIdForAdd(flatStructures[0]?.id || undefined);
                            setSelectedCoursesToAdd([]);
                            setAddCourseSearchText('');
                            setIsAddCourseModalOpen(true);
                          }}
                          className="rounded-xl h-10 px-5 font-semibold text-xs bg-blue-600 hover:bg-blue-700 shadow-md border-none flex items-center gap-1.5 cursor-pointer"
                        >
                          Thêm môn học vào CTĐT
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Empty State */}
                  {groupedEntries.length === 0 || programCourses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 space-y-3">
                      <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                      <div className="font-medium text-sm">Chưa có môn học nào được phân bổ vào chương trình</div>
                      {!readonly && (
                        <Button
                          type="primary"
                          icon={<Plus size={14} />}
                          onClick={() => {
                            setSelectedStructureIdForAdd(flatStructures[0]?.id || undefined);
                            setSelectedCoursesToAdd([]);
                            setAddCourseSearchText('');
                            setIsAddCourseModalOpen(true);
                          }}
                          className="rounded-xl bg-blue-600 text-xs cursor-pointer"
                        >
                          Thêm môn học ngay
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* Grouped Courses by Structure */
                    <div className="space-y-6">
                      {groupedEntries.map((groupEntry) => {
                        let runningIdx = 0;
                        const isUngrouped = groupEntry.id === 'ungrouped';
                        const req = groupEntry.creditRequired;
                        const cur = groupEntry.totalCredits;
                        const isMet = req > 0 && cur >= req;

                        return (
                          <div
                            key={String(groupEntry.id)}
                            className={cn(
                              "bg-white rounded-2xl border shadow-2xs overflow-hidden transition-all",
                              isUngrouped ? "border-amber-300/80 bg-amber-50/20" : "border-slate-200/90"
                            )}
                          >
                            {/* Group Header */}
                            <div className={cn(
                              "border-b px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                              isUngrouped ? "bg-amber-50/80 border-amber-200" : "bg-slate-50/90 border-slate-200/90"
                            )}>
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="flex items-center gap-2">
                                  {isUngrouped ? (
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  ) : (
                                    <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                                  )}
                                  <span className={cn(
                                    "font-bold text-sm tracking-tight",
                                    isUngrouped ? "text-amber-900" : "text-slate-900"
                                  )}>
                                    {groupEntry.fullName}
                                  </span>
                                </div>

                                {!isUngrouped && groupEntry.code && (
                                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                                    {groupEntry.code}
                                  </code>
                                )}

                                {!isUngrouped && (
                                  <div className="flex items-center gap-1.5 ml-1">
                                    <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                                      {groupEntry.items.length} môn học &bull; {cur} {req > 0 ? `/ ${req}` : ''} TC
                                    </span>
                                    {req > 0 && (
                                      isMet ? (
                                        <Tag color="success" className="font-bold text-[10px] rounded-full border-none">
                                          Đạt định mức ({cur}/{req} TC)
                                        </Tag>
                                      ) : (
                                        <Tag color="warning" className="font-bold text-[10px] rounded-full border-none">
                                          Thiếu {req - cur} TC
                                        </Tag>
                                      )
                                    )}
                                  </div>
                                )}

                                {isUngrouped && (
                                  <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    {groupEntry.items.length} môn học &bull; {cur} TC chưa xếp khối
                                  </span>
                                )}
                              </div>

                              {!readonly && !isUngrouped && (
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<Plus size={14} />}
                                  onClick={() => {
                                    setSelectedStructureIdForAdd(Number(groupEntry.id));
                                    setSelectedCoursesToAdd([]);
                                    setAddCourseSearchText('');
                                    setIsAddCourseModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1 p-0 cursor-pointer"
                                >
                                  Thêm môn vào khối này
                                </Button>
                              )}
                            </div>

                            {/* Group Table */}
                            {groupEntry.items.length === 0 ? (
                              <div className="py-6 text-center text-slate-400 text-xs italic bg-white">
                                Chưa có học phần nào được gán vào khối kiến thức này
                              </div>
                            ) : (
                              <Table
                                dataSource={groupEntry.items}
                                rowKey="courseId"
                                pagination={false}
                                size="small"
                                className="ant-table-custom"
                                columns={[
                                  {
                                    title: 'STT',
                                    key: 'stt',
                                    width: 60,
                                    align: 'center',
                                    render: () => {
                                      runningIdx += 1;
                                      return <span className="text-slate-400 font-bold text-xs">{runningIdx}</span>;
                                    }
                                  },
                                  {
                                    title: 'Mã HP',
                                    dataIndex: 'courseCode',
                                    key: 'courseCode',
                                    width: 120,
                                    render: (code) => (
                                      <code className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-bold text-xs font-mono border border-slate-200/60">
                                        {code}
                                      </code>
                                    )
                                  },
                                  {
                                    title: 'Tên học phần',
                                    dataIndex: 'courseName',
                                    key: 'courseName',
                                    render: (name) => <span className="font-bold text-slate-800 text-xs">{name}</span>
                                  },
                                  {
                                    title: 'Số tín chỉ',
                                    dataIndex: 'credits',
                                    key: 'credits',
                                    width: 90,
                                    align: 'center',
                                    render: (credits) => <span className="font-bold text-slate-700 text-xs">{credits || 3}</span>
                                  },
                                  {
                                    title: 'Học kỳ dự kiến',
                                    dataIndex: 'semester',
                                    key: 'semester',
                                    width: 120,
                                    align: 'center',
                                    render: (sem, record: ProgramCourseItem) => (
                                      !readonly ? (
                                        <Select
                                          value={record.semester || 1}
                                          size="small"
                                          className="w-24 text-xs"
                                          onChange={(val) => {
                                            const updated = programCourses.map(p =>
                                              p.courseId === record.courseId ? { ...p, semester: val } : p
                                            );
                                            saveCoursesToBackend(updated);
                                          }}
                                          options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({
                                            label: `Học kỳ ${s}`,
                                            value: s
                                          }))}
                                        />
                                      ) : (
                                        <span className="text-xs font-semibold text-slate-600">Học kỳ {sem || 1}</span>
                                      )
                                    )
                                  },
                                  {
                                    title: 'Tính chất',
                                    dataIndex: 'required',
                                    key: 'required',
                                    width: 120,
                                    align: 'center',
                                    render: (req, record: ProgramCourseItem) => (
                                      !readonly ? (
                                        <Select
                                          value={record.required !== false}
                                          size="small"
                                          className="w-28 text-xs"
                                          onChange={(val) => {
                                            const updated = programCourses.map(p =>
                                              p.courseId === record.courseId ? { ...p, required: val } : p
                                            );
                                            saveCoursesToBackend(updated);
                                          }}
                                          options={[
                                            { label: 'Bắt buộc', value: true },
                                            { label: 'Tự chọn', value: false }
                                          ]}
                                        />
                                      ) : (
                                        req !== false ? (
                                          <Tag color="blue" className="rounded-full text-[10px] font-bold border-none">
                                            Bắt buộc
                                          </Tag>
                                        ) : (
                                          <Tag color="orange" className="rounded-full text-[10px] font-bold border-none">
                                            Tự chọn
                                          </Tag>
                                        )
                                      )
                                    )
                                  },
                                  ...(!readonly ? [
                                    {
                                      title: 'Đổi Khối kiến thức',
                                      key: 'changeStructure',
                                      width: 240,
                                      render: (_: any, record: ProgramCourseItem) => (
                                        <Select
                                          value={record.structureId || undefined}
                                          placeholder="Chọn khối..."
                                          size="small"
                                          className="w-full text-xs"
                                          onChange={(newSid) => {
                                            const targetStruct = flatStructures.find(s => s.id === newSid);
                                            const updated = programCourses.map(p =>
                                              p.courseId === record.courseId
                                                ? { ...p, structureId: newSid || null, structureName: targetStruct ? targetStruct.name : null }
                                                : p
                                            );
                                            saveCoursesToBackend(updated);
                                          }}
                                          allowClear
                                        >
                                          {flatStructures.map(s => (
                                            <Select.Option key={s.id} value={s.id}>
                                              {s.fullName}
                                            </Select.Option>
                                          ))}
                                        </Select>
                                      )
                                    },
                                    {
                                      title: 'Thao tác',
                                      key: 'actions',
                                      width: 70,
                                      align: 'center' as const,
                                      render: (_: any, record: ProgramCourseItem) => (
                                        <Tooltip title="Gỡ môn khỏi CTĐT">
                                          <Button
                                            type="text"
                                            danger
                                            icon={<Trash2 size={15} />}
                                            onClick={() => handleRemoveCourse(record.courseId)}
                                            className="text-rose-500 hover:bg-rose-50 rounded-lg w-8 h-8 flex items-center justify-center mx-auto cursor-pointer"
                                          />
                                        </Tooltip>
                                      )
                                    }
                                  ] : [])
                                ]}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* 3. Add Course Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-base">Thêm Môn học vào Chương trình đào tạo</span>
          </div>
        }
        open={isAddCourseModalOpen}
        onCancel={() => {
          setIsAddCourseModalOpen(false);
          setSelectedCoursesToAdd([]);
          setAddCourseSearchText('');
        }}
        onOk={handleAddCoursesConfirm}
        okText={`Thêm ${selectedCoursesToAdd.length > 0 ? `(${selectedCoursesToAdd.length})` : ''} môn học`}
        cancelText="Hủy bỏ"
        width={820}
        centered
        okButtonProps={{ className: 'rounded-xl h-10 px-6 font-semibold bg-blue-600 hover:bg-blue-700 border-none cursor-pointer' }}
        cancelButtonProps={{ className: 'rounded-xl h-10 px-6 font-medium cursor-pointer' }}
      >
        <div className="py-3 space-y-4">
          {/* Target Structure Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Khối kiến thức phân bổ (TT 17/2021/TT-BGDĐT):
              </span>
              <Select
                placeholder="Chọn khối kiến thức để gán..."
                className="w-full rounded-xl"
                value={selectedStructureIdForAdd}
                onChange={setSelectedStructureIdForAdd}
                allowClear
              >
                {flatStructures.map(s => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.fullName} {s.creditRequired > 0 ? `(${s.creditRequired} TC)` : ''}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Học kỳ dự kiến:</span>
                <Select
                  value={defaultSemesterForAdd}
                  onChange={setDefaultSemesterForAdd}
                  className="w-full"
                  options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({
                    label: `Học kỳ ${s}`,
                    value: s
                  }))}
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Tính chất:</span>
                <Select
                  value={defaultRequiredForAdd}
                  onChange={setDefaultRequiredForAdd}
                  className="w-full"
                  options={[
                    { label: 'Bắt buộc', value: true },
                    { label: 'Tự chọn', value: false }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Search & List */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Danh sách môn học khả dụng ({availableCourses.length})
            </span>
            <Input.Search
              placeholder="Tìm theo mã hoặc tên môn học..."
              allowClear
              size="middle"
              className="w-72 text-xs"
              value={addCourseSearchText}
              onChange={(e) => setAddCourseSearchText(e.target.value)}
            />
          </div>

          <Table
            dataSource={filteredAvailableCourses}
            rowKey="id"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedCoursesToAdd,
              onChange: (selectedKeys) => setSelectedCoursesToAdd(selectedKeys as (number | string)[])
            }}
            pagination={{
              pageSize: 6,
              showSizeChanger: false,
              className: 'px-4 py-2'
            }}
            size="small"
            className="ant-table-custom border border-slate-200/80 rounded-xl overflow-hidden"
            columns={[
              {
                title: 'Mã HP',
                dataIndex: 'code',
                key: 'code',
                width: 120,
                render: (code) => <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-xs font-mono">{code}</code>
              },
              {
                title: 'Tên học phần',
                dataIndex: 'name',
                key: 'name',
                render: (name) => <span className="font-bold text-slate-800 text-xs">{name}</span>
              },
              {
                title: 'Số tín chỉ',
                dataIndex: 'credits',
                key: 'credits',
                width: 90,
                align: 'center',
                render: (tc) => <span className="font-semibold text-slate-700 text-xs">{tc || 3}</span>
              }
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
