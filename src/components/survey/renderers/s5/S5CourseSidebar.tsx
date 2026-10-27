'use client';

import React, { useMemo, useState } from 'react';
import { Input, Typography, Tag, Select, Button, Tooltip } from 'antd';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Filter
} from 'lucide-react';
import { CourseMetaItem } from './types';
import { cn } from '@/lib/utils';

const { Text } = Typography;

interface S5CourseSidebarProps {
  courses: CourseMetaItem[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  allSyllabusStatuses: Record<string, string>;
}

export const S5CourseSidebar: React.FC<S5CourseSidebarProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  allSyllabusStatuses,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Status resolver
  const getCourseStatus = (c: CourseMetaItem) => {
    return allSyllabusStatuses[String(c.courseId)] || c.status || 'DRAFT';
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: courses.length,
      DRAFT: 0,
      IN_PROGRESS: 0,
      UNDER_REVIEW: 0,
      REJECTED: 0,
      COMPLETED: 0,
    };
    courses.forEach(c => {
      const st = getCourseStatus(c);
      if (st === 'COMPLETED' || st === 'READY' || st === 'APPROVED') {
        counts.COMPLETED++;
      } else if (st === 'UNDER_REVIEW' || st === 'PENDING_REVIEW') {
        counts.UNDER_REVIEW++;
      } else if (st === 'REJECTED') {
        counts.REJECTED++;
      } else if (st === 'IN_PROGRESS') {
        counts.IN_PROGRESS++;
      } else {
        counts.DRAFT++;
      }
    });
    return counts;
  }, [courses, allSyllabusStatuses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const st = getCourseStatus(c);
      const matchesSearch =
        !searchTerm.trim() ||
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return st === 'COMPLETED' || st === 'READY' || st === 'APPROVED';
      if (statusFilter === 'UNDER_REVIEW') return st === 'UNDER_REVIEW' || st === 'PENDING_REVIEW';
      if (statusFilter === 'REJECTED') return st === 'REJECTED';
      if (statusFilter === 'IN_PROGRESS') return st === 'IN_PROGRESS';
      if (statusFilter === 'DRAFT') return st === 'DRAFT' || st === 'PENDING' || !st;
      return true;
    });
  }, [courses, searchTerm, statusFilter, allSyllabusStatuses]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'READY':
      case 'APPROVED':
        return (
          <Tag color="success" className="text-[10px] font-semibold border-emerald-300 rounded px-1.5 py-0 m-0">
            Hoàn thành
          </Tag>
        );
      case 'UNDER_REVIEW':
      case 'PENDING_REVIEW':
        return (
          <Tag color="processing" className="text-[10px] font-semibold border-blue-300 rounded px-1.5 py-0 m-0">
            Chờ duyệt
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tag color="error" className="text-[10px] font-semibold border-rose-300 rounded px-1.5 py-0 m-0">
            Yêu cầu sửa
          </Tag>
        );
      case 'IN_PROGRESS':
        return (
          <Tag color="warning" className="text-[10px] font-semibold border-amber-300 rounded px-1.5 py-0 m-0">
            Đang soạn
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="text-[10px] font-medium border-slate-200 text-slate-500 rounded px-1.5 py-0 m-0">
            Chưa soạn
          </Tag>
        );
    }
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'READY':
      case 'APPROVED':
        return <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />;
      case 'UNDER_REVIEW':
      case 'PENDING_REVIEW':
        return <Send size={14} className="text-blue-500 shrink-0" />;
      case 'REJECTED':
        return <AlertTriangle size={14} className="text-rose-600 shrink-0" />;
      case 'IN_PROGRESS':
        return <Clock size={14} className="text-amber-500 shrink-0" />;
      default:
        return <HelpCircle size={14} className="text-slate-400 shrink-0" />;
    }
  };

  // Render Collapsed Sidebar
  if (isCollapsed) {
    return (
      <div className="w-[60px] shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col h-full items-center py-2.5 transition-all duration-200">
        <Tooltip title="Mở rộng danh mục học phần" placement="right">
          <Button
            type="text"
            size="small"
            icon={<PanelLeftOpen size={16} className="text-slate-600" />}
            onClick={() => setIsCollapsed(false)}
            className="mb-3 hover:bg-slate-200"
          />
        </Tooltip>

        <div className="w-8 h-px bg-slate-200 mb-2" />

        <div className="flex-1 w-full overflow-y-auto px-1 space-y-1.5">
          {courses.map(course => {
            const isSelected = String(course.courseId) === String(selectedCourseId);
            const st = getCourseStatus(course);
            return (
              <Tooltip
                key={course.courseId}
                placement="right"
                title={
                  <div className="text-xs">
                    <div className="font-bold">{course.courseCode} - {course.courseName}</div>
                    <div className="text-[11px] text-slate-300">{course.credits} TC • Học kỳ {course.semester || 1}</div>
                    <div className="mt-1">{renderStatusBadge(st)}</div>
                  </div>
                }
              >
                <button
                  type="button"
                  onClick={() => onSelectCourse(String(course.courseId))}
                  className={cn(
                    "w-full h-10 rounded flex flex-col items-center justify-center transition-all cursor-pointer",
                    isSelected ? "bg-white shadow-xs border border-blue-400 text-blue-700" : "hover:bg-slate-200/60 text-slate-600"
                  )}
                >
                  {renderStatusIcon(st)}
                  <span className="text-[9px] font-mono font-bold leading-none mt-1 truncate max-w-[46px]">
                    {course.courseCode.slice(0, 5)}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Expanded Sidebar
  return (
    <div className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/60 flex flex-col h-full overflow-hidden transition-all duration-200">
      {/* Header with Title, Count, Collapse Button */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Text strong className="text-xs text-slate-800 uppercase tracking-wider">
              Danh mục học phần
            </Text>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {statusCounts.COMPLETED}/{courses.length}
            </span>
          </div>

          <Tooltip title="Thu gọn danh mục" placement="left">
            <Button
              type="text"
              size="small"
              icon={<PanelLeftClose size={15} className="text-slate-500 hover:text-slate-800" />}
              onClick={() => setIsCollapsed(true)}
            />
          </Tooltip>
        </div>

        {/* Search */}
        <Input
          prefix={<Search size={13} className="text-slate-400" />}
          placeholder="Tìm mã hoặc tên môn..."
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
          className="rounded text-xs"
        />

        {/* Status Filter */}
        <Select
          size="small"
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full text-xs"
          suffixIcon={<Filter size={12} className="text-slate-400" />}
          options={[
            { value: 'ALL', label: `Tất cả trạng thái (${statusCounts.ALL})` },
            { value: 'DRAFT', label: `Chưa soạn (${statusCounts.DRAFT})` },
            { value: 'IN_PROGRESS', label: `Đang soạn (${statusCounts.IN_PROGRESS})` },
            { value: 'UNDER_REVIEW', label: `Chờ phê duyệt (${statusCounts.UNDER_REVIEW})` },
            { value: 'REJECTED', label: `Yêu cầu chỉnh sửa (${statusCounts.REJECTED})` },
            { value: 'COMPLETED', label: `Đã hoàn tất (${statusCounts.COMPLETED})` },
          ]}
        />
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
        {filteredCourses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Không tìm thấy học phần phù hợp
          </div>
        ) : (
          filteredCourses.map(course => {
            const isSelected = String(course.courseId) === String(selectedCourseId);
            const st = getCourseStatus(course);

            return (
              <button
                key={course.courseId}
                type="button"
                onClick={() => onSelectCourse(String(course.courseId))}
                className={cn(
                  "relative w-full text-left p-2.5 rounded-md transition-all duration-150 flex flex-col gap-1.5 cursor-pointer border",
                  isSelected
                    ? "bg-white shadow-xs border-blue-400 text-blue-900 ring-1 ring-blue-100"
                    : "bg-white/70 hover:bg-white border-transparent hover:border-slate-200 text-slate-700"
                )}
              >
                {/* Top row: Code + Credits + Status Tag */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {renderStatusIcon(st)}
                    <span className="font-mono font-bold text-xs text-slate-800 truncate">
                      {course.courseCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({course.credits} TC)
                    </span>
                  </div>
                  <div>{renderStatusBadge(st)}</div>
                </div>

                {/* Course Name */}
                <div className="text-[12px] text-slate-700 font-medium line-clamp-2 leading-tight">
                  {course.courseName}
                </div>

                {/* Meta info: Semester & Department */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-100">
                  <span>Học kỳ {course.semester || '—'}</span>
                  <span className="truncate max-w-[140px] text-right">
                    {course.departmentName || 'Bộ môn phụ trách'}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
