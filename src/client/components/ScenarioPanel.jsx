export default function ScenarioPanel({ implication, light = false }) {
  if (!implication) return null;

  const cardClass = light
    ? 'rounded-xl p-4 mb-3 bg-[#f8fafc] border border-[#e2e8f0]'
    : 'glass-card p-5 mb-4';
  const titleClass = light
    ? 'text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-3'
    : 'text-xs font-mono uppercase tracking-wider text-ink-faint mb-4';
  const bodyClass = light ? 'text-sm text-[#334155] leading-relaxed' : 'text-sm text-ink leading-relaxed max-prose';
  const worstClass = light
    ? 'rounded-xl p-4 border border-red-100 bg-red-50/50'
    : 'rounded-xl p-5 border border-danger/15 bg-danger/3';
  const worstTitleClass = light
    ? 'text-xs font-semibold text-red-700 uppercase tracking-wide'
    : 'text-xs font-semibold text-danger-bright uppercase tracking-wide';
  const worstBodyClass = light ? 'text-sm text-[#475569] leading-relaxed' : 'text-sm text-ink-muted leading-relaxed max-prose';
  const triggerClass = light
    ? 'mt-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100'
    : 'mt-4 px-4 py-3 rounded-xl bg-warning/5 border border-warning/15';
  const triggerTextClass = light ? 'text-sm text-[#475569]' : 'text-sm text-ink-muted';
  const triggerAccentClass = light ? 'text-amber-700 font-medium' : 'text-warning-bright font-medium';

  return (
    <section className={light ? '' : 'mt-8'}>
      <h4 className={titleClass}>What this means for you</h4>

      <div className={cardClass}>
        <p className={bodyClass}>{implication.plainExplanation}</p>
      </div>

      <div className={worstClass}>
        <div className="flex items-center gap-2 mb-3">
          <span className={worstTitleClass}>Worst-case scenario</span>
        </div>
        <p className={worstBodyClass}>{implication.worstCaseScenario}</p>
      </div>

      {implication.affectsYouIf && (
        <div className={triggerClass}>
          <p className={triggerTextClass}>
            <span className={triggerAccentClass}>Triggers if: </span>
            {implication.affectsYouIf}
          </p>
        </div>
      )}
    </section>
  );
}
