import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPdfTextSparse } from '../src/shared/pdf-quality.js';

describe('isPdfTextSparse', () => {
  it('returns true for empty text', () => {
    assert.equal(isPdfTextSparse('', 3), true);
  });

  it('returns true when chars per page below threshold', () => {
    assert.equal(isPdfTextSparse('short', 2), true);
  });

  it('returns false for text-dense PDF extract', () => {
    const dense = 'word '.repeat(200);
    assert.equal(isPdfTextSparse(dense, 1), false);
  });
});
