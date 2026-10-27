export type IrmLevel = 0 | 1 | 2 | 3 | 4;

export interface S6Indicator {
  piId: number | string;
  piCode: string;
  content: string;
  bloomLevel?: string;
}

export interface S6PloGroup {
  ploId: number | string;
  ploCode: string;
  ploName?: string;
  domain: string; // KNOWLEDGE, SKILL, ATTITUDE, AUTONOMY
  indicators: S6Indicator[];
}

export interface S6CourseRow {
  programCourseId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  semester?: number;
  credits: number;
  structureName?: string;
  cells: Record<string | number, number>; // piId/piCode -> level (1: I, 2: R, 3: M, 4: A)
}

export interface S6MatrixData {
  programId?: number;
  rows: S6CourseRow[];
  ploGroups: S6PloGroup[];
  uncoveredPiCodes: string[];
}

export interface S6RendererRef {
  validate: () => boolean;
  saveMatrix: () => Promise<boolean>;
  getData?: () => { mapping: Record<string | number, Record<string | number, number>> };
}
