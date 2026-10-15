'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Button, Input, Select, Typography, Tag, Drawer, Empty, Spin, Modal, Checkbox,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  BookOpen, ChevronLeft, ChevronRight, CheckCircle2,
  GripVertical, AlertCircle, Trash2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { surveyCampaignService } from '@/services/surveyCampaignService';

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 min-h-[180px] text-sm">
      Đang tải bộ soạn thảo...
    </div>
  ),
});

const { Text, Title } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CLOItem {
  id: string;
  code: string;
  content: string;
  mappedPlos: string[];
  bloomLevel: string;
  masteryLevel: string;
}

export interface SyllabusTopic {
  id: string;
  title: string;
  lectureHours: number;
  practiceHours: number;
  selfStudyHours: number;
  mappedClos: string[];
}

export interface SyllabusChapter {
  id: string;
  title: string;
  topics: SyllabusTopic[];
}

export interface AssessmentComponent {
  id: string;
  name: string;
  weight: number;
  method: string;
  description: string;
  mappedClos: string[];
}

export interface MaterialItem {
  id: string;
  type: 'main' | 'reference';
  title: string;
  author: string;
  publisher: string;
  year: string;
  url?: string;
}

export interface SelfStudyGuide {
  id: string;
  chapterRef: string;
  content: string;
  materials: string;
}

export interface CourseSyllabusData {
  // Identifiers
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  // Tab 1 — Thông tin
  courseNameEn?: string;
  lectureHours?: number;
  practiceHours?: number;
  labHours?: number;
  selfStudyHours?: number;
  lecturers?: string;
  department?: string;
  faculty?: string;
  prerequisites?: string;
  corequisites?: string;
  // Tab 2 — Mục tiêu & CLO
  knowledgeObjective?: string;
  skillsObjective?: string;
  clos: CLOItem[];
  cloMappingMatrix?: Record<string, Record<string, boolean>>;
  councilReview?: string;
  // Tab 3 — Nội dung giảng dạy
  chapters?: SyllabusChapter[];
  syllabusHtml?: string;
  // Tab 4 — Đánh giá
  assessmentComponents?: AssessmentComponent[];
  assessmentMatrix?: Record<string, Record<string, boolean>>;
  // Tab 5 — Tài liệu & Tự học
  materials?: MaterialItem[];
  selfStudyGuides?: SelfStudyGuide[];
  // Meta
  updatedAt?: string;
  updatedBy?: string;
}

interface S5CLORendererProps {
  step?: any;
  readonly?: boolean;
  data?: Record<string, CourseSyllabusData>;
  onChange?: (data: any) => void;
  /** Called by page after successful save, to reset dirty state */
  onSaveSuccess?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOM_OPTIONS = [
  { label: 'L1 — Ghi nhớ (Remember)', value: '1' },
  { label: 'L2 — Thông hiểu (Understand)', value: '2' },
  { label: 'L3 — Vận dụng (Apply)', value: '3' },
  { label: 'L4 — Phân tích (Analyze)', value: '4' },
  { label: 'L5 — Đánh giá (Evaluate)', value: '5' },
  { label: 'L6 — Sáng tạo (Create)', value: '6' },
];

const MASTERY_OPTIONS = [
  { label: 'I — Giới thiệu', value: 'I' },
  { label: 'R — Củng cố', value: 'R' },
  { label: 'M — Thành thạo', value: 'M' },
  { label: 'A — Đánh giá', value: 'A' },
];

const ASSESSMENT_METHODS = [
  { label: 'Bài tập / Bài nộp', value: 'assignment' },
  { label: 'Kiểm tra viết', value: 'written' },
  { label: 'Thi vấn đáp', value: 'oral' },
  { label: 'Thực hành / Lab', value: 'lab' },
  { label: 'Tiểu luận / Báo cáo', value: 'report' },
  { label: 'Chuyên cần / Tham gia', value: 'attendance' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const defaultSyllabus = (courseId: string, code: string, name: string, credits: number): CourseSyllabusData => ({
  courseId, courseCode: code, courseName: name, credits,
  clos: [],
  chapters: [],
  assessmentComponents: [],
  materials: [],
  selfStudyGuides: [],
  cloMappingMatrix: {},
  assessmentMatrix: {},
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 mb-4">
      <Text strong className="text-slate-700 text-sm font-semibold">{title}</Text>
      {action}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{children}</Text>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const S5CLORenderer: React.FC<S5CLORendererProps> = ({
  step,
  readonly = false,
  data = {},
  onChange,
}) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params?.id as string;
  const courseIdParam = searchParams?.get('courseId') || '';

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseIdParam);
  const [availablePlos, setAvailablePlos] = useState<{ code: string; title: string }[]>([]);
  const [isPloDrawerOpen, setIsPloDrawerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [allSyllabusData, setAllSyllabusData] = useState<Record<string, CourseSyllabusData>>({});
  const [activeTab, setActiveTab] = useState<'info' | 'clo' | 'syllabus' | 'assessment' | 'materials'>('info');

  const isLocalChangeRef = React.useRef(false);

  // Normalize incoming data prop
  const normalizeData = (inputData: any): Record<string, CourseSyllabusData> => {
    if (!inputData || typeof inputData !== 'object') return {};
    if (inputData.courseId && typeof inputData.courseId === 'string') {
      return { [inputData.courseId]: inputData };
    }
    return inputData;
  };

  useEffect(() => {
    if (isLocalChangeRef.current) { isLocalChangeRef.current = false; return; }
    if (data && typeof data === 'object') {
      setAllSyllabusData(prev => ({ ...prev, ...normalizeData(data) }));
      setIsDirty(false);
    }
  }, [data]);

  // Load campaign context (PLOs + course list)
  useEffect(() => {
    if (!campaignId) return;
    const load = async () => {
      try {
        setLoading(true);
        const campaign = await surveyCampaignService.getById(campaignId);

        // Extract PLOs from S2/S3 step
        const ploStep = campaign?.steps?.find((s: any) => {
          const sc = typeof s.configuration === 'string'
            ? JSON.parse(s.configuration)?.screenCode
            : s.configuration?.screenCode;
          return sc === 'S2_PLO' || sc === 'S3_PLO';
        });

        if (ploStep) {
          const result = typeof ploStep.resultData === 'string'
            ? JSON.parse(ploStep.resultData)
            : (ploStep.resultData || {});
          const rawPlos = result?.plos || [];
          if (Array.isArray(rawPlos) && rawPlos.length > 0) {
            setAvailablePlos(rawPlos.map((p: any, idx: number) => ({
              code: p.code || p.id || `PLO${idx + 1}`,
              title: p.title || p.content || p.name || `Chuẩn đầu ra PLO ${idx + 1}`,
            })));
          } else {
            setAvailablePlos([
              { code: 'PLO1', title: 'Kiến thức cơ sở ngành và chuyên ngành' },
              { code: 'PLO2', title: 'Kỹ năng tư duy phản biện và giải quyết vấn đề' },
              { code: 'PLO3', title: 'Kỹ năng làm việc nhóm và giao tiếp chuyên nghiệp' },
              { code: 'PLO4', title: 'Năng lực thiết kế và triển khai giải pháp kỹ thuật' },
              { code: 'PLO5', title: 'Đạo đức nghề nghiệp và trách nhiệm xã hội' },
            ]);
          }
        }

        // Extract courses
        if (campaign?.courses && campaign.courses.length > 0) {
          const mapped = campaign.courses.map((c: any) => ({
            id: c.courseId,
            code: c.courseCode,
            name: c.courseName,
            credits: c.credits,
            status: c.status,
          }));
          setCourses(mapped);

          if (courseIdParam && mapped.some((c: any) => String(c.id) === String(courseIdParam))) {
            setSelectedCourseId(String(courseIdParam));
          } else if (!selectedCourseId && mapped.length > 0) {
            setSelectedCourseId(String(mapped[0].id));
          }
        }
      } catch (err) {
        console.error('[S5CLO] Load context error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaignId, courseIdParam]);

  // Load per-course detail on switch
  useEffect(() => {
    setIsDirty(false);
    if (!campaignId || !selectedCourseId) return;
    const fetchDetail = async () => {
      try {
        const detail = await surveyCampaignService.getCourseDetail(campaignId, selectedCourseId, step?.id);
        if (detail?.syllabusData) {
          const parsed = typeof detail.syllabusData === 'string'
            ? JSON.parse(detail.syllabusData)
            : detail.syllabusData;
          setAllSyllabusData(prev => ({
            ...prev,
            [selectedCourseId]: {
              courseId: String(selectedCourseId),
              courseCode: detail.courseCode,
              courseName: detail.courseName,
              credits: detail.credits,
              clos: [],
              chapters: [],
              assessmentComponents: [],
              materials: [],
              selfStudyGuides: [],
              cloMappingMatrix: {},
              assessmentMatrix: {},
              ...parsed,
              updatedAt: detail.updatedAt,
              updatedBy: detail.updatedBy,
            },
          }));
        }
      } catch (err) {
        console.error('[S5CLO] Fetch course detail error:', err);
      }
    };
    fetchDetail();
  }, [campaignId, selectedCourseId]);

  const currentCourse = courses.find(c => String(c.id) === String(selectedCourseId)) || (courses.length > 0 ? courses[0] : null);

  const currentSyllabus: CourseSyllabusData = (selectedCourseId && (allSyllabusData[selectedCourseId] || allSyllabusData[String(selectedCourseId)]))
    || defaultSyllabus(
      String(currentCourse?.id || selectedCourseId || ''),
      currentCourse?.code || '',
      currentCourse?.name || '',
      currentCourse?.credits || 3,
    );

  const updateSyllabus = useCallback((updated: Partial<CourseSyllabusData>) => {
    const targetId = selectedCourseId || currentCourse?.id;
    if (!targetId) return;
    isLocalChangeRef.current = true;
    const merged: CourseSyllabusData = {
      ...currentSyllabus,
      ...updated,
      courseId: targetId,
      courseCode: updated.courseCode || currentCourse?.code || '',
      courseName: updated.courseName || currentCourse?.name || '',
      credits: updated.credits ?? currentCourse?.credits ?? 3,
    };
    setAllSyllabusData(prev => ({ ...prev, [targetId]: merged }));
    setIsDirty(true);
    // Propagate to page so handleSave in page.tsx has latest data
    if (onChange) onChange(merged);
  }, [currentSyllabus, selectedCourseId, currentCourse, onChange]);

  // Expose selectedCourseId for page-level save
  const getSelectedCourseId = () => selectedCourseId;

  const handleCourseSwitch = (newId: string) => {
    if (isDirty) {
      Modal.confirm({
        title: 'Xác nhận chuyển môn học',
        icon: null,
        centered: true,
        width: 440,
        content: (
          <div className="py-2">
            <p className="text-slate-600 text-sm">
              Nội dung chỉnh sửa của <strong className="font-mono">[{currentCourse?.code}]</strong> chưa được lưu và sẽ bị hủy.
            </p>
          </div>
        ),
        okText: 'Tiếp tục chuyển',
        okButtonProps: { type: 'primary', danger: true, className: 'rounded-sm h-8 text-xs font-medium' },
        cancelText: 'Ở lại',
        cancelButtonProps: { className: 'rounded-sm h-8 text-xs font-medium' },
        onOk: () => { setIsDirty(false); setSelectedCourseId(newId); },
      });
    } else {
      setSelectedCourseId(newId);
    }
  };

  // Save is handled externally by page.tsx via onSave prop
  // Internal helper to reset dirty state after page saves successfully
  const resetDirty = () => setIsDirty(false);

  // ─── Tab 2: CLO helpers ────────────────────────────────────────────────────

  const addCLO = () => {
    const nextIdx = (currentSyllabus.clos?.length || 0) + 1;
    const newClo: CLOItem = {
      id: uid(),
      code: `CLO${nextIdx}`,
      content: '',
      mappedPlos: [],
      bloomLevel: '3',
      masteryLevel: 'I',
    };
    updateSyllabus({ clos: [...(currentSyllabus.clos || []), newClo] });
  };

  const removeCLO = (index: number) => {
    const targetClo = currentSyllabus.clos[index];
    const newClos = currentSyllabus.clos.filter((_, i) => i !== index);
    const newMatrix = { ...(currentSyllabus.cloMappingMatrix || {}) };
    if (targetClo?.id) delete newMatrix[targetClo.id];
    updateSyllabus({ clos: newClos, cloMappingMatrix: newMatrix });
  };

  const updateCLO = (index: number, field: keyof CLOItem, value: any) => {
    const newClos = [...currentSyllabus.clos];
    newClos[index] = { ...newClos[index], [field]: value };

    // Tự động đồng bộ với Ma trận CLO x PLO nếu sửa trường mappedPlos
    if (field === 'mappedPlos') {
      const cloId = newClos[index].id;
      const selectedPloCodes: string[] = value || [];
      const newMatrix = { ...(currentSyllabus.cloMappingMatrix || {}) };
      const cloRow: Record<string, boolean> = {};

      availablePlos.forEach(p => {
        cloRow[p.code] = selectedPloCodes.includes(p.code);
      });
      newMatrix[cloId] = cloRow;
      updateSyllabus({ clos: newClos, cloMappingMatrix: newMatrix });
    } else {
      updateSyllabus({ clos: newClos });
    }
  };

  const toggleCloMatrixCell = (cloId: string, ploCode: string) => {
    const matrix = { ...(currentSyllabus.cloMappingMatrix || {}) };
    if (!matrix[cloId]) matrix[cloId] = {};
    const newCheckedState = !matrix[cloId][ploCode];
    matrix[cloId] = { ...matrix[cloId], [ploCode]: newCheckedState };

    // Đồng bộ ngược lại thuộc tính mappedPlos của CLO tương ứng
    const newClos = (currentSyllabus.clos || []).map(clo => {
      if (clo.id === cloId) {
        const currentMapped = new Set(clo.mappedPlos || []);
        if (newCheckedState) {
          currentMapped.add(ploCode);
        } else {
          currentMapped.delete(ploCode);
        }
        return { ...clo, mappedPlos: Array.from(currentMapped) };
      }
      return clo;
    });

    updateSyllabus({ clos: newClos, cloMappingMatrix: matrix });
  };

  // ─── Tab 3: Chapter helpers ───────────────────────────────────────────────

  const addChapter = () => {
    const newChapter: SyllabusChapter = {
      id: uid(),
      title: `Chương ${(currentSyllabus.chapters?.length || 0) + 1}`,
      topics: [],
    };
    updateSyllabus({ chapters: [...(currentSyllabus.chapters || []), newChapter] });
  };

  const removeChapter = (chIdx: number) => {
    updateSyllabus({ chapters: currentSyllabus.chapters?.filter((_, i) => i !== chIdx) });
  };

  const updateChapter = (chIdx: number, field: keyof SyllabusChapter, value: any) => {
    const chs = [...(currentSyllabus.chapters || [])];
    chs[chIdx] = { ...chs[chIdx], [field]: value };
    updateSyllabus({ chapters: chs });
  };

  const addTopic = (chIdx: number) => {
    const chs = [...(currentSyllabus.chapters || [])];
    const newTopic: SyllabusTopic = {
      id: uid(), title: '', lectureHours: 1, practiceHours: 0, selfStudyHours: 0, mappedClos: [],
    };
    chs[chIdx] = { ...chs[chIdx], topics: [...(chs[chIdx].topics || []), newTopic] };
    updateSyllabus({ chapters: chs });
  };

  const removeTopic = (chIdx: number, tIdx: number) => {
    const chs = [...(currentSyllabus.chapters || [])];
    chs[chIdx] = { ...chs[chIdx], topics: chs[chIdx].topics.filter((_, i) => i !== tIdx) };
    updateSyllabus({ chapters: chs });
  };

  const updateTopic = (chIdx: number, tIdx: number, field: keyof SyllabusTopic, value: any) => {
    const chs = [...(currentSyllabus.chapters || [])];
    const topics = [...(chs[chIdx].topics || [])];
    topics[tIdx] = { ...topics[tIdx], [field]: value };
    chs[chIdx] = { ...chs[chIdx], topics };
    updateSyllabus({ chapters: chs });
  };

  // ─── Tab 4: Assessment helpers ────────────────────────────────────────────

  const addAssessmentComponent = () => {
    const comp: AssessmentComponent = {
      id: uid(), name: '', weight: 0, method: 'written', description: '', mappedClos: [],
    };
    updateSyllabus({ assessmentComponents: [...(currentSyllabus.assessmentComponents || []), comp] });
  };

  const removeAssessmentComponent = (idx: number) => {
    updateSyllabus({ assessmentComponents: currentSyllabus.assessmentComponents?.filter((_, i) => i !== idx) });
  };

  const updateAssessmentComponent = (idx: number, field: keyof AssessmentComponent, value: any) => {
    const comps = [...(currentSyllabus.assessmentComponents || [])];
    comps[idx] = { ...comps[idx], [field]: value };
    updateSyllabus({ assessmentComponents: comps });
  };

  const toggleAssessmentMatrix = (compId: string, cloId: string) => {
    const matrix = { ...(currentSyllabus.assessmentMatrix || {}) };
    if (!matrix[compId]) matrix[compId] = {};
    matrix[compId] = { ...matrix[compId], [cloId]: !matrix[compId][cloId] };
    updateSyllabus({ assessmentMatrix: matrix });
  };

  const totalWeight = (currentSyllabus.assessmentComponents || []).reduce((sum, c) => sum + (c.weight || 0), 0);

  // ─── Tab 5: Materials helpers ─────────────────────────────────────────────

  const addMaterial = (type: 'main' | 'reference') => {
    const m: MaterialItem = { id: uid(), type, title: '', author: '', publisher: '', year: '', url: '' };
    updateSyllabus({ materials: [...(currentSyllabus.materials || []), m] });
  };

  const removeMaterial = (idx: number) => {
    updateSyllabus({ materials: currentSyllabus.materials?.filter((_, i) => i !== idx) });
  };

  const updateMaterial = (idx: number, field: keyof MaterialItem, value: any) => {
    const mats = [...(currentSyllabus.materials || [])];
    mats[idx] = { ...mats[idx], [field]: value };
    updateSyllabus({ materials: mats });
  };

  const addSelfStudyGuide = () => {
    const g: SelfStudyGuide = { id: uid(), chapterRef: '', content: '', materials: '' };
    updateSyllabus({ selfStudyGuides: [...(currentSyllabus.selfStudyGuides || []), g] });
  };

  const removeSelfStudyGuide = (idx: number) => {
    updateSyllabus({ selfStudyGuides: currentSyllabus.selfStudyGuides?.filter((_, i) => i !== idx) });
  };

  const updateSelfStudyGuide = (idx: number, field: keyof SelfStudyGuide, value: any) => {
    const guides = [...(currentSyllabus.selfStudyGuides || [])];
    guides[idx] = { ...guides[idx], [field]: value };
    updateSyllabus({ selfStudyGuides: guides });
  };

  // ─── CLO options for dropdowns in Tab 3 & 4 ──────────────────────────────

  const cloOptions = (currentSyllabus.clos || []).map(c => ({
    label: `${c.code}: ${c.content.slice(0, 60)}${c.content.length > 60 ? '…' : ''}`,
    value: c.id,
  }));

  // isReadonlySection mirrors the readonly prop passed from page.tsx
  // page.tsx controls edit mode via isEdit state → passes readonly={!isEdit}
  const isReadonlySection = readonly;

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Spin size="large" />
        <Text className="block text-slate-400 font-medium">Đang tải cấu trúc môn học và chuẩn đầu ra...</Text>
      </div>
    );
  }

  // ─── Tab Renderers ─────────────────────────────────────────────────────────

  const renderTabInfo = () => (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0 space-y-6">
      <SectionHeader title="Thông tin cơ bản" />
      <div className="grid grid-cols-2 gap-5">
        <div>
          <FieldLabel>Mã học phần</FieldLabel>
          <Tag color="blue" className="font-mono font-bold text-sm px-3 py-0.5">{currentCourse?.code || '—'}</Tag>
        </div>
        <div>
          <FieldLabel>Số tín chỉ</FieldLabel>
          <Text strong className="text-slate-800">{currentCourse?.credits || 3} Tín chỉ</Text>
        </div>
        <div>
          <FieldLabel>Tên học phần (Tiếng Việt)</FieldLabel>
          <Text strong className="text-slate-800">{currentCourse?.name || '—'}</Text>
        </div>
        <div>
          <FieldLabel>Tên học phần (Tiếng Anh)</FieldLabel>
          <Input
            value={currentSyllabus.courseNameEn || ''}
            disabled={isReadonlySection}
            placeholder="Nhập tên tiếng Anh..."
            className="rounded-lg"
            onChange={e => updateSyllabus({ courseNameEn: e.target.value })}
          />
        </div>
      </div>

      <SectionHeader title="Phân bổ số tiết" />
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Lý thuyết', key: 'lectureHours' },
          { label: 'Bài tập', key: 'practiceHours' },
          { label: 'Thực tập / Lab', key: 'labHours' },
          { label: 'Tự học', key: 'selfStudyHours' },
        ].map(f => (
          <div key={f.key}>
            <FieldLabel>{f.label}</FieldLabel>
            <Input
              type="number"
              min={0}
              value={(currentSyllabus as any)[f.key] ?? ''}
              disabled={isReadonlySection}
              placeholder="0"
              className="rounded-lg text-center"
              onChange={e => updateSyllabus({ [f.key]: parseInt(e.target.value) || 0 })}
            />
          </div>
        ))}
      </div>

      <SectionHeader title="Đơn vị quản lý" />
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Giảng viên giảng dạy', key: 'lecturers', placeholder: 'Nhập tên giảng viên...' },
          { label: 'Bộ môn', key: 'department', placeholder: 'Nhập bộ môn...' },
          { label: 'Khoa quản lý', key: 'faculty', placeholder: 'Nhập khoa...' },
        ].map(f => (
          <div key={f.key}>
            <FieldLabel>{f.label}</FieldLabel>
            <Input
              value={(currentSyllabus as any)[f.key] || ''}
              disabled={isReadonlySection}
              placeholder={f.placeholder}
              className="rounded-lg"
              onChange={e => updateSyllabus({ [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <SectionHeader title="Điều kiện học tập" />
      <div className="grid grid-cols-2 gap-5">
        <div>
          <FieldLabel>Môn tiên quyết</FieldLabel>
          <Input
            value={currentSyllabus.prerequisites || ''}
            disabled={isReadonlySection}
            placeholder="VD: IT001 - Nhập môn Lập trình"
            className="rounded-lg"
            onChange={e => updateSyllabus({ prerequisites: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Môn học trước</FieldLabel>
          <Input
            value={currentSyllabus.corequisites || ''}
            disabled={isReadonlySection}
            placeholder="VD: IT002 - Kỹ thuật lập trình"
            className="rounded-lg"
            onChange={e => updateSyllabus({ corequisites: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderTabCLO = () => {
    const clos = currentSyllabus.clos || [];
    const matrix = currentSyllabus.cloMappingMatrix || {};

    return (
      <div className="space-y-4">
        {/* Phần 1: Mục tiêu học phần */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <SectionHeader title="Phần 1 — Mục tiêu học phần" />
          <div className="space-y-5">
            <div>
              <FieldLabel>Kiến thức (Knowledge)</FieldLabel>
              <RichtextEditor
                value={currentSyllabus.knowledgeObjective || ''}
                disabled={isReadonlySection}
                contentType="CLO"
                metadata={{
                  'Tên học phần': currentCourse?.name,
                  'Mã học phần': currentCourse?.code,
                  'Số tín chỉ': currentCourse?.credits,
                  'Môn tiên quyết': currentSyllabus.prerequisites,
                  'Môn học trước': currentSyllabus.corequisites
                }}
                onChange={val => updateSyllabus({ knowledgeObjective: val })}
                placeholder="Trình bày những kiến thức sinh viên tích lũy được sau khi hoàn thành môn học..."
              />
            </div>
            <div>
              <FieldLabel>Kỹ năng (Skills)</FieldLabel>
              <RichtextEditor
                value={currentSyllabus.skillsObjective || ''}
                disabled={isReadonlySection}
                contentType="CLO"
                metadata={{
                  'Tên học phần': currentCourse?.name,
                  'Mã học phần': currentCourse?.code,
                  'Số tín chỉ': currentCourse?.credits,
                  'Môn tiên quyết': currentSyllabus.prerequisites,
                  'Môn học trước': currentSyllabus.corequisites
                }}
                onChange={val => updateSyllabus({ skillsObjective: val })}
                placeholder="Trình bày các kỹ năng cứng và mềm sinh viên đạt được..."
              />
            </div>
          </div>
        </div>

        {/* Phần 2: CLO Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <SectionHeader title="Phần 2 — Chuẩn đầu ra môn học (CLO)" />

          {clos.length === 0 ? (
            <Empty description="Chưa có CLO nào. Bấm «Thêm CLO Card» ở dưới để bắt đầu." imageStyle={{ height: 48 }} />
          ) : (
            <div className="space-y-3">
              {clos.map((clo, index) => (
                <div
                  key={clo.id || index}
                  className="group p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-blue-300 transition-colors"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between flex-nowrap">
                    <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                      <Input
                        value={clo.code}
                        disabled={isReadonlySection}
                        onChange={e => updateCLO(index, 'code', e.target.value)}
                        className="w-20 font-bold text-blue-700 font-mono text-center rounded-lg text-sm h-7 flex-shrink-0"
                      />
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">Card #{index + 1}</span>
                    </div>
                    {!isReadonlySection && (
                      <button onClick={() => removeCLO(index)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <FieldLabel>Mô tả chuẩn đầu ra</FieldLabel>
                    <Input.TextArea
                      value={clo.content}
                      disabled={isReadonlySection}
                      placeholder="Mô tả chi tiết sinh viên cần đạt được sau khi học xong..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      onChange={e => updateCLO(index, 'content', e.target.value)}
                      className="rounded-lg text-sm"
                    />
                  </div>

                  {/* Bloom + Mastery + PLO */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <FieldLabel>Thang Bloom</FieldLabel>
                      <Select
                        value={clo.bloomLevel || '3'}
                        disabled={isReadonlySection}
                        className="w-full"
                        size="small"
                        onChange={val => updateCLO(index, 'bloomLevel', val)}
                        options={BLOOM_OPTIONS}
                      />
                    </div>
                    <div>
                      <FieldLabel>Mức độ đạt</FieldLabel>
                      <Select
                        value={clo.masteryLevel || 'I'}
                        disabled={isReadonlySection}
                        className="w-full"
                        size="small"
                        onChange={val => updateCLO(index, 'masteryLevel', val)}
                        options={MASTERY_OPTIONS}
                      />
                    </div>
                    <div>
                      <FieldLabel>Ánh xạ PLO</FieldLabel>
                      <Select
                        mode="multiple"
                        value={clo.mappedPlos || []}
                        disabled={isReadonlySection}
                        className="w-full"
                        size="small"
                        placeholder="Chọn PLO..."
                        onChange={val => updateCLO(index, 'mappedPlos', val)}
                        options={availablePlos.map(p => ({ label: p.code, value: p.code }))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isReadonlySection && (
            <div className="mt-4 pt-2">
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={addCLO}
                className="text-blue-600 hover:text-blue-700 font-semibold p-0 cursor-pointer"
              >
                Thêm CLO Card
              </Button>
            </div>
          )}
        </div>

        {/* Phần 3: Ma trận CLO × PLO */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <div className="flex items-center justify-between py-3 border-b border-slate-100 mb-4">
            <Text strong className="text-slate-700 text-sm font-semibold">
              Phần 3 — Ma trận ánh xạ CLO × PLO (CTĐT)
            </Text>
            <button
              onClick={() => setIsPloDrawerOpen(true)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Xem mô tả PLO →
            </button>
          </div>

          {clos.length === 0 || availablePlos.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              {clos.length === 0
                ? 'Thêm CLO ở Phần 2 để hiển thị ma trận.'
                : 'Chưa có PLO. Vui lòng hoàn thành Bước 2 (S2_PLO).'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 bg-slate-50 border border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 min-w-[120px] z-10">
                      CĐR HP \ PLO
                    </th>
                    {availablePlos.map(plo => (
                      <th key={plo.code} className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-600 min-w-[60px]">
                        <div title={plo.title} className="cursor-help">{plo.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clos.map(clo => (
                    <tr key={clo.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="sticky left-0 bg-white border border-slate-200 px-3 py-2 font-semibold text-blue-700 font-mono z-10">
                        {clo.code}
                      </td>
                      {availablePlos.map(plo => {
                        const checked = !!(matrix[clo.id]?.[plo.code]);
                        return (
                          <td key={plo.code} className="border border-slate-200 px-2 py-2 text-center">
                            <Checkbox
                              checked={checked}
                              disabled={isReadonlySection}
                              onChange={() => toggleCloMatrixCell(clo.id, plo.code)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 mt-2">
                Tích chọn để ánh xạ CLO với PLO của chương trình đào tạo. Dữ liệu tự cập nhật.
              </p>
            </div>
          )}
        </div>

        {/* Phần 4: Ý kiến Hội đồng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <SectionHeader title="Phần 4 — Đánh giá & Điều chỉnh (Dành cho Hội đồng)" />
          <FieldLabel>Kết luận của Hội đồng Khoa/Bộ môn chuyên môn</FieldLabel>
          <Input.TextArea
            value={currentSyllabus.councilReview || ''}
            disabled={isReadonlySection}
            placeholder="Nhập các góp ý, yêu cầu điều chỉnh chuẩn đầu ra từ Hội đồng tại đây..."
            rows={4}
            className="rounded-xl text-sm"
            onChange={e => updateSyllabus({ councilReview: e.target.value })}
          />
        </div>
      </div>
    );
  };

  const renderTabSyllabus = () => {
    const chapters = currentSyllabus.chapters || [];

    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0 space-y-4">
        <SectionHeader title="Nội dung giảng dạy (Cấu trúc Chương / Mục)" />

        {chapters.length === 0 ? (
          <Empty description="Chưa có chương nào. Bấm «Thêm chương» ở dưới để bắt đầu." imageStyle={{ height: 48 }} />
        ) : (
          <div className="space-y-4">
            {chapters.map((ch, chIdx) => (
              <div key={ch.id} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Chapter header */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <span className="text-slate-300"><GripVertical size={14} /></span>
                  <Input
                    value={ch.title}
                    disabled={isReadonlySection}
                    className="font-semibold text-slate-800 rounded-lg flex-1 h-8 text-sm"
                    onChange={e => updateChapter(chIdx, 'title', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    {!isReadonlySection && (
                      <>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => addTopic(chIdx)}
                          className="rounded-sm h-7 text-xs font-medium border-slate-300"
                        >
                          Thêm mục
                        </Button>
                        <button onClick={() => removeChapter(chIdx)} className="text-red-400 hover:text-red-600 p-1 rounded">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Topics table */}
                {ch.topics && ch.topics.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100">
                        <th className="px-4 py-2 text-left font-semibold text-slate-500 w-[40%]">Nội dung mục</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-500 w-[8%]">LT</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-500 w-[8%]">BT</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-500 w-[8%]">TH</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-500">CLO liên quan</th>
                        {!isReadonlySection && <th className="px-3 py-2 w-[40px]" />}
                      </tr>
                    </thead>
                    <tbody>
                      {ch.topics.map((t, tIdx) => (
                        <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                          <td className="px-4 py-2">
                            <Input
                              value={t.title}
                              disabled={isReadonlySection}
                              placeholder="Tên mục..."
                              className="rounded-md h-7 text-xs"
                              onChange={e => updateTopic(chIdx, tIdx, 'title', e.target.value)}
                            />
                          </td>
                          {(['lectureHours', 'practiceHours', 'selfStudyHours'] as const).map(f => (
                            <td key={f} className="px-3 py-2">
                              <Input
                                type="number"
                                min={0}
                                value={t[f]}
                                disabled={isReadonlySection}
                                className="rounded-md h-7 text-xs text-center w-full"
                                onChange={e => updateTopic(chIdx, tIdx, f, parseInt(e.target.value) || 0)}
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2">
                            <Select
                              mode="multiple"
                              value={t.mappedClos || []}
                              disabled={isReadonlySection || cloOptions.length === 0}
                              className="w-full"
                              size="small"
                              placeholder={cloOptions.length === 0 ? 'Thêm CLO ở Tab 2 trước' : 'Chọn CLO...'}
                              onChange={val => updateTopic(chIdx, tIdx, 'mappedClos', val)}
                              options={cloOptions}
                            />
                          </td>
                          {!isReadonlySection && (
                            <td className="px-3 py-2">
                              <button onClick={() => removeTopic(chIdx, tIdx)} className="text-red-400 hover:text-red-600 p-1 rounded">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {ch.topics?.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 italic">Chưa có mục. Bấm «Thêm mục».</div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isReadonlySection && (
          <div className="pt-2">
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={addChapter}
              className="text-blue-600 hover:text-blue-700 font-semibold p-0 cursor-pointer"
            >
              Thêm chương
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderTabAssessment = () => {
    const comps = currentSyllabus.assessmentComponents || [];
    const clos = currentSyllabus.clos || [];
    const aMatrix = currentSyllabus.assessmentMatrix || {};

    return (
      <div className="space-y-4">
        {/* Thành phần điểm */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <SectionHeader title="Thành phần điểm & Trọng số" />

          {/* Weight indicator */}
          {comps.length > 0 && (
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs font-medium ${
              totalWeight === 100
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <AlertCircle size={13} />
              <span>Tổng trọng số: <strong>{totalWeight}%</strong> {totalWeight !== 100 && '— Cần đạt đúng 100%'}</span>
            </div>
          )}

          {comps.length === 0 ? (
            <Empty description="Chưa có thành phần điểm." imageStyle={{ height: 48 }} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 w-[22%]">Thành phần</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-500 w-[9%]">Trọng số %</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500 w-[18%]">Phương thức</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Mô tả / Quy định</th>
                    {!isReadonlySection && <th className="px-3 py-2 w-[40px]" />}
                  </tr>
                </thead>
                <tbody>
                  {comps.map((comp, idx) => (
                    <tr key={comp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                      <td className="px-3 py-2">
                        <Input
                          value={comp.name}
                          disabled={isReadonlySection}
                          placeholder="VD: Kiểm tra giữa kỳ"
                          className="rounded-md h-7 text-xs"
                          onChange={e => updateAssessmentComponent(idx, 'name', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={comp.weight}
                          disabled={isReadonlySection}
                          className="rounded-md h-7 text-xs text-center"
                          onChange={e => updateAssessmentComponent(idx, 'weight', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={comp.method}
                          disabled={isReadonlySection}
                          className="w-full"
                          size="small"
                          onChange={val => updateAssessmentComponent(idx, 'method', val)}
                          options={ASSESSMENT_METHODS}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={comp.description}
                          disabled={isReadonlySection}
                          placeholder="Mô tả yêu cầu, tiêu chí chấm..."
                          className="rounded-md h-7 text-xs"
                          onChange={e => updateAssessmentComponent(idx, 'description', e.target.value)}
                        />
                      </td>
                      {!isReadonlySection && (
                        <td className="px-3 py-2">
                          <button onClick={() => removeAssessmentComponent(idx)} className="text-red-400 hover:text-red-600 p-1 rounded">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isReadonlySection && (
            <div className="mt-4 pt-2">
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={addAssessmentComponent}
                className="text-blue-600 hover:text-blue-700 font-semibold p-0 cursor-pointer"
              >
                Thêm thành phần điểm
              </Button>
            </div>
          )}
        </div>

        {/* Ma trận đánh giá */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <SectionHeader title="Ma trận đánh giá (Thành phần × CLO)" />

          {comps.length === 0 || clos.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              {comps.length === 0 ? 'Thêm thành phần điểm ở trên để hiển thị ma trận.' : 'Thêm CLO ở Tab 2 trước.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 bg-slate-50 border border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 min-w-[160px] z-10">
                      Thành phần \ CLO
                    </th>
                    {clos.map(c => (
                      <th key={c.id} className="border border-slate-200 px-3 py-2 text-center font-semibold text-blue-700 min-w-[64px]">
                        {c.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comps.map(comp => (
                    <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="sticky left-0 bg-white border border-slate-200 px-3 py-2 font-medium text-slate-700 z-10">
                        {comp.name || <span className="text-slate-400 italic">Chưa đặt tên</span>}
                      </td>
                      {clos.map(clo => {
                        const checked = !!(aMatrix[comp.id]?.[clo.id]);
                        return (
                          <td key={clo.id} className="border border-slate-200 px-2 py-2 text-center">
                            <Checkbox
                              checked={checked}
                              disabled={isReadonlySection}
                              onChange={() => toggleAssessmentMatrix(comp.id, clo.id)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 mt-2">
                Tích chọn để xác nhận thành phần đánh giá đo lường CLO tương ứng.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabMaterials = () => {
    const mats = currentSyllabus.materials || [];
    const guides = currentSyllabus.selfStudyGuides || [];
    const mainMats = mats.filter(m => m.type === 'main');
    const refMats = mats.filter(m => m.type === 'reference');

    const MatTable = ({ type, items, label }: { type: 'main' | 'reference'; items: MaterialItem[]; label: string }) => (
      <div>
        <div className="flex items-center justify-between mb-2">
          <Text strong className="text-slate-700 text-xs font-semibold uppercase tracking-wide">{label}</Text>
        </div>
        {items.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-2">Chưa có tài liệu.</div>
        ) : (
          <div className="space-y-2">
            {items.map((m) => {
              const globalIdx = mats.findIndex(x => x.id === m.id);
              return (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl group">
                  <div className="col-span-4">
                    <FieldLabel>Tên tài liệu / Tiêu đề</FieldLabel>
                    <Input value={m.title} disabled={isReadonlySection} placeholder="Tên sách, giáo trình..." className="rounded-md h-7 text-xs" onChange={e => updateMaterial(globalIdx, 'title', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>Tác giả</FieldLabel>
                    <Input value={m.author} disabled={isReadonlySection} placeholder="Tác giả..." className="rounded-md h-7 text-xs" onChange={e => updateMaterial(globalIdx, 'author', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>Nhà xuất bản</FieldLabel>
                    <Input value={m.publisher} disabled={isReadonlySection} placeholder="NXB..." className="rounded-md h-7 text-xs" onChange={e => updateMaterial(globalIdx, 'publisher', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <FieldLabel>Năm</FieldLabel>
                    <Input value={m.year} disabled={isReadonlySection} placeholder="2024" className="rounded-md h-7 text-xs" onChange={e => updateMaterial(globalIdx, 'year', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>URL / Liên kết</FieldLabel>
                    <Input value={m.url || ''} disabled={isReadonlySection} placeholder="https://..." className="rounded-md h-7 text-xs" onChange={e => updateMaterial(globalIdx, 'url', e.target.value)} />
                  </div>
                  {!isReadonlySection && (
                    <div className="col-span-1 pt-4">
                      <button onClick={() => removeMaterial(globalIdx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isReadonlySection && (
          <div className="pt-1">
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => addMaterial(type)}
              className="text-blue-600 hover:text-blue-700 font-semibold p-0 cursor-pointer text-xs"
            >
              Thêm tài liệu ({label})
            </Button>
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-4">
        {/* Danh mục tài liệu */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0 space-y-6">
          <SectionHeader title="Danh mục tài liệu học tập" />
          <MatTable type="main" items={mainMats} label="Tài liệu chính (Giáo trình bắt buộc)" />
          <div className="border-t border-slate-100 pt-4">
            <MatTable type="reference" items={refMats} label="Tài liệu tham khảo" />
          </div>
        </div>

        {/* Hướng dẫn tự học */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 min-h-0">
          <SectionHeader title="Hướng dẫn tự học (Theo chương/buổi)" />

          {guides.length === 0 ? (
            <Empty description="Chưa có hướng dẫn tự học." imageStyle={{ height: 48 }} />
          ) : (
            <div className="space-y-3">
              {guides.map((g, idx) => (
                <div key={g.id} className="group grid grid-cols-12 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="col-span-2">
                    <FieldLabel>Tham chiếu (Chương/Buổi)</FieldLabel>
                    <Input value={g.chapterRef} disabled={isReadonlySection} placeholder="VD: Chương 1" className="rounded-md h-7 text-xs" onChange={e => updateSelfStudyGuide(idx, 'chapterRef', e.target.value)} />
                  </div>
                  <div className="col-span-5">
                    <FieldLabel>Nội dung hướng dẫn</FieldLabel>
                    <Input.TextArea value={g.content} disabled={isReadonlySection} placeholder="Yêu cầu sinh viên đọc, chuẩn bị..." autoSize={{ minRows: 1, maxRows: 3 }} className="rounded-lg text-xs" onChange={e => updateSelfStudyGuide(idx, 'content', e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <FieldLabel>Tài liệu cần đọc</FieldLabel>
                    <Input value={g.materials} disabled={isReadonlySection} placeholder="VD: Giáo trình chương 1, trang 5-20" className="rounded-md h-7 text-xs" onChange={e => updateSelfStudyGuide(idx, 'materials', e.target.value)} />
                  </div>
                  {!isReadonlySection && (
                    <div className="col-span-1 pt-4">
                      <button onClick={() => removeSelfStudyGuide(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isReadonlySection && (
            <div className="mt-4 pt-2">
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={addSelfStudyGuide}
                className="text-blue-600 hover:text-blue-700 font-semibold p-0 cursor-pointer"
              >
                Thêm hướng dẫn tự học
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info': return renderTabInfo();
      case 'clo': return renderTabCLO();
      case 'syllabus': return renderTabSyllabus();
      case 'assessment': return renderTabAssessment();
      case 'materials': return renderTabMaterials();
    }
  };

  // ─── Tab nav ───────────────────────────────────────────────────────────────

  const tabs = [
    { key: 'info', label: 'Thông tin' },
    { key: 'clo', label: 'Mục tiêu & CLO' },
    { key: 'syllabus', label: 'Nội dung giảng dạy' },
    { key: 'assessment', label: 'Đánh giá' },
    { key: 'materials', label: 'Tài liệu & Tự học' },
  ] as const;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 pb-12 max-w-7xl mx-auto">
      {/* Course selector */}
      <div className="flex items-center gap-3 py-2 border-b border-slate-100 flex-wrap">
        <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <Text strong className="text-slate-600 text-sm">Học phần:</Text>
        <Select
          value={selectedCourseId ? String(selectedCourseId) : undefined}
          onChange={(val) => handleCourseSwitch(String(val))}
          className="w-[400px] font-semibold"
          options={courses.map(c => ({
            label: `[${c.code}] ${c.name} (${c.credits || 3} TC)`,
            value: String(c.id),
          }))}
        />
        <div className="flex items-center gap-1">
          <Button
            icon={<ChevronLeft size={15} />}
            className="rounded-lg px-2 h-8"
            disabled={courses.findIndex(c => String(c.id) === String(selectedCourseId)) <= 0}
            onClick={() => {
              const idx = courses.findIndex(c => String(c.id) === String(selectedCourseId));
              if (idx > 0) handleCourseSwitch(String(courses[idx - 1].id));
            }}
          />
          <Button
            icon={<ChevronRight size={15} />}
            className="rounded-lg px-2 h-8"
            disabled={courses.findIndex(c => String(c.id) === String(selectedCourseId)) >= courses.length - 1}
            onClick={() => {
              const idx = courses.findIndex(c => String(c.id) === String(selectedCourseId));
              if (idx < courses.length - 1) handleCourseSwitch(String(courses[idx + 1].id));
            }}
          />
        </div>

        {/* Edit mode badge — driven by readonly prop from page */}
        {!readonly && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200 ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            Đang chỉnh sửa
          </div>
        )}
        {readonly && currentSyllabus.clos.length > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200 ml-auto">
            <CheckCircle2 size={11} className="flex-shrink-0" />
            Đã lưu
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px cursor-pointer ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 bg-blue-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {renderTabContent()}

      {/* PLO Reference Drawer */}
      <Drawer
        title="Chuẩn đầu ra Chương trình (PLO) — Tham chiếu"
        placement="right"
        width={480}
        open={isPloDrawerOpen}
        onClose={() => setIsPloDrawerOpen(false)}
      >
        <div className="space-y-3">
          {availablePlos.map((plo, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <Tag color="blue" className="font-bold mb-1">{plo.code}</Tag>
              <Text strong className="block text-slate-800 text-sm">{plo.title}</Text>
            </div>
          ))}
        </div>
      </Drawer>


    </div>
  );
};

export default S5CLORenderer;
