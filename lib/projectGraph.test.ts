import { describe, expect, it } from 'vitest';

import { listProjectIds, selectProjectDossier, type ProjectGraphSources } from './projectGraph';
import type {
  AppDocument,
  Discrepancy,
  EvmMetrics,
  EvmProjectEntry,
  Project,
  RecommendedAction,
} from './types';

const evm = (over: Partial<EvmMetrics> = {}): EvmMetrics => ({
  bac: 100,
  pv: 90,
  ev: 80,
  ac: 100,
  cpi: 0.8,
  spi: 0.89,
  cv: -20,
  sv: -10,
  eac: 125,
  vac: -25,
  tcpi: 1.2,
  ...over,
});

const project = (over: Partial<Project> = {}): Project => ({
  id: 'PRJ-005',
  name: 'Everest Data Lake',
  division: 'data',
  divisionName: 'Data & Analytics',
  program: 'Data & Analytics',
  owner: 'Ada',
  phase: 'Execution',
  status: 'Off Track',
  percentComplete: 0.5,
  evm: evm(),
  startDate: '2025-01-01',
  plannedEndDate: '2025-06-01',
  forecastEndDate: null,
  openRisks: 0,
  openIssues: 0,
  lastUpdated: '2025-05-01',
  isStale: false,
  flags: [],
  ...over,
});

const evmEntry = (over: Partial<EvmProjectEntry> = {}): EvmProjectEntry => ({
  projectId: 'PRJ-005',
  name: 'Everest Data Lake',
  metrics: evm(),
  series: [{ period: '2025-01', pv: 10, ev: 8, ac: 9 }],
  ...over,
});

const discrepancy = (over: Partial<Discrepancy> = {}): Discrepancy => ({
  projectId: 'PRJ-005',
  name: 'Everest Data Lake',
  field: 'budget',
  type: 'value_mismatch',
  financeValue: 100,
  pmoValue: 120,
  severity: 'high',
  ...over,
});

const action = (over: Partial<RecommendedAction> = {}): RecommendedAction => ({
  projectId: 'PRJ-005',
  severity: 'high',
  action: 'Rebaseline schedule',
  rationale: 'CPI below 0.85',
  ...over,
});

const document = (over: Partial<AppDocument> = {}): AppDocument => ({
  id: 'DOC-DECISION-001',
  type: 'decision-log',
  title: 'Everest scope decision',
  summary: 'Decision on Everest',
  body: '# Decision',
  aiGenerated: true,
  generatedAt: '2025-05-01',
  meta: { author: 'AI', relatedProjectId: 'PRJ-005' },
  tags: [],
  ...over,
});

const sources = (over: Partial<ProjectGraphSources> = {}): ProjectGraphSources => ({
  projects: [project()],
  evmProjects: [evmEntry()],
  discrepancies: [discrepancy()],
  actions: [action()],
  documents: [document()],
  ...over,
});

describe('selectProjectDossier', () => {
  it('joins a Project with its EVM entry for a known id', () => {
    const dossier = selectProjectDossier('PRJ-005', sources());

    expect(dossier).not.toBeNull();
    expect(dossier?.project.id).toBe('PRJ-005');
    expect(dossier?.evm?.projectId).toBe('PRJ-005');
    expect(dossier?.evm?.series).toHaveLength(1);
  });

  it("includes only this Project's discrepancies", () => {
    const dossier = selectProjectDossier(
      'PRJ-005',
      sources({
        discrepancies: [
          discrepancy({ projectId: 'PRJ-005', field: 'budget' }),
          discrepancy({ projectId: 'PRJ-004', field: 'status' }),
        ],
      }),
    );

    expect(dossier?.discrepancies.map((d) => d.field)).toEqual(['budget']);
  });

  it("includes this Project's actions but excludes portfolio-level and other Projects'", () => {
    const dossier = selectProjectDossier(
      'PRJ-005',
      sources({
        actions: [
          action({ projectId: 'PRJ-005', action: 'Rebaseline' }),
          action({ projectId: null, action: 'Portfolio review' }),
          action({ projectId: 'PRJ-004', action: 'Escalate' }),
        ],
      }),
    );

    expect(dossier?.actions.map((a) => a.action)).toEqual(['Rebaseline']);
  });

  it('matches related documents only by meta.relatedProjectId', () => {
    const dossier = selectProjectDossier(
      'PRJ-005',
      sources({
        documents: [
          document({ id: 'DOC-A', meta: { author: 'AI', relatedProjectId: 'PRJ-005' } }),
          // mentions the id in tags/title but is not linked by meta — must be excluded
          document({
            id: 'DOC-B',
            title: 'PRJ-005 retrospective',
            tags: ['PRJ-005'],
            meta: { author: 'AI', relatedProjectId: 'PRJ-004' },
          }),
          document({ id: 'DOC-C', meta: { author: 'AI', relatedProjectId: null } }),
        ],
      }),
    );

    expect(dossier?.documents.map((d) => d.id)).toEqual(['DOC-A']);
  });

  it('returns null for an id no Project carries', () => {
    expect(selectProjectDossier('PRJ-999', sources())).toBeNull();
  });

  it('reads empty sections as empty arrays, not absence', () => {
    const dossier = selectProjectDossier(
      'PRJ-005',
      sources({ discrepancies: [], actions: [], documents: [] }),
    );

    expect(dossier?.discrepancies).toEqual([]);
    expect(dossier?.actions).toEqual([]);
    expect(dossier?.documents).toEqual([]);
  });
});

describe('listProjectIds', () => {
  it('enumerates Project ids in portfolio order', () => {
    const src = sources({
      projects: [project({ id: 'PRJ-001' }), project({ id: 'PRJ-005' })],
    });
    expect(listProjectIds(src)).toEqual(['PRJ-001', 'PRJ-005']);
  });
});
