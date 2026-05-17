export default function RedlineBlock({ redline, light = false }) {
  if (!redline || redline.action === 'none') return null;

  const titleClass = light
    ? 'text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-3'
    : 'text-xs font-mono uppercase tracking-wider text-ink-faint mb-4';
  const cardClass = light ? 'rounded-xl p-4 border border-[#e2e8f0] bg-[#f8fafc]' : 'glass-card p-5';
  const badgeClass = light
    ? 'px-2.5 py-1 rounded-lg text-xs font-mono text-[#c97a7a] bg-[#fdf6f6] border border-[#f5d0d0]'
    : 'px-2.5 py-1 rounded-lg text-xs font-mono text-accent bg-accent/8 border border-accent/15';
  const removeClass = light
    ? 'mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100'
    : 'mt-3 px-4 py-3 rounded-xl bg-danger/5 border border-danger/10';
  const suggestClass = light
    ? 'mt-3 px-4 py-3 rounded-xl bg-[#fdf6f6] border border-[#f5d0d0]'
    : 'mt-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/10';
  const labelClass = light ? 'text-xs font-mono text-[#94a3b8] mb-1' : 'text-xs font-mono text-ink-faint mb-1';
  const removeTextClass = light ? 'text-sm text-red-700 line-through' : 'text-sm text-danger-bright line-through decoration-danger/40';
  const suggestTextClass = light ? 'text-sm text-[#1e293b]' : 'text-sm text-accent-bright';
  const rationaleClass = light ? 'mt-3 text-sm text-[#64748b]' : 'mt-3 text-sm text-ink-muted max-prose';

  return (
    <div className={light ? '' : 'mt-8'}>
      <h4 className={titleClass}>Negotiation redline</h4>
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-3">
          <span className={badgeClass}>{redline.action.replace(/_/g, ' ')}</span>
        </div>

        {redline.originalPhrase && (
          <div className={removeClass}>
            <p className={labelClass}>Remove / replace</p>
            <p className={removeTextClass}>{redline.originalPhrase}</p>
          </div>
        )}

        {redline.suggestedReplacement && (
          <div className={suggestClass}>
            <p className={labelClass}>Suggested replacement</p>
            <p className={suggestTextClass}>{redline.suggestedReplacement}</p>
          </div>
        )}

        {redline.rationale && <p className={rationaleClass}>{redline.rationale}</p>}
      </div>
    </div>
  );
}
