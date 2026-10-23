import { DomainType, DOMAIN_OPTIONS, PO, PLO, S2PLOData } from './types';

export const getPoCode = (idx: number) => `PO${idx + 1}`;
export const getPloCode = (idx: number) => `PLO${idx + 1}`;
export const getPiCode = (ploIdx: number, piIdx: number) => `PI${ploIdx + 1}.${piIdx + 1}`;

export const getDomainLabel = (domain?: DomainType, short = true) => {
  const found = DOMAIN_OPTIONS.find((d) => d.value === domain);
  if (!found) return 'Kiến thức';
  return short ? found.shortLabel : found.label;
};

export const escapeHtml = (raw: string): string => {
  return (raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const textToInlineHtml = (raw: string): string => {
  return escapeHtml(raw).replace(/\n/g, '<br/>');
};

export function buildMucTieuHtml(s: S2PLOData): string {
  const posList = s?.pos || [];
  const posHtml = posList
    .map((po, idx) => `<p><b>${po?.code || getPoCode(idx)}.</b> ${textToInlineHtml(po?.content || '')}</p>`)
    .join('');
  return `${s?.mucTieuHeadingHtml || ''}${posHtml}`;
}

export function buildChuanDauRaHtml(s: S2PLOData): string {
  const plosList = s?.plos || [];
  const plosHtml = plosList
    .map((plo, ploIdx) => {
      const domainText = getDomainLabel(plo?.domain);
      const pisList = plo?.pis || [];
      const pisHtml = pisList
        .map(
          (pi, piIdx) =>
            `<p style="margin-left: 16px;"><b>${pi?.code || getPiCode(ploIdx, piIdx)}.</b> ${textToInlineHtml(
              pi?.content || ''
            )}</p>`
        )
        .join('');
      return `<div><p><b>${plo?.code || getPloCode(ploIdx)} [${domainText}]:</b> ${textToInlineHtml(
        plo?.content || ''
      )}</p>${pisHtml}</div>`;
    })
    .join('');
  return `${s?.chuanDauRaHeadingHtml || ''}${plosHtml}`;
}

export function buildMatrixHtml(s: S2PLOData): string {
  const posList = s?.pos || [];
  const plosList = s?.plos || [];
  if (!posList.length || !plosList.length) return '';
  const headerRow1 = `<tr><th rowspan="2" style="text-align:left;">Mục tiêu (PO)</th>${plosList
    .map((plo, ploIdx) => `<th colspan="${(plo?.pis || []).length || 1}">${plo?.code || getPloCode(ploIdx)}</th>`)
    .join('')}</tr>`;
  const headerRow2 = `<tr>${plosList
    .map((plo, ploIdx) =>
      (plo?.pis || []).map((pi, piIdx) => `<th>${pi?.code || getPiCode(ploIdx, piIdx)}</th>`).join('')
    )
    .join('')}</tr>`;
  const body = posList
    .map((po, poIdx) => {
      const cells = plosList
        .map((plo, ploIdx) =>
          (plo?.pis || []).map((_, piIdx) => `<td>${s?.matrix?.[poIdx]?.[ploIdx]?.[piIdx] ? '✓' : ''}</td>`).join('')
        )
        .join('');
      return `<tr><td><b>${po?.code || getPoCode(poIdx)}</b></td>${cells}</tr>`;
    })
    .join('');
  return `<table class="matrix-table"><thead>${headerRow1}${headerRow2}</thead><tbody>${body}</tbody></table>`;
}

export function ensureMatrixShape(pos: PO[], plos: PLO[], currentMatrix: boolean[][][]): boolean[][][] {
  const poCount = (pos || []).length;
  const ploCount = (plos || []).length;

  return Array.from({ length: poCount }, (_, poIdx) =>
    Array.from({ length: ploCount }, (_, ploIdx) => {
      const piCount = (plos?.[ploIdx]?.pis || []).length;
      return Array.from({ length: piCount }, (_, piIdx) => {
        return currentMatrix?.[poIdx]?.[ploIdx]?.[piIdx] ?? false;
      });
    })
  );
}

export function validateS2Data(current: S2PLOData): {
  errors: Record<string, string>;
  firstInvalidId: string | null;
} {
  const errors: Record<string, string> = {};
  let firstInvalidId: string | null = null;
  const hasText = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim().length > 0;

  if (!hasText(current.mucTieuHeadingHtml)) {
    errors['mucTieuHeading'] = 'Vui lòng nhập đề mục mục tiêu';
    if (!firstInvalidId) firstInvalidId = 'muc-tieu-heading-editor';
  }

  if (!current.pos || current.pos.length === 0) {
    errors['po-0'] = 'Vui lòng thêm ít nhất một mục tiêu PO';
    if (!firstInvalidId) firstInvalidId = 'po-input-0';
  } else {
    current.pos.forEach((po, idx) => {
      if (!po.content || !po.content.trim()) {
        errors[`po-${idx}`] = `Vui lòng nhập nội dung ${getPoCode(idx)}`;
        if (!firstInvalidId) firstInvalidId = `po-input-${idx}`;
      }
    });
  }

  if (!hasText(current.chuanDauRaHeadingHtml)) {
    errors['chuanDauRaHeading'] = 'Vui lòng nhập đề mục chuẩn đầu ra';
    if (!firstInvalidId) firstInvalidId = 'chuan-dau-ra-heading-editor';
  }

  if (!current.plos || current.plos.length === 0) {
    errors['plo-0'] = 'Vui lòng thêm ít nhất một PLO';
    if (!firstInvalidId) firstInvalidId = 'plo-input-0';
  } else {
    current.plos.forEach((plo, ploIdx) => {
      if (!plo.content || !plo.content.trim()) {
        errors[`plo-${ploIdx}`] = `Vui lòng nhập nội dung ${getPloCode(ploIdx)}`;
        if (!firstInvalidId) firstInvalidId = `plo-input-${ploIdx}`;
      }
      if (!plo.pis || plo.pis.length === 0) {
        errors[`pi-${ploIdx}-0`] = `Vui lòng thêm ít nhất một PI cho ${getPloCode(ploIdx)}`;
        if (!firstInvalidId) firstInvalidId = `pi-input-${ploIdx}-0`;
      } else {
        plo.pis.forEach((pi, piIdx) => {
          if (!pi.content || !pi.content.trim()) {
            errors[`pi-${ploIdx}-${piIdx}`] = `Vui lòng nhập nội dung ${getPiCode(ploIdx, piIdx)}`;
            if (!firstInvalidId) firstInvalidId = `pi-input-${ploIdx}-${piIdx}`;
          }
        });
      }
    });

    return { errors, firstInvalidId };
  }

  return { errors, firstInvalidId };
}

export function parseS2Source(data: any): S2PLOData {
  const source = data?.ploBuilder || data || {};
  const rawPlos = Array.isArray(source.plos) ? source.plos : [
    { content: '', domain: 'KNOWLEDGE', pis: [{ content: '' }, { content: '' }, { content: '' }] },
  ];
  const mappedPlos: PLO[] = rawPlos.map((plo: any, ploIdx: number) => ({
    code: plo.code || getPloCode(ploIdx),
    content: plo.content || '',
    domain: plo.domain || 'KNOWLEDGE',
    pis: Array.isArray(plo.pis)
      ? plo.pis.map((pi: any, piIdx: number) => ({
          code: pi.code || getPiCode(ploIdx, piIdx),
          content: pi.content || '',
        }))
      : [{ content: '' }],
  }));

  const rawPos = Array.isArray(source.pos) ? source.pos : Array.isArray(source.peos) ? source.peos : [{ content: '' }];
  const mappedPos: PO[] = rawPos.map((po: any, idx: number) => ({
    code: po.code || getPoCode(idx),
    content: po.content || '',
  }));

  const baseMatrix = Array.isArray(source.matrix) ? source.matrix : [];
  const shapedMatrix = ensureMatrixShape(mappedPos, mappedPlos, baseMatrix);

  return {
    mucTieuHeadingHtml: source.mucTieuHeadingHtml || '<p><b>1. Mục tiêu đào tạo (PO)</b></p>',
    chuanDauRaHeadingHtml: source.chuanDauRaHeadingHtml || '<p><b>2. Chuẩn đầu ra (PLO)</b></p>',
    pos: mappedPos,
    peos: mappedPos,
    plos: mappedPlos,
    matrix: shapedMatrix,
  };
}
