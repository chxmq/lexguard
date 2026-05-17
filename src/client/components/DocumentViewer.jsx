import { useEffect, useMemo, useRef } from 'react';
import { buildDocumentSegments, buildHighlightRanges, getHighlightStyle } from '../lib/document-segments.js';

export default function DocumentViewer({ fullText, clauses, selectedCategory, onSelectClause }) {
  const containerRef = useRef(null);
  const highlightRefs = useRef({});

  const ranges = useMemo(() => buildHighlightRanges(clauses), [clauses]);
  const segments = useMemo(() => buildDocumentSegments(fullText || '', ranges), [fullText, ranges]);

  useEffect(() => {
    if (!selectedCategory) return;
    const el = highlightRefs.current[selectedCategory];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedCategory]);

  if (!fullText) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-[#7a8a99]">
        Document text unavailable for this session. Re-run analysis to store the full contract, or use
        clause excerpts on the right.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white shadow-sm border border-[#d0dae3] min-h-[480px]">
          <div className="px-6 py-4 border-b border-[#e8edf2] flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-wider text-[#7a8a99]">Source document</p>
            <p className="text-[10px] text-[#9aa8b5]">Click a highlight to see analysis</p>
          </div>
          <div className="px-8 py-8 text-[15px] leading-relaxed text-[#1e293b] whitespace-pre-wrap" style={{ fontFamily: 'Georgia, serif' }}>
            {segments.map((seg, i) => {
              if (seg.type === 'text') {
                return <span key={`t-${i}`}>{seg.content}</span>;
              }

              const style = getHighlightStyle(seg.severity);
              const isActive = selectedCategory === seg.category;

              return (
                <mark
                  key={`h-${seg.category}-${i}`}
                  ref={(el) => {
                    if (el) highlightRefs.current[seg.category] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectClause?.(seg.category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectClause?.(seg.category);
                    }
                  }}
                  className="cursor-pointer rounded-sm transition-all duration-200"
                  style={{
                    background: style.bg,
                    opacity: isActive ? 1 : 0.45,
                    boxShadow: isActive
                      ? `inset 0 0 0 2px ${style.border}, 0 0 0 3px ${style.ring}`
                      : `inset 0 0 0 1px ${style.border}40`,
                  }}
                  title={seg.category.replace(/_/g, ' ')}
                >
                  {seg.content}
                </mark>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#9aa8b5]">
          Highlighted spans = extracted clauses · color = severity
        </p>
      </div>
    </div>
  );
}
