'use client';

import React, { useMemo } from 'react';
import { Button, Input, InputNumber, Select, Table, Typography } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { CourseSyllabusData, SyllabusChapter, SyllabusTopic } from './types';
import { uid } from './constants';

const { Text } = Typography;

interface S5TabScheduleProps {
  data: CourseSyllabusData;
  readonly: boolean;
  onChange: (updated: Partial<CourseSyllabusData>) => void;
}

export const S5TabSchedule: React.FC<S5TabScheduleProps> = ({ data, readonly, onChange }) => {
  const chapters = data.chapters || [];
  const clos = data.clos || [];

  const handleAddChapter = () => {
    const nextChapterIndex = chapters.length + 1;
    const newChapter: SyllabusChapter = {
      id: uid(),
      title: `Chương ${nextChapterIndex}: Nội dung chủ đề mới`,
      topics: [
        {
          id: uid(),
          title: `Tuần ${nextChapterIndex}: Giới thiệu và bài giảng cơ bản`,
          lectureHours: 2,
          practiceHours: 1,
          selfStudyHours: 6,
          mappedClos: clos.length > 0 ? [clos[0].code] : [],
        },
      ],
    };
    onChange({ chapters: [...chapters, newChapter] });
  };

  const handleAddTopic = (chapterId: string) => {
    const updated = chapters.map(ch => {
      if (ch.id !== chapterId) return ch;
      const nextTopicNum = ch.topics.length + 1;
      const newTopic: SyllabusTopic = {
        id: uid(),
        title: `Chủ đề ${nextTopicNum}: Chi tiết nội dung`,
        lectureHours: 2,
        practiceHours: 1,
        selfStudyHours: 6,
        mappedClos: [],
      };
      return { ...ch, topics: [...ch.topics, newTopic] };
    });
    onChange({ chapters: updated });
  };

  const handleUpdateTopic = (chapterId: string, topicId: string, field: keyof SyllabusTopic, value: any) => {
    const updated = chapters.map(ch => {
      if (ch.id !== chapterId) return ch;
      const newTopics = ch.topics.map(t => (t.id === topicId ? { ...t, [field]: value } : t));
      return { ...ch, topics: newTopics };
    });
    onChange({ chapters: updated });
  };

  const handleDeleteTopic = (chapterId: string, topicId: string) => {
    const updated = chapters.map(ch => {
      if (ch.id !== chapterId) return ch;
      return { ...ch, topics: ch.topics.filter(t => t.id !== topicId) };
    });
    onChange({ chapters: updated });
  };

  const handleDeleteChapter = (chapterId: string) => {
    onChange({ chapters: chapters.filter(ch => ch.id !== chapterId) });
  };

  const totalLecture = useMemo(() => {
    return chapters.reduce((sum, ch) => sum + ch.topics.reduce((tSum, t) => tSum + (t.lectureHours || 0), 0), 0);
  }, [chapters]);

  const totalPractice = useMemo(() => {
    return chapters.reduce((sum, ch) => sum + ch.topics.reduce((tSum, t) => tSum + (t.practiceHours || 0), 0), 0);
  }, [chapters]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <Text strong className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Kế hoạch giảng dạy chi tiết 15 tuần & phân bổ chương mục
          </Text>
          <div className="text-xs text-slate-500 mt-0.5">
            Tổng giờ lên lớp: <strong>{totalLecture}h Lý thuyết</strong> • <strong>{totalPractice}h Thực hành/Lab</strong>
          </div>
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 space-y-3">
          <p className="mb-0">Chưa có kế hoạch tuần nào cho học phần này.</p>
          {!readonly && (
            <Button
              type="primary"
              size="small"
              icon={<Plus size={13} />}
              onClick={handleAddChapter}
              className="bg-blue-600 rounded text-xs"
            >
              Khởi tạo Chương 1
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((ch, chIdx) => (
            <div key={ch.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 mr-3">
                  <span className="text-xs font-bold text-slate-700 shrink-0">Chương {chIdx + 1}:</span>
                  <Input
                    value={ch.title}
                    disabled={readonly}
                    onChange={e => {
                      const updated = chapters.map(c => (c.id === ch.id ? { ...c, title: e.target.value } : c));
                      onChange({ chapters: updated });
                    }}
                    className="text-xs font-medium"
                  />
                </div>

                {!readonly && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<Trash2 size={13} />}
                      onClick={() => handleDeleteChapter(ch.id)}
                      className="h-7"
                    />
                  </div>
                )}
              </div>

              <div className="p-2 space-y-2">
                {ch.topics.map((topic, tIdx) => (
                  <div key={topic.id} className="flex items-center gap-2 text-xs bg-slate-50/50 p-2 rounded border border-slate-100">
                    <span className="font-mono text-slate-400 shrink-0">#{tIdx + 1}</span>
                    <Input
                      value={topic.title}
                      disabled={readonly}
                      onChange={e => handleUpdateTopic(ch.id, topic.id, 'title', e.target.value)}
                      placeholder="Tên bài giảng / nội dung tuần..."
                      className="flex-1 text-xs"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-400 text-[11px]">LT:</span>
                      <InputNumber
                        min={0}
                        max={10}
                        value={topic.lectureHours}
                        disabled={readonly}
                        onChange={v => handleUpdateTopic(ch.id, topic.id, 'lectureHours', v || 0)}
                        className="w-14 text-xs"
                        size="small"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-400 text-[11px]">TH:</span>
                      <InputNumber
                        min={0}
                        max={10}
                        value={topic.practiceHours}
                        disabled={readonly}
                        onChange={v => handleUpdateTopic(ch.id, topic.id, 'practiceHours', v || 0)}
                        className="w-14 text-xs"
                        size="small"
                      />
                    </div>
                    <div className="w-44 shrink-0">
                      <Select
                        mode="multiple"
                        placeholder="CLO đạt được"
                        value={topic.mappedClos || []}
                        disabled={readonly}
                        options={clos.map(c => ({ label: c.code, value: c.code }))}
                        onChange={v => handleUpdateTopic(ch.id, topic.id, 'mappedClos', v)}
                        className="w-full text-xs"
                        size="small"
                        maxTagCount="responsive"
                      />
                    </div>
                    {!readonly && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={13} />}
                        onClick={() => handleDeleteTopic(ch.id, topic.id)}
                        className="h-7"
                      />
                    )}
                  </div>
                ))}

                {/* Add Topic Button directly below chapter topics */}
                {!readonly && (
                  <Button
                    type="dashed"
                    size="small"
                    icon={<Plus size={12} />}
                    onClick={() => handleAddTopic(ch.id)}
                    className="w-full text-xs h-7 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 rounded flex items-center justify-center gap-1 mt-1"
                  >
                    Thêm tuần / chủ đề cho Chương {chIdx + 1}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add Chapter Button directly below all chapters */}
          {!readonly && (
            <Button
              type="dashed"
              icon={<Plus size={14} />}
              onClick={handleAddChapter}
              className="w-full text-xs h-9 font-semibold border-slate-300 text-blue-700 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs mt-2"
            >
              Thêm Chương mới (Chương {chapters.length + 1})
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
