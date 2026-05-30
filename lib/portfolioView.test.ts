import { describe, expect, it } from 'vitest';

import { countOffTrack, selectPortfolioView } from './portfolioView';
import type { Division, EvmMetrics, Project, ProjectStatus } from './types';

const DIVISIONS: Division[] = [
  { id: 'eng', name: 'Engineering' },
  { id: 'infra', name: 'Infrastructure' },
];

const evm = (bac: number): EvmMetrics => ({
  bac,
  pv: 0,
  ev: 0,
  ac: 0,
  cpi: 0,
  spi: 0,
  cv: 0,
  sv: 0,
  eac: 0,
  vac: 0,
  tcpi: 0,
});

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Project',
  division: 'eng',
  divisionName: 'Engineering',
  program: 'Engineering',
  owner: 'Ada',
  phase: 'Execution',
  status: 'On Track',
  percentComplete: 0.5,
  evm: evm(100),
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

describe('countOffTrack', () => {
  it('counts only projects whose status is Off Track', () => {
    const projects = [
      project({ status: 'On Track' }),
      project({ status: 'Off Track' }),
      project({ status: 'At Risk' }),
      project({ status: 'Off Track' }),
    ];
    expect(countOffTrack(projects)).toBe(2);
  });
});

describe('selectPortfolioView', () => {
  const projects = [
    project({ id: 'a', division: 'eng', status: 'On Track', evm: evm(100), phase: 'Execution' }),
    project({ id: 'b', division: 'infra', status: 'Off Track', evm: evm(200), phase: 'Planning' }),
    project({ id: 'c', division: 'eng', status: 'Off Track', evm: evm(50), phase: 'Execution' }),
  ];

  it('returns the full set and totals when no filters are applied', () => {
    const view = selectPortfolioView(projects, {}, DIVISIONS);
    expect(view.projects).toHaveLength(3);
    expect(view.total).toBe(3);
    expect(view.totalBac).toBe(350);
    expect(view.offTrack).toBe(2);
    expect(view.isFiltered).toBe(false);
  });

  it('filters by division and recomputes aggregates over the filtered set', () => {
    const view = selectPortfolioView(projects, { division: 'eng' }, DIVISIONS);
    expect(view.projects.map((p) => p.id)).toEqual(['a', 'c']);
    expect(view.totalBac).toBe(150);
    expect(view.offTrack).toBe(1);
    expect(view.isFiltered).toBe(true);
  });

  it('combines division, status, and phase filters', () => {
    const view = selectPortfolioView(
      projects,
      { division: 'eng', status: 'Off Track', phase: 'Execution' },
      DIVISIONS,
    );
    expect(view.projects.map((p) => p.id)).toEqual(['c']);
  });

  it('reports per-status counts in canonical order', () => {
    const view = selectPortfolioView(projects, {}, DIVISIONS);
    expect(view.statusData).toEqual([
      { status: 'On Track' as ProjectStatus, count: 1 },
      { status: 'At Risk' as ProjectStatus, count: 0 },
      { status: 'Off Track' as ProjectStatus, count: 2 },
    ]);
  });

  it('reports per-division BAC in the supplied division order', () => {
    const view = selectPortfolioView(projects, {}, DIVISIONS);
    expect(view.divisionData).toEqual([
      { division: 'Engineering', bac: 150 },
      { division: 'Infrastructure', bac: 200 },
    ]);
  });
});
