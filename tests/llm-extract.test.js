import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseLlmExtraction } from '../src/server/modules/extraction/extract-clauses-llm.js';

describe('shouldUseLlmExtraction', () => {
  it('returns true when heuristic coverage is low', () => {
    const prev = process.env.LEXGUARD_LLM_EXTRACT;
    process.env.LEXGUARD_LLM_EXTRACT = 'auto';
    const use = shouldUseLlmExtraction(
      [{ category: 'compensation' }],
      [{ category: 'non_compete' }, { category: 'ip_assignment' }],
      'employment'
    );
    assert.equal(use, true);
    process.env.LEXGUARD_LLM_EXTRACT = prev;
  });

  it('returns false when disabled', () => {
    const prev = process.env.LEXGUARD_LLM_EXTRACT;
    process.env.LEXGUARD_LLM_EXTRACT = 'false';
    assert.equal(shouldUseLlmExtraction([], [{ category: 'x' }], 'employment'), false);
    process.env.LEXGUARD_LLM_EXTRACT = prev;
  });
});
