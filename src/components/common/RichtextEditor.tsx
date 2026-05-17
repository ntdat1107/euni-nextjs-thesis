'use client';

import React, { useEffect, useState, useRef } from 'react';
import 'ckeditor5/ckeditor5.css';

interface RichtextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  error?: boolean;
}

export default function RichtextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled,
  minHeight = 220,
  error = false
}: RichtextEditorProps) {
  const [editorData, setEditorData] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const initEditor = async () => {
      try {
        const { CKEditor } = await import('@ckeditor/ckeditor5-react');
        const CK = await import('ckeditor5');
        
        // Load Vietnamese translation if possible
        let viTranslations;
        try {
          viTranslations = await import('ckeditor5/translations/vi.js');
        } catch (e) {
          console.warn('Vietnamese translations not found');
        }

        setEditorData({
          component: CKEditor,
          engine: CK.ClassicEditor,
          plugins: [
            CK.Essentials, CK.Undo, CK.SelectAll, CK.Paragraph, CK.Heading,
            CK.Bold, CK.Italic, CK.Underline, CK.Strikethrough, CK.RemoveFormat,
            CK.FontSize, CK.FontColor, CK.FontBackgroundColor, CK.Alignment,
            CK.List, CK.ListProperties, CK.Indent, CK.IndentBlock,
            CK.Link, CK.AutoLink, CK.HorizontalLine,
            CK.Table, CK.TableToolbar, CK.TableProperties, CK.TableCellProperties,
            CK.TableColumnResize, CK.TableCaption
          ],
          translations: viTranslations?.default
        });
      } catch (error) {
        console.error('Failed to load CKEditor 5 modular', error);
      }
    };

    initEditor();
  }, []);

  if (!editorData) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400" style={{ minHeight }}>
        Đang tải bộ soạn thảo văn bản...
      </div>
    );
  }

  const { component: CKEditorComponent, engine: ClassicEditor, plugins, translations } = editorData;

  const editorConfig = {
    plugins: plugins,
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
        { model: "paragraph", title: "Đoạn văn", class: "ck-heading_paragraph" },
        { model: "heading1", view: "h1", title: "Tiêu đề 1", class: "ck-heading_heading1" },
        { model: "heading2", view: "h2", title: "Tiêu đề 2", class: "ck-heading_heading2" },
        { model: "heading3", view: "h3", title: "Tiêu đề 3", class: "ck-heading_heading3" },
        { model: "heading4", view: "h4", title: "Tiêu đề 4", class: "ck-heading_heading4" },
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
    placeholder: placeholder || "Nhập nội dung...",
    language: "vi",
    translations: [translations].filter(Boolean),
    licenseKey: "GPL",
  };

  return (
    <div
      className={`ck-editor-wrapper rounded-lg border transition-all ${
        isFocused ? 'is-focused' : ''
      } ${error ? 'has-error' : ''} ${disabled ? 'is-readonly' : ''}`}
      style={{ '--ck-min-height': `${minHeight}px` } as any}
    >
      {disabled ? (
        <div
          className="ck-content prose prose-sm max-w-none px-4 py-3 text-slate-800"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ 
            __html: value || '<p class="text-slate-400 italic">Không có nội dung</p>' 
          }}
        />
      ) : (
        <CKEditorComponent
          editor={ClassicEditor}
          config={editorConfig}
          data={value}
          onReady={(editor: any) => {
            // Adjust editor height
            editor.editing.view.change((writer: any) => {
              writer.setStyle(
                'min-height',
                `${minHeight}px`,
                editor.editing.view.document.getRoot()
              );
            });
          }}
          onChange={(event: any, editor: any) => {
            const data = editor.getData();
            onChange(data);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
        .ck-content ul, .ck-content ol { padding-left: 1.5rem; margin: 0.4em 0; }
        .ck-content a { color: #2563eb; text-decoration: underline; }
        
        /* Table styles */
        .ck-content table { border-collapse: collapse; width: 100%; font-size: 0.8125rem; }
        .ck-content table td, .ck-content table th { border: 1px solid #cbd5e1; padding: 6px 10px; }
        .ck-content table th { background: #f1f5f9; font-weight: 600; }
      `}</style>
    </div>
  );
}
