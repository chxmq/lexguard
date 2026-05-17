import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  heuristicCrossClause,
  mergeCrossClauseResults,
} from '../src/shared/cross-clause-heuristics.js';

describe('heuristicCrossClause', () => {
  it('detects notice period contradiction on employment sample pattern', () => {
    const clauses = [
      {
        category: 'termination',
        text: 'Company may terminate without Cause upon thirty (30) days written notice.',
      },
      {
        category: 'notice_period',
        text: 'Employee shall serve a notice period of sixty (60) days upon resignation.',
      },
    ];
    const result = heuristicCrossClause(clauses);
    assert.ok(result.contradictions.length >= 1);
    assert.equal(result.contradictions[0].clause1, 'termination');
  });

  it('flags sole discretion language', () => {
    const result = heuristicCrossClause([
      {
        category: 'compensation',
        text: 'Bonus shall be awarded at the Company sole discretion.',
      },
    ]);
    assert.ok(result.ambiguities.some((a) => /discretion/i.test(a.phrase)));
  });
});

describe('mergeCrossClauseResults', () => {
  it('deduplicates identical ambiguity entries', () => {
    const heuristic = {
      ambiguities: [{ clause: 'a', phrase: 'reasonable', issue: 'x', severity: 'Medium' }],
      contradictions: [],
      missingDefinitions: [],
      exploitativePatterns: [],
    };
    const ai = {
      ambiguities: [{ clause: 'a', phrase: 'reasonable', issue: 'y', severity: 'High' }],
      contradictions: [],
      missingDefinitions: [],
      exploitativePatterns: [],
    };
    const merged = mergeCrossClauseResults(heuristic, ai);
    assert.equal(merged.ambiguities.length, 1);
    assert.deepEqual(merged.sources, ['heuristic', 'vertex']);
  });
});
