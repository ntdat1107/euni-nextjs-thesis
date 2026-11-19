import { AiParsedResult } from './types';

// Safe extraction of JSON from streaming or completed LLM response
export const extractJsonFromText = (raw: string): any | null => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Nếu được bao trong markdown code fences hoàn chỉnh
  let clean = trimmed;
  if (clean.includes('```')) {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      clean = match[1].trim();
    } else {
      // Trường hợp streaming chưa đóng code fence: loại bỏ phần mở ```json
      clean = clean.replace(/^```(?:json)?\s*/i, '').trim();
    }
  }

  // 2. Thử parse trực tiếp
  try {
    return JSON.parse(clean);
  } catch (e) {}

  // 3. Tìm cặp ngoặc { ... } ngoài cùng an toàn (không dùng regex lồng nhau)
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = clean.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Thử loại bỏ trailing commas trước dấu đóng ngoặc } hoặc ]
      try {
        const sanitized = candidate.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(sanitized);
      } catch (e2) {}
    }
  }

  return null;
};

export interface PartialMatrixResult {
  analysis?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  mappings: Record<string, string[]>;
  isComplete: boolean;
}

export const parsePartialMatrix = (raw: string): PartialMatrixResult | null => {
  const json = extractJsonFromText(raw);
  if (!json) return null;

  return {
    analysis: json.analysis,
    errorMessage: json.errorMessage,
    isInvalid: json.isValid === false || Boolean(json.errorMessage),
    mappings: json.mappings || {},
    isComplete: true,
  };
};

export interface PartialPeoResult {
  mucTieuChung?: string;
  peos: Array<{ code: string; content: string }>;
  isComplete: boolean;
}

export const parsePartialPeo = (raw: string): PartialPeoResult | null => {
  const json = extractJsonFromText(raw);
  if (!json) return null;

  const rawPos = json.pos || json.peos || [];
  const peos = Array.isArray(rawPos)
    ? rawPos.map((p: any, idx: number) => ({
        code: typeof p === 'object' && p.code ? p.code : `PO${idx + 1}`,
        content: typeof p === 'object' && p.content ? p.content : String(p || ''),
      })).filter(p => p.content.trim().length > 0)
    : [];

  return {
    mucTieuChung: json.mucTieuChung,
    peos,
    isComplete: true,
  };
};

export interface PartialPloResult {
  chuanDauRaChung?: string;
  plos: Array<{
    code: string;
    domain: string;
    content: string;
    pis: Array<{ code: string; content: string }>;
  }>;
  isComplete: boolean;
}

export const parsePartialPlo = (raw: string): PartialPloResult | null => {
  const json = extractJsonFromText(raw);
  if (!json) return null;

  const rawPlos = json.plos || [];
  const plos = Array.isArray(rawPlos)
    ? rawPlos.map((plo: any, idx: number) => {
        const rawPis = plo.pis || [];
        const pis = Array.isArray(rawPis)
          ? rawPis.map((pi: any, piIdx: number) => ({
              code: typeof pi === 'object' && pi.code ? pi.code : `PI${idx + 1}.${piIdx + 1}`,
              content: typeof pi === 'object' && pi.content ? pi.content : String(pi || ''),
            })).filter(p => p.content.trim().length > 0)
          : [];

        return {
          code: plo.code || `PLO${idx + 1}`,
          domain: plo.domain || 'KNOWLEDGE',
          content: plo.content || '',
          pis,
        };
      }).filter(p => p.content.trim().length > 0)
    : [];

  return {
    chuanDauRaChung: json.chuanDauRaChung,
    plos,
    isComplete: true,
  };
};

export const parsePeoContent = (htmlOrJson: string): { rawHtml: string; mucTieuChung: string; peos: string[] } => {
  if (!htmlOrJson) return { rawHtml: '', mucTieuChung: '', peos: [] };

  // 1. Ưu tiên parse JSON (Token-efficient format)
  const json = extractJsonFromText(htmlOrJson);
  if (json && (json.mucTieuChung || json.pos || json.peos)) {
    const rawPos = json.pos || json.peos || [];
    const peos = Array.isArray(rawPos)
      ? rawPos.map((p: any) => (typeof p === 'string' ? p : p.content || '')).filter(Boolean)
      : [];
    const mucTieuChung = json.mucTieuChung ? `<p>${json.mucTieuChung}</p>` : '';
    return { rawHtml: htmlOrJson, mucTieuChung, peos };
  }

  // 2. Fallback sang parse HTML cũ
  if (typeof window === 'undefined') return { rawHtml: htmlOrJson, mucTieuChung: '', peos: [] };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOrJson, 'text/html');

    const pElements = Array.from(doc.querySelectorAll('p'));
    const mucTieuParas = pElements.filter(p => {
      const t = p.textContent?.toLowerCase() || '';
      return !t.includes('mục tiêu cụ thể') && !t.includes('peo') && !t.includes('po') && !t.includes('danh sách');
    });
    const mucTieuChung = mucTieuParas.map(p => p.outerHTML).join('').trim();

    const liElements = Array.from(doc.querySelectorAll('li'));
    let peos = liElements.map(li => {
      let text = li.textContent || '';
      text = text.replace(/^(?:PEO|PO)\s*\d+\s*[:\.\-]\s*/i, '').trim();
      return text;
    }).filter(t => t.length > 0);

    if (peos.length === 0) {
      pElements.forEach(p => {
        const text = p.textContent?.trim() || '';
        const match = text.match(/^(?:(?:PEO|PO)\s*\d+|\d+)\s*[:\.\-]\s*(.*)/i);
        if (match && match[1]) {
          peos.push(match[1].trim());
        }
      });
    }

    if (peos.length === 0) {
      const lines = htmlOrJson.split('\n');
      lines.forEach(line => {
        const text = line.replace(/<[^>]+>/g, '').trim();
        const match = text.match(/^(?:[-*•]|\d+\.)?\s*(?:(?:PEO|PO)\s*\d+)\s*[:\.\-]\s*(.*)/i);
        if (match && match[1]) {
          peos.push(match[1].trim());
        }
      });
    }

    return { rawHtml: htmlOrJson, mucTieuChung, peos };
  } catch (err) {
    return { rawHtml: htmlOrJson, mucTieuChung: '', peos: [] };
  }
};

const resolvePloDomain = (content: string, idx: number): 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY' | 'ATTITUDE' => {
  const lower = content.toLowerCase();
  if (lower.includes('kỹ năng') || lower.includes('vận dụng') || lower.includes('thực hành') || lower.includes('sử dụng')) {
    return 'SKILL';
  }
  if (lower.includes('tự chủ') || lower.includes('trách nhiệm') || lower.includes('quản lý') || lower.includes('lãnh đạo')) {
    return 'AUTONOMY';
  }
  if (lower.includes('thái độ') || lower.includes('phẩm chất') || lower.includes('đạo đức')) {
    return 'ATTITUDE';
  }
  const fallback = ['KNOWLEDGE', 'SKILL', 'AUTONOMY', 'ATTITUDE'] as const;
  return fallback[idx % 4];
};

export interface S2AllParsedResult {
  rawHtml: string;
  mucTieuChung: string;
  pos: Array<{ code: string; content: string }>;
  peos: string[];
  chuanDauRaChung: string;
  plos: Array<{
    code: string;
    domain: any;
    content: string;
    pis: Array<{ code: string; content: string }>;
  }>;
  mappings: Record<string, string[]>;
  matrix: boolean[][][];
  isComplete: boolean;
}

export const parseS2AllContent = (htmlOrJson: string): S2AllParsedResult | null => {
  if (!htmlOrJson) return null;
  const json = extractJsonFromText(htmlOrJson);
  if (!json) return null;

  const rawPos = json.pos || json.peos || [];
  const pos: Array<{ code: string; content: string }> = Array.isArray(rawPos)
    ? rawPos.map((p: any, idx: number) => ({
        code: typeof p === 'object' && p?.code ? p.code : `PO${idx + 1}`,
        content: typeof p === 'object' && p?.content ? p.content : String(p || ''),
      })).filter((p: { code: string; content: string }) => p.content.trim().length > 0)
    : [];

  const peos = pos.map(p => p.content);
  const mucTieuChung = json.mucTieuChung ? `<p>${json.mucTieuChung}</p>` : '';

  const rawPlos = Array.isArray(json.plos) ? json.plos : [];
  const plos = rawPlos.map((plo: any, idx: number) => {
    const rawPis = Array.isArray(plo.pis) ? plo.pis : [];
    const pis = rawPis.map((pi: any, piIdx: number) => ({
      code: typeof pi === 'object' && pi?.code ? pi.code : `PI${idx + 1}.${piIdx + 1}`,
      content: typeof pi === 'object' && pi?.content ? pi.content : String(pi || ''),
    })).filter((p: { code: string; content: string }) => p.content.trim().length > 0);

    return {
      code: plo.code || `PLO${idx + 1}`,
      domain: plo.domain || resolvePloDomain(plo.content || '', idx),
      content: plo.content || '',
      pis,
    };
  }).filter((p: any) => p.content.trim().length > 0);

  const chuanDauRaChung = json.chuanDauRaChung ? `<p>${json.chuanDauRaChung}</p>` : '';
  const mappings: Record<string, string[]> = json.mappings || {};

  const matrix: boolean[][][] = Array.from({ length: pos.length }, (_, poIdx) => {
    const poCode = (pos[poIdx]?.code || `PO${poIdx + 1}`).toUpperCase().trim();
    const mapped = (mappings[poCode] || []).map(x => String(x).toUpperCase().trim());

    return Array.from({ length: plos.length }, (_, ploIdx) => {
      const pis = plos[ploIdx]?.pis || [];
      return Array.from({ length: pis.length }, (_, piIdx) => {
        const piCode = (pis[piIdx]?.code || `PI${ploIdx + 1}.${piIdx + 1}`).toUpperCase().trim();
        return mapped.includes(piCode);
      });
    });
  });

  return {
    rawHtml: htmlOrJson,
    mucTieuChung,
    pos,
    peos,
    chuanDauRaChung,
    plos,
    mappings,
    matrix,
    isComplete: pos.length > 0 && plos.length > 0,
  };
};

export const parsePloContent = (htmlOrJson: string) => {
  if (!htmlOrJson) return { rawHtml: '', chuanDauRaChung: '', plos: [] };

  // 1. Ưu tiên parse JSON (Token-efficient format)
  const json = extractJsonFromText(htmlOrJson);
  if (json && Array.isArray(json.plos) && json.plos.length > 0) {
    const chuanDauRaChung = json.chuanDauRaChung ? `<p>${json.chuanDauRaChung}</p>` : '';
    const plos = json.plos.map((p: any, idx: number) => {
      const code = p.code || `PLO${idx + 1}`;
      const content = p.content || '';
      const domain = p.domain || resolvePloDomain(content, idx);
      const rawPis = Array.isArray(p.pis) ? p.pis : [];
      let pis = rawPis.map((pi: any, pIdx: number) => ({
        code: pi.code || `PI${idx + 1}.${pIdx + 1}`,
        content: typeof pi === 'string' ? pi : pi.content || '',
      })).filter((pi: any) => pi.content.length > 0);

      if (pis.length === 0) {
        pis = [
          { code: `PI${idx + 1}.1`, content: `Hiểu và giải thích các nguyên lý nền tảng của ${code}` },
          { code: `PI${idx + 1}.2`, content: `Vận dụng thực tế và triển khai hiệu quả các yêu cầu thuộc ${code}` },
        ];
      }
      return { code, domain, content, pis };
    }).filter((p: any) => p.content.length > 0);

    return { rawHtml: htmlOrJson, chuanDauRaChung, plos };
  }

  // 2. Fallback sang parse HTML cũ
  if (typeof window === 'undefined') return { rawHtml: htmlOrJson, chuanDauRaChung: '', plos: [] };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOrJson, 'text/html');

    const pElements = Array.from(doc.querySelectorAll('p'));
    const cdrParas = pElements.filter(p => {
      const t = p.textContent?.toLowerCase() || '';
      return !t.includes('plo') && !t.includes('pi ') && !t.includes('chỉ số');
    });
    const chuanDauRaChung = cdrParas.map(p => p.outerHTML).join('').trim();

    const rootUls = Array.from(doc.body.children).filter(el => el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol');
    const topLis: HTMLElement[] = [];
    if (rootUls.length > 0) {
      rootUls.forEach(ul => {
        Array.from(ul.children).forEach(child => {
          if (child.tagName.toLowerCase() === 'li') topLis.push(child as HTMLElement);
        });
      });
    } else {
      Array.from(doc.querySelectorAll('li')).forEach(li => {
        if (!li.parentElement?.closest('li')) topLis.push(li);
      });
    }

    const plos = topLis.map((li, idx) => {
      const code = `PLO${idx + 1}`;
      const childLis = Array.from(li.querySelectorAll('li'));
      let pis = childLis.map((cLi, pIdx) => {
        let cText = cLi.textContent || '';
        cText = cText.replace(/^PI\s*\d+(\.\d+)?\s*[:\.\-]\s*/i, '').trim();
        return { code: `PI${idx + 1}.${pIdx + 1}`, content: cText };
      }).filter(pi => pi.content.length > 0);

      const clone = li.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('ul, ol').forEach(nested => nested.remove());
      let content = (clone.textContent || '').replace(/^PLO\s*\d+\s*[:\.\-]\s*/i, '').trim();
      const domain = resolvePloDomain(content, idx);

      if (pis.length === 0) {
        pis = [
          { code: `PI${idx + 1}.1`, content: `Hiểu và giải thích các nguyên lý nền tảng của ${code}` },
          { code: `PI${idx + 1}.2`, content: `Vận dụng thực tế và triển khai hiệu quả các yêu cầu thuộc ${code}` },
        ];
      }

      return { code, domain, content, pis };
    }).filter(p => p.content.length > 0);

    return { rawHtml: htmlOrJson, chuanDauRaChung, plos };
  } catch (err) {
    return { rawHtml: htmlOrJson, chuanDauRaChung: '', plos: [] };
  }
};

export const parseCoContent = (html: string) => {
  if (typeof window === 'undefined') return { rawHtml: html, cos: [] };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const liElements = Array.from(doc.querySelectorAll('li'));
    const defaultDomains: Array<'KNOWLEDGE' | 'SKILL' | 'AUTONOMY'> = ['KNOWLEDGE', 'SKILL', 'AUTONOMY'];

    let cos = liElements.map((li, idx) => {
      let text = (li.textContent || '').replace(/^CO\s*\d+\s*[:\.\-]\s*/i, '').trim();
      const lower = text.toLowerCase();
      let domain: 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY' = defaultDomains[idx % 3];

      if (lower.includes('kiến thức') || lower.includes('hiểu') || lower.includes('nắm vững') || lower.includes('phân tích')) {
        domain = 'KNOWLEDGE';
      } else if (lower.includes('kỹ năng') || lower.includes('vận dụng') || lower.includes('thực hành') || lower.includes('lập trình') || lower.includes('thiết kế')) {
        domain = 'SKILL';
      } else if (lower.includes('tự chủ') || lower.includes('trách nhiệm') || lower.includes('thái độ') || lower.includes('nhóm') || lower.includes('đạo đức')) {
        domain = 'AUTONOMY';
      }

      text = text.replace(/^\((kiến thức|kỹ năng|mức tự chủ và trách nhiệm|tự chủ|thái độ)\)\s*[:\.\-]\s*/i, '').trim();
      return { code: `CO${idx + 1}`, domain, content: text };
    }).filter(c => c.content.length > 0);

    if (cos.length === 0) {
      const pElements = Array.from(doc.querySelectorAll('p'));
      pElements.forEach((p, idx) => {
        const text = p.textContent?.trim() || '';
        const match = text.match(/^(?:CO\s*\d+|\d+)\s*[:\.\-]\s*(.*)/i);
        if (match && match[1]) {
          cos.push({
            code: `CO${cos.length + 1}`,
            domain: defaultDomains[idx % 3],
            content: match[1].trim(),
          });
        }
      });
    }

    return { rawHtml: html, cos };
  } catch (err) {
    return { rawHtml: html, cos: [] };
  }
};

export interface CloParsedItem {
  code: string;
  content: string;
  bloomLevel?: string;
  masteryLevel?: string;
  mappedPlos?: string[];
}

export const parseCloListContent = (htmlOrJson: string): { rawHtml: string; clos: CloParsedItem[]; mappings?: Record<string, string[]> } => {
  if (!htmlOrJson) return { rawHtml: '', clos: [] };

  // 1. JSON
  const json = extractJsonFromText(htmlOrJson);
  if (json && typeof json === 'object') {
    const rawClos = Array.isArray(json.clos) ? json.clos : (Array.isArray(json) ? json : []);
    if (rawClos.length > 0) {
      const clos: CloParsedItem[] = rawClos.map((c: any, idx: number) => ({
        code: c.code || `CLO${idx + 1}`,
        content: typeof c === 'string' ? c : (c.content || ''),
        bloomLevel: c.bloomLevel ? String(c.bloomLevel) : '3',
        masteryLevel: c.masteryLevel || 'R',
        mappedPlos: Array.isArray(c.mappedPlos) ? c.mappedPlos : (Array.isArray(c.pis) ? c.pis : []),
      })).filter((c: CloParsedItem) => c.content.trim().length > 0);

      const mappings = json.mappings || {};
      return { rawHtml: htmlOrJson, clos, mappings };
    }
  }

  // 2. HTML fallback
  if (typeof window === 'undefined') return { rawHtml: htmlOrJson, clos: [] };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOrJson, 'text/html');
    const liElements = Array.from(doc.querySelectorAll('li'));

    const clos: CloParsedItem[] = liElements.map((li, idx) => {
      const text = (li.textContent || '').replace(/^CLO\s*\d+\s*[:\.\-]\s*/i, '').trim();
      let bloomLevel = '3';
      const lower = text.toLowerCase();
      if (lower.includes('nhớ') || lower.includes('nhận biết') || lower.includes('liệt kê')) bloomLevel = '1';
      else if (lower.includes('hiểu') || lower.includes('giải thích') || lower.includes('mô tả')) bloomLevel = '2';
      else if (lower.includes('áp dụng') || lower.includes('vận dụng') || lower.includes('thực thi') || lower.includes('sử dụng')) bloomLevel = '3';
      else if (lower.includes('phân tích') || lower.includes('so sánh')) bloomLevel = '4';
      else if (lower.includes('đánh giá') || lower.includes('thẩm định')) bloomLevel = '5';
      else if (lower.includes('sáng tạo') || lower.includes('thiết kế') || lower.includes('xây dựng')) bloomLevel = '6';

      return {
        code: `CLO${idx + 1}`,
        content: text,
        bloomLevel,
        masteryLevel: 'R',
        mappedPlos: [],
      };
    }).filter((c: CloParsedItem) => c.content.length > 0);

    return { rawHtml: htmlOrJson, clos };
  } catch (err) {
    return { rawHtml: htmlOrJson, clos: [] };
  }
};

export const parseS5AllContent = (htmlOrJson: string): {
  rawHtml: string;
  courseDescription?: string;
  cos?: Array<{ code: string; domain: 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY'; content: string }>;
  clos?: CloParsedItem[];
  mappings?: Record<string, string[]>;
} => {
  if (!htmlOrJson) return { rawHtml: '' };
  const json = extractJsonFromText(htmlOrJson);
  if (!json || typeof json !== 'object') {
    return { rawHtml: htmlOrJson };
  }

  const courseDescription = json.courseDescription || json.description || json.moTa;
  const rawCos = Array.isArray(json.cos) ? json.cos : [];
  const cos = rawCos.map((c: any, idx: number) => ({
    code: c.code || `CO${idx + 1}`,
    domain: (c.domain || 'KNOWLEDGE') as 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY',
    content: typeof c === 'string' ? c : (c.content || ''),
  })).filter((c: any) => c.content.trim().length > 0);

  const rawClos = Array.isArray(json.clos) ? json.clos : [];
  const clos: CloParsedItem[] = rawClos.map((c: any, idx: number) => ({
    code: c.code || `CLO${idx + 1}`,
    content: typeof c === 'string' ? c : (c.content || ''),
    bloomLevel: c.bloomLevel ? String(c.bloomLevel) : '3',
    masteryLevel: c.masteryLevel || 'R',
    mappedPlos: Array.isArray(c.mappedPlos) ? c.mappedPlos : [],
  })).filter((c: CloParsedItem) => c.content.trim().length > 0);

  return {
    rawHtml: htmlOrJson,
    courseDescription,
    cos: cos.length > 0 ? cos : undefined,
    clos: clos.length > 0 ? clos : undefined,
    mappings: json.mappings,
  };
};

export const parseMatrixContent = (
  htmlOrJson: string,
  pos: Array<{ code?: string; content?: string }>,
  plos: Array<{ code?: string; content?: string; pis?: Array<{ code?: string; content?: string }> }>
): {
  rawHtml: string;
  isMatrixValid: boolean;
  matrixErrorMessage?: string;
  matrix?: boolean[][][];
  analysis?: string;
  mappings?: Record<string, string[]>;
} => {
  if (!htmlOrJson) return { rawHtml: '', isMatrixValid: false };

  const poList = pos || [];
  const ploList = plos || [];
  if (poList.length === 0 || ploList.length === 0) {
    return {
      rawHtml: htmlOrJson,
      isMatrixValid: false,
      matrixErrorMessage: 'Chưa có dữ liệu Mục tiêu đào tạo (PO) hoặc Chuẩn đầu ra (PLO).',
    };
  }

  // 1. Ưu tiên parse JSON trực tiếp (Token-efficient format)
  const json = extractJsonFromText(htmlOrJson);
  if (json && typeof json === 'object') {
    if (json.isValid === false) {
      return {
        rawHtml: htmlOrJson,
        isMatrixValid: false,
        matrixErrorMessage: json.errorMessage || 'Dữ liệu đầu vào chưa hợp lệ để thiết lập ma trận.',
      };
    }

    if (json.mappings && typeof json.mappings === 'object') {
      const resultMatrix: boolean[][][] = Array.from({ length: poList.length }, (_, poIdx) =>
        Array.from({ length: ploList.length }, (_, ploIdx) => {
          const piCount = (ploList[ploIdx]?.pis || []).length;
          return Array.from({ length: piCount }, () => false);
        })
      );

      const mappings: Record<string, string[]> = {};
      Object.entries(json.mappings).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          mappings[k.toUpperCase().trim()] = v.map((x: any) => String(x).toUpperCase().trim());
        }
      });

      let matchCount = 0;
      poList.forEach((po, poIdx) => {
        const currentPoCode = (po.code || `PO${poIdx + 1}`).toUpperCase().trim();
        const targetPis = mappings[currentPoCode] || [];

        ploList.forEach((plo, ploIdx) => {
          const pis = plo.pis || [];
          pis.forEach((pi, piIdx) => {
            const currentPiCode = (pi.code || `PI${ploIdx + 1}.${piIdx + 1}`).toUpperCase().trim();
            if (targetPis.includes(currentPiCode)) {
              resultMatrix[poIdx][ploIdx][piIdx] = true;
              matchCount++;
            }
          });
        });
      });

      return {
        rawHtml: htmlOrJson,
        isMatrixValid: true,
        matrix: resultMatrix,
        analysis: json.analysis,
        mappings,
      };
    }
  }

  // 2. Fallback sang parse DOM HTML cũ
  if (typeof window === 'undefined') return { rawHtml: htmlOrJson, isMatrixValid: false };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOrJson, 'text/html');

    // Kiểm tra cờ validation error từ AI
    const invalidBox = doc.querySelector('.ai-matrix-invalid');
    const textLower = doc.body.textContent?.toLowerCase() || '';
    const hasInvalidKeyword =
      invalidBox !== null ||
      textLower.includes('dữ liệu đầu vào chưa hợp lệ') ||
      textLower.includes('chưa hợp lệ để thiết lập ma trận') ||
      textLower.includes('chưa hợp lệ để sinh ma trận') ||
      textLower.includes('không thể xây dựng ma trận');

    if (hasInvalidKeyword) {
      const errText = invalidBox?.textContent?.trim() || 'Dữ liệu PO / PLO / PI đầu vào chưa hợp lệ để thiết lập ma trận.';
      return {
        rawHtml: htmlOrJson,
        isMatrixValid: false,
        matrixErrorMessage: errText,
      };
    }

    const resultMatrix: boolean[][][] = Array.from({ length: poList.length }, (_, poIdx) =>
      Array.from({ length: ploList.length }, (_, ploIdx) => {
        const piCount = (ploList[ploIdx]?.pis || []).length;
        return Array.from({ length: piCount }, () => false);
      })
    );

    // 3. Trích xuất JSON mappings từ #ai-matrix-data nếu có
    const dataDiv = doc.querySelector('#ai-matrix-data');
    let mappings: Record<string, string[]> = {};

    if (dataDiv && dataDiv.textContent) {
      try {
        const parsed = JSON.parse(dataDiv.textContent.trim());
        if (parsed.mappings) {
          mappings = parsed.mappings;
        }
      } catch (e) {
        // Fallback sang parse table
      }
    }

    // Fallback: Quét thẻ <table> trong HTML
    if (Object.keys(mappings).length === 0) {
      const table = doc.querySelector('table');
      if (table) {
        const headerThs = Array.from(table.querySelectorAll('thead th, tr:first-child th'));
        const colToPi: Record<number, string> = {};
        headerThs.forEach((th, idx) => {
          const t = th.textContent?.trim().toUpperCase() || '';
          const matchPi = t.match(/PI\s*(\d+\.\d+)/);
          if (matchPi) {
            colToPi[idx] = `PI${matchPi[1]}`;
          }
        });

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        rows.forEach((tr) => {
          const cells = Array.from(tr.querySelectorAll('td, th'));
          if (cells.length > 0) {
            const firstText = cells[0].textContent?.trim().toUpperCase() || '';
            const matchPo = firstText.match(/PO\s*(\d+)/);
            if (matchPo) {
              const poCode = `PO${matchPo[1]}`;
              mappings[poCode] = mappings[poCode] || [];
              cells.forEach((cell, cIdx) => {
                const cellText = cell.textContent?.trim() || '';
                const isChecked =
                  cellText.includes('✓') ||
                  cellText.toLowerCase().includes('x') ||
                  cellText === '1' ||
                  cell.getAttribute('data-match') === 'true';
                if (isChecked && colToPi[cIdx]) {
                  mappings[poCode].push(colToPi[cIdx]);
                }
              });
            }
          }
        });
      }
    }

    // Fallback text pattern: "PO1: PI1.1, PI1.2"
    if (Object.keys(mappings).length === 0) {
      const allText = doc.body.textContent || '';
      const lines = allText.split('\n');
      lines.forEach((line) => {
        const match = line.match(/(PO\s*\d+)\s*[:\-\u2192]\s*(.*)/i);
        if (match) {
          const poCode = match[1].replace(/\s+/g, '').toUpperCase();
          const rest = match[2];
          const piMatches = rest.match(/PI\s*\d+\.\d+/gi);
          if (piMatches) {
            mappings[poCode] = piMatches.map((p) => p.replace(/\s+/g, '').toUpperCase());
          }
        }
      });
    }

    // 4. Ánh xạ các giá trị true vào resultMatrix
    let matchCount = 0;
    poList.forEach((po, poIdx) => {
      const currentPoCode = (po.code || `PO${poIdx + 1}`).toUpperCase().trim();
      const targetPis = (mappings[currentPoCode] || []).map((p) => p.toUpperCase().trim());

      ploList.forEach((plo, ploIdx) => {
        const pis = plo.pis || [];
        pis.forEach((pi, piIdx) => {
          const currentPiCode = (pi.code || `PI${ploIdx + 1}.${piIdx + 1}`).toUpperCase().trim();
          if (targetPis.includes(currentPiCode)) {
            resultMatrix[poIdx][ploIdx][piIdx] = true;
            matchCount++;
          }
        });
      });
    });

    const isMatrixValid = matchCount > 0 || doc.querySelector('table') !== null;
    return {
      rawHtml: htmlOrJson,
      isMatrixValid,
      matrix: isMatrixValid ? resultMatrix : undefined,
      matrixErrorMessage: isMatrixValid ? undefined : 'AI chưa đề xuất được các ô ánh xạ hợp lệ trong ma trận.',
    };
  } catch (err) {
    return {
      rawHtml: htmlOrJson,
      isMatrixValid: false,
      matrixErrorMessage: 'Lỗi xử lý dữ liệu ma trận: ' + String(err),
    };
  }
};

// ==========================================
// 8. FACILITIES PARSER & HTML FORMATTER
// ==========================================
export interface FacilitiesLabItem {
  item: string;
  specification: string;
}

export interface FacilitiesToolItem {
  name: string;
  version?: string;
  purpose?: string;
  license?: string;
}

export interface FacilitiesHardwareItem {
  name: string;
  specification?: string;
}

export interface FacilitiesParsedResult {
  rawHtml: string;
  labRequirements: FacilitiesLabItem[];
  operatingSystem?: string;
  softwareTools: FacilitiesToolItem[];
  hardwareDevices: FacilitiesHardwareItem[];
  notes?: string;
  isComplete: boolean;
}

export const parseFacilitiesContent = (raw: string): FacilitiesParsedResult | null => {
  if (!raw) return null;
  const json = extractJsonFromText(raw);
  if (!json || typeof json !== 'object') return null;

  const rawLabs = Array.isArray(json.labRequirements) ? json.labRequirements : [];
  const labRequirements: FacilitiesLabItem[] = rawLabs.map((l: any) => ({
    item: typeof l === 'object' && l.item ? l.item : (typeof l === 'string' ? l : 'Phòng thực hành'),
    specification: typeof l === 'object' && l.specification ? l.specification : '',
  })).filter((l: FacilitiesLabItem) => l.item.trim().length > 0);

  const rawTools = Array.isArray(json.softwareTools) ? json.softwareTools : [];
  const softwareTools: FacilitiesToolItem[] = rawTools.map((t: any) => ({
    name: typeof t === 'object' && t.name ? t.name : (typeof t === 'string' ? t : 'Phần mềm'),
    version: typeof t === 'object' && t.version ? t.version : '',
    purpose: typeof t === 'object' && t.purpose ? t.purpose : '',
    license: typeof t === 'object' && t.license ? t.license : '',
  })).filter((t: FacilitiesToolItem) => t.name.trim().length > 0);

  const rawHw = Array.isArray(json.hardwareDevices) ? json.hardwareDevices : [];
  const hardwareDevices: FacilitiesHardwareItem[] = rawHw.map((h: any) => ({
    name: typeof h === 'object' && h.name ? h.name : (typeof h === 'string' ? h : 'Thiết bị'),
    specification: typeof h === 'object' && h.specification ? h.specification : '',
  })).filter((h: FacilitiesHardwareItem) => h.name.trim().length > 0);

  return {
    rawHtml: raw,
    labRequirements,
    operatingSystem: typeof json.operatingSystem === 'string' ? json.operatingSystem : undefined,
    softwareTools,
    hardwareDevices,
    notes: typeof json.notes === 'string' ? json.notes : undefined,
    isComplete: labRequirements.length > 0 || softwareTools.length > 0 || Boolean(json.operatingSystem),
  };
};

export const formatFacilitiesToHtml = (data: Partial<FacilitiesParsedResult>): string => {
  const parts: string[] = [];
  if (data.labRequirements && data.labRequirements.length > 0) {
    parts.push('<h4>1. Yêu cầu phòng thực hành & Phần cứng:</h4>');
    parts.push('<ul>');
    data.labRequirements.forEach(r => {
      parts.push(`<li><strong>${r.item}:</strong> ${r.specification}</li>`);
    });
    parts.push('</ul>');
  }
  if (data.operatingSystem) {
    parts.push('<h4>2. Hệ điều hành:</h4>');
    parts.push(`<p>${data.operatingSystem}</p>`);
  }
  if (data.softwareTools && data.softwareTools.length > 0) {
    parts.push('<h4>3. Phần mềm & Môi trường phát triển:</h4>');
    parts.push('<ul>');
    data.softwareTools.forEach(t => {
      const extra = [t.version ? `Phiên bản: ${t.version}` : '', t.license ? `Bản quyền: ${t.license}` : ''].filter(Boolean).join(' · ');
      const purpose = t.purpose ? ` - ${t.purpose}` : '';
      const meta = extra ? ` <em>(${extra})</em>` : '';
      parts.push(`<li><strong>${t.name}</strong>${meta}${purpose}</li>`);
    });
    parts.push('</ul>');
  }
  if (data.hardwareDevices && data.hardwareDevices.length > 0) {
    parts.push('<h4>4. Thiết bị phần cứng bổ trợ:</h4>');
    parts.push('<ul>');
    data.hardwareDevices.forEach(h => {
      parts.push(`<li><strong>${h.name}:</strong> ${h.specification || ''}</li>`);
    });
    parts.push('</ul>');
  }
  if (data.notes) {
    parts.push('<h4>5. Ghi chú & Yêu cầu khác:</h4>');
    parts.push(`<p>${data.notes}</p>`);
  }
  return parts.join('\n');
};

// ==========================================
// 9. COURSE DESCRIPTION PARSER
// ==========================================
export interface CourseDescriptionParsedResult {
  rawHtml: string;
  courseDescription: string;
  keyObjectives: string[];
  targetAudience?: string;
  isComplete: boolean;
}

export const parseCourseDescriptionContent = (raw: string): CourseDescriptionParsedResult | null => {
  if (!raw) return null;
  const json = extractJsonFromText(raw);
  if (!json || typeof json !== 'object') return null;

  const desc = json.courseDescription || json.description || json.moTa || (typeof json.content === 'string' ? json.content : '');
  const rawObjs = Array.isArray(json.keyObjectives) ? json.keyObjectives : [];
  const keyObjectives = rawObjs.map((o: any) => String(o || '')).filter(Boolean);

  return {
    rawHtml: raw,
    courseDescription: desc,
    keyObjectives,
    targetAudience: typeof json.targetAudience === 'string' ? json.targetAudience : undefined,
    isComplete: Boolean(desc && desc.trim().length > 0),
  };
};

// ==========================================
// 10. MATERIAL PARSER
// ==========================================
export interface MaterialParsedItem {
  title: string;
  author?: string;
  publisher?: string;
  year?: number | string;
  description?: string;
}

export interface MaterialParsedResult {
  rawHtml: string;
  mainMaterials: MaterialParsedItem[];
  referenceMaterials: MaterialParsedItem[];
  isComplete: boolean;
}

export const parseMaterialContent = (raw: string): MaterialParsedResult | null => {
  if (!raw) return null;
  const json = extractJsonFromText(raw);
  if (!json || typeof json !== 'object') return null;

  const mapMat = (arr: any[]): MaterialParsedItem[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(m => ({
      title: typeof m === 'object' && m.title ? m.title : String(m || ''),
      author: typeof m === 'object' ? m.author : undefined,
      publisher: typeof m === 'object' ? m.publisher : undefined,
      year: typeof m === 'object' ? m.year : undefined,
      description: typeof m === 'object' ? m.description : undefined,
    })).filter(m => m.title.trim().length > 0);
  };

  const mainMaterials = mapMat(json.mainMaterials || json.main || []);
  const referenceMaterials = mapMat(json.referenceMaterials || json.reference || json.references || []);

  return {
    rawHtml: raw,
    mainMaterials,
    referenceMaterials,
    isComplete: mainMaterials.length > 0 || referenceMaterials.length > 0,
  };
};

// ==========================================
// 11. SYLLABUS SCHEDULE PARSER
// ==========================================
export interface SyllabusParsedResult {
  rawHtml: string;
  chapters: Array<{
    title: string;
    topics: Array<{
      title: string;
      lectureHours?: number;
      practiceHours?: number;
      selfStudyHours?: number;
      mappedClos?: string[];
    }>;
  }>;
  isComplete: boolean;
}

export const parseSyllabusContent = (raw: string): SyllabusParsedResult | null => {
  if (!raw) return null;
  const json = extractJsonFromText(raw);
  if (!json || typeof json !== 'object' || !Array.isArray(json.chapters)) return null;

  const chapters = json.chapters.map((ch: any) => ({
    title: typeof ch === 'object' && ch.title ? ch.title : String(ch || ''),
    topics: Array.isArray(ch.topics) ? ch.topics.map((t: any) => ({
      title: typeof t === 'object' && t.title ? t.title : String(t || ''),
      lectureHours: t.lectureHours,
      practiceHours: t.practiceHours,
      selfStudyHours: t.selfStudyHours,
      mappedClos: Array.isArray(t.mappedClos) ? t.mappedClos : [],
    })) : [],
  })).filter((ch: any) => ch.title.trim().length > 0);

  return {
    rawHtml: raw,
    chapters,
    isComplete: chapters.length > 0,
  };
};

// ==========================================
// 12. ASSESSMENT PARSER
// ==========================================
export interface AssessmentParsedResult {
  rawHtml: string;
  components: Array<{
    name: string;
    method?: string;
    weight: number;
    criteria?: string;
    mappedClos?: string[];
  }>;
  isComplete: boolean;
}

export const parseAssessmentContent = (raw: string): AssessmentParsedResult | null => {
  if (!raw) return null;
  const json = extractJsonFromText(raw);
  if (!json || typeof json !== 'object') return null;

  const rawComps = Array.isArray(json.components) ? json.components : (Array.isArray(json) ? json : []);
  const components = rawComps.map((c: any) => ({
    name: typeof c === 'object' && c.name ? c.name : String(c || ''),
    method: typeof c === 'object' ? c.method : undefined,
    weight: Number(c.weight) || 0,
    criteria: typeof c === 'object' ? c.criteria : undefined,
    mappedClos: Array.isArray(c.mappedClos) ? c.mappedClos : [],
  })).filter((c: any) => c.name.trim().length > 0);

  return {
    rawHtml: raw,
    components,
    isComplete: components.length > 0,
  };
};

// ==========================================
// 13. SURVEY QUESTIONS PARSER (STEP 1)
// ==========================================
export type SurveyParsedQuestionType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'LIKERT_SCALE';

export interface SurveyParsedOption {
  content: string;
  orderIndex: number;
}

export interface SurveyParsedQuestion {
  content: string;
  helpText?: string;
  questionType: SurveyParsedQuestionType;
  required: boolean;
  minRating?: number;
  maxRating?: number;
  options?: SurveyParsedOption[];
}

export interface SurveyParsedSection {
  title: string;
  description?: string;
  questions: SurveyParsedQuestion[];
}

export interface SurveyQuestionsParsedResult {
  rawHtml: string;
  title?: string;
  description?: string;
  targetAudience?: string;
  sections: SurveyParsedSection[];
  isComplete: boolean;
}

const normalizeQuestionType = (val: any, hasOptions: boolean, hasRating: boolean): SurveyParsedQuestionType => {
  const str = String(val || '').toUpperCase().trim();
  if (str.includes('LIKERT') || str.includes('SCALE') || str.includes('THANG_DO') || str.includes('RATING')) {
    return 'LIKERT_SCALE';
  }
  if (str.includes('MULTIPLE') || str.includes('CHON_NHIEU') || str.includes('CHECKBOX')) {
    return 'MULTIPLE_CHOICE';
  }
  if (str.includes('SINGLE') || str.includes('RADIO') || str.includes('CHON_MOT') || str.includes('CHON_1')) {
    return 'SINGLE_CHOICE';
  }
  if (str.includes('LONG') || str.includes('PARAGRAPH') || str.includes('DOAN_VAN') || str.includes('ESSAY')) {
    return 'LONG_TEXT';
  }
  if (str.includes('SHORT') || str.includes('VAN_BAN') || str.includes('TEXT')) {
    return 'SHORT_TEXT';
  }
  if (hasRating) return 'LIKERT_SCALE';
  if (hasOptions) return 'SINGLE_CHOICE';
  return 'SHORT_TEXT';
};

export const parseSurveyQuestionsContent = (raw: string): SurveyQuestionsParsedResult | null => {
  if (!raw) return null;
  const json = extractJsonFromText(raw);
  if (!json || typeof json !== 'object') return null;

  const rawSections = Array.isArray(json.sections)
    ? json.sections
    : Array.isArray(json)
    ? json
    : Array.isArray(json.questions)
    ? [{ title: 'Phần 1: Nội dung khảo sát', questions: json.questions }]
    : [];

  const sections: SurveyParsedSection[] = rawSections.map((sec: any, secIdx: number) => {
    const title = typeof sec === 'object' && sec.title ? String(sec.title) : `Phần ${secIdx + 1}: Nội dung khảo sát`;
    const description = typeof sec === 'object' && sec.description ? String(sec.description) : undefined;
    const rawQuestions = Array.isArray(sec.questions) ? sec.questions : [];

    const questions: SurveyParsedQuestion[] = rawQuestions.map((q: any) => {
      const content = typeof q === 'object' && q.content ? String(q.content) : String(q || '');
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const hasOptions = rawOptions.length > 0;
      const hasRating = Boolean(q.minRating || q.maxRating);

      const questionType = normalizeQuestionType(q.questionType, hasOptions, hasRating);

      const options: SurveyParsedOption[] = rawOptions.map((opt: any, optIdx: number) => ({
        content: typeof opt === 'object' && opt.content ? String(opt.content) : String(opt || ''),
        orderIndex: optIdx + 1,
      })).filter((opt: SurveyParsedOption) => opt.content.trim().length > 0);

      return {
        content,
        helpText: q.helpText ? String(q.helpText) : undefined,
        questionType,
        required: q.required !== false,
        minRating: questionType === 'LIKERT_SCALE' ? (Number(q.minRating) || 1) : undefined,
        maxRating: questionType === 'LIKERT_SCALE' ? (Number(q.maxRating) || 5) : undefined,
        options: options.length > 0 ? options : undefined,
      };
    }).filter((q: SurveyParsedQuestion) => q.content.trim().length > 0);

    return {
      title,
      description,
      questions,
    };
  }).filter((sec: SurveyParsedSection) => sec.title.trim().length > 0 || sec.questions.length > 0);

  return {
    rawHtml: raw,
    title: typeof json.title === 'string' ? json.title : undefined,
    description: typeof json.description === 'string' ? json.description : undefined,
    targetAudience: typeof json.targetAudience === 'string' ? json.targetAudience : undefined,
    sections,
    isComplete: sections.length > 0 && sections.some(s => s.questions.length > 0),
  };
};

export const formatSurveyQuestionsToHtml = (data: Partial<SurveyQuestionsParsedResult>): string => {
  const parts: string[] = [];
  if (data.title) {
    parts.push(`<h3>${data.title}</h3>`);
  }
  if (data.targetAudience) {
    parts.push(`<p><strong>Đối tượng khảo sát:</strong> ${data.targetAudience}</p>`);
  }
  if (data.description) {
    parts.push(`<p><em>${data.description}</em></p>`);
  }

  (data.sections || []).forEach((sec, sIdx) => {
    parts.push(`<h4>Phần ${sIdx + 1}: ${sec.title}</h4>`);
    if (sec.description) parts.push(`<p>${sec.description}</p>`);
    parts.push('<ol>');
    (sec.questions || []).forEach((q) => {
      const typeLabel = q.questionType === 'LIKERT_SCALE' ? `[Thang đo ${q.minRating || 1}-${q.maxRating || 5}]` : `[${q.questionType}]`;
      const req = q.required ? ' <span style="color:red">*</span>' : '';
      parts.push(`<li><strong>${q.content}</strong>${req} <em>${typeLabel}</em>`);
      if (q.options && q.options.length > 0) {
        parts.push('<ul>');
        q.options.forEach(opt => parts.push(`<li>${opt.content}</li>`));
        parts.push('</ul>');
      }
      parts.push('</li>');
    });
    parts.push('</ol>');
  });

  return parts.join('\n');
};
