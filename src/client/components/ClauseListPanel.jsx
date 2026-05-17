import SeverityBadge from './SeverityBadge.jsx';

export default function ClauseListPanel({ clauses, selectedCategory, onSelect, missingClauses = [] }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#64748b]">Clauses</h2>
        <span className="text-[10px] text-[#94a3b8]">{clauses.length} found</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {clauses.map((item) => {
          const { clause, classifier } = item;
          if (!clause?.category) return null;
          const active = selectedCategory === clause.category;
          return (
            <button
              key={clause.category}
              type="button"
              onClick={() => onSelect(clause.category)}
              className={`w-full text-left px-4 py-3 border-b border-[#e8edf2] transition-colors ${
                active ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-[#eef2f6] border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-[#1e293b] capitalize">
                  {clause.category.replace(/_/g, ' ')}
                </span>
                <SeverityBadge severity={classifier?.severity || 'Medium'} />
              </div>
              <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed">
                {classifier?.reasoning || clause.text?.slice(0, 120)}
              </p>
            </button>
          );
        })}

        {missingClauses.map((m) => (
          <div
            key={m.category}
            className="px-4 py-3 border-b border-[#e8edf2] bg-warning/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={m.severity} />
              <span className="text-sm font-medium text-[#1e293b] capitalize">
                {m.category.replace(/_/g, ' ')} (missing)
              </span>
            </div>
            <p className="text-xs text-[#64748b]">{m.riskMessage}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
