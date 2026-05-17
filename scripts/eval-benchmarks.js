#!/usr/bin/env node
/**
 * Measurable benchmark: expected clause extraction + risk signals on demo contracts.
 * Usage: npm run eval   (requires Vertex for full pipeline; use --extract-only for heuristics)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractClauses } from '../src/server/modules/extraction/extract-clauses.js';
import { heuristicCrossClause } from '../src/shared/cross-clause-heuristics.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const expected = JSON.parse(
  fs.readFileSync(path.join(root, 'eval/expected-findings.json'), 'utf-8')
);

const extractOnly = process.argv.includes('--extract-only');

function scoreCase(name, spec, report) {
  const checks = [];
  let passed = 0;

  for (const cat of spec.requiredCategories || []) {
    const found = report.extracted.some((c) => c.category === cat);
    checks.push({ test: `extract:${cat}`, pass: found });
    if (found) passed += 1;
  }

  for (const hit of spec.phraseHits || []) {
    const clause = report.extracted.find((c) => c.category === hit.category);
    const text = clause?.text || '';
    const re = new RegExp(hit.pattern, 'i');
    const ok = re.test(text);
    checks.push({ test: `phrase:${hit.label}`, pass: ok });
    if (ok) passed += 1;
  }

  if (spec.crossClause?.minContradictions) {
    const n = report.crossClause?.contradictions?.length || 0;
    const ok = n >= spec.crossClause.minContradictions;
    checks.push({ test: `cross-clause:contradictions>=${spec.crossClause.minContradictions}`, pass: ok });
    if (ok) passed += 1;
  }

  const total = checks.length;
  const pct = total ? Math.round((passed / total) * 100) : 0;
  return { name, passed, total, pct, checks };
}

async function analyzeOne(name, spec) {
  const filePath = path.join(root, spec.file);
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const { extracted, missing } = await extractClauses(rawText, spec.documentType);
  const crossClause = heuristicCrossClause(extracted);

  let full = null;
  if (!extractOnly && process.env.LEXGUARD_DEMO_MODE !== 'true') {
    try {
      const { runAnalysis } = await import('../src/server/modules/analysis/pipeline.js');
      full = await runAnalysis({
        sessionId: `eval-${name}`,
        rawText,
        onProgress: () => {},
      });
    } catch (err) {
      console.warn(`[eval] Full analysis skipped for ${name}:`, err.message);
    }
  }

  const report = {
    extracted: full?.clauses?.map((c) => c.clause || c) || extracted,
    missing: full?.missingClauses || missing,
    crossClause: full?.ambiguityAnalysis || crossClause,
    overallRiskScore: full?.overallRiskScore,
  };

  return scoreCase(name, spec, report);
}

async function main() {
  console.log('LexGuard benchmark evaluation\n');
  const results = [];

  for (const [name, spec] of Object.entries(expected)) {
    const result = await analyzeOne(name, spec);
    results.push(result);
    console.log(`${name}: ${result.passed}/${result.total} (${result.pct}%)`);
    for (const c of result.checks.filter((x) => !x.pass)) {
      console.log(`  FAIL: ${c.test}`);
    }
  }

  const avg =
    results.reduce((s, r) => s + r.pct, 0) / (results.length || 1);
  console.log(`\nAverage benchmark score: ${avg.toFixed(1)}%`);
  process.exit(avg >= 85 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
