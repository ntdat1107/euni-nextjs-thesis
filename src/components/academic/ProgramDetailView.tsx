'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  App,
  Tooltip,
  Tag,
  Tabs,
  Alert,
  Breadcrumb,
  Drawer,
  Spin
} from 'antd';
import {
  Edit3,
  FileText,
  CheckCircle,
  BookOpen,
  ArrowLeft,
  Eye,
  AlertCircle,
  Layers
} from 'lucide-react';
import { Program, ProgramStructure, ProgramObeMatrixData } from '@/types/academic';
import { programService } from '@/services/programService';
import { useMajors } from '@/hooks/useMajors';
import { useCourses } from '@/hooks/useCourses';
import ProgramStructureTree from '@/components/academic/ProgramStructureTree';
import ProgramObeTabs from '@/components/academic/ProgramObeTabs';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;

interface ProgramCourseItem {
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

interface ProgramDetailViewProps {
  programId: number | string;
  onBack?: () => void;
}

export default function ProgramDetailView({ programId, onBack }: ProgramDetailViewProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const isNew = programId === 'new';

  const { majors = [], isLoading: loadingMajors } = useMajors();
  const { courses = [], isLoading: loadingCourses } = useCourses();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [isEditMode, setIsEditMode] = useState(isNew);
  const [activeTab, setActiveTab] = useState('1');

  // Courses state
  const [programCourses, setProgramCourses] = useState<ProgramCourseItem[]>([]);
  const [initialProgramCourses, setInitialProgramCourses] = useState<ProgramCourseItem[]>([]);
  const [programCoursesDetail, setProgramCoursesDetail] = useState<any[]>([]);
  const [selectedCourseForView, setSelectedCourseForView] = useState<any | null>(null);
  const [isCourseDrawerOpen, setIsCourseDrawerOpen] = useState(false);

  // Structures & OBE
  const [structures, setStructures] = useState<ProgramStructure[]>([]);
  const [obeData, setObeData] = useState<ProgramObeMatrixData | null>(null);
  const [loadingObe, setLoadingObe] = useState(false);

  // Load structures
  const loadStructures = useCallback(async (id: number | string) => {
    try {
      const data = await programService.getStructures(id);
      setStructures(data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load OBE
  const loadObeData = useCallback(async (id: number | string) => {
    try {
      setLoadingObe(true);
      const data = await programService.getObeMatrix(id);
      setObeData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingObe(false);
    }
  }, []);

  // Load all program data
  const loadProgramData = useCallback(async () => {
    if (isNew) {
      setProgram(null);
      setIsEditMode(true);
      form.resetFields();
      setProgramCourses([]);
      setInitialProgramCourses([]);
      setStructures([]);
      setObeData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await programService.getById(programId);
      setProgram(data);
      form.setFieldsValue(data);

      const details = await programService.getCoursesDetail(programId);
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
      setInitialProgramCourses(items);
      setProgramCoursesDetail(details || []);

      loadStructures(programId);
      loadObeData(programId);
    } catch (err: any) {
      message.error(err?.message || 'Không thể tải thông tin chương trình đào tạo');
    } finally {
      setLoading(false);
    }
  }, [programId, isNew, form, loadStructures, loadObeData, message]);

  useEffect(() => {
    loadProgramData();
  }, [loadProgramData]);

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

  // Save General Info
  const handleSubmit = async (values: any) => {
    try {
      setIsSaving(true);
      const metadata = {
        name: values.name,
        code: values.code,
        majorId: values.majorId,
        status: values.status,
        description: values.description,
        effectiveYear: values.effectiveYear ? Number(values.effectiveYear) : undefined,
        totalCredits: values.totalCredits ? Number(values.totalCredits) : undefined,
        degreeLevel: values.degreeLevel,
        trainingMode: values.trainingMode
      };

      if (!isNew && program) {
        const updated = await programService.update(program.id, metadata);
        setProgram(updated);
        setIsEditMode(false);
        message.success('Cập nhật thông tin chương trình thành công!');
      } else {
        const created = await programService.create(metadata);
        message.success('Tạo chương trình đào tạo mới thành công!');
        router.push(`/curriculum/programs/${created.id}`);
      }
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi lưu chương trình đào tạo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/curriculum/programs');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Đã ban hành
          </div>
        );
      case 'REVIEWING':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            Đang xây dựng / rà soát
          </div>
        );
      case 'DRAFT':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Bản nháp
          </div>
        );
      case 'INACTIVE':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            Ngừng áp dụng
          </div>
        );
    }
  };

  if (loading || loadingMajors || loadingCourses) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span className="text-xs text-slate-500 font-medium">Đang tải dữ liệu chương trình đào tạo...</span>
      </div>
    );
  }

  const totalCredits = programCourses.reduce((sum, item) => sum + (Number(item.credits) || 0), 0);
  const programTargetCredits = Number(program?.totalCredits) || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Breadcrumb Standard */}
      <Breadcrumb
        className="text-slate-400 text-xs"
        items={[
          { title: <a onClick={() => router.push('/')} className="hover:text-blue-600 cursor-pointer">Trang chủ</a> },
          { title: <a onClick={handleBack} className="hover:text-blue-600 cursor-pointer">Chương trình đào tạo</a> },
          { title: isNew ? 'Thiết lập Chương trình mới' : (program?.name || 'Chi tiết CTĐT') }
        ]}
      />

      {/* 2. Header Card Standard */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeft className="w-5 h-5 text-slate-600" />}
            onClick={handleBack}
            className="hover:bg-slate-100 rounded-xl h-10 w-10 flex items-center justify-center shrink-0 cursor-pointer"
            title="Quay lại danh sách"
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Title level={2} className="!mb-0 !text-slate-800 tracking-tight font-bold text-2xl">
                {isNew ? 'Thiết lập Chương trình đào tạo mới' : (isEditMode ? `Chỉnh sửa: ${program?.name}` : program?.name)}
              </Title>
              {program?.code && (
                <code className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {program.code}
                </code>
              )}
              {program?.status && getStatusBadge(program.status)}
            </div>
            <Text className="text-slate-500 font-medium text-xs mt-1 block">
              {isNew 
                ? 'Nhập các thông tin khởi tạo khung chương trình đào tạo theo chuẩn kiểm định.'
                : 'Thông tin chi tiết, Cây cấu trúc khối kiến thức (TT 17) và Khung môn học của CTĐT.'
              }
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && !isEditMode && (
            <Button 
              type="primary" 
              icon={<Edit3 size={16} />}
              onClick={() => {
                setActiveTab('1');
                setIsEditMode(true);
              }}
              className="h-10 px-5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 border-none transition-all flex items-center gap-2 cursor-pointer"
            >
              Chỉnh sửa thông tin chung
            </Button>
          )}
          {!isNew && isEditMode && (
            <Button 
              type="default" 
              onClick={() => {
                setIsEditMode(false);
                loadProgramData();
              }}
              className="h-10 px-5 rounded-xl font-semibold border-slate-300 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
            >
              Hủy chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      {/* 3. Content Card Standard */}
      <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
        {program?.status === 'REVIEWING' && (
          <Alert
            message="Chương trình đào tạo đang trong Quy trình Xây dựng / Rà soát"
            description="Thông tin chung CTĐT có thể được chỉnh sửa trực tiếp tại đây. Cấu trúc Khối kiến thức (Tab 2), Khung môn học (Tab 3) và Chuẩn đầu ra OBE (Tab 4) được biên soạn thông qua các bước trong Quy trình Xây dựng CTĐT."
            type="info"
            showIcon
            icon={<Layers className="w-5 h-5 text-blue-600" />}
            className="rounded-2xl border-blue-200 bg-blue-50/80 mb-6 text-blue-900 shadow-sm"
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="premium-tabs"
          items={[
            // TAB 1: THÔNG TIN CHUNG CTĐT
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  1. Thông tin chung CTĐT
                </span>
              ),
              children: (
                <div className="max-w-5xl mx-auto py-8">
                  <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
                    {!isEditMode && program ? (
                      /* View-Only Readout */
                      <div className="space-y-8">
                        <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông số vận hành đào tạo</span>
                            {getStatusBadge(program.status)}
                          </div>
                          <Row gutter={[24, 24]}>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title={<span className="text-xs text-slate-500 font-medium">Trình độ đào tạo</span>}
                                value={program.degreeLevel === 'MASTER' ? 'Thạc sĩ' : (program.degreeLevel === 'DOCTOR' ? 'Tiến sĩ' : 'Đại học')}
                                valueStyle={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title={<span className="text-xs text-slate-500 font-medium">Hình thức đào tạo</span>}
                                value={program.trainingMode === 'PART_TIME' ? 'Vừa làm vừa học' : (program.trainingMode === 'DISTANCE' ? 'Từ xa' : 'Chính quy')}
                                valueStyle={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title={<span className="text-xs text-slate-500 font-medium">Năm áp dụng</span>}
                                value={program.effectiveYear || 'Chưa thiết lập'}
                                valueStyle={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                              <Statistic
                                title={<span className="text-xs text-slate-500 font-medium">Tổng số tín chỉ định mức</span>}
                                value={program.totalCredits ? `${program.totalCredits} TC` : 'Chưa thiết lập'}
                                valueStyle={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}
                              />
                            </Col>
                          </Row>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80">
                          <div>
                            <span className="text-xs text-slate-400 block mb-1">Mã chương trình:</span>
                            <span className="font-mono font-bold text-slate-800 text-sm">{program.code}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 block mb-1">Ngành đào tạo:</span>
                            <span className="font-bold text-slate-800 text-sm">
                              {majors.find(m => m.id === program.majorId)?.name || 'Chưa xác định'}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-xs text-slate-400 block mb-1">Mô tả mục tiêu đào tạo:</span>
                            <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                              {program.description || 'Chưa có thông tin mô tả chi tiết cho chương trình này.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Edit Mode Form Inputs */
                      <div className="space-y-6">
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="code"
                              label={<span className="text-xs font-semibold text-slate-600">Mã chương trình</span>}
                              rules={[{ required: true, message: 'Vui lòng nhập mã CTĐT' }]}
                            >
                              <Input placeholder="Ví dụ: CTDT_CNTT_2024" className="rounded-xl h-10" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="name"
                              label={<span className="text-xs font-semibold text-slate-600">Tên chương trình</span>}
                              rules={[{ required: true, message: 'Vui lòng nhập tên CTĐT' }]}
                            >
                              <Input placeholder="Ví dụ: Công nghệ thông tin định hướng AI" className="rounded-xl h-10" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="majorId"
                              label={<span className="text-xs font-semibold text-slate-600">Ngành đào tạo</span>}
                              rules={[{ required: true, message: 'Vui lòng chọn ngành' }]}
                            >
                              <Select placeholder="Chọn ngành học" className="rounded-xl h-10">
                                {majors.map(m => (
                                  <Select.Option key={m.id} value={m.id}>
                                    {m.name} ({m.code})
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="status"
                              label={<span className="text-xs font-semibold text-slate-600">Trạng thái</span>}
                              initialValue="DRAFT"
                            >
                              <Select className="rounded-xl h-10">
                                <Select.Option value="DRAFT">Bản nháp (Đang xây dựng/rà soát)</Select.Option>
                                <Select.Option value="ACTIVE">Ban hành chính thức (Active)</Select.Option>
                                <Select.Option value="INACTIVE">Ngừng áp dụng</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="degreeLevel"
                              label={<span className="text-xs font-semibold text-slate-600">Trình độ đào tạo</span>}
                              initialValue="BACHELOR"
                            >
                              <Select className="rounded-xl h-10">
                                <Select.Option value="BACHELOR">Đại học</Select.Option>
                                <Select.Option value="MASTER">Thạc sĩ</Select.Option>
                                <Select.Option value="DOCTOR">Tiến sĩ</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="trainingMode"
                              label={<span className="text-xs font-semibold text-slate-600">Hình thức đào tạo</span>}
                              initialValue="FORMAL"
                            >
                              <Select className="rounded-xl h-10">
                                <Select.Option value="FORMAL">Chính quy</Select.Option>
                                <Select.Option value="PART_TIME">Vừa làm vừa học</Select.Option>
                                <Select.Option value="DISTANCE">Từ xa</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="effectiveYear"
                              label={<span className="text-xs font-semibold text-slate-600">Năm áp dụng</span>}
                            >
                              <Input type="number" placeholder="2024" className="rounded-xl h-10" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Form.Item
                              name="totalCredits"
                              label={<span className="text-xs font-semibold text-slate-600">Tổng tín chỉ yêu cầu</span>}
                            >
                              <Input type="number" placeholder="130" className="rounded-xl h-10" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          name="description"
                          label={<span className="text-xs font-semibold text-slate-600">Mô tả chương trình</span>}
                        >
                          <Input.TextArea rows={4} placeholder="Mô tả mục tiêu, định hướng..." className="rounded-xl" />
                        </Form.Item>
                      </div>
                    )}
                  </Form>
                </div>
              )
            },

            // TAB 2: CẤU TRÚC KHỐI KIẾN THỨC (TT 17)
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  2. Cấu trúc Khối kiến thức (TT 17)
                </span>
              ),
              children: !isNew && program ? (
                <div className="py-4">
                  <ProgramStructureTree
                    programId={program.id}
                    structures={structures}
                    onRefresh={() => loadStructures(program.id)}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Vui lòng lưu thông tin chung và khởi tạo đợt xây dựng CTĐT để thiết lập cây khối kiến thức.
                </div>
              )
            },

            // TAB 3: KHUNG HỌC PHẦN (MÔN HỌC THEO KHỐI)
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  3. Khung học phần (Môn học theo khối)
                </span>
              ),
              children: (() => {
                if (isNew || !program) {
                  return (
                    <div className="py-12 text-center text-slate-400">
                      Vui lòng lưu thông tin chung trước khi phân bổ học phần vào chương trình.
                    </div>
                  );
                }

                // Gom nhóm học phần theo flatStructures
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

                const groupedEntries: {
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
                  if (items.length > 0 || isEditMode) {
                    groupedEntries.push({
                      id: s.id,
                      code: s.code,
                      name: s.name,
                      fullName: s.fullName,
                      creditRequired: s.creditRequired,
                      items,
                      totalCredits: items.reduce((sum, i) => sum + (Number(i.credits) || 0), 0),
                    });
                  }
                });

                const ungroupedItems = structMap.get('ungrouped') || [];
                if (ungroupedItems.length > 0) {
                  groupedEntries.push({
                    id: 'ungrouped',
                    code: '',
                    name: 'Học phần chưa phân khối kiến thức',
                    fullName: 'Học phần chưa phân khối kiến thức (Cần gán khối theo TT 17)',
                    creditRequired: 0,
                    items: ungroupedItems,
                    totalCredits: ungroupedItems.reduce((sum, i) => sum + (Number(i.credits) || 0), 0),
                  });
                }

                return (
                  <div className="py-4 space-y-4">
                    {/* Thanh tổng quan */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-4 flex-wrap text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">Tổng môn học:</span>
                          <span className="font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-100">
                            {programCourses.length} môn
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">Tín chỉ phân bổ:</span>
                          <span className="font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-100">
                            {totalCredits} {programTargetCredits > 0 ? `/ ${programTargetCredits}` : ''} TC
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">Khối kiến thức:</span>
                          <span className="font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-100">
                            {flatStructures.length} khối định nghĩa
                          </span>
                        </div>
                        {ungroupedItems.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-amber-700 bg-white px-2.5 py-0.5 rounded-full border border-amber-200">
                              ⚠ {ungroupedItems.length} môn chưa gán khối
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Danh sách hiển thị theo từng Khối kiến thức */}
                    {groupedEntries.length === 0 || programCourses.length === 0 ? (
                      <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 space-y-3">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                        <div className="font-medium text-sm">Chưa có môn học nào trong khung chương trình</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
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
                                "bg-white rounded-xl border overflow-hidden transition-all",
                                isUngrouped ? "border-amber-300/80 bg-amber-50/20" : "border-slate-200/80"
                              )}
                            >
                              {/* Header Khối kiến thức */}
                              <div className={cn(
                                "border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                                isUngrouped ? "bg-amber-50/80 border-amber-200" : "bg-slate-50/80 border-slate-200/80"
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

                                  {/* Tiến độ tín chỉ vs Định mức */}
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
                              </div>

                              {/* Bảng môn học */}
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
                                        <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-xs font-mono border border-slate-200/60">
                                          {code}
                                        </code>
                                      )
                                    },
                                    {
                                      title: 'Tên học phần',
                                      dataIndex: 'courseName',
                                      key: 'courseName',
                                      render: (name) => <span className="font-semibold text-slate-800 text-xs">{name}</span>
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
                                      title: 'Đề cương & CLO',
                                      key: 'syllabus',
                                      width: 150,
                                      align: 'center',
                                      render: (_: any, record: ProgramCourseItem) => {
                                        const detail = programCoursesDetail.find(d => d.courseId === record.courseId);
                                        const hasData = !!(detail?.data || record.data);
                                        return (
                                          <div className="flex items-center justify-center gap-1.5">
                                            {hasData ? (
                                              <Tag color="success" className="rounded-full px-2 py-0 border-none font-bold text-[10px]">
                                                Đã có đề cương
                                              </Tag>
                                            ) : (
                                              <Tag color="default" className="rounded-full px-2 py-0 border-none font-medium text-[10px] text-slate-400 bg-slate-100">
                                                Chưa khảo sát
                                              </Tag>
                                            )}
                                            {hasData && (
                                              <Button
                                                type="text"
                                                size="small"
                                                icon={<Eye size={13} className="text-blue-600" />}
                                                onClick={() => {
                                                  setSelectedCourseForView({
                                                    id: record.courseId,
                                                    code: record.courseCode,
                                                    name: record.courseName,
                                                    credits: record.credits,
                                                    detail: detail || { data: record.data }
                                                  });
                                                  setIsCourseDrawerOpen(true);
                                                }}
                                                className="hover:bg-blue-50 text-blue-600 p-1 rounded cursor-pointer"
                                              />
                                            )}
                                          </div>
                                        );
                                      }
                                    }
                                  ]}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            },

            // TAB 4: CHUẨN ĐẦU RA OBE & MA TRẬN
            {
              key: '4',
              label: (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-500" />
                  4. Chuẩn đầu ra OBE &amp; Ma trận
                </span>
              ),
              children: !isNew && program ? (
                <div className="py-4">
                  <ProgramObeTabs
                    programId={program.id}
                    obeData={obeData}
                    loading={loadingObe}
                    onRefresh={() => loadObeData(program.id)}
                    readOnly={true}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Vui lòng lưu thông tin chương trình đào tạo trước khi xem ma trận OBE.
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Drawer Xem Chi Tiết Đề Cương & CLO Môn Học */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-bold text-slate-800 text-base">
                Chi tiết Đề cương học phần: {selectedCourseForView?.name}
              </div>
              <div className="text-xs font-mono text-slate-500 font-semibold">
                Mã môn: {selectedCourseForView?.code} | Số tín chỉ: {selectedCourseForView?.credits || 3}
              </div>
            </div>
          </div>
        }
        width={720}
        open={isCourseDrawerOpen}
        onClose={() => {
          setIsCourseDrawerOpen(false);
          setSelectedCourseForView(null);
        }}
        destroyOnClose
      >
        {selectedCourseForView ? (
          <div className="py-2 space-y-6">
            <Alert
              message="Đề cương học phần phục vụ chuẩn đầu ra CTĐT"
              description="Các chuẩn đầu ra học phần (CLO) dưới đây đã được giảng viên phụ trách xây dựng và liên kết với ma trận đóng góp PLO/PI của CTĐT."
              type="info"
              showIcon
              icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
              className="rounded-2xl border-blue-200 bg-blue-50/80 mb-4"
            />

            {(() => {
              const detailDataStr = selectedCourseForView.detail?.data;
              let parsedData: any = null;
              if (detailDataStr) {
                try {
                  parsedData = JSON.parse(detailDataStr);
                } catch (e) {}
              }

              if (!parsedData) {
                return (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span className="text-sm font-medium">Môn học này chưa thực hiện khảo sát đề cương &amp; CLO</span>
                  </div>
                );
              }

              const clos = parsedData.clos || parsedData.courseLearningOutcomes || [];
              const info = parsedData.info || parsedData;

              return (
                <div className="space-y-6">
                  {/* General Course Info */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Thông tin tổng quan đề cương</span>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Tên tiếng Anh:</span>
                        <span className="font-semibold text-slate-700">{info.englishName || '---'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Mô tả học phần:</span>
                        <span className="font-semibold text-slate-700">{info.description || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* CLOs Section */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Chuẩn đầu ra môn học (CLO)</span>
                    {Array.isArray(clos) && clos.length > 0 ? (
                      <div className="space-y-3">
                        {clos.map((clo: any, cIdx: number) => (
                          <div key={cIdx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <Tag color="purple" className="font-mono font-bold text-xs rounded-lg px-2.5 py-0.5">
                                {clo.code || `CLO${cIdx + 1}`}
                              </Tag>
                            </div>
                            <p className="text-sm font-medium text-slate-800 leading-relaxed">
                              {clo.description || clo.content || clo.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded-xl">Không có thông tin CLO</div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}
      </Drawer>

      {/* Unified Fixed Bottom Page Action Bar for EDIT mode */}
      {isEditMode && (
        <div className="sticky bottom-0 z-20 -mx-6 -mb-6 mt-6 px-8 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Nhấn "{isNew ? 'Tạo chương trình' : 'Cập nhật thông tin'}" để lưu các thông tin chung của chương trình đào tạo.
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button
              onClick={() => {
                if (isNew) {
                  handleBack();
                } else {
                  setIsEditMode(false);
                  loadProgramData();
                }
              }}
              className="rounded-xl h-11 px-7 font-semibold text-slate-700 hover:bg-slate-50 border-slate-300 transition-all cursor-pointer"
            >
              Hủy bỏ
            </Button>

            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={isSaving}
              className="rounded-xl h-11 px-8 font-semibold shadow-md bg-blue-600 hover:bg-blue-700 border-none transition-all cursor-pointer"
            >
              {isNew ? 'Tạo chương trình' : 'Cập nhật thông tin'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
