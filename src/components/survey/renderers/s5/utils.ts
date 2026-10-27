import { COItem, CourseSyllabusData, PiMetaItem, PloDomainGroup, PloGroupItem } from './types';
import { uid } from './constants';

export const cleanHtmlText = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

export const helperExtractCos = (data: Partial<CourseSyllabusData>): COItem[] => {
  if (Array.isArray(data.cos) && data.cos.length > 0) {
    return data.cos;
  }

  const result: COItem[] = [];
  const k = cleanHtmlText(data.knowledgeObjective);
  const s = cleanHtmlText(data.skillsObjective);
  const a = cleanHtmlText(data.attitudesObjective);

  let idx = 1;
  if (k) result.push({ id: uid(), code: `CO${idx++}`, domain: 'KNOWLEDGE', content: k });
  if (s) result.push({ id: uid(), code: `CO${idx++}`, domain: 'SKILL', content: s });
  if (a) result.push({ id: uid(), code: `CO${idx++}`, domain: 'AUTONOMY', content: a });

  if (result.length === 0) {
    return [
      { id: uid(), code: 'CO1', domain: 'KNOWLEDGE', content: '' },
      { id: uid(), code: 'CO2', domain: 'SKILL', content: '' },
      { id: uid(), code: 'CO3', domain: 'AUTONOMY', content: '' },
    ];
  }

  return result;
};

export const helperSyncObjectivesFromCos = (cos: COItem[]) => {
  const kList = cos.filter(c => c.domain === 'KNOWLEDGE').map(c => c.content.trim()).filter(Boolean);
  const sList = cos.filter(c => c.domain === 'SKILL').map(c => c.content.trim()).filter(Boolean);
  const aList = cos.filter(c => c.domain === 'AUTONOMY').map(c => c.content.trim()).filter(Boolean);

  return {
    knowledgeObjective: kList.length > 0 ? `<p>${kList.join('</p><p><br/>')}</p>` : '',
    skillsObjective: sList.length > 0 ? `<p>${sList.join('</p><p><br/>')}</p>` : '',
    attitudesObjective: aList.length > 0 ? `<p>${aList.join('</p><p><br/>')}</p>` : '',
  };
};

export const helperParsePloDomains = (rawPlos: any[]): PloDomainGroup[] => {
  const domainDefs: { domain: string; label: string; shortLabel: string }[] = [
    { domain: 'KNOWLEDGE', label: '1. Kiến thức', shortLabel: 'Kiến thức' },
    { domain: 'SKILL', label: '2. Kỹ năng', shortLabel: 'Kỹ năng' },
    { domain: 'AUTONOMY', label: '3. Năng lực tự chủ & trách nhiệm', shortLabel: 'Năng lực' },
    { domain: 'ATTITUDE', label: '4. Phẩm chất đạo đức', shortLabel: 'Phẩm chất' },
  ];

  if (!Array.isArray(rawPlos) || rawPlos.length === 0) {
    return [
      {
        domain: 'KNOWLEDGE',
        domainLabel: '1. Kiến thức',
        shortLabel: 'Kiến thức',
        plos: [{ code: 'PLO1', domain: 'KNOWLEDGE', title: 'Kiến thức cơ bản và chuyên ngành', pis: [] }],
        allPis: [
          { code: 'PI1.1', title: 'Hiểu và vận dụng kiến thức khoa học cơ bản', ploCode: 'PLO1', domain: 'KNOWLEDGE' },
          { code: 'PI1.2', title: 'Áp dụng kiến thức cốt lõi ngành trong giải quyết bài toán kỹ thuật', ploCode: 'PLO1', domain: 'KNOWLEDGE' },
          { code: 'PI1.3', title: 'Thiết kế và triển khai giải pháp công nghệ', ploCode: 'PLO1', domain: 'KNOWLEDGE' },
        ],
      },
      {
        domain: 'SKILL',
        domainLabel: '2. Kỹ năng',
        shortLabel: 'Kỹ năng',
        plos: [{ code: 'PLO2', domain: 'SKILL', title: 'Kỹ năng chuyên môn và nghề nghiệp', pis: [] }],
        allPis: [
          { code: 'PI2.1', title: 'Kỹ năng lập trình, phân tích và mô phỏng hệ thống', ploCode: 'PLO2', domain: 'SKILL' },
          { code: 'PI2.2', title: 'Kỹ năng phát hiện và xử lý lỗi kỹ thuật', ploCode: 'PLO2', domain: 'SKILL' },
          { code: 'PI2.3', title: 'Kỹ năng làm việc nhóm và giao tiếp chuyên môn', ploCode: 'PLO2', domain: 'SKILL' },
        ],
      },
      {
        domain: 'AUTONOMY',
        domainLabel: '3. Năng lực tự chủ & trách nhiệm',
        shortLabel: 'Năng lực',
        plos: [{ code: 'PLO3', domain: 'AUTONOMY', title: 'Năng lực tự chủ và trách nhiệm', pis: [] }],
        allPis: [
          { code: 'PI3.1', title: 'Khả năng tự nghiên cứu, định hướng và thích ứng', ploCode: 'PLO3', domain: 'AUTONOMY' },
          { code: 'PI3.2', title: 'Trách nhiệm tổ chức, hướng dẫn và quản lý', ploCode: 'PLO3', domain: 'AUTONOMY' },
        ],
      },
      {
        domain: 'ATTITUDE',
        domainLabel: '4. Phẩm chất đạo đức',
        shortLabel: 'Phẩm chất',
        plos: [{ code: 'PLO4', domain: 'ATTITUDE', title: 'Phẩm chất đạo đức nghề nghiệp', pis: [] }],
        allPis: [
          { code: 'PI4.1', title: 'Tuân thủ đạo đức nghề nghiệp và kỷ luật tổ chức', ploCode: 'PLO4', domain: 'ATTITUDE' },
          { code: 'PI4.2', title: 'Ý thức trách nhiệm cộng đồng và học tập suốt đời', ploCode: 'PLO4', domain: 'ATTITUDE' },
        ],
      },
    ];
  }

  return domainDefs.map(def => {
    const plosInDomain = rawPlos.filter((p: any) => (p.domain || 'KNOWLEDGE') === def.domain);
    const allPis: PiMetaItem[] = [];

    const plos: PloGroupItem[] = plosInDomain.map((p: any, pIdx: number) => {
      const pCode = p.code || `PLO${pIdx + 1}`;
      const pTitle = p.content || p.title || '';
      const pis: PiMetaItem[] = [];

      if (Array.isArray(p.pis) && p.pis.length > 0) {
        p.pis.forEach((pi: any, piIdx: number) => {
          const piItem: PiMetaItem = {
            code: pi.code || `PI${pIdx + 1}.${piIdx + 1}`,
            title: pi.content || pi.title || pTitle,
            ploCode: pCode,
            domain: def.domain,
          };
          pis.push(piItem);
          allPis.push(piItem);
        });
      } else {
        const leafItem: PiMetaItem = {
          code: pCode,
          title: pTitle,
          ploCode: pCode,
          domain: def.domain,
        };
        pis.push(leafItem);
        allPis.push(leafItem);
      }

      return {
        code: pCode,
        domain: def.domain,
        title: pTitle,
        pis,
      };
    });

    return {
      domain: def.domain,
      domainLabel: def.label,
      shortLabel: def.shortLabel,
      plos,
      allPis,
    };
  });
};
