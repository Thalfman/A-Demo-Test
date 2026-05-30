/**
 * Shared data model — the single source of truth for the entire app.
 *
 * The generator (`scripts/generate-data.ts`) emits JSON that conforms to these
 * types; the loaders (`lib/loaders.ts`) read them back with these types; and the
 * module pages (built later by EXECUTION_PROMPT.md) consume them. Change a shape
 * here and every layer follows.
 *
 * Two views of a project exist on purpose:
 *  - `RawProject` is the messy, real-world export (nullable fields, drifting
 *    date formats, inconsistent spellings). This is what lands in /data.
 *  - `Project` is the strict, normalized record produced by `lib/normalize.ts`,
 *    carrying the data-quality flags discovered during cleanup.
 */

/* ----------------------------------------------------------------------------
 * Enums / unions
 * ------------------------------------------------------------------------- */

export type DivisionId = 'eng' | 'infra' | 'data' | 'cx';

export const PROJECT_PHASES = [
  'Initiation',
  'Planning',
  'Execution',
  'Monitoring',
  'Closeout',
] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const PROJECT_STATUSES = ['On Track', 'At Risk', 'Off Track'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Division {
  id: DivisionId;
  name: string;
}

/* ----------------------------------------------------------------------------
 * Data-quality flags (produced by normalization)
 * ------------------------------------------------------------------------- */

export type DataQualityCode =
  | 'missing' // field was null/blank in the source
  | 'coerced' // value was type-coerced or clamped
  | 'date_drift' // non-ISO date format detected and reparsed
  | 'spelling_normalized' // categorical value mapped to a canonical spelling
  | 'stale' // record not updated within the freshness window
  | 'rounded_estimate'; // suspiciously round human estimate vs precise actual

export interface DataQualityFlag {
  field: string;
  code: DataQualityCode;
  original: string | number | null;
  normalized: string | number | null;
  note?: string;
}

/* ----------------------------------------------------------------------------
 * Earned-value management (EVM)
 * ------------------------------------------------------------------------- */

export interface EvmMetrics {
  bac: number; // Budget at completion
  pv: number; // Planned value
  ev: number; // Earned value
  ac: number; // Actual cost
  cpi: number; // Cost performance index  = EV / AC
  spi: number; // Schedule performance index = EV / PV
  cv: number; // Cost variance     = EV - AC
  sv: number; // Schedule variance = EV - PV
  eac: number; // Estimate at completion = BAC / CPI
  vac: number; // Variance at completion = BAC - EAC
  tcpi: number; // To-complete performance index = (BAC - EV) / (BAC - AC)
}

export interface EvmSeriesPoint {
  period: string; // 'YYYY-MM'
  pv: number;
  ev: number;
  ac: number;
}

/* ----------------------------------------------------------------------------
 * AI artifacts (precomputed, clearly labeled)
 * ------------------------------------------------------------------------- */

export interface AiArtifact {
  aiGenerated: true;
  title: string;
  generatedAt: string;
  body: string; // markdown / plain prose, terse busy-PM voice
  bullets?: string[];
}

/* ----------------------------------------------------------------------------
 * Module 1 — Portfolio Health
 * ------------------------------------------------------------------------- */

export interface RawProject {
  id: string;
  name: string;
  division: string | null;
  program: string | null;
  owner: string | null;
  phase: string | null;
  status: string | null;
  percentComplete: number | null; // 0..100
  budget: number | null; // BAC
  plannedValue: number | null;
  earnedValue: number | null;
  actualCost: number | null;
  startDate: string | null; // drifting formats
  plannedEndDate: string | null;
  forecastEndDate: string | null;
  openRisks: number | null;
  openIssues: number | null;
  lastUpdated: string | null;
}

export interface Project {
  id: string;
  name: string;
  division: DivisionId;
  divisionName: string;
  program: string;
  owner: string | null; // null preserved when genuinely missing
  phase: ProjectPhase;
  status: ProjectStatus;
  percentComplete: number; // 0..1 ratio
  evm: EvmMetrics;
  startDate: string; // ISO yyyy-mm-dd
  plannedEndDate: string;
  forecastEndDate: string | null;
  openRisks: number;
  openIssues: number;
  lastUpdated: string; // ISO yyyy-mm-dd
  isStale: boolean;
  flags: DataQualityFlag[];
}

export interface PortfolioData {
  projects: RawProject[];
  aiBriefing: AiArtifact;
}

/* ----------------------------------------------------------------------------
 * Module 2 — EVM & Variance
 * ------------------------------------------------------------------------- */

export type Severity = 'high' | 'medium' | 'low';

export interface RecommendedAction {
  projectId: string | null; // null = portfolio-level
  severity: Severity;
  action: string;
  rationale: string;
}

export interface EvmProjectEntry {
  projectId: string;
  name: string;
  metrics: EvmMetrics;
  series: EvmSeriesPoint[];
}

export interface EvmData {
  portfolio: {
    metrics: EvmMetrics;
    series: EvmSeriesPoint[];
  };
  projects: EvmProjectEntry[];
  aiNarrative: AiArtifact;
  recommendedActions: RecommendedAction[];
}

/* ----------------------------------------------------------------------------
 * Module 3 — Cross-System Reconciliation
 * ------------------------------------------------------------------------- */

export interface ReconRecord {
  projectId: string;
  name: string;
  status: string | null;
  budget: number | null;
  actualCost: number | null;
  owner: string | null;
  endDate: string | null; // drifting format
}

export interface ReconExport {
  source: string;
  exportedAt: string;
  records: ReconRecord[];
}

export type DiscrepancyType =
  | 'value_mismatch'
  | 'status_mismatch'
  | 'date_mismatch'
  | 'missing_in_finance'
  | 'missing_in_pmo'
  | 'duplicate';

export interface Discrepancy {
  projectId: string;
  name: string;
  field: string;
  type: DiscrepancyType;
  financeValue: string | number | null;
  pmoValue: string | number | null;
  severity: Severity;
}

export interface ReconciliationData {
  financeExport: ReconExport;
  pmoExport: ReconExport;
  discrepancies: Discrepancy[];
  aiSummary: AiArtifact;
}

/* ----------------------------------------------------------------------------
 * Module 4 — Status & SOP Library
 * ------------------------------------------------------------------------- */

export type DocumentType =
  | 'status-report'
  | 'sop'
  | 'meeting-notes'
  | 'decision-log';

export interface DocumentMeta {
  author: string;
  audience?: string;
  relatedProjectId?: string | null;
  version?: string;
  effectiveDate?: string;
}

export interface AppDocument {
  id: string;
  type: DocumentType;
  title: string;
  summary: string;
  body: string; // markdown
  aiGenerated: true;
  generatedAt: string;
  meta: DocumentMeta;
  tags: string[];
}

export interface DocumentsData {
  statusReports: AppDocument[];
  sops: AppDocument[];
  meetingNotes: AppDocument[];
  decisionLogs: AppDocument[];
}

/* ----------------------------------------------------------------------------
 * Meta
 * ------------------------------------------------------------------------- */

export interface ModuleInfo {
  id: 'portfolio' | 'evm' | 'reconciliation' | 'documents';
  title: string;
  route: string;
  dataFile: string;
  summary: string;
}

export type DataQualitySummary = {
  totalProjects: number;
  flaggedFields: number;
  byCode: Record<DataQualityCode, number>;
};

export interface Meta {
  schemaVersion: string;
  seed: number;
  generatedAt: string;
  divisions: Division[];
  counts: {
    projects: number;
    statusReports: number;
    sops: number;
    meetingNotes: number;
    decisionLogs: number;
    discrepancies: number;
  };
  dataQuality: DataQualitySummary;
  modules: ModuleInfo[];
}
