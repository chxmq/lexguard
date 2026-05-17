import SeverityBadge from './SeverityBadge.jsx';
import ScenarioPanel from './ScenarioPanel.jsx';
import RedlineBlock from './RedlineBlock.jsx';

const PRIORITY_COLORS = {
  Accept: { text: '#c97a7a', border: '#e58e8e' },
  'Flag for review': { text: '#4a7a94', border: '#8eb8cc' },
  Negotiate: { text: '#b45309', border: '#fbbf24' },
  'Walk away': { text: '#dc2626', border: '#f87171' },
};

export default function ClauseInsightPanel({ item }) {
  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-[#64748b] text-center">
        Select a highlighted clause in the document or pick an item from the list above.
      </div>
    );
  }

  const { clause, classifier, implication, comparator, orchestrator } = item;
  const priority = orchestrator?.negotiationPriority;
  const priorityStyle = PRIORITY_COLORS[priority] || PRIORITY_COLORS['Flag for review'];

  return (
    <div className="flex-1 overflow-y-auto border-t border-[#e2e8f0] bg-white min-h-0">
      <div className="px-4 py-4 border-b border-[#e8edf2] sticky top-0 bg-white z-10">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-[#1e293b] capitalize">
            {clause.category.replace(/_/g, ' ')}
          </h3>
          <SeverityBadge severity={classifier?.severity || 'Medium'} />
          {priority && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
              style={{ color: priorityStyle.text, borderColor: priorityStyle.border }}
            >
              {priority}
            </span>
          )}
        </div>
        <p className="text-sm text-[#64748b] leading-relaxed">{classifier?.reasoning}</p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {classifier?.flags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {classifier.flags.map((flag) => (
              <span
                key={flag}
                className="px-2 py-1 rounded-md text-xs font-mono bg-red-50 text-red-700 border border-red-100"
              >
                {flag}
              </span>
            ))}
          </div>
        )}

        <ScenarioPanel implication={implication} light />

        {comparator && (
          <section>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-2">
              Benchmark
            </h4>
            <p className="text-sm font-medium text-[#1e293b]">{comparator.deviationLabel}</p>
            <p className="text-sm text-[#64748b] mt-1">{comparator.benchmarkSummary}</p>
            {comparator.keyDifferences?.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-[#64748b] list-disc pl-4">
                {comparator.keyDifferences.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {orchestrator && (
          <section>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-3">
              Adversarial analysis
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl p-3 bg-[#fdf6f6] border border-[#f5d0d0]">
                <p className="text-[10px] font-semibold uppercase text-[#c97a7a] mb-1">Acceptable</p>
                <p className="text-sm text-[#475569]">{orchestrator.acceptableArgument}</p>
              </div>
              <div className="rounded-xl p-3 bg-red-50 border border-red-100">
                <p className="text-[10px] font-semibold uppercase text-red-700 mb-1">Dangerous</p>
                <p className="text-sm text-[#475569]">{orchestrator.dangerousArgument}</p>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
              <p className="text-xs font-semibold uppercase text-[#1e293b] mb-1">Verdict</p>
              <p className="text-sm text-[#334155]">{orchestrator.finalVerdict}</p>
            </div>
          </section>
        )}

        <RedlineBlock redline={orchestrator?.redlineSuggestion} light />
      </div>
    </div>
  );
}
