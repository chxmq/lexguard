import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverallRisk,
  sortBySeverity,
} from '../src/server/modules/analysis/pipeline.js';

describe('calculateOverallRisk', () => {
  it('returns 72 when only missing clauses and no results', () => {
    assert.equal(calculateOverallRisk([], [{ category: 'non_compete' }]), 72);
  });

  it('weights higher severities more across multiple clauses', () => {
    const low = calculateOverallRisk([
      { classifier: { severity: 'Low', confidence: 0.9 } },
      { classifier: { severity: 'Informational', confidence: 0.9 } },
    ]);
    const high = calculateOverallRisk([
      { classifier: { severity: 'Critical', confidence: 0.95 } },
      { classifier: { severity: 'High', confidence: 0.9 } },
    ]);
    assert.ok(high > low);
  });

  it('caps score at 100', () => {
    const score = calculateOverallRisk([
      { classifier: { severity: 'Critical', confidence: 1 } },
      { classifier: { severity: 'Critical', confidence: 1 } },
      { classifier: { severity: 'High', confidence: 1 } },
    ]);
    assert.ok(score <= 100);
  });
});

describe('sortBySeverity', () => {
  it('orders Critical before Low', () => {
    const sorted = sortBySeverity([
      { classifier: { severity: 'Low' } },
      { classifier: { severity: 'Critical' } },
    ]);
    assert.equal(sorted[0].classifier.severity, 'Critical');
  });
});
