#!/usr/bin/env node
/**
 * End-to-end: POST demo contract, poll until complete, print risk summary.
 * Usage: node scripts/e2e-analyze.js [path-to.txt]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.VITE_API_URL || `http://localhost:${process.env.PORT || 3050}`;
const sample =
  process.argv[2] ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), '../demo/sample_employment_contract.txt');

const text = fs.readFileSync(sample, 'utf-8');

async function main() {
  console.log('API:', API);
  console.log('Sample:', sample);

  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  console.log('Health:', JSON.stringify(health, null, 2));

  const start = await fetch(`${API}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!start.ok) throw new Error(await start.text());
  const { sessionId } = await start.json();
  console.log('Session:', sessionId);

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const status = await fetch(`${API}/api/analyze/${sessionId}/status`).then((r) => r.json());
    console.log(`[${i + 1}]`, status.status, status.lastStage, status.message || '');

    if (status.status === 'complete') break;
    if (status.status === 'error') throw new Error(status.error || 'Analysis failed');
  }

  const report = await fetch(`${API}/api/session/${sessionId}`).then((r) => r.json());
  console.log('\n--- Report ---');
  console.log('documentType:', report.documentType);
  console.log('overallRiskScore:', report.overallRiskScore);
  console.log('clauses:', report.clauses?.length);
  console.log(
    'top risks:',
    report.clauses?.slice(0, 3).map((c) => `${c.clause?.category}: ${c.classifier?.severity}`)
  );
  const amb = report.ambiguityAnalysis;
  if (amb) {
    console.log(
      'cross-clause:',
      `contradictions=${amb.contradictions?.length || 0}`,
      `ambiguities=${amb.ambiguities?.length || 0}`
    );
  }
  console.log('\nOpen:', `http://localhost:5173/report/${sessionId}`);
}

main().catch((err) => {
  console.error('E2E failed:', err.message);
  process.exit(1);
});
