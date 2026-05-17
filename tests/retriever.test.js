import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('retrieveBenchmarks (category-first)', () => {
  it('returns corpus entry without Vertex embedding calls', async () => {
    process.env.LEXGUARD_RAG_MODE = 'category-first';
    process.env.LEXGUARD_RUNTIME_EMBEDDINGS = 'local';

    const { retrieveBenchmarks } = await import('../src/server/modules/rag/retriever.js');
    const results = await retrieveBenchmarks(
      'non-compete restriction during employment',
      'employment',
      'non_compete'
    );

    assert.ok(results.length >= 1);
    assert.ok(results[0].text.length > 20);
    assert.equal(results[0].documentType, 'employment');
  });
});
