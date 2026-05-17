import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { demoClassifyDocument, demoAnalyzeClause } from '../src/server/lib/demo-mode.js';

describe('demo-mode', () => {
  it('classifies employment documents', () => {
    const result = demoClassifyDocument('EMPLOYMENT AGREEMENT for Employee');
    assert.equal(result.documentType, 'employment');
    assert.equal(result.signingParty, 'employee');
  });

  it('classifies saas documents', () => {
    const result = demoClassifyDocument('CLOUD PLATFORM TERMS OF SERVICE subscription');
    assert.equal(result.documentType, 'saas_tos');
  });

  it('produces full clause analysis shape', () => {
    const clause = { category: 'non_compete', text: 'sample non compete text' };
    const out = demoAnalyzeClause(clause, 'employment', 'employee');
    assert.ok(out.classifier?.severity);
    assert.ok(out.implication?.plainExplanation);
    assert.ok(out.comparator?.deviationLabel);
    assert.ok(out.orchestrator?.negotiationPriority);
  });
});
