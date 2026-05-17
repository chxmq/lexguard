import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractClauses } from '../src/server/modules/extraction/extract-clauses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const employment = fs.readFileSync(
  path.join(__dirname, '../demo/sample_employment_contract.txt'),
  'utf-8'
);

describe('extractClauses (heuristic)', () => {
  it('extracts core employment categories from sample contract', async () => {
    process.env.LEXGUARD_LLM_EXTRACT = 'false';
    const { extracted, missing } = await extractClauses(employment, 'employment');
    const categories = new Set(extracted.map((c) => c.category));

    assert.ok(categories.has('non_compete'));
    assert.ok(categories.has('ip_assignment'));
    assert.ok(categories.has('termination'));
    assert.ok(categories.has('notice_period'));
    assert.equal(missing.filter((m) => m.category === 'non_compete').length, 0);
  });

  it('returns extraction metadata', async () => {
    const { extractionMeta } = await extractClauses(employment, 'employment');
    assert.ok(extractionMeta.final >= extractionMeta.heuristic);
  });
});
