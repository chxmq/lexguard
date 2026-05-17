import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeClauseItems,
  getClauseCategory,
} from '../src/shared/clause-utils.js';

describe('normalizeClauseItems', () => {
  it('passes through items that already have clause.category', () => {
    const input = [
      {
        clause: { category: 'non_compete', text: 'text' },
        classifier: { severity: 'High' },
      },
    ];
    const out = normalizeClauseItems(input);
    assert.equal(out.length, 1);
    assert.equal(out[0].clause.category, 'non_compete');
  });

  it('normalizes legacy flat shape', () => {
    const out = normalizeClauseItems([
      { category: 'termination', text: 'Either party may...', classifier: { severity: 'Medium' } },
    ]);
    assert.equal(out[0].clause.category, 'termination');
    assert.equal(out[0].clause.text, 'Either party may...');
  });

  it('filters invalid entries', () => {
    assert.equal(normalizeClauseItems([null, {}, { classifier: {} }]).length, 0);
  });
});

describe('getClauseCategory', () => {
  it('reads nested or flat category', () => {
    assert.equal(getClauseCategory({ clause: { category: 'ip_assignment' } }), 'ip_assignment');
    assert.equal(getClauseCategory({ category: 'notice_period' }), 'notice_period');
    assert.equal(getClauseCategory({}), null);
  });
});
