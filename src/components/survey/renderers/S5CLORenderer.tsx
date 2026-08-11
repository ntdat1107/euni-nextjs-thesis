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
import { ExternalLink, BookOpen, Layers, Sparkles, AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
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

        // 2. Load survey campaign courses from campaign payload metadata
        if (campaign?.courses && campaign.courses.length > 0) {
          const mappedCourses = campaign.courses.map((c: any) => ({
            id: c.courseId,
            code: c.courseCode,
            name: c.courseName,
            credits: c.credits,
            status: c.status
          }));
          setCourses(mappedCourses);

          if (courseIdParam && mappedCourses.some((c: any) => c.id === courseIdParam)) {
            setSelectedCourseId(courseIdParam);
          } else if (!selectedCourseId && mappedCourses.length > 0) {
            setSelectedCourseId(mappedCourses[0].id);
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

  // Fetch single course detail when selectedCourseId changes
  useEffect(() => {
    setIsDirty(false);
    if (!campaignId || !selectedCourseId) return;

    const fetchCourseDetail = async () => {
      try {
        const detail = await surveyCampaignService.getCourseDetail(campaignId, selectedCourseId);
        if (detail && detail.syllabusData) {
          const parsedData = typeof detail.syllabusData === 'string' ? JSON.parse(detail.syllabusData) : detail.syllabusData;
          setAllSyllabusData((prev) => ({
            ...prev,
            [selectedCourseId]: {
              courseId: selectedCourseId,
              courseCode: detail.courseCode,
              courseName: detail.courseName,
              credits: detail.credits,
              clos: parsedData.clos || [],
              syllabusHtml: parsedData.syllabusHtml || '',
              updatedAt: detail.updatedAt,
              updatedBy: detail.updatedBy,
              ...parsedData
            }
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết đề cương môn học:', err);
      }
    };

    fetchCourseDetail();
  }, [campaignId, selectedCourseId]);

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

  const [activeTab, setActiveTab] = useState<'info' | 'clo' | 'syllabus' | 'assessment' | 'materials'>('clo');

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Spin size="large" />
        <Text className="block text-slate-400 font-medium">Đang tải cấu trúc môn học và chuẩn đầu ra...</Text>
      </div>
    );
  }

  // Handle single course saving via API
  const handleSaveCourse = async () => {
    if (!campaignId || !selectedCourseId) return;
    try {
      setLoading(true);
      await surveyCampaignService.saveCourseDetail(campaignId, selectedCourseId, currentSyllabus, 'COMPLETED');
      setIsDirty(false);
      Modal.success({ title: 'Thành công', content: 'Đã lưu đề cương học phần môn ' + currentCourse?.name });
    } catch (err) {
      Modal.error({ title: 'Lỗi', content: 'Không thể lưu đề cương học phần' });
    } finally {
      setLoading(false);
    }
  };

  // Content render per active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <Title level={5} className="!mb-4 text-slate-800 font-bold border-b pb-2">
              Thông tin chung về Học phần (Readonly từ Master Data)
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Tên học phần (VN)</Text>
                <Text strong className="text-base text-slate-800">{currentCourse?.name || '---'}</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Tên tiếng Anh (EN)</Text>
                <Text strong className="text-base text-slate-800">{currentCourse?.nameEn || currentCourse?.name || '---'}</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Mã học phần</Text>
                <Tag color="blue" className="font-mono font-bold text-sm px-3 py-0.5 mt-1">{currentCourse?.code || '---'}</Tag>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Số tín chỉ</Text>
                <Text strong className="text-base text-slate-800">{currentCourse?.credits || 3} Tín chỉ</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Phân bổ tiết (LT / BT / TH / Tự học)</Text>
                <Text strong className="text-slate-800">30 LT / 15 BT / 0 TH / 90 Tự học</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Bộ môn / Khoa phụ trách</Text>
                <Text strong className="text-slate-800">Bộ môn Công nghệ phần mềm - Khoa KH&KT Máy tính</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Học phần Tiên quyết</Text>
                <Text className="text-slate-600 font-medium">Không có</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase font-bold text-slate-400">Học phần Học trước</Text>
                <Text className="text-slate-600 font-medium">IT001 - Nhập môn Lập trình</Text>
              </div>
            </div>
          </div>
        );

      case 'clo':
        return (
          <div className="space-y-6">
            {/* Card view for CLOs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <Title level={5} className="!mb-0 text-slate-800 font-bold">Mục tiêu & Chuẩn đầu ra môn học (CLO)</Title>
                  <Text type="secondary" className="text-xs">Mỗi CLO được quản lý dưới dạng Card riêng biệt kèm Thang Bloom và ánh xạ PLO</Text>
                </div>
                {!isCourseSectionReadonly && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={addCLO} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    Thêm CLO Card
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {(currentSyllabus.clos || []).map((clo, index) => (
                  <div key={clo.id || index} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Input
                          value={clo.code}
                          disabled={isCourseSectionReadonly}
                          onChange={(e) => updateCLO(index, 'code', e.target.value)}
                          className="w-24 font-bold text-blue-600 font-mono text-center rounded-lg"
                        />
                        <Tag color="blue" className="font-bold text-xs">CLO Card #{index + 1}</Tag>
                      </div>
                      {!isCourseSectionReadonly && (
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCLO(index)} />
                      )}
                    </div>

                    <div>
                      <Text className="text-xs font-bold text-slate-500 block mb-1">Mô tả Chuẩn đầu ra (CLO)</Text>
                      <Input.TextArea
                        value={clo.content}
                        disabled={isCourseSectionReadonly}
                        placeholder="Nhập chi tiết mô tả chuẩn đầu ra môn học..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(e) => updateCLO(index, 'content', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
                      <div>
                        <Text className="text-xs font-bold text-slate-500 block mb-1">Thang Bloom</Text>
                        <Select
                          value={clo.bloomLevel || '3'}
                          disabled={isCourseSectionReadonly}
                          className="w-full"
                          onChange={(val) => updateCLO(index, 'bloomLevel', val)}
                          options={[
                            { label: 'L1: Ghi nhớ', value: '1' },
                            { label: 'L2: Thông hiểu', value: '2' },
                            { label: 'L3: Vận dụng', value: '3' },
                            { label: 'L4: Phân tích', value: '4' },
                            { label: 'L5: Đánh giá', value: '5' },
                            { label: 'L6: Sáng tạo', value: '6' }
                          ]}
                        />
                      </div>
                      <div>
                        <Text className="text-xs font-bold text-slate-500 block mb-1">Mức độ đạt được</Text>
                        <Select
                          value={clo.masteryLevel || 'I'}
                          disabled={isCourseSectionReadonly}
                          className="w-full"
                          onChange={(val) => updateCLO(index, 'masteryLevel', val)}
                          options={[
                            { label: 'I (Giới thiệu)', value: 'I' },
                            { label: 'R (Củng cố)', value: 'R' },
                            { label: 'M (Thành thạo)', value: 'M' },
                            { label: 'A (Đánh giá)', value: 'A' }
                          ]}
                        />
                      </div>
                      <div>
                        <Text className="text-xs font-bold text-slate-500 block mb-1">Ánh xạ PLO (CTĐT)</Text>
                        <Select
                          mode="multiple"
                          value={clo.mappedPlos || []}
                          disabled={isCourseSectionReadonly}
                          className="w-full"
                          placeholder="Chọn PLO..."
                          onChange={(val) => updateCLO(index, 'mappedPlos', val)}
                          options={availablePlos.map(p => ({ label: `${p.code}: ${p.title}`, value: p.code }))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'syllabus':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <Title level={5} className="!mb-2 text-slate-800 font-bold">Nội dung giảng dạy (Syllabus theo Chương/Bài)</Title>
            <RichtextEditor
              value={currentSyllabus.syllabusHtml || ''}
              disabled={isCourseSectionReadonly}
              onChange={(val) => updateCurrentSyllabus({ ...currentSyllabus, syllabusHtml: val })}
              placeholder="Nhập danh sách Chương, Bài học, thời lượng phân bổ và liên kết CLO..."
            />
          </div>
        );

      case 'assessment':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <Title level={5} className="!mb-2 text-slate-800 font-bold">Phương pháp & Trọng số Đánh giá học phần</Title>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                <Text strong className="block text-slate-700">Đánh giá Chuyên cần</Text>
                <div className="text-2xl font-bold text-blue-600">10%</div>
                <Tag color="cyan">Kiểm tra qua CLO1, CLO2</Tag>
              </div>
              <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                <Text strong className="block text-slate-700">Đánh giá Giữa kỳ</Text>
                <div className="text-2xl font-bold text-blue-600">30%</div>
                <Tag color="cyan">Kiểm tra qua CLO2, CLO3</Tag>
              </div>
              <div className="p-4 bg-slate-50 border rounded-xl space-y-2">
                <Text strong className="block text-slate-700">Đánh giá Cuối kỳ</Text>
                <div className="text-2xl font-bold text-blue-600">60%</div>
                <Tag color="cyan">Kiểm tra tất cả CLOs</Tag>
              </div>
            </div>
          </div>
        );

      case 'materials':
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <Title level={5} className="!mb-2 text-slate-800 font-bold">Tài liệu học tập & Hướng dẫn Tự học</Title>
            <div className="space-y-4">
              <div>
                <Text strong className="block text-slate-700 mb-1">Giáo trình chính</Text>
                <Input placeholder="Tên sách, tác giả, nhà xuất bản, năm xuất bản..." disabled={isCourseSectionReadonly} defaultValue="Giáo trình Lập trình Hướng đối tượng - NXB ĐHQG 2023" />
              </div>
              <div>
                <Text strong className="block text-slate-700 mb-1">Tài liệu tham khảo</Text>
                <Input.TextArea placeholder="Danh sách sách tham khảo, bài báo..." disabled={isCourseSectionReadonly} rows={3} defaultValue="1. Clean Code - Robert C. Martin&#10;2. Design Patterns - Gang of Four" />
              </div>
            </div>
          </div>
        );
    }
  };

  // Calculate dynamic progress for completed courses
  const completedCoursesCount = courses.filter(c => {
    const syllabus = allSyllabusData[c.id];
    return syllabus && Array.isArray(syllabus.clos) && syllabus.clos.length > 0;
  }).length;
  const totalCoursesCount = courses.length;
  const progressPercent = totalCoursesCount > 0 ? Math.round((completedCoursesCount / totalCoursesCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Clean & Basic Course Selector Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 py-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <Text strong className="text-slate-700 text-sm">Học phần:</Text>
          <Select
            value={selectedCourseId}
            onChange={handleCourseSwitch}
            className="w-[420px] font-semibold"
            options={courses.map(c => ({
              label: `[${c.code}] ${c.name} (${c.credits || 3} tín chỉ)`,
              value: c.id
            }))}
          />
          <div className="flex items-center gap-1">
            <Button
              icon={<ChevronLeft size={16} />}
              className="rounded-lg px-2"
              disabled={courses.findIndex(c => c.id === selectedCourseId) <= 0}
              onClick={() => {
                const idx = courses.findIndex(c => c.id === selectedCourseId);
                if (idx > 0) handleCourseSwitch(courses[idx - 1].id);
              }}
            />
            <Button
              icon={<ChevronRight size={16} />}
              className="rounded-lg px-2"
              disabled={courses.findIndex(c => c.id === selectedCourseId) >= courses.length - 1}
              onClick={() => {
                const idx = courses.findIndex(c => c.id === selectedCourseId);
                if (idx < courses.length - 1) handleCourseSwitch(courses[idx + 1].id);
              }}
            />
          </div>
        </div>
      </div>

      {/* 5 Workspaces Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button type={activeTab === 'info' ? 'primary' : 'text'} onClick={() => setActiveTab('info')} className="rounded-xl font-bold">
          Thông tin
        </Button>
        <Button type={activeTab === 'clo' ? 'primary' : 'text'} onClick={() => setActiveTab('clo')} className="rounded-xl font-bold">
          Mục tiêu & CLO
        </Button>
        <Button type={activeTab === 'syllabus' ? 'primary' : 'text'} onClick={() => setActiveTab('syllabus')} className="rounded-xl font-bold">
          Nội dung giảng dạy
        </Button>
        <Button type={activeTab === 'assessment' ? 'primary' : 'text'} onClick={() => setActiveTab('assessment')} className="rounded-xl font-bold">
          Đánh giá
        </Button>
        <Button type={activeTab === 'materials' ? 'primary' : 'text'} onClick={() => setActiveTab('materials')} className="rounded-xl font-bold">
          Tài liệu & Tự học
        </Button>
      </div>

      {/* Workspace Active Panel */}
      {renderTabContent()}

      {/* Reference Drawer for PLOs */}
      <Drawer
        title="Danh sách Chuẩn đầu ra CTĐT (PLO) Tham chiếu"
        placement="right"
        width={500}
        open={isPloDrawerOpen}
        onClose={() => setIsPloDrawerOpen(false)}
      >
        <div className="space-y-3">
          {availablePlos.map((plo, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border rounded-xl">
              <Tag color="blue" className="font-bold mb-1">{plo.code}</Tag>
              <Text strong className="block text-slate-800">{plo.title}</Text>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default S5CLORenderer;
