'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Modal, Button, Tag, Input, Tooltip, message } from 'antd';
import { Sparkles, Send, Loader2, RefreshCw, Bot, Replace, Settings2, AlertCircle, Code, LayoutDashboard } from 'lucide-react';
import { fetchWithTokenRefresh } from '@/services/api';
import { userAiService } from '@/services/userAiService';
import { AiParsedResult, AiAssistantModalProps } from './types';
import {
  parsePeoContent,
  parsePloContent,
  parseCoContent,
  parseCloListContent,
  parseS5AllContent,
  parseMatrixContent,
  parseS2AllContent,
  parseFacilitiesContent,
  formatFacilitiesToHtml,
  parseCourseDescriptionContent,
  parseMaterialContent,
  parseSyllabusContent,
  parseAssessmentContent,
  parseSurveyQuestionsContent,
  FacilitiesParsedResult,
  CourseDescriptionParsedResult,
  MaterialParsedResult,
  MaterialParsedItem,
  SyllabusParsedResult,
  AssessmentParsedResult,
  SurveyQuestionsParsedResult,
  extractJsonFromText,
} from './aiParsers';
import { getDefaultPrompts } from './aiConstants';
import { useAiStream } from './useAiStream';
import { useAiModelSelection } from './useAiModelSelection';
import { AiStatusStrip } from './AiStatusStrip';
import { ModelConfigPanel } from './ModelConfigPanel';
import { cn } from '@/lib/utils';

export * from './types';
export * from './aiParsers';

const buildMatrixPreviewHtml = (
  analysis: string | undefined,
  mappings: Record<string, string[]> | undefined,
  pos: Array<{ code?: string; content?: string }>,
  plos: Array<{ code?: string; content?: string; pis?: Array<{ code?: string; content?: string }> }>,
  isStreaming?: boolean,
  activePo?: string
): string => {
  const allPis: Array<{ code: string; content: string; ploCode: string }> = [];
  (plos || []).forEach((plo, ploIdx) => {
    const ploCode = plo.code || `PLO${ploIdx + 1}`;
    (plo.pis || []).forEach((pi, piIdx) => {
      allPis.push({
        code: (pi.code || `PI${ploIdx + 1}.${piIdx + 1}`).toUpperCase().trim(),
        content: pi.content || '',
        ploCode,
      });
    });
  });

  // Fallback nếu metadata plos rỗng thì gom từ mappings
  if (allPis.length === 0 && mappings) {
    const uniquePis = Array.from(new Set(Object.values(mappings).flat())).sort();
    uniquePis.forEach(piCode => {
      allPis.push({ code: piCode.toUpperCase().trim(), content: '', ploCode: '' });
    });
  }

  const effectivePos = (pos && pos.length > 0)
    ? pos
    : mappings
    ? Object.keys(mappings).map(code => ({ code, content: '' }))
    : [];

  let totalChecked = 0;
  const rowsHtml = effectivePos.map((po, poIdx) => {
    const poCode = (po.code || `PO${poIdx + 1}`).toUpperCase().trim();
    const mapped = (mappings?.[poCode] || []).map(x => x.toUpperCase().trim());
    const isCurrentActive = isStreaming && activePo === poCode && mapped.length === 0;

    if (isCurrentActive && allPis.length > 0) {
      return `<tr class="bg-blue-50/30">
        <td class="p-1.5 border border-blue-200 font-bold text-blue-700 text-left bg-blue-50/70 whitespace-nowrap">${poCode}</td>
        <td colspan="${allPis.length}" class="p-1.5 text-center text-[10px] text-blue-600 font-medium italic border border-blue-200">
          <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>Đang đối sánh và liên kết các chỉ số PI cho ${poCode}...</span>
        </td>
      </tr>`;
    }

    const cells = allPis.map(pi => {
      const isMatch = mapped.includes(pi.code);
      if (isMatch) totalChecked++;
      return isMatch
        ? `<td class="p-1 text-center bg-blue-50/70 border border-slate-200 font-bold text-blue-600 text-xs">✓</td>`
        : `<td class="p-1 text-center border border-slate-200 text-slate-300 text-xs">-</td>`;
    }).join('');

    return `<tr>
      <td class="p-1.5 border border-slate-200 font-semibold text-slate-800 text-left bg-slate-50/90 whitespace-nowrap">${poCode}</td>
      ${cells}
    </tr>`;
  }).join('');

  const headersHtml = allPis.map(pi =>
    `<th class="p-1 border border-slate-200 text-center text-[10px] font-bold text-slate-700 bg-slate-100 whitespace-nowrap" title="${pi.content}">${pi.code}</th>`
  ).join('');

  return `
    <div class="space-y-2 text-xs animate-in fade-in duration-150">
      ${isStreaming ? `
        <div class="p-2.5 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-lg text-xs flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0"></div>
          <span><strong>Đang phân tích tương quan:</strong> ${analysis || 'Đang thiết lập ma trận tương quan chuẩn OBE...'}<span class="inline-block w-1.5 h-3 bg-blue-600 ml-1 animate-pulse align-middle"></span></span>
        </div>
      ` : `
        <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <span class="font-bold">✓ Hợp lệ:</span>
          <span>${analysis || 'Đã phân tích tương quan giữa các Mục tiêu đào tạo (PO) và Chỉ số đo lường (PI) theo chuẩn OBE.'}</span>
        </div>
      `}
      <div class="overflow-x-auto border border-slate-200 rounded-lg max-w-full">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th class="p-1.5 border border-slate-200 text-left font-bold text-slate-700 bg-slate-100 text-xs min-w-[70px]">PO \\ PI</th>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        ${isStreaming ? `
          <span class="flex items-center gap-1.5 text-blue-600 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
            Đang ánh xạ theo thời gian thực (${totalChecked} ô đã liên kết)...
          </span>
        ` : `
          <span>Tổng số ô liên kết được đề xuất: <strong class="text-blue-600 font-semibold">${totalChecked}</strong> ô</span>
          <span class="italic text-[10px]">Nhấn "Áp dụng vào biểu mẫu" để điền tự động vào bảng ma trận chính</span>
        `}
      </div>
    </div>
  `;
};

const buildPeoPreviewHtml = (
  mucTieuChung: string | undefined,
  peos: Array<{ code?: string; content: string; isInProgress?: boolean }>,
  isStreaming?: boolean
): string => {
  const items = peos.map((item, idx) => `
    <div class="flex items-start gap-2 p-2 rounded-lg bg-white border ${item.isInProgress && isStreaming ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}">
      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-mono">${item.code || `PO${idx + 1}`}</span>
      <span class="text-xs text-slate-700 leading-relaxed">
        ${item.content}
        ${item.isInProgress && isStreaming ? '<span class="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle"></span>' : ''}
      </span>
    </div>
  `).join('');

  return `
    <div class="space-y-2 text-xs animate-in fade-in duration-150">
      ${mucTieuChung ? `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs">
          <strong class="text-slate-800">Mục tiêu chung:</strong> ${mucTieuChung.replace(/<\/?p>/g, '')}
          ${isStreaming && peos.length === 0 ? '<span class="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle"></span>' : ''}
        </div>
      ` : ''}
      ${peos.length > 0 ? `
        <div class="font-semibold text-slate-700 text-xs pt-0.5">Các mục tiêu cụ thể (PO):</div>
        <div class="space-y-1.5">${items}</div>
      ` : ''}
      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang soạn thảo các mục tiêu đào tạo...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildPloPreviewHtml = (
  chuanDauRaChung: string | undefined,
  plos: Array<{ code: string; domain: string; content: string; pis: Array<{ code: string; content: string }>; isInProgress?: boolean }>,
  isStreaming?: boolean
): string => {
  const domainColors: Record<string, string> = {
    KNOWLEDGE: 'bg-blue-50 text-blue-700 border-blue-200',
    SKILL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    AUTONOMY: 'bg-amber-50 text-amber-700 border-amber-200',
    ATTITUDE: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const domainNames: Record<string, string> = {
    KNOWLEDGE: 'Kiến thức',
    SKILL: 'Kỹ năng',
    AUTONOMY: 'Tự chủ & Trách nhiệm',
    ATTITUDE: 'Thái độ & Phẩm chất',
  };

  const ploItems = plos.map(plo => {
    const badgeColor = domainColors[plo.domain] || 'bg-slate-50 text-slate-700 border-slate-200';
    const domainLabel = domainNames[plo.domain] || plo.domain;
    const piList = (plo.pis || []).map((pi: { code: string; content: string }) => `
      <div class="flex items-start gap-1.5 text-[11px] text-slate-600 pl-1">
        <span class="font-mono font-bold text-slate-500 shrink-0">${pi.code}:</span>
        <span class="leading-relaxed">${pi.content}</span>
      </div>
    `).join('');

    return `
      <div class="p-2.5 rounded-xl bg-white border ${plo.isInProgress && isStreaming ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'} space-y-1.5">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 font-mono">${plo.code}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}">${domainLabel}</span>
          </div>
        </div>
        <p class="text-xs text-slate-800 font-medium mb-1 leading-relaxed">
          ${plo.content}
          ${plo.isInProgress && isStreaming ? '<span class="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle"></span>' : ''}
        </p>
        ${piList ? `
          <div class="pt-1.5 border-t border-slate-100 space-y-1 bg-slate-50/50 p-2 rounded-lg">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chỉ số đo lường (PI):</div>
            ${piList}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-2 text-xs animate-in fade-in duration-150">
      ${chuanDauRaChung ? `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs">
          <strong class="text-slate-800">Chuẩn đầu ra chung:</strong> ${chuanDauRaChung.replace(/<\/?p>/g, '')}
          ${isStreaming && plos.length === 0 ? '<span class="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle"></span>' : ''}
        </div>
      ` : ''}
      ${plos.length > 0 ? `
        <div class="font-semibold text-slate-700 text-xs pt-0.5">Danh sách Chuẩn đầu ra (PLO & PI):</div>
        <div class="space-y-1.5">${ploItems}</div>
      ` : ''}
      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang phân bổ chuẩn đầu ra và chỉ số đo lường...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildCoPreviewHtml = (
  cos: Array<{ code?: string; domain?: string; content: string; isInProgress?: boolean }>,
  isStreaming?: boolean
): string => {
  const domainMeta: Record<string, { label: string; color: string; border: string; bg: string }> = {
    KNOWLEDGE: { label: 'Kiến thức', color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' },
    SKILL: { label: 'Kỹ năng', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' },
    AUTONOMY: { label: 'Tự chủ & Trách nhiệm', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50' },
  };

  const items = cos.map((co, idx) => {
    const meta = domainMeta[co.domain || 'KNOWLEDGE'] || domainMeta.KNOWLEDGE;
    return `
      <div class="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 font-mono">${co.code || `CO${idx + 1}`}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${meta.bg} ${meta.color} border ${meta.border}">${meta.label}</span>
        </div>
        <div class="text-xs text-slate-700 leading-relaxed flex-1">
          ${co.content}
          ${co.isInProgress && isStreaming ? '<span class="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle"></span>' : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-2 text-xs animate-in fade-in duration-150">
      <div class="font-semibold text-slate-700 text-xs">Mục tiêu học phần (Course Objectives - CO):</div>
      <div class="space-y-2">${items}</div>
      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-1">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang đề xuất các mục tiêu CO theo Thông tư 17...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildCloPreviewHtml = (
  clos: Array<{ code?: string; content: string; bloomLevel?: string; masteryLevel?: string; mappedPlos?: string[]; isInProgress?: boolean }>,
  isStreaming?: boolean
): string => {
  const bloomNames: Record<string, string> = {
    '1': 'Bloom 1 (Nhớ)',
    '2': 'Bloom 2 (Hiểu)',
    '3': 'Bloom 3 (Vận dụng)',
    '4': 'Bloom 4 (Phân tích)',
    '5': 'Bloom 5 (Đánh giá)',
    '6': 'Bloom 6 (Sáng tạo)',
  };

  const items = clos.map((clo, idx) => {
    const bName = bloomNames[clo.bloomLevel || '3'] || `Bloom ${clo.bloomLevel || '3'}`;
    const mPlos = Array.isArray(clo.mappedPlos) && clo.mappedPlos.length > 0
      ? clo.mappedPlos.map(pi => `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">${pi}</span>`).join(' ')
      : '<span class="text-slate-400 italic text-[10px]">Chưa ánh xạ</span>';

    return `
      <div class="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white font-mono">${clo.code || `CLO${idx + 1}`}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">${bName}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">Mức độ: ${clo.masteryLevel || 'R'}</span>
          </div>
          <div class="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Ánh xạ PI:</span> ${mPlos}
          </div>
        </div>
        <div class="text-xs text-slate-700 leading-relaxed">
          ${clo.content}
          ${clo.isInProgress && isStreaming ? '<span class="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle"></span>' : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-2 text-xs animate-in fade-in duration-150">
      <div class="font-semibold text-slate-700 text-xs">Chuẩn đầu ra học phần (CLO - Bloom's Taxonomy):</div>
      <div class="space-y-2">${items}</div>
      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-1">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang đề xuất các Chuẩn đầu ra CLO theo thang Bloom...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildCloMatrixPreviewHtml = (
  analysis: string | undefined,
  mappings: Record<string, string[]> | undefined,
  clos: Array<{ code?: string; content?: string }>,
  plos: Array<{ code?: string; content?: string; pis?: Array<{ code?: string; content?: string }> }>,
  isStreaming?: boolean
): string => {
  const allPis: Array<{ code: string; content: string; ploCode: string }> = [];
  (plos || []).forEach((plo, ploIdx) => {
    const ploCode = plo.code || `PLO${ploIdx + 1}`;
    (plo.pis || []).forEach((pi, piIdx) => {
      allPis.push({
        code: (pi.code || `PI${ploIdx + 1}.${piIdx + 1}`).toUpperCase().trim(),
        content: pi.content || '',
        ploCode,
      });
    });
  });

  if (allPis.length === 0 && mappings) {
    const uniquePis = Array.from(new Set(Object.values(mappings).flat())).sort();
    uniquePis.forEach(piCode => {
      allPis.push({ code: piCode.toUpperCase().trim(), content: '', ploCode: '' });
    });
  }

  const effectiveClos = (clos && clos.length > 0)
    ? clos
    : mappings
    ? Object.keys(mappings).map(code => ({ code, content: '' }))
    : [];

  let totalChecked = 0;
  const rowsHtml = effectiveClos.map((c, cIdx) => {
    const cCode = (c.code || `CLO${cIdx + 1}`).toUpperCase().trim();
    const mapped = (mappings?.[cCode] || []).map(x => x.toUpperCase().trim());

    const cells = allPis.map(pi => {
      const isMatch = mapped.includes(pi.code);
      if (isMatch) totalChecked++;
      return isMatch
        ? `<td class="p-1 text-center bg-blue-50/70 border border-slate-200 font-bold text-blue-600 text-xs">✓</td>`
        : `<td class="p-1 text-center border border-slate-200 text-slate-300 text-xs">-</td>`;
    }).join('');

    return `<tr>
      <td class="p-1.5 border border-slate-200 font-semibold text-slate-800 text-left bg-slate-50/90 whitespace-nowrap">${cCode}</td>
      ${cells}
    </tr>`;
  }).join('');

  const headersHtml = allPis.map(pi =>
    `<th class="p-1 border border-slate-200 text-center text-[10px] font-bold text-slate-700 bg-slate-100 whitespace-nowrap" title="${pi.content}">${pi.code}</th>`
  ).join('');

  return `
    <div class="space-y-2 text-xs animate-in fade-in duration-150">
      <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
        <span class="font-bold">✓ Ma trận đối sánh:</span>
        <span>${analysis || 'Đã phân tích tương quan giữa các CLO và các chỉ số PI của CTĐT.'}</span>
      </div>
      <div class="overflow-x-auto border border-slate-200 rounded-lg max-w-full">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th class="p-1.5 border border-slate-200 text-left font-bold text-slate-700 bg-slate-100 text-xs min-w-[70px]">CLO \\ PI</th>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Tổng số ô liên kết: <strong class="text-blue-600 font-semibold">${totalChecked}</strong> ô</span>
        <span class="italic text-[10px]">Nhấn "Áp dụng vào biểu mẫu" để tự động đánh dấu ma trận</span>
      </div>
    </div>
  `;
};

const buildS5AllPreviewHtml = (
  courseDescription: string | undefined,
  cos: Array<{ code?: string; domain?: string; content: string }>,
  clos: Array<{ code?: string; content: string; bloomLevel?: string; masteryLevel?: string; mappedPlos?: string[] }>,
  mappings: Record<string, string[]> | undefined,
  plos: Array<{ code?: string; content?: string; pis?: Array<{ code?: string; content?: string }> }>,
  isStreaming?: boolean
): string => {
  const coHtml = buildCoPreviewHtml(cos, isStreaming);
  const cloHtml = buildCloPreviewHtml(clos, isStreaming);
  const matrixHtml = mappings ? buildCloMatrixPreviewHtml('Tương quan CLO ↔ PI được thiết lập tự động.', mappings, clos, plos, isStreaming) : '';

  return `
    <div class="space-y-3.5 animate-in fade-in duration-150">
      <div class="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs flex items-center justify-between">
        <span class="font-bold flex items-center gap-1.5">
          <span>✦ Đề xuất toàn diện Học phần:</span>
          <span class="font-normal text-indigo-800">${cos.length} CO · ${clos.length} CLO · Ma trận ánh xạ CTĐT</span>
        </span>
      </div>

      ${courseDescription ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span> 1. Mô tả tóm tắt học phần
          </div>
          <div class="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-200">
            ${courseDescription}
          </div>
        </div>
      ` : ''}

      ${cos.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-600"></span> 2. Mục tiêu học phần (CO)
          </div>
          ${coHtml}
        </div>
      ` : ''}

      ${clos.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span> 3. Chuẩn đầu ra học phần (CLO)
          </div>
          ${cloHtml}
        </div>
      ` : ''}

      ${mappings && Object.keys(mappings).length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-purple-600"></span> 4. Ma trận CLO ↔ PLO/PI
          </div>
          ${matrixHtml}
        </div>
      ` : ''}
    </div>
  `;
};

const buildFacilitiesPreviewHtml = (
  data: FacilitiesParsedResult,
  isStreaming?: boolean
): string => {
  const labHtml = (data.labRequirements || []).map(r => `
    <div class="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start gap-2 shadow-2xs">
      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0 font-mono">${r.item}</span>
      <span class="text-xs text-slate-700 leading-relaxed">${r.specification}</span>
    </div>
  `).join('');

  const toolsHtml = (data.softwareTools || []).map(t => {
    const licBadge = t.license ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">${t.license}</span>` : '';
    const verBadge = t.version ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">${t.version}</span>` : '';
    return `
      <tr class="border-b border-slate-100">
        <td class="p-2 font-bold text-slate-800 text-xs">${t.name}</td>
        <td class="p-2 text-center text-xs">${verBadge || '-'}</td>
        <td class="p-2 text-slate-700 text-xs">${t.purpose || '-'}</td>
        <td class="p-2 text-center text-xs">${licBadge || '-'}</td>
      </tr>
    `;
  }).join('');

  const hwHtml = (data.hardwareDevices || []).map(h => `
    <div class="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs">
      <span class="font-bold text-slate-800">${h.name}</span>
      <span class="text-slate-600 font-mono text-[11px]">${h.specification || ''}</span>
    </div>
  `).join('');

  return `
    <div class="space-y-3 text-xs animate-in fade-in duration-150">
      <div class="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs flex items-center justify-between">
        <span class="font-bold flex items-center gap-1.5">
          <span>✦ Đề xuất Cơ sở vật chất & Phần mềm thực hành:</span>
          <span class="font-normal text-blue-800">${data.labRequirements.length} phòng/phần cứng · ${data.softwareTools.length} công cụ phần mềm</span>
        </span>
      </div>

      ${data.labRequirements.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span> 1. Phòng thực hành & Cấu hình máy tính
          </div>
          <div class="space-y-1.5">${labHtml}</div>
        </div>
      ` : ''}

      ${data.operatingSystem ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-600"></span> 2. Hệ điều hành & Nền tảng
          </div>
          <div class="text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 font-medium">
            ${data.operatingSystem}
          </div>
        </div>
      ` : ''}

      ${data.softwareTools.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span> 3. Danh mục Phần mềm & Môi trường phát triển
          </div>
          <div class="overflow-x-auto border border-slate-200 rounded-lg">
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th class="p-2">Tên phần mềm / Công cụ</th>
                  <th class="p-2 text-center">Phiên bản</th>
                  <th class="p-2">Mục đích sử dụng</th>
                  <th class="p-2 text-center">Bản quyền</th>
                </tr>
              </thead>
              <tbody>${toolsHtml}</tbody>
            </table>
          </div>
        </div>
      ` : ''}

      ${data.hardwareDevices.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-purple-600"></span> 4. Thiết bị phần cứng bổ trợ
          </div>
          <div class="space-y-1.5">${hwHtml}</div>
        </div>
      ` : ''}

      ${data.notes ? `
        <div class="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs">
          <strong>Lưu ý & Yêu cầu khác:</strong> ${data.notes}
        </div>
      ` : ''}

      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang phân tích và chuẩn hóa danh mục cơ sở vật chất...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildCourseDescriptionPreviewHtml = (
  data: CourseDescriptionParsedResult,
  isStreaming?: boolean
): string => {
  const objsHtml = (data.keyObjectives || []).map(o => `
    <li class="text-xs text-slate-700 leading-relaxed">${o}</li>
  `).join('');

  return `
    <div class="space-y-3 text-xs animate-in fade-in duration-150">
      <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
        <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span> Mô tả tổng quan học phần
        </div>
        <div class="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-200 whitespace-pre-line">
          ${data.courseDescription}
        </div>
      </div>

      ${data.keyObjectives && data.keyObjectives.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span> Mục tiêu then chốt
          </div>
          <ul class="list-disc pl-5 space-y-1">${objsHtml}</ul>
        </div>
      ` : ''}

      ${data.targetAudience ? `
        <div class="p-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-indigo-900 text-xs">
          <strong>Đối tượng người học:</strong> ${data.targetAudience}
        </div>
      ` : ''}

      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang hoàn thiện mô tả tổng quan học phần...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildMaterialPreviewHtml = (
  data: MaterialParsedResult,
  isStreaming?: boolean
): string => {
  const renderItem = (m: MaterialParsedItem, isMain: boolean) => `
    <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
      <div class="flex items-start justify-between gap-2">
        <span class="font-bold text-xs text-slate-800">${m.title}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${isMain ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
          ${isMain ? 'Giáo trình chính' : 'Tham khảo'}
        </span>
      </div>
      <div class="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
        ${m.author ? `<span>Tác giả: <strong>${m.author}</strong></span>` : ''}
        ${m.publisher ? `<span>· NXB: ${m.publisher}</span>` : ''}
        ${m.year ? `<span>· Năm: ${m.year}</span>` : ''}
      </div>
      ${m.description ? `<p class="text-xs text-slate-600 mb-0 pt-0.5">${m.description}</p>` : ''}
    </div>
  `;

  return `
    <div class="space-y-3 text-xs animate-in fade-in duration-150">
      ${data.mainMaterials.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span> Giáo trình chính (Main Materials)
          </div>
          <div class="space-y-2">${data.mainMaterials.map(m => renderItem(m, true)).join('')}</div>
        </div>
      ` : ''}

      ${data.referenceMaterials.length > 0 ? `
        <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
          <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-slate-600"></span> Tài liệu tham khảo (Reference Materials)
          </div>
          <div class="space-y-2">${data.referenceMaterials.map(m => renderItem(m, false)).join('')}</div>
        </div>
      ` : ''}

      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang tra cứu danh mục giáo trình học phần...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildSyllabusPreviewHtml = (
  data: SyllabusParsedResult,
  isStreaming?: boolean
): string => {
  const chaptersHtml = (data.chapters || []).map((ch) => {
    const topicsHtml = (ch.topics || []).map(t => {
      const clos = (t.mappedClos || []).map(c => `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">${c}</span>`).join(' ');
      const hours = [
        t.lectureHours ? `LT: ${t.lectureHours}h` : '',
        t.practiceHours ? `TH: ${t.practiceHours}h` : '',
        t.selfStudyHours ? `Tự học: ${t.selfStudyHours}h` : '',
      ].filter(Boolean).join(' · ');

      return `
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs">
          <div>
            <div class="font-semibold text-slate-800">${t.title}</div>
            ${hours ? `<div class="text-[11px] text-slate-500 font-mono pt-0.5">${hours}</div>` : ''}
          </div>
          ${clos ? `<div class="shrink-0 flex items-center gap-1">${clos}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
        <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span> ${ch.title}
        </div>
        <div class="space-y-1.5 pl-2">${topicsHtml}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-3 text-xs animate-in fade-in duration-150">
      <div class="space-y-2">${chaptersHtml}</div>
      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang xây dựng kế hoạch phân bổ bài giảng...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildAssessmentPreviewHtml = (
  data: AssessmentParsedResult,
  isStreaming?: boolean
): string => {
  const totalWeight = (data.components || []).reduce((sum, c) => sum + (c.weight || 0), 0);
  const rows = (data.components || []).map(c => {
    const clos = (c.mappedClos || []).map(clo => `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold">${clo}</span>`).join(' ');
    return `
      <tr class="border-b border-slate-100">
        <td class="p-2 font-bold text-slate-800 text-xs">${c.name}</td>
        <td class="p-2 text-center text-xs font-mono font-bold text-blue-700">${c.weight}%</td>
        <td class="p-2 text-slate-700 text-xs">${c.criteria || c.method || '-'}</td>
        <td class="p-2 text-center text-xs">${clos || '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="space-y-3 text-xs animate-in fade-in duration-150">
      <div class="p-2.5 ${totalWeight === 100 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'} border rounded-lg text-xs flex items-center justify-between">
        <span class="font-bold">✦ Tổng trọng số đánh giá: ${totalWeight}%</span>
        <span class="text-[11px]">${totalWeight === 100 ? '✓ Đạt chuẩn 100%' : '⚠ Cần cân đối lại cho đủ 100%'}</span>
      </div>

      <div class="overflow-x-auto border border-slate-200 rounded-lg">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-2">Thành phần đánh giá</th>
              <th class="p-2 text-center">Trọng số</th>
              <th class="p-2">Tiêu chí / Phương pháp</th>
              <th class="p-2 text-center">Chuẩn CLO</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang phân bổ thành phần đánh giá học phần...</span>
        </div>
      ` : ''}
    </div>
  `;
};

const buildSurveyQuestionsPreviewHtml = (
  data: SurveyQuestionsParsedResult,
  isStreaming?: boolean
): string => {
  const totalSections = data.sections?.length || 0;
  const totalQuestions = (data.sections || []).reduce((sum, sec) => sum + (sec.questions?.length || 0), 0);

  const sectionsHtml = (data.sections || []).map((sec, sIdx) => {
    const questionsHtml = (sec.questions || []).map((q, qIdx) => {
      let typeBadge = '';
      if (q.questionType === 'LIKERT_SCALE') {
        typeBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Thang đo ${q.minRating || 1}-${q.maxRating || 5}</span>`;
      } else if (q.questionType === 'SINGLE_CHOICE') {
        typeBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Trắc nghiệm chọn 1</span>`;
      } else if (q.questionType === 'MULTIPLE_CHOICE') {
        typeBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Chọn nhiều</span>`;
      } else if (q.questionType === 'SHORT_TEXT') {
        typeBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Văn bản ngắn</span>`;
      } else {
        typeBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Đoạn văn dài</span>`;
      }

      const optionsHtml = (q.options || []).map(opt =>
        `<span class="inline-flex items-center text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-normal">• ${opt.content}</span>`
      ).join(' ');

      return `
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-1.5">
              <span class="font-bold text-slate-500 font-mono text-[11px] shrink-0 pt-0.5">Câu ${qIdx + 1}.</span>
              <span class="font-semibold text-slate-800 leading-snug">
                ${q.content}
                ${q.required ? '<span class="text-rose-500 font-bold ml-1">*</span>' : ''}
              </span>
            </div>
            <div class="shrink-0">${typeBadge}</div>
          </div>
          ${q.helpText ? `<div class="text-[11px] text-slate-400 italic pl-5">${q.helpText}</div>` : ''}
          ${optionsHtml ? `<div class="flex flex-wrap gap-1.5 pt-1 pl-5">${optionsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 text-[11px] font-bold">Phần ${sIdx + 1}</span>
            <span class="font-bold text-xs text-slate-800">${sec.title}</span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono">${sec.questions?.length || 0} câu</span>
        </div>
        ${sec.description ? `<p class="text-[11px] text-slate-500 italic mb-1.5 pl-1">${sec.description}</p>` : ''}
        <div class="space-y-2">${questionsHtml || '<div class="text-slate-400 italic text-xs py-1">Chưa có câu hỏi trong phần này</div>'}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-3 text-xs animate-in fade-in duration-150">
      <div class="p-2.5 bg-blue-50/90 border border-blue-200 text-blue-900 rounded-lg text-xs space-y-1">
        <div class="flex items-center justify-between flex-wrap gap-1.5">
          <div class="font-bold flex items-center gap-1.5 text-blue-950 text-xs">
            <span>✦ ${data.title || 'Biểu mẫu khảo sát nhu cầu đào tạo'}</span>
          </div>
          <div class="flex items-center gap-2">
            ${data.targetAudience ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-blue-700 border border-blue-200">Đối tượng: ${data.targetAudience}</span>` : ''}
            <span class="text-[10px] text-blue-800 font-mono font-medium">${totalSections} phần · ${totalQuestions} câu hỏi</span>
          </div>
        </div>
        ${data.description ? `<div class="text-[11px] text-blue-800/80 leading-relaxed italic">${data.description}</div>` : ''}
      </div>

      <div class="space-y-2.5">${sectionsHtml}</div>

      ${isStreaming ? `
        <div class="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium pt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div>
          <span>AI đang phân tích và cấu trúc các phần khảo sát theo thời gian thực...</span>
        </div>
      ` : ''}
    </div>
  `;
};

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  open,
  onClose,
  contentType,
  metadata = {},
  title,
  subtitle,
  badgeLabel,
  quickPrompts,
  placeholder,
  applyButtonText = 'Áp dụng vào biểu mẫu',
  onApply,
}) => {
  const [promptText, setPromptText] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'raw'>('visual');
  const outputContainerRef = useRef<HTMLDivElement>(null);

  const {
    streamedText,
    isGenerating,
    setIsGenerating,
    hasCompletedStream,
    errorMsg,
    setErrorMsg,
    clearStream,
    startStream,
  } = useAiStream();

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
    hasDefaultConfig,
    defaultConfig,
    resetToDefault,
    currentDisplay,
    dynamicModels,
    loadingModels,
    refreshModels,
  } = useAiModelSelection(open, contentType);

  const handleClose = () => {
    setPromptText('');
    clearStream();
    setViewMode('visual');
    onClose();
  };

  const handleGenerate = async (promptToRun?: string) => {
    const finalPrompt = promptToRun || promptText;
    if (!finalPrompt.trim() || isGenerating) return;

    if (!selectedModel) {
      setIsCustomizing(true);
      message.warning('Vui lòng chọn mô hình thực thi hoặc cấu hình mô hình mặc định trước khi gửi yêu cầu.');
      return;
    }

    if (selectedProvider && selectedProvider !== 'GEMINI') {
      const hasKey = credentials.some(c => c.provider === selectedProvider && c.active);
      if (!hasKey) {
        message.warning(`Vui lòng thêm API Key cho ${selectedProvider} tại Cài đặt AI trước khi thực thi.`);
        return;
      }
    }

    try {
      clearStream();
      setIsGenerating(true);
      setErrorMsg(null);
      setViewMode('visual');

      const modelOverride = selectedModel;
      let credIdOverride: number | undefined;

      if (selectedProvider) {
        const activeCred = credentials.find(c => c.provider === selectedProvider && c.active);
        if (activeCred) credIdOverride = activeCred.id;
      }

      if (saveAsDefault && modelOverride) {
        userAiService.saveModelConfig({
          taskType: (contentType || 'DEFAULT').toUpperCase(),
          modelName: modelOverride,
          credentialId: credIdOverride,
          temperature,
          maxTokens,
          active: true,
        }).then(() => message.success(`Đã lưu ${modelOverride} làm mặc định cho tác vụ ${contentType || 'này'}`))
          .catch(err => console.warn('[AI Assistant] Save config failed:', err));
      }

      const res = await fetchWithTokenRefresh('/api/ai/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          contentType: contentType || 'GENERAL',
          metadata,
          modelName: modelOverride,
          credentialId: credIdOverride,
          temperature,
          maxTokens,
        }),
      });
      await startStream(res);
    } catch (err: unknown) {
      console.error('AI Stream Error:', err);
      setIsGenerating(false);
      setErrorMsg('Không thể kết nối đến AI service hoặc lỗi xác thực khóa API.');
    }
  };

  const parsedJson = useMemo(() => {
    if (!streamedText) return null;
    return extractJsonFromText(streamedText);
  }, [streamedText]);

  const hasValidJson = Boolean(parsedJson);

  const contextPills = useMemo(() => {
    if (!metadata || Object.keys(metadata).length === 0) return [];
    const pills: string[] = [];
    const progName = metadata['Tên CTĐT'] || metadata['Ngành đào tạo'] || metadata['Chương trình đào tạo'] || metadata.programName || metadata.majorName;
    if (progName) pills.push(String(progName));

    if (Array.isArray(metadata.pos) && metadata.pos.length > 0) {
      pills.push(`${metadata.pos.length} PO tham chiếu`);
    }
    if (Array.isArray(metadata.plos) && metadata.plos.length > 0) {
      pills.push(`${metadata.plos.length} PLO tham chiếu`);
    }
    if (metadata.matrixMappings && Object.keys(metadata.matrixMappings).length > 0) {
      pills.push(`Ma trận PO-PI tham chiếu`);
    }
    if (metadata['Tên học phần']) {
      pills.push(String(metadata['Tên học phần']));
    }
    return pills;
  }, [metadata]);

  const isS2AllContentType = (contentType || '').toUpperCase() === 'S2_ALL' || (contentType || '').toUpperCase() === 'PO_PLO_MATRIX' || (contentType || '').toUpperCase() === 'STEP2_ALL';
  const isS5AllContentType = (contentType || '').toUpperCase() === 'S5_ALL' || (contentType || '').toUpperCase() === 'STEP5_ALL';

  const parsedS2All = useMemo(() => {
    if (!isS2AllContentType || !streamedText) return null;
    return parseS2AllContent(streamedText);
  }, [isS2AllContentType, streamedText]);

  const parsedS5All = useMemo(() => {
    if (!isS5AllContentType || !streamedText) return null;
    return parseS5AllContent(streamedText);
  }, [isS5AllContentType, streamedText]);

  const parsedPeo = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'PEO' || typeUpper === 'PO') {
      return parsePeoContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedPlo = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'PLO') {
      return parsePloContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedCo = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'CO') {
      return parseCoContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedClo = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'CLO') {
      return parseCloListContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedFacilities = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'FACILITIES' || typeUpper === 'FACILITIES_REQUIREMENTS' || typeUpper === 'CO_SO_VAT_CHAT') {
      return parseFacilitiesContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedCourseDesc = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'COURSE_DESCRIPTION' || typeUpper === 'DESCRIPTION') {
      return parseCourseDescriptionContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedMaterial = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'MATERIAL' || typeUpper === 'MATERIALS' || typeUpper === 'HOC_LIEU' || typeUpper === 'GIAO_TRINH') {
      return parseMaterialContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedSyllabus = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'SYLLABUS' || typeUpper === 'OUTLINE') {
      return parseSyllabusContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedAssessment = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (typeUpper === 'ASSESSMENT') {
      return parseAssessmentContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const parsedSurveyQuestions = useMemo(() => {
    const typeUpper = (contentType || '').toUpperCase();
    if (
      typeUpper === 'SURVEY_QUESTIONS' ||
      typeUpper === 'SURVEY' ||
      typeUpper === 'KHAO_SAT' ||
      typeUpper === 'KHAO_SAT_CAU_HOI' ||
      typeUpper === 'S1_ALL' ||
      typeUpper === 'STEP1_ALL'
    ) {
      return parseSurveyQuestionsContent(streamedText);
    }
    return null;
  }, [contentType, streamedText]);

  const isMatrixContentType = (contentType || '').toUpperCase().includes('MATRIX') && !(contentType || '').toUpperCase().includes('CLO');
  const isCloMatrixContentType = (contentType || '').toUpperCase() === 'CLO_PLO_MATRIX' || (contentType || '').toUpperCase() === 'CLO_PI_MATRIX';

  const matrixValidation = useMemo(() => {
    if (!isMatrixContentType || !streamedText) return null;
    return parseMatrixContent(streamedText, metadata?.pos || [], metadata?.plos || []);
  }, [isMatrixContentType, streamedText, metadata]);

  const isMatrixInvalid = isMatrixContentType && matrixValidation ? !matrixValidation.isMatrixValid : false;

  const hasFormattedContent = useMemo(() => {
    if (hasValidJson) return true;
    if (parsedS2All && (parsedS2All.pos.length > 0 || parsedS2All.plos.length > 0)) return true;
    if (parsedS5All && (parsedS5All.cos?.length || parsedS5All.clos?.length || parsedS5All.courseDescription)) return true;
    if (parsedCo && parsedCo.cos && parsedCo.cos.length > 0) return true;
    if (parsedClo && parsedClo.clos && parsedClo.clos.length > 0) return true;
    if (parsedPeo && parsedPeo.peos && parsedPeo.peos.length > 0) return true;
    if (parsedPlo && parsedPlo.plos && parsedPlo.plos.length > 0) return true;
    if (parsedFacilities && parsedFacilities.isComplete) return true;
    if (parsedCourseDesc && parsedCourseDesc.isComplete) return true;
    if (parsedMaterial && parsedMaterial.isComplete) return true;
    if (parsedSyllabus && parsedSyllabus.isComplete) return true;
    if (parsedAssessment && parsedAssessment.isComplete) return true;
    if (parsedSurveyQuestions && parsedSurveyQuestions.sections.length > 0) return true;
    if (isMatrixContentType && matrixValidation && matrixValidation.isMatrixValid) return true;
    if (isCloMatrixContentType && parsedJson?.mappings) return true;
    if (streamedText && (streamedText.includes('<p>') || streamedText.includes('<ul>') || streamedText.includes('<table>') || streamedText.includes('<li>'))) {
      return true;
    }
    return false;
  }, [
    hasValidJson,
    parsedS2All,
    parsedS5All,
    parsedCo,
    parsedClo,
    parsedPeo,
    parsedPlo,
    parsedFacilities,
    parsedCourseDesc,
    parsedMaterial,
    parsedSyllabus,
    parsedAssessment,
    isMatrixContentType,
    matrixValidation,
    isCloMatrixContentType,
    parsedJson,
    streamedText,
  ]);

  // Auto-scroll output container while streaming raw text
  useEffect(() => {
    if (isGenerating && (!(hasValidJson || hasFormattedContent) || viewMode === 'raw') && outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [streamedText, isGenerating, hasValidJson, hasFormattedContent, viewMode]);

  const formattedOutputHtml = useMemo(() => {
    if (!streamedText) return '';

    const typeUpper = (contentType || '').toUpperCase();

    // 0. Toàn bộ Bước 2 (S2_ALL: PO + PLO + Ma trận)
    if (isS2AllContentType && parsedS2All && (parsedS2All.pos.length > 0 || parsedS2All.plos.length > 0)) {
      const peoHtml = buildPeoPreviewHtml(parsedS2All.mucTieuChung, parsedS2All.pos, false);
      const ploHtml = buildPloPreviewHtml(parsedS2All.chuanDauRaChung, parsedS2All.plos, false);
      const matrixHtml = buildMatrixPreviewHtml(
        'Đã tự động ánh xạ ma trận tương quan giữa các PO và PI được tạo.',
        parsedS2All.mappings,
        parsedS2All.pos,
        parsedS2All.plos,
        false
      );

      return `
        <div class="space-y-3.5 animate-in fade-in duration-150">
          <div class="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs flex items-center justify-between">
            <span class="font-bold flex items-center gap-1.5">
              <span>✦ Đề xuất toàn diện Bước 2:</span>
              <span class="font-normal text-indigo-800">${parsedS2All.pos.length} PO · ${parsedS2All.plos.length} PLO (${parsedS2All.plos.reduce((acc, p) => acc + (p.pis?.length || 0), 0)} PI) · Ma trận tương quan</span>
            </span>
          </div>
          <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
            <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span> 1. Mục tiêu chương trình đào tạo (PO)
            </div>
            ${peoHtml}
          </div>
          <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
            <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-600"></span> 2. Chuẩn đầu ra (PLO & PI)
            </div>
            ${ploHtml}
          </div>
          <div class="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
            <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-purple-600"></span> 3. Ma trận tích hợp (PO ↔ PI)
            </div>
            ${matrixHtml}
          </div>
        </div>
      `;
    }

    // 1. Ma trận tích hợp (PO_PI_MATRIX)
    if (isMatrixContentType) {
      if (parsedJson) {
        if (parsedJson.isValid === false || parsedJson.errorMessage) {
          return `
            <div class="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-1.5 text-xs animate-in fade-in duration-150">
              <div class="font-bold flex items-center gap-1.5 text-amber-800 text-xs">
                <span>⚠ Dữ liệu chưa hợp lệ để thiết lập ma trận</span>
              </div>
              <p class="text-xs text-amber-800 leading-relaxed mb-0">${parsedJson.errorMessage || 'Dữ liệu đầu vào chưa đủ điều kiện OBE.'}</p>
            </div>
          `;
        }

        return buildMatrixPreviewHtml(
          parsedJson.analysis,
          parsedJson.mappings || {},
          metadata?.pos || [],
          metadata?.plos || [],
          false
        );
      }

      if (matrixValidation) {
        if (!matrixValidation.isMatrixValid) {
          return `
            <div class="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-1.5 text-xs">
              <div class="font-bold flex items-center gap-1.5 text-amber-800 text-xs">
                <span>⚠ Dữ liệu chưa hợp lệ để thiết lập ma trận</span>
              </div>
              <p class="text-xs text-amber-800 leading-relaxed mb-0">${matrixValidation.matrixErrorMessage || 'Dữ liệu đầu vào chưa đủ điều kiện OBE.'}</p>
            </div>
          `;
        }
        return buildMatrixPreviewHtml(
          matrixValidation.analysis,
          matrixValidation.mappings,
          metadata?.pos || [],
          metadata?.plos || [],
          false
        );
      }
    }

    // 2. Mục tiêu đào tạo (PO / PEO)
    if (typeUpper === 'PEO' || typeUpper === 'PO') {
      if (parsedJson && (parsedJson.mucTieuChung || parsedJson.pos || parsedJson.peos)) {
        const rawPos = parsedJson.pos || parsedJson.peos || [];
        const peos = Array.isArray(rawPos)
          ? rawPos.map((p: Record<string, unknown> | string, idx: number) => ({
              code: typeof p === 'object' && p && typeof p.code === 'string' ? p.code : `PO${idx + 1}`,
              content: typeof p === 'object' && p && typeof p.content === 'string' ? p.content : String(p || ''),
            })).filter(p => p.content.trim().length > 0)
          : [];
        return buildPeoPreviewHtml(parsedJson.mucTieuChung, peos, false);
      }
      const p = parsePeoContent(streamedText);
      if (p.peos && p.peos.length > 0) {
        return buildPeoPreviewHtml(p.mucTieuChung, p.peos.map((txt, idx) => ({ code: `PO${idx + 1}`, content: txt })), false);
      }
    }

    // 3. Chuẩn đầu ra (PLO & PI)
    if (typeUpper === 'PLO') {
      if (parsedJson && (parsedJson.chuanDauRaChung || parsedJson.plos)) {
        const rawPlos = parsedJson.plos || [];
        const plos = Array.isArray(rawPlos)
          ? rawPlos.map((plo: Record<string, unknown>, idx: number) => {
              const rawPis = Array.isArray(plo.pis) ? plo.pis : [];
              const pis = rawPis.map((pi: Record<string, unknown> | string, piIdx: number) => ({
                code: typeof pi === 'object' && pi && typeof pi.code === 'string' ? pi.code : `PI${idx + 1}.${piIdx + 1}`,
                content: typeof pi === 'object' && pi && typeof pi.content === 'string' ? pi.content : String(pi || ''),
              })).filter(p => p.content.trim().length > 0);

              return {
                code: typeof plo.code === 'string' ? plo.code : `PLO${idx + 1}`,
                domain: typeof plo.domain === 'string' ? plo.domain : 'KNOWLEDGE',
                content: typeof plo.content === 'string' ? plo.content : '',
                pis,
              };
            }).filter(p => p.content.trim().length > 0)
          : [];
        return buildPloPreviewHtml(parsedJson.chuanDauRaChung, plos, false);
      }
      const p = parsePloContent(streamedText);
      if (p.plos && p.plos.length > 0) {
        return buildPloPreviewHtml(p.chuanDauRaChung, p.plos, false);
      }
    }

    // 4. Toàn bộ Bước 5 (S5_ALL: Mô tả + CO + CLO + Ma trận)
    if (isS5AllContentType && (parsedS5All?.cos?.length || parsedS5All?.clos?.length || parsedS5All?.courseDescription || parsedJson?.cos || parsedJson?.clos)) {
      const cos = parsedS5All?.cos || parsedJson?.cos || [];
      const clos = parsedS5All?.clos || parsedJson?.clos || [];
      const desc = parsedS5All?.courseDescription || parsedJson?.courseDescription || parsedJson?.description || parsedJson?.moTa;
      const mappings = parsedS5All?.mappings || parsedJson?.mappings;
      return buildS5AllPreviewHtml(desc, cos, clos, mappings, metadata?.plos || [], isGenerating);
    }

    // 5. Mục tiêu học phần (CO)
    if (typeUpper === 'CO') {
      if (parsedJson?.cos && Array.isArray(parsedJson.cos)) {
        return buildCoPreviewHtml(parsedJson.cos, isGenerating);
      }
      if (parsedCo?.cos && parsedCo.cos.length > 0) {
        return buildCoPreviewHtml(parsedCo.cos, isGenerating);
      }
    }

    // 6. Chuẩn đầu ra học phần (CLO)
    if (typeUpper === 'CLO') {
      if (parsedJson?.clos && Array.isArray(parsedJson.clos)) {
        return buildCloPreviewHtml(parsedJson.clos, isGenerating);
      }
      if (parsedClo?.clos && parsedClo.clos.length > 0) {
        return buildCloPreviewHtml(parsedClo.clos, isGenerating);
      }
    }

    // 7. Ma trận CLO ↔ PLO/PI (CLO_PLO_MATRIX)
    if (isCloMatrixContentType) {
      const mappings = parsedJson?.mappings || (extractJsonFromText(streamedText)?.mappings) || {};
      const analysis = parsedJson?.analysis || 'Đã phân tích tương quan giữa các Chuẩn đầu ra CLO và Chỉ số đo lường PI của CTĐT.';
      return buildCloMatrixPreviewHtml(analysis, mappings, metadata?.clos || [], metadata?.plos || [], isGenerating);
    }

    // 8. Cơ sở vật chất & Phần mềm thực hành (FACILITIES)
    if (typeUpper === 'FACILITIES' || typeUpper === 'FACILITIES_REQUIREMENTS' || typeUpper === 'CO_SO_VAT_CHAT') {
      if (parsedFacilities && parsedFacilities.isComplete) {
        return buildFacilitiesPreviewHtml(parsedFacilities, isGenerating);
      }
    }

    // 9. Mô tả học phần (COURSE_DESCRIPTION)
    if (typeUpper === 'COURSE_DESCRIPTION' || typeUpper === 'DESCRIPTION') {
      if (parsedCourseDesc && parsedCourseDesc.isComplete) {
        return buildCourseDescriptionPreviewHtml(parsedCourseDesc, isGenerating);
      }
    }

    // 10. Học liệu & Giáo trình (MATERIAL)
    if (typeUpper === 'MATERIAL' || typeUpper === 'MATERIALS' || typeUpper === 'HOC_LIEU' || typeUpper === 'GIAO_TRINH') {
      if (parsedMaterial && parsedMaterial.isComplete) {
        return buildMaterialPreviewHtml(parsedMaterial, isGenerating);
      }
    }

    // 11. Đề cương chi tiết / Kế hoạch giảng dạy (SYLLABUS)
    if (typeUpper === 'SYLLABUS' || typeUpper === 'OUTLINE') {
      if (parsedSyllabus && parsedSyllabus.isComplete) {
        return buildSyllabusPreviewHtml(parsedSyllabus, isGenerating);
      }
    }

    // 12. Phương pháp đánh giá (ASSESSMENT)
    if (typeUpper === 'ASSESSMENT') {
      if (parsedAssessment && parsedAssessment.isComplete) {
        return buildAssessmentPreviewHtml(parsedAssessment, isGenerating);
      }
    }

    // 13. Khảo sát nhu cầu đào tạo (SURVEY_QUESTIONS / STEP 1)
    if (
      typeUpper === 'SURVEY_QUESTIONS' ||
      typeUpper === 'SURVEY' ||
      typeUpper === 'KHAO_SAT' ||
      typeUpper === 'KHAO_SAT_CAU_HOI' ||
      typeUpper === 'S1_ALL' ||
      typeUpper === 'STEP1_ALL'
    ) {
      if (parsedSurveyQuestions && parsedSurveyQuestions.sections.length > 0) {
        return buildSurveyQuestionsPreviewHtml(parsedSurveyQuestions, isGenerating);
      }
    }

    // 13. Fallback: Nếu text chứa markdown table hoặc HTML thông thường
    let text = streamedText;
    if (text.includes('|') && text.includes('---')) {
      const lines = text.split('\n');
      let inTable = false;
      const converted = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          if (trimmed.includes('---')) return '';
          const cells = trimmed.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (!inTable) {
            inTable = true;
            return `<table class="matrix-table w-full text-xs border border-slate-300 my-2"><thead><tr class="bg-slate-100 font-semibold">${cells.map(c => `<th class="border border-slate-300 p-1.5 text-center">${c.trim()}</th>`).join('')}</tr></thead><tbody>`;
          }
          return `<tr>${cells.map(c => `<td class="border border-slate-300 p-1.5 text-center">${c.trim()}</td>`).join('')}</tr>`;
        } else {
          if (inTable) {
            inTable = false;
            return `</tbody></table><p>${line}</p>`;
          }
          return line;
        }
      });
      if (inTable) converted.push('</tbody></table>');
      text = converted.filter(Boolean).join('\n');
    }
    return text;
  }, [streamedText, isMatrixContentType, matrixValidation, parsedJson, contentType, metadata]);

  const handleApply = () => {
    if (!streamedText) return;
    let res: AiParsedResult = { rawHtml: streamedText };
    const typeUpper = (contentType || '').toUpperCase();
    if (isS2AllContentType) {
      const s = parseS2AllContent(streamedText);
      if (s) {
        res = {
          rawHtml: streamedText,
          mucTieuChung: s.mucTieuChung,
          pos: s.pos,
          peos: s.peos,
          chuanDauRaChung: s.chuanDauRaChung,
          plos: s.plos,
          mappings: s.mappings,
          matrix: s.matrix,
          isMatrixValid: true,
        };
      }
    } else if (typeUpper === 'S5_ALL' || typeUpper === 'STEP5_ALL') {
      const s = parseS5AllContent(streamedText);
      if (s) {
        res = {
          rawHtml: streamedText,
          courseDescription: s.courseDescription,
          cos: s.cos,
          clos: s.clos,
          mappings: s.mappings,
        };
      }
    } else if (typeUpper === 'PEO' || typeUpper === 'PO') {
      const p = parsePeoContent(streamedText);
      res = { rawHtml: streamedText, mucTieuChung: p.mucTieuChung, peos: p.peos };
    } else if (typeUpper === 'PLO') {
      const p = parsePloContent(streamedText);
      res = { rawHtml: streamedText, chuanDauRaChung: p.chuanDauRaChung, plos: p.plos };
    } else if (typeUpper === 'CLO') {
      const p = parseCloListContent(streamedText);
      res = { rawHtml: streamedText, clos: p.clos, mappings: p.mappings };
    } else if (typeUpper === 'CO') {
      const p = parseCoContent(streamedText);
      res = { rawHtml: streamedText, cos: p.cos };
    } else if (typeUpper === 'CLO_PLO_MATRIX' || typeUpper === 'CLO_PI_MATRIX') {
      const json = extractJsonFromText(streamedText);
      res = { rawHtml: streamedText, mappings: json?.mappings || {} };
    } else if (typeUpper === 'PO_PI_MATRIX' || typeUpper === 'MATRIX' || typeUpper === 'MATRIX_PO_PI') {
      const p = parseMatrixContent(streamedText, metadata?.pos || [], metadata?.plos || []);
      if (!p.isMatrixValid) {
        message.error(p.matrixErrorMessage || 'Dữ liệu đầu vào chưa hợp lệ để áp dụng vào ma trận.');
        return;
      }
      res = { rawHtml: streamedText, matrix: p.matrix, isMatrixValid: true };
    } else if (typeUpper === 'FACILITIES' || typeUpper === 'FACILITIES_REQUIREMENTS' || typeUpper === 'CO_SO_VAT_CHAT') {
      const p = parseFacilitiesContent(streamedText);
      if (p) {
        const html = formatFacilitiesToHtml(p);
        res = {
          rawHtml: html,
          facilitiesRequirements: html,
          facilitiesJson: p,
        };
      }
    } else if (typeUpper === 'COURSE_DESCRIPTION' || typeUpper === 'DESCRIPTION') {
      const p = parseCourseDescriptionContent(streamedText);
      if (p) {
        res = {
          rawHtml: p.courseDescription,
          courseDescription: p.courseDescription,
        };
      }
    } else if (typeUpper === 'MATERIAL' || typeUpper === 'MATERIALS' || typeUpper === 'HOC_LIEU' || typeUpper === 'GIAO_TRINH') {
      const p = parseMaterialContent(streamedText);
      if (p) {
        res = {
          rawHtml: streamedText,
          materials: p,
        };
      }
    } else if (typeUpper === 'SYLLABUS' || typeUpper === 'OUTLINE') {
      const p = parseSyllabusContent(streamedText);
      if (p) {
        res = {
          rawHtml: streamedText,
          chapters: p.chapters,
        };
      }
    } else if (typeUpper === 'ASSESSMENT') {
      const p = parseAssessmentContent(streamedText);
      if (p) {
        res = {
          rawHtml: streamedText,
          assessmentComponents: p.components,
        };
      }
    } else if (
      typeUpper === 'SURVEY_QUESTIONS' ||
      typeUpper === 'SURVEY' ||
      typeUpper === 'KHAO_SAT' ||
      typeUpper === 'KHAO_SAT_CAU_HOI' ||
      typeUpper === 'S1_ALL' ||
      typeUpper === 'STEP1_ALL'
    ) {
      const p = parseSurveyQuestionsContent(streamedText);
      if (p) {
        res = {
          rawHtml: streamedText,
          surveyForm: {
            title: p.title,
            description: p.description,
            targetAudience: p.targetAudience,
            sections: p.sections.map(s => ({
              title: s.title,
              description: s.description,
              questions: s.questions.map(q => ({
                content: q.content,
                helpText: q.helpText,
                questionType: q.questionType,
                required: q.required,
                minRating: q.minRating,
                maxRating: q.maxRating,
                options: q.options?.map((opt, oIdx) => ({
                  content: opt.content,
                  orderIndex: opt.orderIndex || oIdx + 1,
                })),
              })),
            })),
          },
        };
      }
    }
    onApply(res);
    onClose();
  };

  const activePrompts = quickPrompts?.length ? quickPrompts : getDefaultPrompts(contentType);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={640}
      centered
      destroyOnClose
      closable={true}
      maskClosable={!isGenerating}
      keyboard={!isGenerating}
      styles={{ body: { padding: 0 } }}
    >
      <div className="w-full p-5 space-y-3.5 font-sans bg-white rounded-2xl">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>{title || 'Trợ lý AI'}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">{subtitle || 'Soạn thảo nội dung tự động dựa trên ngữ cảnh chương trình đào tạo.'}</div>
            </div>
          </div>
          <Link
            href="/ai-settings"
            target="_blank"
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/60 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shrink-0",
              isGenerating && "pointer-events-none opacity-50 cursor-not-allowed"
            )}
          >
            <Settings2 size={13} className="text-slate-500 hover:text-indigo-600" />
            <span>Cài đặt AI</span>
          </Link>
        </div>

        <AiStatusStrip
          currentDisplay={currentDisplay}
          temperature={temperature}
          isCustomizing={isCustomizing}
          onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
          disabled={isGenerating}
        />

        {contextPills.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700 flex items-center gap-1 shrink-0">
              <Sparkles size={12} className="text-indigo-600" /> Ngữ cảnh tham chiếu:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {contextPills.map((pill, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[10.5px] shadow-2xs">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        )}

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
            contentType={contentType}
            hasDefaultConfig={hasDefaultConfig}
            defaultConfig={defaultConfig}
            onResetToDefault={resetToDefault}
            dynamicModels={dynamicModels}
            loadingModels={loadingModels}
            onRefreshModels={refreshModels}
            disabled={isGenerating}
          />
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
            <div className="font-semibold flex items-center gap-1.5"><AlertCircle size={14} className="text-rose-600 shrink-0" /><span>{errorMsg}</span></div>
            <p className="text-[11px] text-rose-600 mb-0">Vui lòng kiểm tra lại hạn ngạch hoặc API Key tại <Link href="/ai-settings" target="_blank" className="font-semibold underline text-rose-800">Cấu hình AI Cá nhân</Link>.</p>
          </div>
        )}

        {!streamedText && !isGenerating && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý câu lệnh thường dùng:</div>
            <div className="flex flex-col gap-1.5">
              {activePrompts.map((qp, idx) => (
                <Tooltip key={idx} title={qp} placement="topLeft" mouseEnterDelay={0.15}>
                  <button
                    type="button"
                    title={qp}
                    disabled={isGenerating}
                    onClick={() => {
                      if (isGenerating) return;
                      setPromptText(qp);
                      if (!selectedModel) {
                        setIsCustomizing(true);
                        message.warning('Vui lòng chọn mô hình thực thi tại mục Tùy chỉnh mô hình trước khi gửi yêu cầu.');
                        return;
                      }
                      handleGenerate(qp);
                    }}
                    className={cn(
                      "group flex items-start justify-between text-xs text-slate-700 bg-slate-50 hover:bg-blue-50/80 hover:text-blue-700 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-blue-200 transition-all text-left font-medium gap-2",
                      isGenerating ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                    )}
                  >
                    <span className="line-clamp-2 leading-relaxed flex-1">{qp}</span>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5">Áp dụng →</span>
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <Input.TextArea
            rows={3}
            placeholder={placeholder || 'Nhập yêu cầu để AI gợi ý nội dung...'}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!selectedModel) {
                  setIsCustomizing(true);
                  message.warning('Vui lòng chọn mô hình thực thi tại mục Tùy chỉnh mô hình trước khi gửi yêu cầu.');
                  return;
                }
                handleGenerate();
              }
            }}
            className="rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:shadow-sm text-xs p-3 leading-relaxed text-slate-800 placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 italic">Nhấn Enter để gửi yêu cầu</span>
            <Tooltip
              title={
                !selectedModel
                  ? 'Vui lòng chọn mô hình ở mục Tùy chỉnh mô hình hoặc cấu hình mô hình mặc định trước khi gửi'
                  : undefined
              }
            >
              <span>
                <Button
                  type="primary"
                  size="middle"
                  icon={isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  onClick={() => handleGenerate()}
                  disabled={!promptText.trim() || isGenerating || !selectedModel}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-xs px-4 h-8 flex items-center gap-1.5 shadow-sm border-none cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <span>{isGenerating ? 'Đang xử lý...' : 'Gửi yêu cầu'}</span>
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>

        {(isGenerating || streamedText) && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70 font-semibold">
              <div className="flex items-center gap-2 text-slate-700">
                <Bot size={15} className="text-blue-600" />
                <span>
                  {isGenerating && !(hasValidJson || hasFormattedContent)
                    ? 'AI đang phản hồi thời gian thực...'
                    : (hasValidJson || hasFormattedContent)
                    ? 'Đề xuất từ AI:'
                    : 'Kết quả phản hồi từ AI:'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-blue-600 text-[11px]">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang truyền luồng...</span>
                  </div>
                )}
                {(hasValidJson || hasFormattedContent) && (
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setViewMode('visual')}
                      className={cn(
                        'px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1',
                        viewMode === 'visual'
                          ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <LayoutDashboard size={12} />
                      <span>Trực quan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('raw')}
                      className={cn(
                        'px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1',
                        viewMode === 'raw'
                          ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <Code size={12} />
                      <span>{hasValidJson ? 'Mã JSON' : 'Văn bản gốc'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={outputContainerRef}
              className="ck-content max-h-[300px] overflow-y-auto pr-1 text-xs leading-relaxed text-slate-700 custom-ai-scrollbar"
            >
              {!streamedText ? (
                <div className="py-7 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={22} className="animate-spin text-blue-600" />
                  <span className="text-xs font-medium text-slate-500">Đang kết nối AI và phân tích dữ liệu...</span>
                </div>
              ) : (hasValidJson || hasFormattedContent) && viewMode === 'visual' ? (
                <div dangerouslySetInnerHTML={{ __html: formattedOutputHtml }} />
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11.5px] text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  {streamedText}
                  {isGenerating && (
                    <span className="inline-block w-1.5 h-3.5 bg-blue-600 ml-1 animate-pulse rounded-xs align-middle" />
                  )}
                </div>
              )}
            </div>
            {hasCompletedStream && (
              <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                <Button
                  size="small"
                  icon={<RefreshCw size={13} />}
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="bg-white hover:bg-slate-100 border-slate-200 text-slate-600 text-xs rounded-lg font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo lại
                </Button>
                {isMatrixInvalid ? (
                  <Tooltip title={matrixValidation?.matrixErrorMessage || 'Dữ liệu chưa hợp lệ để áp dụng vào ma trận'}>
                    <Button
                      disabled
                      size="small"
                      className="bg-slate-100 border border-slate-200 text-slate-400 text-xs font-medium rounded-lg h-8 px-3.5 cursor-not-allowed opacity-75"
                    >
                      Chưa thể áp dụng (Dữ liệu chưa hợp lệ)
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    icon={<Replace size={13} />}
                    onClick={handleApply}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 border-none text-xs font-semibold rounded-lg h-8 px-3.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applyButtonText}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`
        .ck-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 8px 0 !important;
          font-size: 11px !important;
          background: #ffffff !important;
        }
        .ck-content th {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          padding: 6px 8px !important;
          font-weight: 600 !important;
          text-align: center !important;
          color: #334155 !important;
        }
        .ck-content td {
          border: 1px solid #cbd5e1 !important;
          padding: 6px 8px !important;
          text-align: center !important;
          color: #1e293b !important;
        }
        .ck-content ul {
          list-style-type: disc !important;
          padding-left: 20px !important;
          margin: 6px 0 !important;
        }
        .ck-content ol {
          list-style-type: decimal !important;
          padding-left: 20px !important;
          margin: 6px 0 !important;
        }
        .ck-content li {
          margin-bottom: 3px !important;
        }
      `}</style>
    </Modal>
  );
};

export default AiAssistantModal;
