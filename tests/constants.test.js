import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEVERITY_ORDER,
  SEVERITY_WEIGHTS,
  MAX_CONTRACT_CHARS,
  MAX_UPLOAD_BYTES,
} from '../src/shared/analysis-constants.js';

describe('analysis-constants', () => {
  it('orders severities from Critical to Informational', () => {
    assert.deepEqual(SEVERITY_ORDER, [
      'Critical',
      'High',
      'Medium',
      'Low',
      'Informational',
    ]);
  });

  it('assigns monotonically decreasing weights', () => {
    const weights = SEVERITY_ORDER.map((s) => SEVERITY_WEIGHTS[s]);
    for (let i = 1; i < weights.length; i++) {
      assert.ok(weights[i - 1] > weights[i]);
    }
  });

  it('defines upload and text limits for API validation', () => {
    assert.ok(MAX_CONTRACT_CHARS >= 50_000);
    assert.ok(MAX_UPLOAD_BYTES >= 10 * 1024 * 1024);
  });
});
