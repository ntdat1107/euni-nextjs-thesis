export type DomainType = 'KNOWLEDGE' | 'SKILL' | 'AUTONOMY' | 'ATTITUDE';

export const DOMAIN_OPTIONS: { value: DomainType; label: string; shortLabel: string }[] = [
  { value: 'KNOWLEDGE', label: 'Kiến thức', shortLabel: 'Kiến thức' },
  { value: 'SKILL', label: 'Kỹ năng', shortLabel: 'Kỹ năng' },
  { value: 'AUTONOMY', label: 'Năng lực', shortLabel: 'Năng lực' },
  { value: 'ATTITUDE', label: 'Phẩm chất', shortLabel: 'Phẩm chất' },
];

export interface PO {
  code?: string;
  content: string;
}

export type PEO = PO;

export interface PI {
  code?: string;
  content: string;
}

export interface PLO {
  code?: string;
  domain?: DomainType;
  content: string;
  pis: PI[];
}

export interface S2PLOData {
  pos: PO[];
  peos?: PO[];
  plos: PLO[];
  matrix: boolean[][][];
  mucTieuHeadingHtml: string;
  chuanDauRaHeadingHtml: string;
  mucTieu?: string;
  chuanDauRa?: string;
  maTranMucTieuVaCDR?: string;
}

export interface S2PLORef {
  validate: () => boolean;
  getData: () => S2PLOData;
}

export interface S2PLORendererProps {
  data?: any;
  campaign?: any;
  readonly?: boolean;
  onChange?: (data: S2PLOData) => void;
}
