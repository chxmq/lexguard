import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('accessibility conventions', () => {
  it('LegalDisclaimer exposes role=note for screen readers', () => {
    const src = fs.readFileSync(
      path.join(root, 'src/client/components/LegalDisclaimer.jsx'),
      'utf-8'
    );
    assert.match(src, /role="note"/);
    assert.match(src, /aria-label="Legal disclaimer"/i);
  });

  it('Upload error alert uses role=alert', () => {
    const src = fs.readFileSync(path.join(root, 'src/client/pages/Upload.jsx'), 'utf-8');
    assert.match(src, /role="alert"/);
  });

  it('index.html sets lang attribute', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
    assert.match(html, /<html[^>]*lang="/i);
  });
});
