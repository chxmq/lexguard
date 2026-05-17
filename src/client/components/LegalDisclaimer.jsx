export default function LegalDisclaimer({ variant = 'default', className = '' }) {
  const isCompact = variant === 'compact';
  const isDark = variant === 'dark';

  return (
    <aside
      role="note"
      aria-label="Legal disclaimer"
      className={`${isCompact ? 'text-[10px] leading-snug' : 'text-xs leading-relaxed'} ${
        isDark
          ? 'text-[#7a8a99] border-t border-white/5 bg-[#121a24] px-4 py-2.5'
          : 'text-ink-faint border border-surface-border/60 bg-paper-card/50 rounded-xl px-4 py-3'
      } ${className}`}
    >
      <p className={isDark ? 'text-[#9aa8b5]' : 'text-ink-muted'}>
        <strong className={isDark ? 'text-[#c5d0db]' : 'text-ink'}>Not legal advice.</strong>{' '}
        LexGuard provides AI-assisted contract intelligence for awareness and negotiation prep only.
        It does not replace a licensed attorney. Do not rely on outputs for binding decisions without
        professional review.
      </p>
    </aside>
  );
}
