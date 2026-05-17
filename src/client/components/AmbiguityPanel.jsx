import SeverityBadge from './SeverityBadge.jsx';

export default function AmbiguityPanel({ analysis }) {
  if (!analysis) return null;

  const { ambiguities = [], contradictions = [], missingDefinitions = [], exploitativePatterns = [] } = analysis;
  const total = ambiguities.length + contradictions.length + missingDefinitions.length + exploitativePatterns.length;

  if (total === 0) return null;

  return (
    <section className="mb-12 animate-slide-up">
      <h3 className="text-lg font-semibold text-ink mb-2">
        Cross-Clause Intelligence
      </h3>
      <p className="text-sm text-ink-muted mb-6">
        Detected {total} issues across clause boundaries — ambiguities, contradictions, and exploitative patterns.
      </p>

      <div className="space-y-4">
        {/* Contradictions — most critical */}
        {contradictions.length > 0 && (
          <div className="glass-card p-5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-danger-bright mb-4">
              Contradictions ({contradictions.length})
            </h4>
            <div className="space-y-3">
              {contradictions.map((c, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-danger/5 border border-danger/10">
                  <SeverityBadge severity={c.severity} />
                  <div>
                    <p className="text-sm text-ink">
                      <span className="font-mono text-xs text-danger-bright">
                        {c.clause1.replace(/_/g, ' ')}
                      </span>
                      {' '}↔{' '}
                      <span className="font-mono text-xs text-danger-bright">
                        {c.clause2.replace(/_/g, ' ')}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exploitative Patterns */}
        {exploitativePatterns.length > 0 && (
          <div className="glass-card p-5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-warning-bright mb-4">
              Exploitative Patterns ({exploitativePatterns.length})
            </h4>
            <div className="space-y-3">
              {exploitativePatterns.map((p, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning/5 border border-warning/10">
                  <SeverityBadge severity={p.severity} />
                  <div>
                    <span className="font-mono text-xs text-warning-bright">{p.clause.replace(/_/g, ' ')}</span>
                    <p className="mt-1 text-sm text-ink-muted">{p.pattern}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ambiguities */}
        {ambiguities.length > 0 && (
          <div className="glass-card p-5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-info-bright mb-4">
              Ambiguous Language ({ambiguities.length})
            </h4>
            <div className="space-y-3">
              {ambiguities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-info/5 border border-info/10">
                  <SeverityBadge severity={a.severity} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-ink-faint">{a.clause.replace(/_/g, ' ')}</span>
                      <code className="px-2 py-0.5 rounded text-xs bg-paper text-info-bright border border-info/15">
                        "{a.phrase}"
                      </code>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{a.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Definitions */}
        {missingDefinitions.length > 0 && (
          <div className="glass-card p-5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-4">
              Missing Definitions ({missingDefinitions.length})
            </h4>
            <div className="space-y-3">
              {missingDefinitions.map((d, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-paper-card border border-surface-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-0.5 rounded text-xs bg-paper text-warning-bright border border-warning/15">
                        {d.term}
                      </code>
                      <span className="text-xs text-ink-faint">used in: {d.usedIn.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{d.risk}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
