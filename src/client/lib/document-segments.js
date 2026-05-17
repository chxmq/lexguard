const SEVERITY_HIGHLIGHT = {
  Critical: { bg: 'rgba(248, 113, 113, 0.35)', border: '#f87171', ring: 'rgba(248, 113, 113, 0.5)' },
  High: { bg: 'rgba(251, 191, 36, 0.3)', border: '#fbbf24', ring: 'rgba(251, 191, 36, 0.45)' },
  Medium: { bg: 'rgba(253, 224, 71, 0.22)', border: '#fde047', ring: 'rgba(253, 224, 71, 0.35)' },
  Low: { bg: 'rgba(142, 184, 204, 0.25)', border: '#8eb8cc', ring: 'rgba(142, 184, 204, 0.4)' },
  Informational: { bg: 'rgba(168, 184, 200, 0.15)', border: '#94a3b8', ring: 'transparent' },
};

export function getHighlightStyle(severity) {
  return SEVERITY_HIGHLIGHT[severity] || SEVERITY_HIGHLIGHT.Medium;
}

/**
 * Build non-overlapping highlight ranges from analyzed clauses.
 */
export function buildHighlightRanges(clauses = []) {
  const ranges = [];

  for (const item of clauses) {
    const { clause, classifier } = item;
    if (clause?.startIndex == null || clause?.endIndex == null) continue;
    const start = Math.max(0, clause.startIndex);
    const end = Math.min(clause.endIndex, start + 50000);
    if (end <= start) continue;

    ranges.push({
      start,
      end,
      category: clause.category,
      severity: classifier?.severity || 'Medium',
      id: clause.category,
    });
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start < last.end) {
      if (r.end - r.start > last.end - last.start) {
        merged[merged.length - 1] = r;
      }
      continue;
    }
    merged.push(r);
  }

  return merged;
}

export function buildDocumentSegments(fullText, ranges = []) {
  if (!fullText) return [{ type: 'text', content: '' }];

  if (!ranges.length) {
    return [{ type: 'text', content: fullText }];
  }

  const segments = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ type: 'text', content: fullText.slice(cursor, range.start) });
    }
    if (range.end > cursor) {
      segments.push({
        type: 'highlight',
        content: fullText.slice(Math.max(cursor, range.start), range.end),
        ...range,
      });
      cursor = range.end;
    }
  }

  if (cursor < fullText.length) {
    segments.push({ type: 'text', content: fullText.slice(cursor) });
  }

  return segments;
}
