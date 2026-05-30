/**
 * The Portfolio derived read-model.
 *
 * One selector over the normalized `Project[]` that produces every aggregate the
 * Portfolio surfaces need: the filtered set, totals, the off-track count, and the
 * status/division chart data. Pure read-model over the frozen data (ADR-0001) —
 * it reads existing values only and never enriches or mutates them.
 *
 * Off-track is defined exactly once, in `countOffTrack`, so the header pulse
 * (`lib/portfolioPulse.ts`) and the Portfolio module agree by construction.
 */

import { PROJECT_STATUSES, type Division, type Project, type ProjectStatus } from './types';

const OFF_TRACK: ProjectStatus = 'Off Track';

/** The single definition of "off track" — one place every surface counts from. */
export const countOffTrack = (projects: Project[]): number =>
  projects.filter((p) => p.status === OFF_TRACK).length;

export interface PortfolioFilters {
  division?: string;
  status?: string;
  phase?: string;
}

// Object-literal type aliases (not interfaces) so they carry the implicit index
// signature the chart's row type expects.
export type StatusDatum = {
  status: ProjectStatus;
  count: number;
};

export type DivisionDatum = {
  division: string;
  bac: number;
};

export interface PortfolioView {
  /** Projects passing the active filters. */
  projects: Project[];
  /** Count before filtering, for "N of M" hints. */
  total: number;
  /** Sum of BAC across the filtered set. */
  totalBac: number;
  /** Off-track count within the filtered set. */
  offTrack: number;
  /** Whether the filtered set differs from the full portfolio. */
  isFiltered: boolean;
  /** Per-status counts, in canonical status order. */
  statusData: StatusDatum[];
  /** Per-division BAC totals, in the supplied division order. */
  divisionData: DivisionDatum[];
}

/**
 * Build the Portfolio read-model for a set of projects under the given filters.
 * `divisions` fixes the order and display names of the per-division aggregate.
 */
export function selectPortfolioView(
  projects: Project[],
  filters: PortfolioFilters,
  divisions: Division[],
): PortfolioView {
  const filtered = projects.filter(
    (p) =>
      (!filters.division || p.division === filters.division) &&
      (!filters.status || p.status === filters.status) &&
      (!filters.phase || p.phase === filters.phase),
  );

  return {
    projects: filtered,
    total: projects.length,
    totalBac: filtered.reduce((sum, p) => sum + p.evm.bac, 0),
    offTrack: countOffTrack(filtered),
    isFiltered: filtered.length !== projects.length,
    statusData: PROJECT_STATUSES.map((status) => ({
      status,
      count: filtered.filter((p) => p.status === status).length,
    })),
    divisionData: divisions.map((d) => ({
      division: d.name,
      bac: filtered
        .filter((p) => p.division === d.id)
        .reduce((sum, p) => sum + p.evm.bac, 0),
    })),
  };
}
