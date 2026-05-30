/**
 * Cross-system reconciliation analysis.
 *
 * One pure selector over the two raw exports and the precomputed discrepancy
 * list, producing the lookup sets the Reconciliation side-by-side view needs:
 * which cells mismatch, which project ids each export carries, and which ids are
 * duplicated within an export. Pure read-model over the frozen data (ADR-0001):
 * it reads existing values only and never enriches or mutates them.
 *
 * Lifted out of the React render so the set logic has a direct test surface.
 */

import type { Discrepancy, ReconRecord } from './types';

export interface ReconciliationAnalysis {
  /** `${projectId}:${field}` keys for every real field-level discrepancy. */
  mismatch: Set<string>;
  /** Project ids present in the Finance export. */
  financeIds: Set<string>;
  /** Project ids present in the PMO export. */
  pmoIds: Set<string>;
  /** Project ids appearing more than once in the Finance export. */
  financeDups: Set<string>;
  /** Project ids appearing more than once in the PMO export. */
  pmoDups: Set<string>;
}

const countIds = (records: ReconRecord[]): Map<string, number> => {
  const counts = new Map<string, number>();
  records.forEach((r) =>
    counts.set(r.projectId, (counts.get(r.projectId) ?? 0) + 1),
  );
  return counts;
};

const dupsOf = (counts: Map<string, number>): Set<string> =>
  new Set([...counts].filter(([, n]) => n > 1).map(([id]) => id));

/**
 * Analyze the Finance and PMO exports against the discrepancy list. The
 * `'record'` field is treated as a whole-row presence marker, not a cell
 * mismatch, so it is excluded from `mismatch`.
 */
export function analyzeReconciliation(
  discrepancies: Discrepancy[],
  financeRecords: ReconRecord[],
  pmoRecords: ReconRecord[],
): ReconciliationAnalysis {
  const mismatch = new Set<string>();
  for (const d of discrepancies) {
    if (d.field && d.field !== 'record') {
      mismatch.add(`${d.projectId}:${d.field}`);
    }
  }

  const fCounts = countIds(financeRecords);
  const pCounts = countIds(pmoRecords);

  return {
    mismatch,
    financeIds: new Set(fCounts.keys()),
    pmoIds: new Set(pCounts.keys()),
    financeDups: dupsOf(fCounts),
    pmoDups: dupsOf(pCounts),
  };
}
