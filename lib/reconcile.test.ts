import { describe, expect, it } from 'vitest';

import { analyzeReconciliation } from './reconcile';
import type { Discrepancy, ReconRecord } from './types';

const record = (over: Partial<ReconRecord> = {}): ReconRecord => ({
  projectId: 'p1',
  name: 'Project',
  status: 'On Track',
  budget: 100,
  actualCost: 90,
  owner: 'Ada',
  endDate: '2025-06-01',
  ...over,
});

const discrepancy = (over: Partial<Discrepancy> = {}): Discrepancy => ({
  projectId: 'p1',
  name: 'Project',
  field: 'budget',
  type: 'value_mismatch',
  financeValue: 100,
  pmoValue: 120,
  severity: 'high',
  ...over,
});

describe('analyzeReconciliation', () => {
  it('keys field-level mismatches by projectId:field', () => {
    const { mismatch } = analyzeReconciliation(
      [discrepancy({ projectId: 'p1', field: 'budget' })],
      [],
      [],
    );
    expect(mismatch.has('p1:budget')).toBe(true);
  });

  it('excludes whole-row "record" markers from cell mismatches', () => {
    const { mismatch } = analyzeReconciliation(
      [discrepancy({ projectId: 'p2', field: 'record' })],
      [],
      [],
    );
    expect(mismatch.has('p2:record')).toBe(false);
    expect(mismatch.size).toBe(0);
  });

  it('collects the project ids present in each export', () => {
    const { financeIds, pmoIds } = analyzeReconciliation(
      [],
      [record({ projectId: 'a' }), record({ projectId: 'b' })],
      [record({ projectId: 'b' }), record({ projectId: 'c' })],
    );
    expect([...financeIds].sort()).toEqual(['a', 'b']);
    expect([...pmoIds].sort()).toEqual(['b', 'c']);
  });

  it('flags ids that appear more than once within an export', () => {
    const { financeDups, pmoDups } = analyzeReconciliation(
      [],
      [record({ projectId: 'a' }), record({ projectId: 'a' }), record({ projectId: 'b' })],
      [record({ projectId: 'c' })],
    );
    expect([...financeDups]).toEqual(['a']);
    expect(pmoDups.size).toBe(0);
  });
});
