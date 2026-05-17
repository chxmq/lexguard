import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTestServer, waitForJobComplete } from '../helpers/http-server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const employmentSample = fs.readFileSync(
  path.join(__dirname, '../../demo/sample_employment_contract.txt'),
  'utf-8'
);

describe('API integration (demo mode)', () => {
  /** @type {Awaited<ReturnType<typeof startTestServer>>} */
  let ctx;

  before(async () => {
    process.env.LEXGUARD_DEMO_MODE = 'true';
    process.env.LEXGUARD_LLM_EXTRACT = 'false';
    ctx = await startTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  it('GET /api/health returns ok with demoMode true', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.demoMode, true);
    assert.equal(body.ragMode, 'category-first');
  });

  it('POST /api/analyze runs full pipeline on employment sample', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: employmentSample }),
    });
    assert.equal(res.status, 200);
    const { sessionId } = await res.json();
    assert.ok(sessionId);

    await waitForJobComplete(ctx.baseUrl, sessionId, { timeoutMs: 90_000 });

    const reportRes = await fetch(`${ctx.baseUrl}/api/session/${sessionId}`);
    assert.equal(reportRes.status, 200);
    const report = await reportRes.json();

    assert.equal(report.documentType, 'employment');
    assert.ok(report.clauses?.length >= 5);
    assert.ok(typeof report.overallRiskScore === 'number');
    assert.ok(report.ambiguityAnalysis?.contradictions?.length >= 1);
  });

  it('POST /api/analyze rejects empty body', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    });
    assert.equal(res.status, 400);
  });

  it('POST /api/analyze rejects text over character limit', async () => {
    const { MAX_CONTRACT_CHARS } = await import('../../src/shared/analysis-constants.js');
    const res = await fetch(`${ctx.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(MAX_CONTRACT_CHARS + 1) }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /character limit/i);
  });

  it('GET /api/analyze/:id/status tracks pipeline progress', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: employmentSample }),
    });
    const { sessionId } = await res.json();

    await waitForJobComplete(ctx.baseUrl, sessionId, { timeoutMs: 60_000 });

    const statusRes = await fetch(`${ctx.baseUrl}/api/analyze/${sessionId}/status`);
    assert.equal(statusRes.status, 200);
    const status = await statusRes.json();
    assert.equal(status.status, 'complete');
    assert.ok(status.lastStage);
  });

  it('GET /api/session/:id returns 404 for unknown session', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/session/00000000-0000-0000-0000-000000000000`);
    assert.equal(res.status, 404);
  });
});
