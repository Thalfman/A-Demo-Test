/**
 * Normalization + data-quality flagging.
 *
 * Turns a messy `RawProject` (the real-world export shape that lands in /data)
 * into a strict `Project`, recording every cleanup as a `DataQualityFlag`.
 *
 * The generator imports `DATASET_AS_OF`, `DIVISIONS`, `DIVISION_SPELLINGS`, and
 * `normalizePortfolio` from this module so the dataset's `meta.dataQuality`
 * summary is computed with the exact same logic the app uses at runtime.
 */

import type {
  DataQualityCode,
  DataQualityFlag,
  DataQualitySummary,
  Division,
  DivisionId,
  EvmMetrics,
  Project,
  ProjectPhase,
  ProjectStatus,
  RawProject,
} from './types';
import { PROJECT_PHASES } from './types';

/** The dataset's "as of" date. Staleness is measured against this fixed point,
 *  never the system clock, so results are stable whenever the app runs. */
export const DATASET_AS_OF = '2025-05-01';
const STALE_AFTER_DAYS = 60;
/** Budgets that are exact multiples of this read as round human estimates. */
const ROUND_ESTIMATE_STEP = 50000;

export const DIVISIONS: Division[] = [
  { id: 'eng', name: 'Engineering' },
  { id: 'infra', name: 'Infrastructure' },
  { id: 'data', name: 'Data & Analytics' },
  { id: 'cx', name: 'Customer Experience' },
];

/** Canonical name per division id. */
export const DIVISION_NAME: Record<DivisionId, string> = DIVISIONS.reduce(
  (acc, d) => {
    acc[d.id] = d.name;
    return acc;
  },
  {} as Record<DivisionId, string>,
);

/** All accepted spellings per division (first entry is canonical). The generator
 *  draws messy spellings from here; normalization maps every entry back. */
export const DIVISION_SPELLINGS: Record<DivisionId, string[]> = {
  eng: ['Engineering', 'Eng', 'engineering', 'ENG'],
  infra: ['Infrastructure', 'Infra', 'infrastructure'],
  data: ['Data & Analytics', 'Data', 'Data and Analytics', 'data'],
  cx: ['Customer Experience', 'CX', 'Cust Exp', 'customer experience'],
};

const normKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const DIVISION_ALIAS: Record<string, DivisionId> = (() => {
  const m: Record<string, DivisionId> = {};
  (Object.keys(DIVISION_SPELLINGS) as DivisionId[]).forEach((id) => {
    DIVISION_SPELLINGS[id].forEach((sp) => {
      m[normKey(sp)] = id;
    });
  });
  return m;
})();

const STATUS_ALIAS: Record<string, ProjectStatus> = {
  ontrack: 'On Track',
  atrisk: 'At Risk',
  offtrack: 'Off Track',
};

const PHASE_ALIAS: Record<string, ProjectPhase> = PROJECT_PHASES.reduce(
  (acc, p) => {
    acc[normKey(p)] = p;
    return acc;
  },
  {} as Record<string, ProjectPhase>,
);

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

/**
 * Parse a date that may arrive as ISO (`2025-01-05`), US slashes
 * (`01/05/2025`), or long form (`Jan 5, 2025`). Returns ISO `yyyy-mm-dd` plus a
 * `drifted` flag when the input was not already ISO. Pure string work — no
 * `Date` parsing — so it is timezone- and locale-independent.
 */
export function parseLooseDate(
  input: string | null | undefined,
): { iso: string | null; drifted: boolean } {
  if (input == null) return { iso: null, drifted: false };
  const s = String(input).trim();
  if (s === '') return { iso: null, drifted: false };

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}`, drifted: false };

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    return { iso: `${m[3]}-${mm}-${dd}`, drifted: true };
  }

  m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const idx = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (idx >= 0) {
      const mm = String(idx + 1).padStart(2, '0');
      const dd = m[2].padStart(2, '0');
      return { iso: `${m[3]}-${mm}-${dd}`, drifted: true };
    }
  }

  return { iso: null, drifted: true };
}

const isoToUtcMs = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const DAY_MS = 86_400_000;

/** Whole days between two ISO dates (b - a). */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.round((isoToUtcMs(bIso) - isoToUtcMs(aIso)) / DAY_MS);
}

/** Derive the full EVM metric set from the four base values. Shared with the
 *  data generator so generated metrics match runtime-computed ones exactly. */
export function computeEvm(
  bac: number,
  pv: number,
  ev: number,
  ac: number,
): EvmMetrics {
  const cpi = ac > 0 ? ev / ac : 0;
  const spi = pv > 0 ? ev / pv : 0;
  const eac = cpi > 0 ? bac / cpi : bac;
  const denom = bac - ac;
  const tcpi = denom !== 0 ? (bac - ev) / denom : 0;
  return {
    bac,
    pv,
    ev,
    ac,
    cpi,
    spi,
    cv: ev - ac,
    sv: ev - pv,
    eac,
    vac: bac - eac,
    tcpi,
  };
}

/** Normalize a single raw project, collecting data-quality flags. */
export function normalizeProject(raw: RawProject): {
  project: Project;
  flags: DataQualityFlag[];
} {
  const flags: DataQualityFlag[] = [];
  const flag = (
    field: string,
    code: DataQualityCode,
    original: string | number | null,
    normalized: string | number | null,
    note?: string,
  ) => flags.push({ field, code, original, normalized, note });

  // Division
  const divKey = raw.division == null ? '' : normKey(raw.division);
  const division: DivisionId = DIVISION_ALIAS[divKey] ?? 'eng';
  const divisionName = DIVISION_NAME[division];
  if (raw.division == null || raw.division === '') {
    flag('division', 'missing', raw.division ?? null, divisionName);
  } else if (raw.division !== divisionName) {
    flag('division', 'spelling_normalized', raw.division, divisionName);
  }

  // Status
  const statusKey = raw.status == null ? '' : normKey(raw.status);
  const status: ProjectStatus = STATUS_ALIAS[statusKey] ?? 'On Track';
  if (raw.status == null || raw.status === '') {
    flag('status', 'missing', raw.status ?? null, status);
  } else if (raw.status !== status) {
    flag('status', 'spelling_normalized', raw.status, status);
  }

  // Phase
  const phaseKey = raw.phase == null ? '' : normKey(raw.phase);
  const phase: ProjectPhase = PHASE_ALIAS[phaseKey] ?? 'Execution';
  if (raw.phase == null || raw.phase === '') {
    flag('phase', 'missing', raw.phase ?? null, phase);
  } else if (raw.phase !== phase) {
    flag('phase', 'spelling_normalized', raw.phase, phase);
  }

  // Owner (null preserved when genuinely missing)
  let owner: string | null = null;
  if (raw.owner == null || raw.owner.trim() === '') {
    flag('owner', 'missing', raw.owner ?? null, null);
  } else {
    owner = raw.owner.trim();
  }

  // Percent complete: 0..100 -> 0..1
  let pct = raw.percentComplete;
  if (pct == null) {
    flag('percentComplete', 'missing', null, 0);
    pct = 0;
  } else if (pct < 0 || pct > 100) {
    const clamped = Math.max(0, Math.min(100, pct));
    flag('percentComplete', 'coerced', pct, clamped);
    pct = clamped;
  }
  const percentComplete = pct / 100;

  // EVM money fields
  const num = (v: number | null, field: string): number => {
    if (v == null) {
      flag(field, 'missing', null, 0);
      return 0;
    }
    return v;
  };
  const bac = num(raw.budget, 'budget');
  const evm = computeEvm(
    bac,
    num(raw.plannedValue, 'plannedValue'),
    num(raw.earnedValue, 'earnedValue'),
    num(raw.actualCost, 'actualCost'),
  );
  if (bac > 0 && bac % ROUND_ESTIMATE_STEP === 0) {
    flag('budget', 'rounded_estimate', bac, bac, 'round human estimate');
  }

  // Dates
  const start = parseLooseDate(raw.startDate);
  if (start.drifted && start.iso) {
    flag('startDate', 'date_drift', raw.startDate, start.iso);
  } else if (start.iso == null) {
    flag('startDate', 'missing', raw.startDate ?? null, null);
  }
  const startDate = start.iso ?? DATASET_AS_OF;

  const plannedEnd = parseLooseDate(raw.plannedEndDate);
  if (plannedEnd.drifted && plannedEnd.iso) {
    flag('plannedEndDate', 'date_drift', raw.plannedEndDate, plannedEnd.iso);
  } else if (plannedEnd.iso == null) {
    flag('plannedEndDate', 'missing', raw.plannedEndDate ?? null, null);
  }
  const plannedEndDate = plannedEnd.iso ?? DATASET_AS_OF;

  const forecast = parseLooseDate(raw.forecastEndDate);
  if (raw.forecastEndDate == null || raw.forecastEndDate === '') {
    flag('forecastEndDate', 'missing', raw.forecastEndDate ?? null, null);
  } else if (forecast.drifted && forecast.iso) {
    flag('forecastEndDate', 'date_drift', raw.forecastEndDate, forecast.iso);
  }
  const forecastEndDate = forecast.iso;

  // Counts
  const openRisks = raw.openRisks ?? 0;
  if (raw.openRisks == null) flag('openRisks', 'missing', null, 0);
  const openIssues = raw.openIssues ?? 0;
  if (raw.openIssues == null) flag('openIssues', 'missing', null, 0);

  // Last updated + staleness
  const updated = parseLooseDate(raw.lastUpdated);
  const lastUpdated = updated.iso ?? DATASET_AS_OF;
  if (updated.drifted && updated.iso) {
    flag('lastUpdated', 'date_drift', raw.lastUpdated, updated.iso);
  } else if (updated.iso == null) {
    flag('lastUpdated', 'missing', raw.lastUpdated ?? null, lastUpdated);
  }
  const isStale = daysBetween(lastUpdated, DATASET_AS_OF) > STALE_AFTER_DAYS;
  if (isStale) {
    flag('lastUpdated', 'stale', lastUpdated, lastUpdated, `>${STALE_AFTER_DAYS}d old`);
  }

  const project: Project = {
    id: raw.id,
    name: raw.name,
    division,
    divisionName,
    program: raw.program ?? divisionName,
    owner,
    phase,
    status,
    percentComplete,
    evm,
    startDate,
    plannedEndDate,
    forecastEndDate,
    openRisks,
    openIssues,
    lastUpdated,
    isStale,
    flags,
  };

  return { project, flags };
}

const emptyByCode = (): Record<DataQualityCode, number> => ({
  missing: 0,
  coerced: 0,
  date_drift: 0,
  spelling_normalized: 0,
  stale: 0,
  rounded_estimate: 0,
});

/** Normalize a full portfolio and roll up a data-quality summary. */
export function normalizePortfolio(rawProjects: RawProject[]): {
  projects: Project[];
  summary: DataQualitySummary;
} {
  const projects: Project[] = [];
  const byCode = emptyByCode();
  let flaggedFields = 0;

  for (const raw of rawProjects) {
    const { project, flags } = normalizeProject(raw);
    projects.push(project);
    for (const f of flags) {
      byCode[f.code] += 1;
      flaggedFields += 1;
    }
  }

  return {
    projects,
    summary: {
      totalProjects: rawProjects.length,
      flaggedFields,
      byCode,
    },
  };
}
