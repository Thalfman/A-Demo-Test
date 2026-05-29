/**
 * Deterministic synthetic-data generator (run: `npm run generate:data`).
 *
 * One fictional project portfolio feeds every module. Output is committed to
 * /data so the build never depends on regeneration. Determinism comes from a
 * seeded PRNG (mulberry32, seed 1337) and a fixed "now" (DATASET_AS_OF) — there
 * is no Math.random and no Date.now, so re-running yields byte-identical files.
 *
 * Two passes:
 *   1. Ground truth — log-normal costs/durations, correlated schedule/cost
 *      health, one genuinely troubled project, a couple of outliers.
 *   2. Messy real-world copy — nulls, spelling drift, date-format drift, stale
 *      records, round human estimates, and two diverging system exports.
 *
 * AI artifacts (narratives, summaries, reports, SOPs) are precomputed here from
 * the real aggregates and clearly labeled aiGenerated.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  computeEvm,
  DATASET_AS_OF,
  DIVISIONS,
  DIVISION_NAME,
  DIVISION_SPELLINGS,
  normalizePortfolio,
} from '../lib/normalize';
import { PROJECT_PHASES } from '../lib/types';
import type {
  AiArtifact,
  AppDocument,
  Discrepancy,
  DivisionId,
  DocumentsData,
  EvmData,
  EvmMetrics,
  EvmProjectEntry,
  EvmSeriesPoint,
  Meta,
  ModuleInfo,
  PortfolioData,
  ProjectPhase,
  ProjectStatus,
  RawProject,
  RecommendedAction,
  ReconExport,
  ReconRecord,
  ReconciliationData,
} from '../lib/types';

/* ----------------------------------------------------------------------------
 * Seeded RNG + math helpers (no Math.random anywhere)
 * ------------------------------------------------------------------------- */

const SEED = 1337;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

const rand = (): number => rng();
const randInt = (min: number, max: number): number =>
  min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
/** Standard normal via Box-Muller (consumes two rng draws). */
const gauss = (): number => {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const logNormal = (median: number, sigma: number): number =>
  median * Math.exp(sigma * gauss());

const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));
const r2 = (x: number): number => Math.round(x * 100) / 100;
const r4 = (x: number): number => Math.round(x * 10000) / 10000;
const ri = (x: number): number => Math.round(x);
const rStep = (x: number, step: number): number => Math.round(x / step) * step;

const roundEvm = (m: EvmMetrics): EvmMetrics => ({
  bac: r2(m.bac),
  pv: r2(m.pv),
  ev: r2(m.ev),
  ac: r2(m.ac),
  cpi: r4(m.cpi),
  spi: r4(m.spi),
  cv: r2(m.cv),
  sv: r2(m.sv),
  eac: r2(m.eac),
  vac: r2(m.vac),
  tcpi: r4(m.tcpi),
});

/* ----------------------------------------------------------------------------
 * Date helpers (UTC-based, deterministic)
 * ------------------------------------------------------------------------- */

const NOW = DATASET_AS_OF; // '2025-05-01'
const NOW_YM = NOW.slice(0, 7); // '2025-05'
const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function isoAddDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + days * 86_400_000);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Shift a 'YYYY-MM' label by a number of months. */
function ymAddMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = idx % 12;
  return `${ny}-${String(nm + 1).padStart(2, '0')}`;
}

const ymToIndex = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};

/** Render an ISO date in one of the drifting export formats. */
type DateStyle = 'iso' | 'us' | 'long';
function renderDate(iso: string, style: DateStyle): string {
  const [y, m, d] = iso.split('-');
  if (style === 'iso') return iso;
  if (style === 'us') return `${m}/${d}/${y}`;
  return `${MONTH_ABBR[Number(m) - 1]} ${Number(d)}, ${y}`;
}
const pickDateStyle = (): DateStyle => {
  const r = rand();
  return r < 0.5 ? 'iso' : r < 0.8 ? 'us' : 'long';
};

/* ----------------------------------------------------------------------------
 * Reference pools
 * ------------------------------------------------------------------------- */

const PROJECT_NAMES = [
  'Atlas Migration', 'Beacon Analytics Platform', 'Cedar CRM Rollout',
  'Delta Warehouse Upgrade', 'Everest Data Lake', 'Falcon Mobile App',
  'Granite Billing System', 'Harbor API Gateway', 'Iris ML Pipeline',
  'Juniper Network Refresh', 'Kestrel Security Program', 'Lumen Reporting Suite',
  'Meridian ERP Integration', 'Nimbus Cloud Migration',
];

const OWNERS = [
  'A. Rivera', 'J. Chen', 'M. Okafor', 'S. Patel', 'T. Nguyen', 'L. Romano',
  'D. Schultz', 'K. Abboud', 'P. Larsson', 'R. Ferreira', 'C. Yamamoto',
  'B. Novak', 'E. Haddad', 'G. Petrov',
];

const DIVISION_IDS: DivisionId[] = ['eng', 'infra', 'data', 'cx'];

const PLANNED_PROGRESS: Record<ProjectPhase, number> = {
  Initiation: 0.1,
  Planning: 0.25,
  Execution: 0.55,
  Monitoring: 0.82,
  Closeout: 0.96,
};

const PHASE_WEIGHTS: Array<[ProjectPhase, number]> = [
  ['Initiation', 1],
  ['Planning', 2],
  ['Execution', 4],
  ['Monitoring', 2],
  ['Closeout', 1],
];
function pickPhase(): ProjectPhase {
  const total = PHASE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [p, w] of PHASE_WEIGHTS) {
    if (r < w) return p;
    r -= w;
  }
  return 'Execution';
}

function statusFromIndices(cpi: number, spi: number): ProjectStatus {
  const score = Math.min(cpi, spi);
  if (score >= 0.97) return 'On Track';
  if (score >= 0.88) return 'At Risk';
  return 'Off Track';
}

/* ----------------------------------------------------------------------------
 * Pass 1 — ground truth
 * ------------------------------------------------------------------------- */

interface Truth {
  id: string;
  name: string;
  divisionId: DivisionId;
  divisionName: string;
  program: string;
  owner: string;
  phase: ProjectPhase;
  plannedProgress: number;
  durationMonths: number;
  elapsedMonths: number;
  spi: number;
  cpi: number;
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  evm: EvmMetrics;
  startDate: string;
  plannedEndDate: string;
  forecastEndDate: string;
  openRisks: number;
  openIssues: number;
  lastUpdated: string;
  troubled: boolean;
}

function buildTruth(): Truth[] {
  const out: Truth[] = [];

  for (let i = 0; i < PROJECT_NAMES.length; i++) {
    const id = `PRJ-${String(i + 1).padStart(3, '0')}`;
    const divisionId = DIVISION_IDS[i % DIVISION_IDS.length];
    const divisionName = DIVISION_NAME[divisionId];

    const phase = pickPhase();
    const plannedProgress = clamp(
      PLANNED_PROGRESS[phase] + (rand() - 0.5) * 0.12,
      0.05,
      1,
    );

    // Log-normal duration (months) and budget (BAC), with forced outliers.
    let durationMonths = ri(clamp(logNormal(10, 0.5), 4, 26));
    let bac = rStep(clamp(logNormal(900_000, 0.7), 150_000, 6_000_000), 1000);
    if (i === 9) durationMonths = 30; // outlier: very long schedule
    if (i === 12) bac = 8_400_000; // outlier: oversized budget

    // Correlated schedule + cost health via a shared latent factor.
    const h = gauss();
    let spi = clamp(1 + 0.16 * h + (rand() - 0.5) * 0.06, 0.62, 1.18);
    let cpi = clamp(1 + 0.15 * h + (rand() - 0.5) * 0.06, 0.62, 1.18);

    // One genuinely troubled project (first project in the data division).
    const troubled = i === 4;
    let effPhase = phase;
    let effProgress = plannedProgress;
    if (troubled) {
      effPhase = 'Execution';
      effProgress = 0.6;
      spi = 0.74;
      cpi = 0.69;
    }

    const pv = bac * effProgress;
    const ev = pv * spi;
    const ac = ev / cpi;
    const evm = computeEvm(bac, pv, ev, ac);

    const totalDays = durationMonths * 30;
    const elapsedDays = ri(effProgress * totalDays);
    const startDate = isoAddDays(NOW, -elapsedDays);
    const plannedEndDate = isoAddDays(startDate, totalDays);
    const slipDays = ri(totalDays * (1 / spi - 1));
    const forecastEndDate = isoAddDays(plannedEndDate, Math.max(slipDays, -30));

    const stress = 1 - Math.min(cpi, spi);
    const openRisks = troubled ? 9 : ri(clamp(stress * 12 + rand() * 2, 0, 14));
    const openIssues = troubled ? 6 : ri(clamp(stress * 8 + rand() * 2, 0, 10));

    // Mostly fresh; a couple deliberately stale.
    const stale = i === 3 || i === 11;
    const ageDays = stale ? randInt(75, 130) : randInt(0, 40);
    const lastUpdated = isoAddDays(NOW, -ageDays);

    const elapsedMonths = Math.max(1, ri(effProgress * durationMonths));

    out.push({
      id,
      name: PROJECT_NAMES[i],
      divisionId,
      divisionName,
      program: `${divisionName} Program`,
      owner: OWNERS[i % OWNERS.length],
      phase: effPhase,
      plannedProgress: effProgress,
      durationMonths,
      elapsedMonths,
      spi,
      cpi,
      bac,
      pv,
      ev,
      ac,
      evm,
      startDate,
      plannedEndDate,
      forecastEndDate,
      openRisks,
      openIssues,
      lastUpdated,
      troubled,
    });
  }

  return out;
}

/* ----------------------------------------------------------------------------
 * Time-phased EVM series
 * ------------------------------------------------------------------------- */

function projectSeries(t: Truth): EvmSeriesPoint[] {
  const points: EvmSeriesPoint[] = [];
  const startYM = ymAddMonths(NOW_YM, -t.elapsedMonths);
  for (let k = 0; k <= t.elapsedMonths; k++) {
    const frac = k / t.elapsedMonths;
    points.push({
      period: ymAddMonths(startYM, k),
      pv: ri(t.pv * frac),
      ev: ri(t.ev * frac),
      ac: ri(t.ac * frac),
    });
  }
  return points;
}

/** Portfolio roll-up across the trailing 12 months ending NOW. */
function portfolioSeries(truth: Truth[]): EvmSeriesPoint[] {
  const points: EvmSeriesPoint[] = [];
  for (let k = 11; k >= 0; k--) {
    const ym = ymAddMonths(NOW_YM, -k);
    const target = ymToIndex(ym);
    let pv = 0;
    let ev = 0;
    let ac = 0;
    for (const t of truth) {
      const startIdx = ymToIndex(ymAddMonths(NOW_YM, -t.elapsedMonths));
      const frac = clamp((target - startIdx) / t.elapsedMonths, 0, 1);
      pv += t.pv * frac;
      ev += t.ev * frac;
      ac += t.ac * frac;
    }
    points.push({ period: ym, pv: ri(pv), ev: ri(ev), ac: ri(ac) });
  }
  return points;
}

/* ----------------------------------------------------------------------------
 * Pass 2 — messy portfolio export
 * ------------------------------------------------------------------------- */

function messyPortfolio(truth: Truth[]): RawProject[] {
  return truth.map((t, i) => {
    const pctRoll = rand();
    // Division spelling drift (canonical is index 0).
    const spellings = DIVISION_SPELLINGS[t.divisionId];
    const division =
      rand() < 0.45 ? pick(spellings.slice(1)) : spellings[0];

    // Status spelling drift.
    const statusVariants: Record<ProjectStatus, string[]> = {
      'On Track': ['On Track', 'on track', 'on-track', 'ON TRACK', 'OnTrack'],
      'At Risk': ['At Risk', 'at risk', 'at-risk', 'AT RISK', 'AtRisk'],
      'Off Track': ['Off Track', 'off track', 'off-track', 'OFF TRACK', 'OffTrack'],
    };
    const sv = statusVariants[statusFromIndices(t.cpi, t.spi)];
    const status = rand() < 0.45 ? pick(sv.slice(1)) : sv[0];

    // Phase case drift (always key-strips back to canonical).
    const phaseVariants = [t.phase, t.phase.toLowerCase(), t.phase.toUpperCase()];
    const phase = rand() < 0.3 ? pick(phaseVariants.slice(1)) : t.phase;

    // Round human estimate vs precise actual.
    const budget = rand() < 0.5 ? rStep(t.bac, 50_000) : r2(t.bac);

    return {
      id: t.id,
      name: t.name,
      division: rand() < 0.06 ? null : division,
      program: rand() < 0.05 ? null : t.program,
      owner: rand() < 0.12 ? null : t.owner,
      phase: rand() < 0.04 ? null : phase,
      status,
      // One record carries an out-of-range estimate to exercise coercion.
      percentComplete:
        i === 8 ? 112 : pctRoll < 0.08 ? null : ri(t.plannedProgress * 100),
      budget,
      plannedValue: r2(t.pv),
      earnedValue: r2(t.ev),
      actualCost: r2(t.ac),
      startDate: renderDate(t.startDate, pickDateStyle()),
      plannedEndDate: renderDate(t.plannedEndDate, pickDateStyle()),
      forecastEndDate:
        rand() < 0.15 ? null : renderDate(t.forecastEndDate, pickDateStyle()),
      openRisks: rand() < 0.05 ? null : t.openRisks,
      openIssues: rand() < 0.05 ? null : t.openIssues,
      lastUpdated: renderDate(t.lastUpdated, pickDateStyle()),
    };
  });
}

/* ----------------------------------------------------------------------------
 * Pass 2 — two diverging system exports + reconciliation
 * ------------------------------------------------------------------------- */

const DROP_FROM_PMO = 2; // missing_in_pmo
const DROP_FROM_FINANCE = 7; // missing_in_finance
const DUPLICATE_IN_PMO = 5; // duplicate
const STATUS_DIVERGE = new Set([3, 10]);
const BUDGET_ROUND = new Set([0, 4, 8, 11]);
const AC_ROUND = new Set([1, 5, 9]);
const DATE_DIVERGE = new Set([6, 12]);
const OWNER_BLANK = new Set([1, 9]);

const rosier = (s: ProjectStatus): ProjectStatus =>
  s === 'Off Track' ? 'At Risk' : s === 'At Risk' ? 'On Track' : 'On Track';

function buildExports(truth: Truth[]): {
  financeExport: ReconExport;
  pmoExport: ReconExport;
} {
  const financeRecords: ReconRecord[] = [];
  const pmoRecords: ReconRecord[] = [];

  truth.forEach((t, i) => {
    const trueStatus = statusFromIndices(t.cpi, t.spi);

    if (i !== DROP_FROM_FINANCE) {
      financeRecords.push({
        projectId: t.id,
        name: t.name,
        status: trueStatus,
        budget: r2(t.bac),
        actualCost: r2(t.ac),
        owner: t.owner,
        endDate: t.plannedEndDate,
      });
    }

    if (i !== DROP_FROM_PMO) {
      const pmoStatus = STATUS_DIVERGE.has(i) ? rosier(trueStatus) : trueStatus;
      const pmoEnd = DATE_DIVERGE.has(i)
        ? isoAddDays(t.plannedEndDate, 14)
        : t.plannedEndDate;
      const rec: ReconRecord = {
        projectId: t.id,
        name: t.name,
        status: pmoStatus,
        budget: BUDGET_ROUND.has(i) ? rStep(t.bac, 50_000) : r2(t.bac),
        actualCost: AC_ROUND.has(i) ? rStep(t.ac, 1000) : r2(t.ac),
        owner: OWNER_BLANK.has(i) ? null : t.owner,
        endDate: renderDate(pmoEnd, pickDateStyle()),
      };
      pmoRecords.push(rec);
      if (i === DUPLICATE_IN_PMO) pmoRecords.push({ ...rec });
    }
  });

  return {
    financeExport: {
      source: 'Finance System',
      exportedAt: NOW,
      records: financeRecords,
    },
    pmoExport: {
      source: 'PMO Tracker',
      exportedAt: isoAddDays(NOW, -2),
      records: pmoRecords,
    },
  };
}

function severityFor(type: Discrepancy['type'], field: string): Discrepancy['severity'] {
  if (type === 'missing_in_finance' || type === 'missing_in_pmo') return 'high';
  if (type === 'status_mismatch') return 'high';
  if (field === 'budget') return 'high';
  if (type === 'duplicate') return 'medium';
  if (field === 'actualCost' || type === 'date_mismatch') return 'medium';
  return 'low';
}

function reconcile(
  fin: ReconExport,
  pmo: ReconExport,
  nameById: Map<string, string>,
): Discrepancy[] {
  const out: Discrepancy[] = [];
  const add = (
    projectId: string,
    field: string,
    type: Discrepancy['type'],
    financeValue: string | number | null,
    pmoValue: string | number | null,
  ) =>
    out.push({
      projectId,
      name: nameById.get(projectId) ?? projectId,
      field,
      type,
      financeValue,
      pmoValue,
      severity: severityFor(type, field),
    });

  const index = (records: ReconRecord[]) => {
    const map = new Map<string, ReconRecord>();
    const counts = new Map<string, number>();
    for (const r of records) {
      counts.set(r.projectId, (counts.get(r.projectId) ?? 0) + 1);
      if (!map.has(r.projectId)) map.set(r.projectId, r);
    }
    return { map, counts };
  };

  const finIdx = index(fin.records);
  const pmoIdx = index(pmo.records);
  const ids = new Set<string>([...finIdx.map.keys(), ...pmoIdx.map.keys()]);

  for (const id of [...ids].sort()) {
    const f = finIdx.map.get(id);
    const p = pmoIdx.map.get(id);

    if (f && !p) {
      add(id, 'record', 'missing_in_pmo', 'present', null);
      continue;
    }
    if (!f && p) {
      add(id, 'record', 'missing_in_finance', null, 'present');
      continue;
    }
    if (!f || !p) continue;

    if ((pmoIdx.counts.get(id) ?? 0) > 1) {
      add(id, 'record', 'duplicate', 1, pmoIdx.counts.get(id) ?? 0);
    }
    if (Math.abs((f.budget ?? 0) - (p.budget ?? 0)) > 0.5) {
      add(id, 'budget', 'value_mismatch', f.budget, p.budget);
    }
    if (Math.abs((f.actualCost ?? 0) - (p.actualCost ?? 0)) > 0.5) {
      add(id, 'actualCost', 'value_mismatch', f.actualCost, p.actualCost);
    }
    if (f.status !== p.status) {
      add(id, 'status', 'status_mismatch', f.status, p.status);
    }
    const fEnd = parseEnd(f.endDate);
    const pEnd = parseEnd(p.endDate);
    if (fEnd !== pEnd) {
      add(id, 'endDate', 'date_mismatch', f.endDate, p.endDate);
    }
    const fOwner = f.owner ?? '';
    const pOwner = p.owner ?? '';
    if (fOwner !== pOwner) {
      add(id, 'owner', 'value_mismatch', f.owner, p.owner);
    }
  }

  return out;
}

// Local ISO extractor mirroring lib/normalize.parseLooseDate's date handling.
function parseEnd(s: string | null): string | null {
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const idx = MONTH_ABBR.findIndex(
      (mo) => mo.toLowerCase() === m![1].slice(0, 3).toLowerCase(),
    );
    if (idx >= 0)
      return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  return null;
}

/* ----------------------------------------------------------------------------
 * AI artifacts (precomputed, terse busy-PM voice)
 * ------------------------------------------------------------------------- */

const fmtMoney = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}k`;

interface Aggregates {
  count: number;
  byStatus: Record<ProjectStatus, number>;
  totalBac: number;
  totalAc: number;
  cpi: number;
  spi: number;
  troubled: Truth;
  underperformers: Truth[];
}

function aggregate(truth: Truth[]): Aggregates {
  const byStatus: Record<ProjectStatus, number> = {
    'On Track': 0,
    'At Risk': 0,
    'Off Track': 0,
  };
  let totalBac = 0;
  let totalAc = 0;
  let totalEv = 0;
  let totalPv = 0;
  for (const t of truth) {
    byStatus[statusFromIndices(t.cpi, t.spi)] += 1;
    totalBac += t.bac;
    totalAc += t.ac;
    totalEv += t.ev;
    totalPv += t.pv;
  }
  const underperformers = truth
    .filter((t) => t.cpi < 0.9 || t.spi < 0.9)
    .sort((a, b) => Math.min(a.cpi, a.spi) - Math.min(b.cpi, b.spi));
  return {
    count: truth.length,
    byStatus,
    totalBac,
    totalAc,
    cpi: totalEv / totalAc,
    spi: totalEv / totalPv,
    troubled: truth.find((t) => t.troubled)!,
    underperformers,
  };
}

function portfolioBriefing(a: Aggregates): AiArtifact {
  return {
    aiGenerated: true,
    title: 'Portfolio Health Briefing',
    generatedAt: NOW,
    body:
      `${a.count} active projects, ${fmtMoney(a.totalBac)} committed. ` +
      `${a.byStatus['Off Track']} off track, ${a.byStatus['At Risk']} at risk. ` +
      `${a.troubled.name} is the standout concern — cost and schedule both slipping. ` +
      `Data hygiene is uneven across the intake; treat unlabeled fields with caution.`,
    bullets: [
      `${a.byStatus['On Track']} on track / ${a.byStatus['At Risk']} at risk / ${a.byStatus['Off Track']} off track`,
      `Portfolio CPI ${a.cpi.toFixed(2)}, SPI ${a.spi.toFixed(2)}`,
      `Watch: ${a.underperformers.slice(0, 3).map((t) => t.name).join(', ')}`,
    ],
  };
}

function evmNarrative(a: Aggregates): AiArtifact {
  return {
    aiGenerated: true,
    title: 'EVM Status Narrative',
    generatedAt: NOW,
    body:
      `Portfolio CPI ${a.cpi.toFixed(2)} / SPI ${a.spi.toFixed(2)} — running over cost and behind plan in aggregate. ` +
      `${a.troubled.name} drags hardest at CPI ${a.troubled.cpi.toFixed(2)}, SPI ${a.troubled.spi.toFixed(2)}; ` +
      `forecast (EAC) ${fmtMoney(a.troubled.evm.eac)} against a ${fmtMoney(a.troubled.bac)} budget. ` +
      `${a.underperformers.length} projects sit below 0.90 on cost or schedule. Prioritize recovery there.`,
    bullets: a.underperformers
      .slice(0, 4)
      .map(
        (t) =>
          `${t.name}: CPI ${t.cpi.toFixed(2)}, SPI ${t.spi.toFixed(2)}, VAC ${fmtMoney(t.evm.vac)}`,
      ),
  };
}

function recommendedActions(a: Aggregates): RecommendedAction[] {
  const actions: RecommendedAction[] = [
    {
      projectId: a.troubled.id,
      severity: 'high',
      action: `Open a recovery plan for ${a.troubled.name}; re-baseline scope and schedule.`,
      rationale: `CPI ${a.troubled.cpi.toFixed(2)} / SPI ${a.troubled.spi.toFixed(2)} with a projected ${fmtMoney(Math.abs(a.troubled.evm.vac))} overrun.`,
    },
  ];
  for (const t of a.underperformers.filter((p) => !p.troubled).slice(0, 2)) {
    actions.push({
      projectId: t.id,
      severity: t.cpi < 0.85 || t.spi < 0.85 ? 'high' : 'medium',
      action: `Review ${t.name} burn rate and confirm the EAC.`,
      rationale: `Trending off plan at CPI ${t.cpi.toFixed(2)}, SPI ${t.spi.toFixed(2)}.`,
    });
  }
  actions.push({
    projectId: null,
    severity: 'medium',
    action: 'Tighten cost-actuals reporting cadence to weekly across the portfolio.',
    rationale: `Aggregate CPI ${a.cpi.toFixed(2)} indicates systemic cost drift, not a single outlier.`,
  });
  return actions;
}

function reconSummary(discrepancies: Discrepancy[]): AiArtifact {
  const high = discrepancies.filter((d) => d.severity === 'high').length;
  const budget = discrepancies.filter((d) => d.field === 'budget');
  const missing = discrepancies.filter(
    (d) => d.type === 'missing_in_finance' || d.type === 'missing_in_pmo',
  ).length;
  const dup = discrepancies.filter((d) => d.type === 'duplicate').length;
  const biggest = budget.sort(
    (x, y) =>
      Math.abs(Number(y.financeValue) - Number(y.pmoValue)) -
      Math.abs(Number(x.financeValue) - Number(x.pmoValue)),
  )[0];
  const gap = biggest
    ? Math.abs(Number(biggest.financeValue) - Number(biggest.pmoValue))
    : 0;
  return {
    aiGenerated: true,
    title: 'Reconciliation Summary',
    generatedAt: NOW,
    body:
      `Finance and PMO disagree on ${discrepancies.length} points (${high} high severity). ` +
      `${missing} records exist on only one side and ${dup} are duplicated in the PMO tracker — ` +
      `roll-ups built on either export alone will be wrong. ` +
      (biggest
        ? `Largest single gap: ${biggest.name} budget differs by ${fmtMoney(gap)}. `
        : '') +
      `Most spread is rounding and stale status, but the missing/duplicate rows are the real risk.`,
    bullets: [
      `${budget.length} budget mismatches`,
      `${missing} records missing from one system`,
      `${dup} duplicated record(s) in PMO`,
    ],
  };
}

/* ----------------------------------------------------------------------------
 * Documents (status reports + SOPs) — AI-generated
 * ------------------------------------------------------------------------- */

function buildDocuments(a: Aggregates, discrepancyCount: number): DocumentsData {
  const statusReports: AppDocument[] = [
    {
      id: 'DOC-STATUS-001',
      type: 'status-report',
      title: 'Weekly Executive Status — Portfolio',
      summary: 'One-page roll-up of portfolio health, risks, and asks.',
      aiGenerated: true,
      generatedAt: NOW,
      meta: { author: 'AI Status Generator', audience: 'Executive Steering' },
      tags: ['weekly', 'executive', 'portfolio'],
      body: [
        '## Headline',
        `Portfolio is running hot: CPI ${a.cpi.toFixed(2)}, SPI ${a.spi.toFixed(2)} across ${a.count} projects (${fmtMoney(a.totalBac)} committed).`,
        '',
        '## Status mix',
        `- On Track: ${a.byStatus['On Track']}`,
        `- At Risk: ${a.byStatus['At Risk']}`,
        `- Off Track: ${a.byStatus['Off Track']}`,
        '',
        '## Top concern',
        `${a.troubled.name} — CPI ${a.troubled.cpi.toFixed(2)}, SPI ${a.troubled.spi.toFixed(2)}. Recovery plan requested.`,
        '',
        '## Ask',
        'Approve weekly cost-actuals cadence and a re-baseline for the troubled project.',
      ].join('\n'),
    },
    {
      id: 'DOC-STATUS-002',
      type: 'status-report',
      title: `Project Deep Dive — ${a.troubled.name}`,
      summary: 'Variance breakdown and recovery options for the troubled project.',
      aiGenerated: true,
      generatedAt: NOW,
      meta: {
        author: 'AI Status Generator',
        audience: 'Program Management',
        relatedProjectId: a.troubled.id,
      },
      tags: ['deep-dive', 'variance', 'recovery'],
      body: [
        '## Where it stands',
        `Budget ${fmtMoney(a.troubled.bac)}, forecast EAC ${fmtMoney(a.troubled.evm.eac)} (VAC ${fmtMoney(a.troubled.evm.vac)}).`,
        `CPI ${a.troubled.cpi.toFixed(2)} and SPI ${a.troubled.spi.toFixed(2)} — over cost and behind schedule.`,
        '',
        '## Why',
        'Scope creep in execution plus underestimated integration effort. Burn outpacing earned value for three reporting periods.',
        '',
        '## Options',
        '1. Re-baseline scope; defer non-critical features.',
        '2. Add senior delivery lead to unblock integration.',
        '3. Hold monthly EAC reviews until CPI recovers above 0.90.',
      ].join('\n'),
    },
  ];

  const sops: AppDocument[] = [
    {
      id: 'DOC-SOP-001',
      type: 'sop',
      title: 'SOP — EVM Variance Response',
      summary: 'When and how to react to CPI/SPI breaches.',
      aiGenerated: true,
      generatedAt: NOW,
      meta: {
        author: 'AI SOP Generator',
        audience: 'Project Managers',
        version: '1.2',
        effectiveDate: NOW,
      },
      tags: ['sop', 'evm', 'governance'],
      body: [
        '## Purpose',
        'Standardize the response when a project breaches earned-value thresholds.',
        '',
        '## Triggers',
        '- CPI or SPI below 0.90 for two consecutive periods.',
        '- VAC exceeding 10% of BAC.',
        '',
        '## Procedure',
        '1. PM logs a variance note with root cause within 48h.',
        '2. Recompute EAC; flag if EAC > BAC × 1.1.',
        '3. Escalate to program review; attach recovery plan.',
        '4. Track corrective actions to closure in the weekly status.',
      ].join('\n'),
    },
    {
      id: 'DOC-SOP-002',
      type: 'sop',
      title: 'SOP — Cross-System Reconciliation',
      summary: 'Reconciling Finance and PMO exports before reporting.',
      aiGenerated: true,
      generatedAt: NOW,
      meta: {
        author: 'AI SOP Generator',
        audience: 'PMO Analysts',
        version: '1.0',
        effectiveDate: NOW,
      },
      tags: ['sop', 'reconciliation', 'data-quality'],
      body: [
        '## Purpose',
        'Ensure portfolio reporting uses a reconciled, single source of truth.',
        '',
        '## Procedure',
        '1. Pull Finance and PMO exports for the same period.',
        '2. Match on project id; list records present on only one side.',
        '3. Flag budget/status/date mismatches and any duplicates.',
        `4. Resolve high-severity items before publishing (last run: ${discrepancyCount} discrepancies).`,
        '5. Record the reconciled set as the period of record.',
      ].join('\n'),
    },
  ];

  return { statusReports, sops };
}

/* ----------------------------------------------------------------------------
 * Assemble + write
 * ------------------------------------------------------------------------- */

function writeJson(dir: string, name: string, data: unknown): void {
  writeFileSync(join(dir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main(): void {
  const truth = buildTruth();
  const agg = aggregate(truth);
  const nameById = new Map(truth.map((t) => [t.id, t.name]));

  // Module 1 — Portfolio Health
  const rawProjects = messyPortfolio(truth);
  const portfolio: PortfolioData = {
    projects: rawProjects,
    aiBriefing: portfolioBriefing(agg),
  };

  // Module 2 — EVM & Variance
  const evmProjects: EvmProjectEntry[] = truth.map((t) => ({
    projectId: t.id,
    name: t.name,
    metrics: roundEvm(t.evm),
    series: projectSeries(t),
  }));
  const portfolioMetrics = roundEvm(
    computeEvm(
      truth.reduce((s, t) => s + t.bac, 0),
      truth.reduce((s, t) => s + t.pv, 0),
      truth.reduce((s, t) => s + t.ev, 0),
      truth.reduce((s, t) => s + t.ac, 0),
    ),
  );
  const evm: EvmData = {
    portfolio: { metrics: portfolioMetrics, series: portfolioSeries(truth) },
    projects: evmProjects,
    aiNarrative: evmNarrative(agg),
    recommendedActions: recommendedActions(agg),
  };

  // Module 3 — Cross-System Reconciliation
  const { financeExport, pmoExport } = buildExports(truth);
  const discrepancies = reconcile(financeExport, pmoExport, nameById);
  const reconciliation: ReconciliationData = {
    financeExport,
    pmoExport,
    discrepancies,
    aiSummary: reconSummary(discrepancies),
  };

  // Module 4 — Status & SOP Library
  const documents = buildDocuments(agg, discrepancies.length);

  // Meta (data-quality summary computed via the runtime normalizer)
  const { summary } = normalizePortfolio(rawProjects);
  const modules: ModuleInfo[] = [
    {
      id: 'portfolio',
      title: 'Portfolio Health',
      route: '/portfolio',
      dataFile: 'data/portfolio.json',
      summary: 'Status, budget, and schedule across the portfolio.',
    },
    {
      id: 'evm',
      title: 'EVM & Variance',
      route: '/evm',
      dataFile: 'data/evm.json',
      summary: 'CPI/SPI/variance with an AI status narrative.',
    },
    {
      id: 'reconciliation',
      title: 'Cross-System Reconciliation',
      route: '/reconciliation',
      dataFile: 'data/reconciliation.json',
      summary: 'Discrepancies between two divergent exports.',
    },
    {
      id: 'documents',
      title: 'Status & SOP Library',
      route: '/documents',
      dataFile: 'data/documents.json',
      summary: 'Finished executive status reports and SOPs.',
    },
  ];
  const meta: Meta = {
    schemaVersion: '1.0.0',
    seed: SEED,
    generatedAt: NOW,
    divisions: DIVISIONS,
    counts: {
      projects: truth.length,
      statusReports: documents.statusReports.length,
      sops: documents.sops.length,
      discrepancies: discrepancies.length,
    },
    dataQuality: summary,
    modules,
  };

  const dataDir = join(process.cwd(), 'data');
  mkdirSync(dataDir, { recursive: true });
  writeJson(dataDir, 'portfolio.json', portfolio);
  writeJson(dataDir, 'evm.json', evm);
  writeJson(dataDir, 'reconciliation.json', reconciliation);
  writeJson(dataDir, 'documents.json', documents);
  writeJson(dataDir, 'meta.json', meta);

  // eslint-disable-next-line no-console
  console.log(
    `Generated /data: ${truth.length} projects, ${discrepancies.length} discrepancies, ` +
      `${summary.flaggedFields} data-quality flags (seed ${SEED}).`,
  );
}

main();
