'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Button, Input, Table, Select, Space, Typography, Tag, Divider, 
  Card, Alert, Tooltip, Drawer, Empty, Spin, Modal 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, BookOutlined, EyeOutlined 
} from '@ant-design/icons';
import { ExternalLink, BookOpen, Layers, Sparkles, AlertCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { programService } from '@/services/programService';
import { courseService } from '@/services/courseService';
import { surveyCampaignService } from '@/services/surveyCampaignService';

const RichtextEditor = dynamic(() => import('@/components/common/RichtextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 min-h-[220px]">
      Đang tải bộ soạn thảo...
    </div>
  )
});

const { Text, Title, Paragraph } = Typography;

export interface CLOItem {
  id: string;
  code: string;
  content: string;
  mappedPlos: string[]; // List of PLO codes (e.g. ['PLO1', 'PLO2'])
  bloomLevel: string;   // 1 to 6
  masteryLevel: string; // I, R, M, A
}

export interface CourseSyllabusData {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits?: number;
  clos: CLOItem[];
  syllabusHtml?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface S5CLORendererProps {
  step?: any;
  readonly?: boolean;
  data?: Record<string, CourseSyllabusData>; // Map of courseId -> CourseSyllabusData
  onChange?: (data: any) => void;
}

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
  const [s2StepId, setS2StepId] = useState<string | null>(null);
  const [isPloDrawerOpen, setIsPloDrawerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isLocalChangeRef = React.useRef(false);

  // TODO: RBAC Course Permission Check - Integrate with fine-grained RBAC service to verify if current user has edit permission for this specific course.
  // In future release, if the current user is not assigned as lecturer/editor for selectedCourseId, this function will return false to lock editing for this course.
  const checkCourseEditPermission = (courseId: string): boolean => {
    // Currently always returns true for all courses until granular course-level RBAC permission checking is active
    return true;
  };

  const hasCourseEditPermission = checkCourseEditPermission(selectedCourseId);
  const isCourseSectionReadonly = readonly || !hasCourseEditPermission;

  // Local state for all courses syllabus data: { [courseId]: CourseSyllabusData }
  const [allSyllabusData, setAllSyllabusData] = useState<Record<string, CourseSyllabusData>>({});

  // Helper to normalize data prop into a map: { [courseId]: CourseSyllabusData }
  const normalizeData = (inputData: any): Record<string, CourseSyllabusData> => {
    if (!inputData || typeof inputData !== 'object') return {};
    
    // If inputData is a single CourseSyllabusData object (has courseId string)
    if (inputData.courseId && typeof inputData.courseId === 'string') {
      return { [inputData.courseId]: inputData };
    }
    
    return inputData;
  };

  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    if (data && typeof data === 'object') {
      const normalized = normalizeData(data);
      setAllSyllabusData((prev) => ({
        ...prev,
        ...normalized,
      }));
      setIsDirty(false); // Reset dirty flag when data is synced/saved from backend
    }
  }, [data]);

  // Load campaign, program courses, and PLOs from S2_PLO step
  useEffect(() => {
    const loadContextData = async () => {
      if (!campaignId) return;
      try {
        setLoading(true);
        const campaign = await surveyCampaignService.getById(campaignId);
        
        // 1. Find S2_PLO or S3_PLO step to extract approved PLOs
        const ploStep = campaign?.steps?.find((s: any) => {
          const sc = typeof s.configuration === 'string' ? JSON.parse(s.configuration)?.screenCode : s.configuration?.screenCode;
          return sc === 'S2_PLO' || sc === 'S3_PLO';
        });

        if (ploStep) {
          setS2StepId(ploStep.id);
          const result = typeof ploStep.resultData === 'string' ? JSON.parse(ploStep.resultData) : (ploStep.resultData || {});
          const rawPlos = result?.plos || [];
          if (Array.isArray(rawPlos) && rawPlos.length > 0) {
            setAvailablePlos(rawPlos.map((p: any, idx: number) => ({
              code: p.code || p.id || `PLO${idx + 1}`,
              title: p.title || p.content || p.name || `Chuẩn đầu ra PLO ${idx + 1}`
            })));
          } else {
            // Default fallback PLOs if step data empty
            setAvailablePlos([
              { code: 'PLO1', title: 'Kiến thức cơ sở ngành và chuyên ngành' },
              { code: 'PLO2', title: 'Kỹ năng tư duy phản biện và giải quyết vấn đề' },
              { code: 'PLO3', title: 'Kỹ năng làm việc nhóm và giao tiếp chuyên nghiệp' },
              { code: 'PLO4', title: 'Năng lực thiết kế và triển khai giải pháp kỹ thuật' },
              { code: 'PLO5', title: 'Đạo đức nghề nghiệp và trách nhiệm xã hội' }
            ]);
          }
        }

        // 2. Fetch program courses
        if (campaign?.programId) {
          const [allCourses, assignedIds] = await Promise.all([
            courseService.getAll(),
            programService.getCourses(campaign.programId)
          ]);
          const filtered = allCourses.filter(c => assignedIds.includes(c.id));
          setCourses(filtered);

          if (courseIdParam && filtered.some(c => c.id === courseIdParam)) {
            setSelectedCourseId(courseIdParam);
          } else if (!selectedCourseId && filtered.length > 0) {
            setSelectedCourseId(filtered[0].id);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu bối cảnh cho Bước 5:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContextData();
  }, [campaignId, courseIdParam]);

  // Current active course object
  const currentCourse = courses.find(c => c.id === selectedCourseId) || (courses.length > 0 ? courses[0] : null);

  // Current active course syllabus state
  const currentSyllabus: CourseSyllabusData = (selectedCourseId && allSyllabusData[selectedCourseId]) || {
    courseId: currentCourse?.id || selectedCourseId || '',
    courseCode: currentCourse?.code || '',
    courseName: currentCourse?.name || '',
    credits: currentCourse?.credits || 3,
    clos: [
      {
        id: '1',
        code: 'CLO1',
        content: 'Hiểu và vận dụng các nguyên lý cơ bản của môn học.',
        mappedPlos: ['PLO1'],
        bloomLevel: '3',
        masteryLevel: 'R'
      }
    ],
    syllabusHtml: ''
  };

  // Reset isDirty whenever selectedCourseId changes
  useEffect(() => {
    setIsDirty(false);
  }, [selectedCourseId]);

  const updateCurrentSyllabus = (updated: CourseSyllabusData) => {
    const targetCourseId = selectedCourseId || currentCourse?.id;
    if (!targetCourseId) return;

    isLocalChangeRef.current = true;
    const fullUpdatedCourse: CourseSyllabusData = {
      ...updated,
      courseId: targetCourseId,
      courseCode: updated.courseCode || currentCourse?.code || '',
      courseName: updated.courseName || currentCourse?.name || '',
      credits: updated.credits || currentCourse?.credits || 3,
    };

    const nextData = {
      ...allSyllabusData,
      [targetCourseId]: fullUpdatedCourse
    };

    setAllSyllabusData(nextData);
    setIsDirty(true);

    // Pass ONLY the active course payload to parent for granular single-course saving
    if (onChange) {
      onChange(fullUpdatedCourse);
    }
  };

  const handleCourseSwitch = (newCourseId: string) => {
    if (isDirty) {
      Modal.confirm({
        title: 'Xác nhận chuyển môn học',
        icon: null,
        centered: true,
        width: 440,
        content: (
          <div className="py-2 space-y-2">
            <Paragraph className="text-slate-600 text-sm leading-relaxed !mb-0">
              Nội dung chỉnh sửa của môn học <strong className="text-slate-800 font-semibold font-mono">[{currentCourse?.code}]</strong> <span className="font-medium">{currentCourse?.name}</span> chưa được lưu.
            </Paragraph>
            <Text type="secondary" className="text-xs block text-slate-400">
              Các thông tin vừa chỉnh sửa sẽ tự động bị hủy nếu bạn chuyển sang môn học khác.
            </Text>
          </div>
        ),
        okText: 'Tiếp tục chuyển',
        okButtonProps: { 
          type: 'primary',
          danger: true,
          className: 'rounded-xl font-medium shadow-none px-4 h-9' 
        },
        cancelText: 'Ở lại',
        cancelButtonProps: { 
          className: 'rounded-xl font-medium px-4 h-9 border-slate-200 text-slate-600' 
        },
        onOk: () => {
          setIsDirty(false);
          setSelectedCourseId(newCourseId);
        }
      });
    } else {
      setSelectedCourseId(newCourseId);
    }
  };

  const addCLO = () => {
    const nextIdx = (currentSyllabus.clos?.length || 0) + 1;
    const newClo: CLOItem = {
      id: `clo-${Date.now()}`,
      code: `CLO${nextIdx}`,
      content: '',
      mappedPlos: availablePlos.length > 0 ? [availablePlos[0].code] : ['PLO1'],
      bloomLevel: '3',
      masteryLevel: 'I'
    };
    updateCurrentSyllabus({
      ...currentSyllabus,
      clos: [...(currentSyllabus.clos || []), newClo]
    });
  };

  const removeCLO = (index: number) => {
    const newClos = currentSyllabus.clos.filter((_, i) => i !== index);
    updateCurrentSyllabus({ ...currentSyllabus, clos: newClos });
  };

  const updateCLO = (index: number, field: keyof CLOItem, value: any) => {
    const newClos = [...currentSyllabus.clos];
    newClos[index] = { ...newClos[index], [field]: value };
    updateCurrentSyllabus({ ...currentSyllabus, clos: newClos });
  };

  const columns = [
    {
      title: 'Mã CLO',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (text: string, record: CLOItem, index: number) => (
        <Input
          value={text}
          disabled={isCourseSectionReadonly}
          placeholder="CLO1"
          onChange={(e) => updateCLO(index, 'code', e.target.value)}
          className="font-bold text-blue-600 rounded-lg text-center"
        />
      ),
    },
    {
      title: 'Nội dung Chuẩn đầu ra Môn học (CLO)',
      dataIndex: 'content',
      key: 'content',
      render: (text: string, record: CLOItem, index: number) => (
        <Input.TextArea
          value={text}
          disabled={isCourseSectionReadonly}
          placeholder="Ví dụ: Áp dụng được các cấu trúc dữ liệu cơ bản để giải quyết bài toán thực tế..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          onChange={(e) => updateCLO(index, 'content', e.target.value)}
          className="rounded-xl border-slate-200"
        />
      ),
    },
    {
      title: 'Ánh xạ PLO (CTĐT)',
      dataIndex: 'mappedPlos',
      key: 'mappedPlos',
      width: 260,
      render: (values: string[], record: CLOItem, index: number) => (
        <Select
          mode="multiple"
          value={values || []}
          disabled={isCourseSectionReadonly}
          className="w-full rounded-lg"
          placeholder="Chọn PLO..."
          onChange={(val) => updateCLO(index, 'mappedPlos', val)}
          options={availablePlos.map(p => ({
            label: `${p.code}: ${p.title}`,
            value: p.code
          }))}
        />
      ),
    },
    {
      title: 'Thang Bloom',
      dataIndex: 'bloomLevel',
      key: 'bloomLevel',
      width: 140,
      render: (text: string, record: CLOItem, index: number) => (
        <Select
          value={text || '3'}
          disabled={isCourseSectionReadonly}
          className="w-full rounded-lg"
          onChange={(val) => updateCLO(index, 'bloomLevel', val)}
          options={[
            { label: 'L1: Ghi nhớ', value: '1' },
            { label: 'L2: Thông hiểu', value: '2' },
            { label: 'L3: Vận dụng', value: '3' },
            { label: 'L4: Phân tích', value: '4' },
            { label: 'L5: Đánh giá', value: '5' },
            { label: 'L6: Sáng tạo', value: '6' },
          ]}
        />
      ),
    },
    {
      title: 'Mức độ',
      dataIndex: 'masteryLevel',
      key: 'masteryLevel',
      width: 120,
      render: (text: string, record: CLOItem, index: number) => (
        <Select
          value={text || 'I'}
          disabled={isCourseSectionReadonly}
          className="w-full rounded-lg"
          onChange={(val) => updateCLO(index, 'masteryLevel', val)}
          options={[
            { label: 'I (Giới thiệu)', value: 'I' },
            { label: 'R (Củng cố)', value: 'R' },
            { label: 'M (Thành thạo)', value: 'M' },
            { label: 'A (Đánh giá)', value: 'A' },
          ]}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: any, record: CLOItem, index: number) => (
        !isCourseSectionReadonly && (
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => removeCLO(index)} 
            className="hover:bg-red-50 rounded-lg"
          />
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Spin size="large" />
        <Text className="block text-slate-400 font-medium">Đang tải cấu trúc môn học và chuẩn đầu ra...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Banner highlight & Reference Link to PLO Step */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 rounded-3xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles size={24} />
          </div>
          <div>
            <Title level={4} className="!mb-0 text-slate-800 font-bold">
              Bước 5: Thiết kế Đề cương chi tiết & Chuẩn đầu ra Môn học (CLO)
            </Title>
            <Text className="text-slate-500 text-sm font-medium">
              Xây dựng CĐR từng môn học dựa trên Chuẩn đầu ra Chương trình đào tạo (PLO) đã phê duyệt.
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon={<EyeOutlined />}
            onClick={() => setIsPloDrawerOpen(true)}
            className="rounded-xl h-10 px-4 font-semibold border-slate-200 bg-white hover:border-blue-500 text-slate-700 flex items-center gap-2"
          >
            Xem nhanh danh sách PLO
          </Button>

          {s2StepId && (
            <a
              href={`/survey/campaigns/${campaignId}/steps/${s2StepId}?mode=view`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="primary"
                icon={<ExternalLink size={16} />}
                className="rounded-xl h-10 px-5 font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 border-none flex items-center gap-2"
              >
                Mở Bước CĐR CTĐT
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Course Selection Dropdown Bar */}
      <Card className="rounded-2xl border-slate-200 shadow-sm p-4 bg-slate-50/60 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <Text strong className="text-slate-700 text-base">Chọn Môn học thiết kế:</Text>
            <Select
              value={selectedCourseId}
              onChange={handleCourseSwitch}
              className="w-[420px] rounded-xl h-11 text-base font-semibold"
              options={courses.map(c => ({
                label: `[${c.code}] ${c.name} (${c.credits || 3} tín chỉ)`,
                value: c.id
              }))}
            />
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <Tag color="warning" className="rounded-full px-3 py-1 font-semibold text-xs border-amber-200 bg-amber-50 text-amber-700 animate-pulse">
                Có thay đổi chưa lưu
              </Tag>
            )}

            {currentSyllabus?.updatedAt && (
              <Tooltip title={`Thời gian lưu gần nhất: ${dayjs(currentSyllabus.updatedAt).format('DD/MM/YYYY HH:mm:ss')}`}>
                <Tag icon={<Clock size={12} />} color="default" className="rounded-full px-3 py-1 font-medium text-xs border-slate-200 bg-slate-100 text-slate-600 flex items-center gap-1.5">
                  Lần sửa cuối: {dayjs(currentSyllabus.updatedAt).format('DD/MM/YYYY HH:mm')} ({currentSyllabus.updatedBy || 'Quản trị viên'})
                </Tag>
              </Tooltip>
            )}

            {currentCourse && (
              <>
                <Tag color="blue" className="rounded-full px-3 py-1 font-bold text-xs">
                  Mã: {currentCourse.code}
                </Tag>
                <Tag color="purple" className="rounded-full px-3 py-1 font-bold text-xs">
                  {currentCourse.credits || 3} Tín chỉ
                </Tag>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Main CLO Form Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <Title level={4} className="!mb-1 font-bold text-slate-800">
              Danh sách Chuẩn đầu ra Môn học (CLO)
            </Title>
            <Text className="text-slate-400 text-sm">
              Môn học: <strong className="text-slate-700">{currentCourse?.name || '---'}</strong>
            </Text>
          </div>

          {!isCourseSectionReadonly && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addCLO}
              className="rounded-xl px-5 h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 border-none flex items-center gap-2"
            >
              Thêm CLO môn học
            </Button>
          )}
        </div>

        <Table
          dataSource={currentSyllabus.clos || []}
          columns={columns}
          pagination={false}
          rowKey={(r) => r.id || r.code}
          bordered
          className="ant-table-custom"
        />

        <Divider className="my-8" />

        {/* Detailed Syllabus Rich Text Editor */}
        <div className="space-y-3">
          <Title level={4} className="!mb-2 text-slate-800 font-bold">
            Nội dung Đề cương chi tiết học phần (Syllabus)
          </Title>
          
          <RichtextEditor
            value={currentSyllabus.syllabusHtml || ''}
            disabled={isCourseSectionReadonly}
            onChange={(val) => updateCurrentSyllabus({ ...currentSyllabus, syllabusHtml: val })}
            placeholder="Nhập nội dung đề cương chi tiết: Mô tả học phần, phân bổ thời lượng, hình thức đánh giá..."
          />
        </div>
      </div>

      {/* Reference Drawer for PLOs */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <BookOutlined className="text-blue-600" />
            <span>Danh sách Chuẩn đầu ra CTĐT (PLO) Tham chiếu</span>
          </div>
        }
        placement="right"
        width={500}
        open={isPloDrawerOpen}
        onClose={() => setIsPloDrawerOpen(false)}
        className="rounded-l-3xl"
      >
        <div className="space-y-4">
          <Paragraph className="text-slate-500 text-sm">
            Danh sách PLO bên dưới được phê duyệt từ Bước tiền đề (Bước 2 / Bước 3). Sử dụng thông tin này để đối chiếu khi gán ánh xạ CLO.
          </Paragraph>

          {availablePlos.length > 0 ? (
            <div className="space-y-3">
              {availablePlos.map((plo, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between">
                    <Tag color="blue" className="font-bold rounded-md font-mono">
                      {plo.code}
                    </Tag>
                  </div>
                  <Text strong className="text-slate-800 block">{plo.title}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu PLO từ bước trước" />
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default S5CLORenderer;
