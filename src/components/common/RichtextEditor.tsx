'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Undo,
  SelectAll,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormat,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  List,
  ListProperties,
  Indent,
  IndentBlock,
  Link,
  AutoLink,
  HorizontalLine,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption
} from 'ckeditor5';
import { Sparkles, Send, Loader2, RefreshCw, PlusCircle, Replace, X, Bot, Check } from 'lucide-react';
import { Popover, Input, Button, Tag, Tooltip, Modal } from 'antd';

import { fetchWithTokenRefresh } from '@/services/api';
import 'ckeditor5/ckeditor5.css';

interface RichtextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  error?: boolean;
  contentType?: 'CLO' | 'PLO' | 'PEO' | 'SYLLABUS' | 'COURSE_DESCRIPTION' | 'PREREQUISITES' | 'ASSESSMENT' | 'GENERAL' | string;
  metadata?: Record<string, any>;
  onApplyParsed?: (parsed: { rawHtml: string; mucTieuChung?: string; peos?: string[] }) => void;
}

const CK_PLUGINS = [
  Essentials, Undo, SelectAll, Paragraph, Heading,
  Bold, Italic, Underline, Strikethrough, RemoveFormat,
  FontSize, FontColor, FontBackgroundColor, Alignment,
  List, ListProperties, Indent, IndentBlock,
  Link, AutoLink, HorizontalLine,
  Table, TableToolbar, TableProperties, TableCellProperties,
  TableColumnResize, TableCaption
];

const BASE_EDITOR_CONFIG: any = {
  plugins: CK_PLUGINS,
  toolbar: {
    items: [
      "undo", "redo", "|",
      "heading", "|",
      "bold", "italic", "underline", "strikethrough", "removeFormat", "|",
      "fontSize", "fontColor", "fontBackgroundColor", "|",
      "alignment", "|",
      "bulletedList", "numberedList", "indent", "outdent", "|",
      "link", "insertTable", "horizontalLine",
    ],
    shouldNotGroupWhenFull: true,
  },
  heading: {
    options: [
      { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
      { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
      { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
      { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
      { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
    ],
  },
  fontSize: {
    options: [10, 11, 12, 13, 14, "default", 16, 18, 20, 24, 28, 32],
    supportAllValues: false,
  },
  fontColor: {
    columns: 6,
    colors: [
      { color: "#1e293b", label: "Đậm" },
      { color: "#334155", label: "Tối" },
      { color: "#64748b", label: "Xám" },
      { color: "#0f172a", label: "Đen" },
      { color: "#ffffff", label: "Trắng", hasBorder: true },
      { color: "#f8fafc", label: "Trắng nhạt", hasBorder: true },
      { color: "#2563eb", label: "Xanh dương" },
      { color: "#1d4ed8", label: "Xanh đậm" },
      { color: "#7c3aed", label: "Tím" },
      { color: "#059669", label: "Xanh lá" },
      { color: "#dc2626", label: "Đỏ" },
      { color: "#d97706", label: "Cam" },
    ],
  },
  fontBackgroundColor: {
    columns: 6,
    colors: [
      { color: "#fef9c3", label: "Vàng nhạt" },
      { color: "#dcfce7", label: "Xanh lá nhạt" },
      { color: "#dbeafe", label: "Xanh dương nhạt" },
      { color: "#ede9fe", label: "Tím nhạt" },
      { color: "#fce7f3", label: "Hồng nhạt" },
      { color: "#fee2e2", label: "Đỏ nhạt" },
      { color: "#fef3c7", label: "Cam nhạt" },
      { color: "#f1f5f9", label: "Xám nhạt" },
      { color: "#ffffff", label: "Không màu", hasBorder: true },
    ],
  },
  alignment: {
    options: ["left", "center", "right", "justify"],
  },
  table: {
    contentToolbar: [
      "tableColumn", "tableRow", "mergeTableCells", "|",
      "tableProperties", "tableCellProperties",
    ],
  },
  language: "en",
  licenseKey: "GPL",
};

export default function RichtextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled,
  minHeight = 220,
  error = false,
  contentType = 'GENERAL',
  metadata,
  onApplyParsed
}: RichtextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [hasCompletedStream, setHasCompletedStream] = useState(false);

  const editorInstanceRef = useRef<any>(null);
  const isEditorReadyRef = useRef(false);
  const initialDataRef = useRef(value);
  const lastEmittedDataRef = useRef(value);

  useEffect(() => {
    if (editorInstanceRef.current && isEditorReadyRef.current) {
      const current = editorInstanceRef.current.getData();
      if (value !== current && value !== lastEmittedDataRef.current) {
        lastEmittedDataRef.current = value;
        editorInstanceRef.current.setData(value || '');
      }
    }
  }, [value]);

  const editorConfig = useMemo(() => ({
    ...BASE_EDITOR_CONFIG,
    placeholder: placeholder || "Nhập nội dung...",
  }), [placeholder]);

  const handleGenerateAiText = async (promptToRun?: string) => {
    const finalPrompt = promptToRun || promptText;
    if (!finalPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStreamedText('');
    setHasCompletedStream(false);

    try {
      const response = await fetchWithTokenRefresh('/api/ai/generate-stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: finalPrompt,
          contentType: contentType || 'GENERAL',
          metadata: metadata || {}
        }),
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullParsedText = '';
      let buffer = '';

      // Queue for smooth typewriter pacing
      let charQueue = '';
      let displayedLength = 0;
      let streamFinished = false;

      // Typewriter timer: reveals 3-6 characters every 15ms for smooth 60fps streaming
      const timer = setInterval(() => {
        if (displayedLength < charQueue.length) {
          // Accelerate if queue is getting long (>100 chars queued)
          const remaining = charQueue.length - displayedLength;
          const step = remaining > 200 ? 12 : remaining > 80 ? 6 : 3;
          displayedLength = Math.min(displayedLength + step, charQueue.length);
          setStreamedText(charQueue.slice(0, displayedLength));
        } else if (streamFinished) {
          clearInterval(timer);
          setStreamedText(charQueue);
          setHasCompletedStream(true);
          setIsGenerating(false);
        }
      }, 15);

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataContent = line.slice(line.indexOf('data:') + 5);
            fullParsedText += dataContent;
          } else if (trimmed && !trimmed.startsWith(':')) {
            fullParsedText += line;
          }
        }
        charQueue = fullParsedText;
      }

      if (buffer.trim()) {
        if (buffer.startsWith('data:')) {
          fullParsedText += buffer.slice(buffer.indexOf('data:') + 5);
        } else {
          fullParsedText += buffer;
        }
        charQueue = fullParsedText;
      }

      streamFinished = true;

    } catch (err) {
      console.error('AI Generate Error:', err);
      setIsGenerating(false);
    }
  };

  const parsePeoContent = (html: string) => {
    if (typeof window === 'undefined') return { rawHtml: html };
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const pElements = Array.from(doc.querySelectorAll('p'));
      const mucTieuParas = pElements.filter(p => !p.textContent?.toLowerCase().includes('mục tiêu cụ thể'));
      const mucTieuChung = mucTieuParas.map(p => p.outerHTML).join('').trim();

      const liElements = Array.from(doc.querySelectorAll('li'));
      const peos = liElements.map(li => {
        let text = li.textContent || '';
        text = text.replace(/^PEO\s*\d+\s*[:\.\-]\s*/i, '').trim();
        return text;
      }).filter(t => t.length > 0);

      return { rawHtml: html, mucTieuChung, peos };
    } catch (err) {
      return { rawHtml: html };
    }
  };

  const handleApplyContent = (mode: 'append' | 'replace') => {
    if (!streamedText) return;
    const parsed = parsePeoContent(streamedText);

    let newValue = value || '';
    if (contentType?.toUpperCase() === 'PEO' && parsed.mucTieuChung && mode === 'replace') {
      newValue = parsed.mucTieuChung;
    } else if (mode === 'replace') {
      newValue = streamedText;
    } else {
      newValue = newValue ? `${newValue}\n${streamedText}` : streamedText;
    }

    if (editorInstanceRef.current && isEditorReadyRef.current) {
      lastEmittedDataRef.current = newValue;
      editorInstanceRef.current.setData(newValue);
    }

    onChange(newValue);

    if (onApplyParsed) {
      onApplyParsed(parsed);
    }

    setIsAiOpen(false);
    setStreamedText('');
    setHasCompletedStream(false);
    setPromptText('');
  };

  const getContextLabel = () => {
    switch (contentType?.toUpperCase()) {
      case 'PEO': return 'Mục tiêu đào tạo (PEO)';
      case 'CLO': return 'Chuẩn đầu ra (CLO)';
      case 'PLO': return 'Chuẩn đầu ra (PLO)';
      case 'SYLLABUS': return 'Đề cương môn học';
      case 'COURSE_DESCRIPTION': return 'Mô tả học phần';
      case 'PREREQUISITES': return 'Điều kiện môn học';
      case 'ASSESSMENT': return 'Phương pháp đánh giá';
      default: return 'Ngữ cảnh học thuật';
    }
  };

  const getQuickPrompts = () => {
    switch (contentType?.toUpperCase()) {
      case 'PEO':
        return [
          "Soạn Mục tiêu chung & các PEO cụ thể cho chương trình đào tạo",
          "Bổ sung PEO về năng lực quản lý, đạo đức nghề nghiệp & lãnh đạo",
          "Tối ưu PEO định hướng phát triển sự nghiệp 3-5 năm sau tốt nghiệp"
        ];
      case 'CLO':
        return [
          "Xây dựng bộ CLO theo thang đo Bloom (Nhớ, Hiểu, Vận dụng, Phân tích...)",
          "Bổ sung CLO về kỹ năng mềm, thái độ & làm việc nhóm",
          "Tối ưu các động từ đo lường chuẩn kiểm định AUN-QA / MOET"
        ];
      case 'PLO':
        return [
          "Soạn bộ PLO chương trình đào tạo chuẩn kiểm định AUN-QA",
          "Bổ sung các chỉ số hiệu quả PI đo lường cho từng PLO",
          "Tạo PLO về khả năng tư duy phản biện & giải quyết vấn đề phức tạp"
        ];
      case 'SYLLABUS':
        return [
          "Gợi ý khung đề cương chi tiết 15 tuần học từ cơ bản đến nâng cao",
          "Phân bổ hợp lý thời lượng Lý thuyết, Thực hành & Tự học",
          "Thêm các chủ đề công nghệ hiện đại thực tiễn vào chương trình"
        ];
      case 'COURSE_DESCRIPTION':
        return [
          "Soạn mô tả tổng quan học phần hấp dẫn & chuẩn học thuật đại học",
          "Tóm tắt mục tiêu, vai trò và giá trị cốt lõi sinh viên tích lũy được"
        ];
      case 'ASSESSMENT':
        return [
          "Thiết kế ma trận đánh giá học phần với phân bổ trọng số (%)",
          "Đề xuất tiêu chí đánh giá chi tiết đồ án/bài tập lớn (Rubrics)"
        ];
      default:
        return [
          "Viết mô tả chuẩn đầu ra chuyên nghiệp",
          "Tóm tắt ngắn gọn nội dung kiến thức môn học",
          "Gợi ý ma trận kỹ năng chi tiết"
        ];
    }
  };

  const quickPrompts = getQuickPrompts();

  const aiPopoverContent = (
    <div className="w-full p-5 space-y-4 font-sans bg-white rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <Sparkles size={16} className="animate-pulse" />
        </div>
        <div>
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Trợ lý AI Trí tuệ nhân tạo</span>
            <Tag color="blue" className="border-none text-[10px] font-bold uppercase rounded-full px-2 py-0.2 bg-blue-50 text-blue-600">
              Gemini Flash • {getContextLabel()}
            </Tag>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Tự động đề xuất & soạn thảo nội dung theo ngữ cảnh {getContextLabel()}</div>
        </div>
      </div>

      {/* Quick Prompts */}
      {!streamedText && !isGenerating && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý câu lệnh thường dùng:</div>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptText(qp);
                  handleGenerateAiText(qp);
                }}
                className="group flex items-center justify-between text-xs text-slate-700 bg-slate-50 hover:bg-blue-50/80 hover:text-blue-700 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-blue-200 transition-all text-left font-medium"
              >
                <span>{qp}</span>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">Áp dụng →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input Box */}
      <div className="space-y-2">
        <div className="relative">
          <Input.TextArea
            rows={3}
            placeholder="Nhập yêu cầu để AI tạo nội dung (Ví dụ: Viết mô tả chuẩn đầu ra PLO môn học Kiến trúc Phần mềm...)"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerateAiText();
              }
            }}
            className="rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:shadow-sm text-xs p-3 leading-relaxed text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 italic">Nhấn Enter để gửi request</span>
          <Button
            type="primary"
            size="middle"
            icon={isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            onClick={() => handleGenerateAiText()}
            disabled={!promptText.trim() || isGenerating}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-xs px-4 h-8 flex items-center gap-1.5 shadow-sm border-none"
          >
            <span>{isGenerating ? 'Đang tạo...' : 'Gửi yêu cầu'}</span>
          </Button>
        </div>
      </div>

      {/* Streaming Output Box */}
      {(isGenerating || streamedText) && (
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70 font-semibold">
            <div className="flex items-center gap-2 text-slate-700">
              <Bot size={15} className="text-blue-600" />
              <span>{isGenerating ? 'AI đang sinh nội dung...' : 'Kết quả tạo từ AI:'}</span>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-1.5 text-blue-600 text-[11px]">
                <Loader2 size={13} className="animate-spin" />
                <span>Streaming...</span>
              </div>
            )}
          </div>

          <div className="ck-content max-h-[300px] overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700 custom-ai-scrollbar">
            <div dangerouslySetInnerHTML={{ __html: streamedText }} />
            {isGenerating && (
              <span className="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle" />
            )}
          </div>

          {hasCompletedStream && (
            <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <Button
                size="small"
                icon={<RefreshCw size={13} />}
                onClick={() => handleGenerateAiText()}
                className="bg-white hover:bg-slate-100 border-slate-200 text-slate-600 text-xs rounded-lg font-medium h-8"
              >
                Tạo lại
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  icon={<PlusCircle size={13} />}
                  onClick={() => handleApplyContent('append')}
                  className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 text-xs rounded-lg font-semibold h-8"
                >
                  Chèn vào cuối
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<Replace size={13} />}
                  onClick={() => handleApplyContent('replace')}
                  className="bg-blue-600 hover:bg-blue-700 border-none text-xs font-semibold rounded-lg h-8 px-3 shadow-xs"
                >
                  Thay thế tất cả
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`ck-editor-wrapper rounded-lg border transition-colors relative ${
        isFocused ? 'is-focused' : ''
      } ${error ? 'has-error' : ''} ${disabled ? 'is-readonly' : ''}`}
      style={{ '--ck-min-height': `${minHeight}px` } as any}
    >
      {!disabled && (
        <div className="absolute top-1.5 right-2 z-10 flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Sparkles size={14} className="text-indigo-600 animate-pulse" />}
            onClick={() => setIsAiOpen(true)}
            className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200/80 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-lg px-2.5 h-7 flex items-center gap-1 shadow-sm transition-all hover:scale-105"
          >
            <span>Nhờ AI viết</span>
          </Button>

          <Modal
            open={isAiOpen}
            onCancel={() => setIsAiOpen(false)}
            footer={null}
            width={540}
            centered
            destroyOnClose
            styles={{ body: { padding: 0 } }}
            className="ai-assistant-modal"
          >
            {aiPopoverContent}
          </Modal>
        </div>
      )}

      {disabled ? (
        <div
          className="ck-content prose prose-sm max-w-none px-4 py-3 text-slate-800"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ 
            __html: value || '<p class="text-slate-400 italic">Không có nội dung</p>' 
          }}
        />
      ) : (
        <CKEditor
          editor={ClassicEditor}
          config={editorConfig}
          data={initialDataRef.current}
          onReady={(editor: any) => {
            editorInstanceRef.current = editor;
            isEditorReadyRef.current = true;
            editor.editing.view.change((writer: any) => {
              writer.setStyle(
                'min-height',
                `${minHeight}px`,
                editor.editing.view.document.getRoot()
              );
            });
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (editorInstanceRef.current && isEditorReadyRef.current) {
              const data = editorInstanceRef.current.getData();
              if (data !== lastEmittedDataRef.current) {
                lastEmittedDataRef.current = data;
                onChange(data);
              }
            }
          }}
        />
      )}

      <style jsx global>{`
        /* Sync with old system styles */
        .ck-editor-wrapper {
          border-color: #e2e8f0;
          background: #fff;
        }
        .ck-editor-wrapper.is-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .ck-editor-wrapper.has-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .ck-editor-wrapper.is-readonly {
          background-color: #f8fafc;
        }

        .ck-editor-wrapper .ck.ck-editor {
          border: none !important;
        }
        .ck-editor-wrapper .ck-toolbar {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          border-radius: 0 !important;
          background: #f8fafc !important;
          padding: 4px 8px !important;
          padding-right: 110px !important; /* Space for AI Assistant Button */
        }
        .ck-editor-wrapper .ck-content {
          border: none !important;
          border-radius: 0 !important;
          min-height: var(--ck-min-height, 220px);
          padding: 12px 16px !important;
          font-size: 0.875rem !important;
          line-height: 1.65 !important;
          color: #1e293b !important;
        }
        .ck-editor-wrapper .ck.ck-button {
          border-radius: 6px !important;
        }
        .ck-editor-wrapper .ck.ck-button:hover:not(.ck-disabled),
        .ck-editor-wrapper .ck.ck-button.ck-on {
          background: #e2e8f0 !important;
        }
        .ck-editor-wrapper .ck.ck-button.ck-on {
          background: #dbeafe !important;
          color: #2563eb !important;
        }
        
        /* Dropdown panels */
        .ck.ck-dropdown__panel {
          border-radius: 8px !important;
          box-shadow: 0 4px 16px 0 rgb(0 0 0 / 0.1) !important;
        }

        /* Content typography */
        .ck-content h1 { font-size: 1.75rem; font-weight: 700; margin: 0.75em 0 0.3em; color: #0f172a; }
        .ck-content h2 { font-size: 1.375rem; font-weight: 600; margin: 0.75em 0 0.3em; color: #1e293b; }
        .ck-content h3 { font-size: 1.125rem; font-weight: 600; margin: 0.6em 0 0.25em; color: #1e293b; }
        .ck-content h4 { font-size: 1rem; font-weight: 600; margin: 0.5em 0 0.2em; color: #1e293b; }
        .ck-content p { margin: 0 0 0.5em; }
        .ck-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.4em 0 !important; }
        .ck-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.4em 0 !important; }
        .ck-content li { margin-bottom: 0.25em; }
        .ck-content a { color: #2563eb; text-decoration: underline; }
        
        /* Table styles */
        .ck-content table { border-collapse: collapse; width: 100%; font-size: 0.8125rem; }
        .ck-content table td, .ck-content table th { border: 1px solid #cbd5e1; padding: 6px 10px; }
        .ck-content table th { background: #f1f5f9; font-weight: 600; }

        /* Custom AI Scrollbar */
        .custom-ai-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-ai-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-ai-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-ai-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* AI Popover Overrides */
        .ai-assistant-popover .ant-popover-inner {
          padding: 0 !important;
          border-radius: 16px !important;
          box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.08) !important;
          border: 1px solid #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
}

