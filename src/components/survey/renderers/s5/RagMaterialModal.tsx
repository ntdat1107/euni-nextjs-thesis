'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Modal, Button, Tag, Typography, Spin, Empty, Checkbox, Segmented, Input, Tooltip, message } from 'antd';
import { Sparkles, Check, Library, Globe, Send, Settings2, RotateCcw, BookOpen, Layers } from 'lucide-react';
import { ragMaterialService, RagMaterialRecommendResponse } from '@/services/ragMaterialService';
import { MaterialItem } from './types';
import { uid } from './constants';
import { useAiModelSelection } from '@/components/common/ai/useAiModelSelection';
import { AiStatusStrip } from '@/components/common/ai/AiStatusStrip';
import { ModelConfigPanel } from '@/components/common/ai/ModelConfigPanel';
import { cn } from '@/lib/utils';

const { Text } = Typography;

interface RagMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  courseName?: string;
  courseDescription?: string;
  clos?: { code?: string; description?: string }[];
  onAddMaterials: (newMaterials: MaterialItem[]) => void;
}

const QUICK_PROMPTS = [
  'Đề xuất giáo trình chính kinh điển và tài liệu tham khảo cập nhật mới nhất',
  'Ưu tiên các sách có bài tập thực hành và ví dụ ứng dụng thực tế theo chuẩn đầu ra CLO',
  'Tìm các giáo trình đại học chuẩn mực của các trường uy tín (ĐHQG, ĐH Bách Khoa...)',
];

export const RagMaterialModal: React.FC<RagMaterialModalProps> = ({
  visible,
  onClose,
  courseName,
  courseDescription,
  clos,
  onAddMaterials,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RagMaterialRecommendResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [requireLibraryOnly, setRequireLibraryOnly] = useState<boolean>(true);
  const [promptText, setPromptText] = useState<string>('');
  const [hasQueried, setHasQueried] = useState<boolean>(false);

  // AI Model Selection & Configuration hook (standardized like CLO/PLO modals)
  const {
    credentials,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    isCustomizing,
    setIsCustomizing,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    saveAsDefault,
    setSaveAsDefault,
    dynamicModels,
    loadingModels,
    refreshModels,
    defaultConfig,
    hasDefaultConfig,
    currentDisplay,
    resetToDefault,
  } = useAiModelSelection(visible, 'MATERIAL');

  const fetchRecommendations = useCallback(
    async (libOnly: boolean = requireLibraryOnly, customPrompt?: string) => {
      setLoading(true);
      setHasQueried(true);
      try {
        const cloTexts = clos?.map(c => c.description || '').filter(Boolean) || [];
        const res = await ragMaterialService.recommend({
          courseName,
          courseDescription,
          clos: cloTexts,
          limit: 6,
          requireLibraryOnly: libOnly,
          userPrompt: customPrompt !== undefined ? customPrompt : promptText,
          modelName: selectedModel || undefined,
        });
        const items = Array.isArray(res) ? res : [];
        setRecommendations(items);
        // Auto-select all returned recommendations for convenience
        setSelectedIds(items.map(r => r.id));
      } catch (err: unknown) {
        setRecommendations([]);
        setSelectedIds([]);
        const errMsg =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
          (err as Error)?.message ||
          'Lỗi kết nối máy chủ';
        message.error('Không thể truy xuất gợi ý học liệu: ' + errMsg);
      } finally {
        setLoading(false);
      }
    },
    [clos, courseDescription, courseName, promptText, requireLibraryOnly, selectedModel]
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleApply = () => {
    const toAdd = (recommendations || [])
      .filter(r => selectedIds.includes(r.id))
      .map(
        r =>
          ({
            id: uid(),
            type: r.suggestedRole || 'main',
            title: r.title,
            author: r.author || '',
            publisher: r.publisher || '',
            year: r.publishYear || new Date().getFullYear().toString(),
            url: r.libraryLocation || (r.shelfCode ? `Giá: ${r.shelfCode}` : ''),
          } as MaterialItem)
      );

    if (toAdd.length === 0) {
      message.warning('Vui lòng chọn ít nhất một cuốn sách.');
      return;
    }

    onAddMaterials(toAdd);
    message.success(`Đã thêm ${toAdd.length} học liệu vào đề cương.`);
    onClose();
  };

  const handleApplyQuickPrompt = (qp: string) => {
    setPromptText(qp);
    fetchRecommendations(requireLibraryOnly, qp);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={760}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: '16px 20px',
          maxHeight: 'calc(85vh - 120px)',
          overflowY: 'auto',
        },
      }}
      title={
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Trợ lý AI - Gợi ý Học liệu & Giáo trình</div>
              <div className="text-[11px] text-slate-400 font-medium">
                Khớp ngữ nghĩa Vector với Thư viện trường (RAG) hoặc đề xuất Giáo trình chuẩn mực toàn cầu.
              </div>
            </div>
          </div>

          <Link
            href="/ai-settings"
            target="_blank"
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shrink-0"
          >
            <Settings2 size={13} className="text-slate-500" />
            <span>Cài đặt AI</span>
          </Link>
        </div>
      }
      footer={
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            {recommendations && recommendations.length > 0
              ? `Đã chọn ${selectedIds.length}/${recommendations.length} tài liệu`
              : hasQueried && !loading
              ? 'Chưa chọn tài liệu nào'
              : 'Nhập yêu cầu và nhấn "Gợi ý học liệu" để bắt đầu'}
          </div>
          <div className="flex items-center gap-2.5">
            <Button size="middle" onClick={onClose} className="h-9 px-4 font-medium text-xs rounded-lg">
              Đóng
            </Button>
            <Button
              size="middle"
              type="primary"
              disabled={selectedIds.length === 0 || loading}
              onClick={handleApply}
              icon={<Check size={15} />}
              className="h-9 px-5 font-semibold text-xs rounded-lg bg-blue-600 hover:bg-blue-700 border-none shadow-2xs"
            >
              Thêm vào đề cương
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 my-1">
        {/* 1. AI Model Status Strip & Config Panel (Standardized with Step 2 & Step 5) */}
        <AiStatusStrip
          currentDisplay={currentDisplay}
          temperature={temperature}
          isCustomizing={isCustomizing}
          onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
          disabled={loading}
        />

        {isCustomizing && (
          <ModelConfigPanel
            selectedProvider={selectedProvider}
            onChangeProvider={setSelectedProvider}
            selectedModel={selectedModel}
            onChangeModel={setSelectedModel}
            credentials={credentials}
            temperature={temperature}
            onChangeTemperature={setTemperature}
            maxTokens={maxTokens}
            onChangeMaxTokens={setMaxTokens}
            saveAsDefault={saveAsDefault}
            onChangeSaveAsDefault={setSaveAsDefault}
            contentType="MATERIAL"
            hasDefaultConfig={hasDefaultConfig}
            defaultConfig={defaultConfig}
            onResetToDefault={resetToDefault}
            dynamicModels={dynamicModels}
            loadingModels={loadingModels}
            onRefreshModels={refreshModels}
            disabled={loading}
          />
        )}

        {/* 2. Scope Segmented: Library Only (RAG) vs External Global Textbooks */}
        <div className="bg-slate-50 p-1 rounded-xl border border-slate-200/90">
          <Segmented
            value={requireLibraryOnly ? 'library' : 'external'}
            onChange={val => {
              const isLib = val === 'library';
              setRequireLibraryOnly(isLib);
            }}
            options={[
              {
                label: (
                  <span className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold">
                    <Library className="w-3.5 h-3.5 text-blue-700" />
                    <span>Thư viện trường (RAG Vector pgvector)</span>
                  </span>
                ),
                value: 'library',
              },
              {
                label: (
                  <span className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold">
                    <Globe className="w-3.5 h-3.5 text-slate-700" />
                    <span>Giáo trình chuẩn mực (AI Toàn cầu)</span>
                  </span>
                ),
                value: 'external',
              },
            ]}
            block
          />
        </div>

        {/* 3. Context Summary Strip */}
        <div className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Học phần:</span>
            <span className="text-slate-800 font-medium">{courseName || 'Chưa đặt tên'}</span>
            {clos && clos.length > 0 && (
              <span className="text-[11px] text-slate-500 font-normal bg-white px-2 py-0.5 rounded border border-slate-200">
                {clos.length} chuẩn đầu ra CLO tham chiếu
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {requireLibraryOnly ? 'Nguồn: 735 cuốn thư viện' : 'Nguồn: Danh mục chuẩn NXB'}
          </span>
        </div>

        {/* 4. Textarea for Custom User Request / Prompt (Just like CLO/PLO Modals) */}
        <div className="space-y-2.5 pt-1">
          <Input.TextArea
            rows={3}
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            disabled={loading}
            placeholder="Nhập yêu cầu định hướng gợi ý học liệu (ví dụ: Ưu tiên giáo trình xuất bản từ năm 2018, sách chuyên sâu về lập trình hướng đối tượng, có bài tập thực hành...)"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                fetchRecommendations(requireLibraryOnly);
              }
            }}
            className="rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-500 text-xs p-3 text-slate-800 placeholder:text-slate-400 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 italic">Nhấn Enter hoặc nút bấm bên phải để bắt đầu quét</span>
            <Button
              type="primary"
              size="middle"
              loading={loading}
              onClick={() => fetchRecommendations(requireLibraryOnly)}
              icon={<Sparkles size={14} />}
              className="h-9 px-5 font-semibold text-xs rounded-lg bg-blue-600 hover:bg-blue-700 border-none shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Đang phân tích...' : 'Gợi ý học liệu'}</span>
            </Button>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý yêu cầu nhanh:</div>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleApplyQuickPrompt(qp)}
                  className="text-left text-[11px] text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/70 px-3 py-1.5 rounded-lg border border-slate-200/80 hover:border-blue-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="line-clamp-1 flex-1">{qp}</span>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-2">Áp dụng →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Results Section (Subdued / Minimalist Output Palette) */}
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 border border-slate-100 rounded-xl bg-slate-50/50">
            <Spin />
            <Text type="secondary" className="text-xs">
              {requireLibraryOnly
                ? 'Đang đối chiếu ngữ nghĩa Vector với 735 tài liệu thư viện trường...'
                : 'Đang thẩm định và đối chiếu giáo trình chuẩn mực học thuật...'}
            </Text>
          </div>
        ) : !hasQueried ? (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
            <Layers className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
            <span>Vui lòng nhập định hướng ở trên và nhấn <strong>Gợi ý học liệu</strong> để hệ thống tìm kiếm.</span>
          </div>
        ) : !recommendations || recommendations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              requireLibraryOnly
                ? 'Chưa tìm thấy học liệu thư viện phù hợp với từ khóa môn học này.'
                : 'Không tìm thấy gợi ý giáo trình chuẩn mực cho môn học này.'
            }
          />
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between pb-1">
              <span>Danh mục học liệu đề xuất ({recommendations.length} tài liệu):</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.length === recommendations.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(recommendations.map(r => r.id));
                  }
                }}
                className="text-[11px] text-blue-600 hover:underline font-normal cursor-pointer"
              >
                {selectedIds.length === recommendations.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {recommendations.map(book => {
              const isSelected = selectedIds.includes(book.id);
              const isMain = book.suggestedRole === 'main';

              return (
                <div
                  key={book.id}
                  onClick={() => toggleSelect(book.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                    isSelected
                      ? "border-blue-400 bg-blue-50/20 shadow-2xs ring-1 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelect(book.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Header Row: Title & Subdued Academic Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-800 leading-snug">
                        {book.title}
                      </span>

                      {/* Subdued Academic Role Badge */}
                      <span
                        className={cn(
                          "text-[10.5px] font-medium px-2 py-0.5 rounded border leading-tight",
                          isMain
                            ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {isMain ? 'Giáo trình chính' : 'Sách tham khảo'}
                      </span>

                      {/* Subdued Similarity Badge */}
                      {book.similarityScore !== undefined && book.similarityScore > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100/80 border border-slate-200 px-1.5 py-0.5 rounded">
                          {Math.round(book.similarityScore * 100)}% khớp
                        </span>
                      )}
                    </div>

                    {/* Metadata Row: Author, Publisher, Year, Shelf */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap pt-0.5">
                      {book.author && (
                        <span>
                          Tác giả: <strong className="text-slate-700 font-medium">{book.author}</strong>
                        </span>
                      )}
                      {book.publisher && <span>NXB: {book.publisher}</span>}
                      {book.publishYear && <span>Năm: {book.publishYear}</span>}
                      {book.shelfCode && book.shelfCode !== 'N/A' && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-mono text-[10px] border border-slate-200">
                          <Library size={11} className="text-slate-500" /> Giá: {book.shelfCode}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {book.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 m-0 italic leading-relaxed">
                        {book.description}
                      </p>
                    )}

                    {/* Subdued Academic Reason Block */}
                    {book.relevanceReason && (
                      <div className="text-[11px] text-slate-600 bg-slate-50/90 border-l-2 border-slate-400 px-2.5 py-1 rounded-r mt-1.5 leading-relaxed">
                        {book.relevanceReason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
