import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers/http-server.js';

describe('createApp health', () => {
  /** @type {Awaited<ReturnType<typeof startTestServer>>} */
  let ctx;

  before(async () => {
    ctx = await startTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  it('exposes Vertex and RAG configuration', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.demoMode, true);
    assert.equal(body.ragMode, 'category-first');
    assert.ok(body.vertex);
    assert.ok('crossClauseAi' in body);
    assert.ok('documentAi' in body);
  });
});
