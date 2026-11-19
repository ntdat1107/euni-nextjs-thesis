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
import { Sparkles } from 'lucide-react';
import { Button } from 'antd';
import { AiAssistantModal, parsePeoContent } from '@/components/common/ai/AiAssistantModal';
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
  showAiButton?: boolean;
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
  onApplyParsed,
  showAiButton = false,
}: RichtextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

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

  const handleApplyAi = (result: { rawHtml: string }) => {
    const newValue = result.rawHtml;
    if (editorInstanceRef.current && isEditorReadyRef.current) {
      lastEmittedDataRef.current = newValue;
      editorInstanceRef.current.setData(newValue);
    }
    onChange(newValue);
    if (onApplyParsed) {
      onApplyParsed(parsePeoContent(newValue));
    }
    setIsAiOpen(false);
  };

  return (
    <div
      className={`ck-editor-wrapper rounded-lg border transition-colors relative ${
        isFocused ? 'is-focused' : ''
      } ${error ? 'has-error' : ''} ${disabled ? 'is-readonly' : ''}`}
      style={{ '--ck-min-height': `${minHeight}px` } as any}
    >
      {!disabled && showAiButton && (
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

          <AiAssistantModal
            open={isAiOpen}
            onClose={() => setIsAiOpen(false)}
            contentType={contentType}
            metadata={metadata}
            onApply={handleApplyAi}
          />
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
          --ck-color-engine-placeholder-text: #94a3b8 !important;
        }

        /* CKEditor Placeholder Styling */
        .ck-editor-wrapper .ck.ck-editor__editable.ck-placeholder::before,
        .ck-editor-wrapper .ck.ck-editor__editable > .ck-placeholder::before,
        .ck-editor-wrapper .ck.ck-placeholder::before,
        .ck-editor-wrapper .ck .ck-placeholder::before,
        .ck-editor-wrapper .ck-content .ck-placeholder::before,
        .ck-editor-wrapper .ck-content.ck-placeholder::before,
        .ck-editor-wrapper :is(.ck.ck-placeholder, .ck .ck-placeholder):before,
        .ck-editor-wrapper :is(.ck.ck-placeholder, .ck .ck-placeholder)::before {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          font-style: italic !important;
          font-weight: 400 !important;
          opacity: 0.85 !important;
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

