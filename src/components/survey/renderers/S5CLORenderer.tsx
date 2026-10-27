'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, Spin, message, Typography, Modal, Input } from 'antd';
import { BookOpen, Award, Calendar, CheckSquare, Library, AlertCircle } from 'lucide-react';
import { surveyCampaignService } from '@/services/surveyCampaignService';
import { CourseMetaItem, CourseSyllabusData, PloDomainGroup, S5RendererRef } from './s5/types';
import { S5CourseSidebar } from './s5/S5CourseSidebar';
import { S5HeaderMeta } from './s5/S5HeaderMeta';
import { S5TabGeneral } from './s5/S5TabGeneral';
import { S5TabClos } from './s5/S5TabClos';
import { S5TabSchedule } from './s5/S5TabSchedule';
import { S5TabAssessment } from './s5/S5TabAssessment';
import { S5TabMaterials } from './s5/S5TabMaterials';
import { helperExtractCos, helperParsePloDomains } from './s5/utils';
import { DEFAULT_ASSESSMENT_PRESET, uid } from './s5/constants';

const { Text } = Typography;

interface S5CLORendererProps {
  step?: any;
  campaign?: any;
  canEditRole?: boolean;
  canApproveRole?: boolean;
  onRefreshStep?: () => void;
  readonly?: boolean;
  data?: any;
  onChange?: (data: any) => void;
}

const defaultSyllabus = (courseId: string, code: string, name: string, credits: number): CourseSyllabusData => ({
  courseId,
  courseCode: code,
  courseName: name,
  credits,
  cos: [
    { id: uid(), code: 'CO1', domain: 'KNOWLEDGE', content: '' },
    { id: uid(), code: 'CO2', domain: 'SKILL', content: '' },
    { id: uid(), code: 'CO3', domain: 'AUTONOMY', content: '' },
  ],
  clos: [
    { id: uid(), code: 'CLO1', content: '', mappedPlos: [], bloomLevel: '3', masteryLevel: 'R' },
    { id: uid(), code: 'CLO2', content: '', mappedPlos: [], bloomLevel: '3', masteryLevel: 'R' },
    { id: uid(), code: 'CLO3', content: '', mappedPlos: [], bloomLevel: '4', masteryLevel: 'R' },
  ],
  chapters: [],
  assessmentComponents: DEFAULT_ASSESSMENT_PRESET.map(c => ({ ...c, id: uid() })),
  materials: [],
  selfStudyGuides: [],
  status: 'DRAFT',
});

export const S5CLORenderer = forwardRef<S5RendererRef, S5CLORendererProps>(({
  step,
  campaign,
  canEditRole = true,
  canApproveRole = false,
  onRefreshStep,
  readonly = false,
  data = {},
  onChange,
}, ref) => {
  const params = useParams();
  const campaignId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseMetaItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [availablePlos, setAvailablePlos] = useState<{ code: string; title: string }[]>([]);
  const [ploDomains, setPloDomains] = useState<PloDomainGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'clo' | 'schedule' | 'assessment' | 'materials'>('info');
  const [allSyllabusData, setAllSyllabusData] = useState<Record<string, CourseSyllabusData>>({});

  // Course-level Edit & Action State
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [backupCourseData, setBackupCourseData] = useState<CourseSyllabusData | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Reject Modal State for course-level rejection
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  // Load campaign context (PLOs & courses)
  useEffect(() => {
    if (!campaignId) return;
    const loadContext = async () => {
      try {
        setLoading(true);
        const fetchedCampaign = campaign || await surveyCampaignService.getById(campaignId);

        // Extract PLOs
        const ploStep = fetchedCampaign?.steps?.find((s: any) => {
          const sc = typeof s.configuration === 'string' ? JSON.parse(s.configuration)?.screenCode : s.configuration?.screenCode;
          return sc === 'S2_PLO';
        });

        if (ploStep) {
          const res = typeof ploStep.resultData === 'string' ? JSON.parse(ploStep.resultData) : (ploStep.resultData || {});
          const source = res?.ploBuilder || res;
          const rawPlos = source?.plos || [];
          const extracted: { code: string; title: string }[] = [];
          rawPlos.forEach((p: any) => {
            if (Array.isArray(p.pis)) {
              p.pis.forEach((pi: any) => {
                extracted.push({ code: pi.code, title: pi.content || p.content || '' });
              });
            } else {
              extracted.push({ code: p.code || p.id, title: p.content || p.title || '' });
            }
          });
          setAvailablePlos(extracted);
          setPloDomains(helperParsePloDomains(rawPlos));
        } else {
          setPloDomains(helperParsePloDomains([]));
        }

        // Extract courses
        if (fetchedCampaign?.courses && fetchedCampaign.courses.length > 0) {
          const mapped: CourseMetaItem[] = fetchedCampaign.courses.map((c: any) => ({
            id: c.id,
            courseId: c.courseId,
            courseCode: c.courseCode,
            courseName: c.courseName,
            courseNameEn: c.courseNameEn,
            credits: c.credits,
            theoryCredits: c.theoryCredits,
            practiceCredits: c.practiceCredits,
            selfStudyHours: c.selfStudyHours,
            semester: c.semester,
            departmentName: c.departmentName,
            status: c.status,
          }));
          setCourses(mapped);
          if (mapped.length > 0 && !selectedCourseId) {
            setSelectedCourseId(String(mapped[0].courseId));
          }
        }
      } catch (err) {
        console.error('Failed to load campaign context for Step 5', err);
      } finally {
        setLoading(false);
      }
    };
    loadContext();
  }, [campaignId, campaign]);

  // Load current course detail when selectedCourseId changes
  useEffect(() => {
    if (!campaignId || !selectedCourseId) return;
    if (allSyllabusData[selectedCourseId]) return;

    const fetchDetail = async () => {
      try {
        const detail = await surveyCampaignService.getCourseDetail(campaignId, selectedCourseId, step?.id);
        const currCourse = courses.find(c => String(c.courseId) === String(selectedCourseId));
        const code = currCourse?.courseCode || detail?.courseCode || '';
        const name = currCourse?.courseName || detail?.courseName || '';
        const credits = currCourse?.credits || detail?.credits || 3;

        let parsedData: any = {};
        if (detail?.syllabusData) {
          parsedData = typeof detail.syllabusData === 'string' ? JSON.parse(detail.syllabusData) : detail.syllabusData;
        }

        const merged: CourseSyllabusData = {
          ...defaultSyllabus(selectedCourseId, code, name, credits),
          ...parsedData,
          courseId: selectedCourseId,
          courseCode: code,
          courseName: name,
          courseNameEn: detail?.courseNameEn || currCourse?.courseNameEn,
          theoryCredits: detail?.theoryCredits || currCourse?.theoryCredits,
          practiceCredits: detail?.practiceCredits || currCourse?.practiceCredits,
          selfStudyHours: detail?.selfStudyHours || currCourse?.selfStudyHours,
          department: detail?.departmentName || currCourse?.departmentName,
          credits,
          status: detail?.status || 'DRAFT',
          reviewNote: detail?.reviewNote || parsedData?.reviewNote,
        };

        merged.cos = helperExtractCos(merged);
        if (!Array.isArray(merged.assessmentComponents) || merged.assessmentComponents.length === 0) {
          merged.assessmentComponents = DEFAULT_ASSESSMENT_PRESET.map(c => ({ ...c, id: uid() }));
        }

        setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: merged }));
      } catch (err) {
        console.error('Failed to fetch course detail', err);
      }
    };
    fetchDetail();
  }, [campaignId, selectedCourseId, courses, step?.id]);

  const currentCourse = courses.find(c => String(c.courseId) === String(selectedCourseId));
  const currentSyllabus = selectedCourseId && allSyllabusData[selectedCourseId]
    ? allSyllabusData[selectedCourseId]
    : defaultSyllabus(selectedCourseId, currentCourse?.courseCode || '', currentCourse?.courseName || '', currentCourse?.credits || 3);

  const isCurrentCourseEditing = editingCourseId === selectedCourseId;
  const isTabsReadonly = readonly || !isCurrentCourseEditing;

  const handleUpdateCurrentSyllabus = useCallback((updated: Partial<CourseSyllabusData>) => {
    if (!selectedCourseId) return;
    setAllSyllabusData(prev => {
      const prevSyllabus = prev[selectedCourseId] || defaultSyllabus(
        selectedCourseId,
        currentCourse?.courseCode || '',
        currentCourse?.courseName || '',
        currentCourse?.credits || 3
      );
      const newSyllabus = { ...prevSyllabus, ...updated };
      const newAll = { ...prev, [selectedCourseId]: newSyllabus };
      if (onChange) {
        onChange(newAll);
      }
      return newAll;
    });
  }, [selectedCourseId, currentCourse, onChange]);

  // Course actions
  const handleStartEdit = () => {
    setBackupCourseData(JSON.parse(JSON.stringify(currentSyllabus)));
    setEditingCourseId(selectedCourseId);
  };

  const handleCancelEdit = () => {
    if (backupCourseData && selectedCourseId) {
      setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: backupCourseData }));
    }
    setEditingCourseId(null);
    setBackupCourseData(null);
  };

  const handleSaveCourse = async () => {
    if (!selectedCourseId || !campaignId) return;
    try {
      setIsSavingCourse(true);
      const toSave = allSyllabusData[selectedCourseId] || currentSyllabus;
      const targetStatus = toSave.status === 'DRAFT' || !toSave.status
        ? 'IN_PROGRESS'
        : toSave.status;

      const payload = { ...toSave, status: targetStatus };
      await surveyCampaignService.saveCourseDetail(
        campaignId,
        selectedCourseId,
        payload,
        targetStatus,
        step?.id
      );

      setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: payload }));
      setCourses(prev => prev.map(c => String(c.courseId) === selectedCourseId ? { ...c, status: targetStatus } : c));
      setEditingCourseId(null);
      setBackupCourseData(null);
      message.success(`Đã lưu đề cương học phần ${payload.courseCode} thành công`);
      if (onRefreshStep) onRefreshStep();
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi lưu đề cương học phần');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleSubmitReviewCourse = () => {
    const toSubmit = allSyllabusData[selectedCourseId] || currentSyllabus;
    if (!toSubmit.clos || toSubmit.clos.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 Chuẩn đầu ra (CLO) cho học phần trước khi nộp duyệt');
      return;
    }

    Modal.confirm({
      title: `Nộp phê duyệt đề cương: [${toSubmit.courseCode}] ${toSubmit.courseName}`,
      content: 'Sau khi nộp, đề cương môn học này sẽ chuyển sang trạng thái Chờ duyệt để cấp thẩm quyền (Trưởng khoa / Hội đồng) thẩm định.',
      okText: 'Nộp phê duyệt',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setIsSavingCourse(true);
          const payload = { ...toSubmit, status: 'UNDER_REVIEW' };
          await surveyCampaignService.saveCourseDetail(
            campaignId,
            selectedCourseId,
            payload,
            'UNDER_REVIEW',
            step?.id
          );
          setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: payload }));
          setCourses(prev => prev.map(c => String(c.courseId) === selectedCourseId ? { ...c, status: 'UNDER_REVIEW' } : c));
          message.success(`Đã gửi nộp phê duyệt học phần ${toSubmit.courseCode}`);
          if (onRefreshStep) onRefreshStep();
        } catch (err: any) {
          message.error('Lỗi khi nộp phê duyệt học phần');
        } finally {
          setIsSavingCourse(false);
        }
      }
    });
  };

  const handleRecallReviewCourse = () => {
    Modal.confirm({
      title: `Thu hồi yêu cầu phê duyệt: ${currentSyllabus.courseCode}`,
      content: 'Bạn có chắc chắn muốn thu hồi yêu cầu phê duyệt đề cương học phần này? Môn học sẽ trở về trạng thái Đang soạn để bạn có thể tiếp tục chỉnh sửa.',
      okText: 'Thu hồi',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setIsSavingCourse(true);
          const payload = { ...currentSyllabus, status: 'IN_PROGRESS' };
          await surveyCampaignService.saveCourseDetail(
            campaignId,
            selectedCourseId,
            payload,
            'IN_PROGRESS',
            step?.id
          );
          setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: payload }));
          setCourses(prev => prev.map(c => String(c.courseId) === selectedCourseId ? { ...c, status: 'IN_PROGRESS' } : c));
          message.success(`Đã thu hồi yêu cầu phê duyệt học phần ${currentSyllabus.courseCode}`);
          if (onRefreshStep) onRefreshStep();
        } catch (err: any) {
          message.error('Lỗi khi thu hồi yêu cầu');
        } finally {
          setIsSavingCourse(false);
        }
      }
    });
  };

  const handleApproveCourse = () => {
    Modal.confirm({
      title: `Phê duyệt hoàn tất đề cương: [${currentSyllabus.courseCode}] ${currentSyllabus.courseName}`,
      content: 'Đề cương học phần này sẽ được xác nhận đạt chuẩn và chuyển sang trạng thái Hoàn thành.',
      okText: 'Xác nhận duyệt',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setIsSavingCourse(true);
          const payload = { ...currentSyllabus, status: 'COMPLETED', reviewNote: undefined };
          await surveyCampaignService.saveCourseDetail(
            campaignId,
            selectedCourseId,
            payload,
            'COMPLETED',
            step?.id
          );
          setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: payload }));
          setCourses(prev => prev.map(c => String(c.courseId) === selectedCourseId ? { ...c, status: 'COMPLETED' } : c));
          message.success(`Đã phê duyệt đề cương học phần ${currentSyllabus.courseCode}`);
          if (onRefreshStep) onRefreshStep();
        } catch (err: any) {
          message.error('Lỗi khi phê duyệt học phần');
        } finally {
          setIsSavingCourse(false);
        }
      }
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectNote.trim()) {
      message.error('Vui lòng nhập lý do / ý kiến góp ý chỉnh sửa');
      return;
    }
    try {
      setIsSavingCourse(true);
      const payload = {
        ...currentSyllabus,
        status: 'REJECTED',
        reviewNote: rejectNote.trim(),
        reviewedAt: new Date().toLocaleString('vi-VN'),
      };
      await surveyCampaignService.saveCourseDetail(
        campaignId,
        selectedCourseId,
        payload,
        'REJECTED',
        step?.id
      );
      setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: payload }));
      setCourses(prev => prev.map(c => String(c.courseId) === selectedCourseId ? { ...c, status: 'REJECTED' } : c));
      setIsRejectModalOpen(false);
      setRejectNote('');
      message.success(`Đã gửi yêu cầu chỉnh sửa cho học phần ${currentSyllabus.courseCode}`);
      if (onRefreshStep) onRefreshStep();
    } catch (err: any) {
      message.error('Lỗi khi gửi yêu cầu chỉnh sửa');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleReopenCourse = () => {
    Modal.confirm({
      title: `Mở lại đề cương học phần: ${currentSyllabus.courseCode}`,
      content: 'Môn học này đã được duyệt. Bạn có chắc chắn muốn mở lại để giảng viên hiệu chỉnh?',
      okText: 'Mở lại môn',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          setIsSavingCourse(true);
          const payload = { ...currentSyllabus, status: 'IN_PROGRESS' };
          await surveyCampaignService.saveCourseDetail(
            campaignId,
            selectedCourseId,
            payload,
            'IN_PROGRESS',
            step?.id
          );
          setAllSyllabusData(prev => ({ ...prev, [selectedCourseId]: payload }));
          setCourses(prev => prev.map(c => String(c.courseId) === selectedCourseId ? { ...c, status: 'IN_PROGRESS' } : c));
          message.success(`Đã mở lại học phần ${currentSyllabus.courseCode}`);
          if (onRefreshStep) onRefreshStep();
        } catch (err: any) {
          message.error('Lỗi khi mở lại học phần');
        } finally {
          setIsSavingCourse(false);
        }
      }
    });
  };

  // Expose validate and save to parent page
  useImperativeHandle(ref, () => ({
    validate: () => {
      const incompleteCourses = courses.filter(c => {
        const s = allSyllabusData[String(c.courseId)] || c;
        const st = s.status;
        return st !== 'COMPLETED' && st !== 'READY' && st !== 'APPROVED';
      });
      if (incompleteCourses.length > 0) {
        message.error(`Còn ${incompleteCourses.length} học phần chưa hoàn tất phê duyệt đề cương (ví dụ: ${incompleteCourses[0].courseCode})`);
        return false;
      }
      return true;
    },
    saveCurrent: async () => {
      if (isCurrentCourseEditing) {
        await handleSaveCourse();
      }
      return true;
    },
  }));

  const allStatuses = React.useMemo(() => {
    const map: Record<string, string> = {};
    courses.forEach(c => {
      map[String(c.courseId)] = allSyllabusData[String(c.courseId)]?.status || c.status || 'DRAFT';
    });
    return map;
  }, [allSyllabusData, courses]);

  if (loading && courses.length === 0) {
    return (
      <div className="p-16 text-center">
        <Spin tip="Đang tải danh mục học phần..." />
      </div>
    );
  }

  return (
    <div className="flex h-[780px] border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
      <S5CourseSidebar
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={id => {
          if (isCurrentCourseEditing) {
            Modal.confirm({
              title: 'Chuyển môn học khi chưa lưu',
              content: 'Bạn đang chỉnh sửa học phần này. Bạn có muốn thoát chỉnh sửa để chuyển sang môn khác?',
              okText: 'Chuyển môn',
              cancelText: 'Ở lại',
              onOk: () => {
                handleCancelEdit();
                setSelectedCourseId(id);
              }
            });
            return;
          }
          setSelectedCourseId(id);
        }}
        allSyllabusStatuses={allStatuses}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <S5HeaderMeta
          data={currentSyllabus}
          isEditing={isCurrentCourseEditing}
          isSaving={isSavingCourse}
          canEditRole={canEditRole && !readonly}
          canApproveRole={canApproveRole}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSaveCourse}
          onSubmitReview={handleSubmitReviewCourse}
          onRecallReview={handleRecallReviewCourse}
          onRejectCourse={() => {
            setRejectNote(currentSyllabus.reviewNote || '');
            setIsRejectModalOpen(true);
          }}
          onApproveCourse={handleApproveCourse}
          onReopenCourse={handleReopenCourse}
        />

        <div className="border-b border-slate-200 px-4 bg-white shrink-0">
          <Tabs
            activeKey={activeTab}
            onChange={k => setActiveTab(k as any)}
            className="text-xs"
            items={[
              { key: 'info', label: <span className="flex items-center gap-1.5"><BookOpen size={13} /> 1. Thông tin & Mục tiêu (CO)</span> },
              { key: 'clo', label: <span className="flex items-center gap-1.5"><Award size={13} /> 2. Chuẩn đầu ra (CLO)</span> },
              { key: 'schedule', label: <span className="flex items-center gap-1.5"><Calendar size={13} /> 3. Kế hoạch 15 tuần</span> },
              { key: 'assessment', label: <span className="flex items-center gap-1.5"><CheckSquare size={13} /> 4. Phương pháp đánh giá</span> },
              { key: 'materials', label: <span className="flex items-center gap-1.5"><Library size={13} /> 5. Giáo trình & Học liệu</span> },
            ]}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' && (
            <S5TabGeneral
              data={currentSyllabus}
              readonly={isTabsReadonly}
              onChange={handleUpdateCurrentSyllabus}
            />
          )}
          {activeTab === 'clo' && (
            <S5TabClos
              data={currentSyllabus}
              readonly={isTabsReadonly}
              availablePlos={availablePlos}
              ploDomains={ploDomains}
              onChange={handleUpdateCurrentSyllabus}
            />
          )}
          {activeTab === 'schedule' && (
            <S5TabSchedule
              data={currentSyllabus}
              readonly={isTabsReadonly}
              onChange={handleUpdateCurrentSyllabus}
            />
          )}
          {activeTab === 'assessment' && (
            <S5TabAssessment
              data={currentSyllabus}
              readonly={isTabsReadonly}
              onChange={handleUpdateCurrentSyllabus}
            />
          )}
          {activeTab === 'materials' && (
            <S5TabMaterials
              data={currentSyllabus}
              readonly={isTabsReadonly}
              onChange={handleUpdateCurrentSyllabus}
            />
          )}
        </div>
      </div>

      {/* Course-level Rejection Modal */}
      <Modal
        title={`Yêu cầu chỉnh sửa đề cương: [${currentSyllabus.courseCode}] ${currentSyllabus.courseName}`}
        open={isRejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectNote('');
        }}
        confirmLoading={isSavingCourse}
        okText="Gửi yêu cầu chỉnh sửa"
        cancelText="Hủy"
        centered
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-3 pt-2">
          <Text className="text-xs text-slate-600 block">
            Vui lòng nhập rõ các nội dung cần giảng viên/bộ môn bổ sung hoặc điều chỉnh theo tiêu chuẩn kiểm định:
          </Text>
          <Input.TextArea
            rows={4}
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="Ví dụ: Bổ sung thêm CLO kỹ năng thực hành, điều chỉnh trọng số đánh giá cuối kỳ thành 50% theo quy định..."
            className="text-xs"
          />
        </div>
      </Modal>
    </div>
  );
});

S5CLORenderer.displayName = 'S5CLORenderer';
export default S5CLORenderer;
