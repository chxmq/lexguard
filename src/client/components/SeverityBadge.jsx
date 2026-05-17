const STYLES = {
  Critical: {
    bg: 'var(--severity-critical-bg)',
    text: 'var(--severity-critical-text)',
    border: 'var(--severity-critical-border)',
    glow: 'rgba(239, 68, 68, 0.2)',
    dot: '#EF4444',
  },
  High: {
    bg: 'var(--severity-high-bg)',
    text: 'var(--severity-high-text)',
    border: 'var(--severity-high-border)',
    glow: 'rgba(245, 158, 11, 0.2)',
    dot: '#F59E0B',
  },
  Medium: {
    bg: 'var(--severity-medium-bg)',
    text: 'var(--severity-medium-text)',
    border: 'var(--severity-medium-border)',
    glow: 'rgba(234, 179, 8, 0.15)',
    dot: '#EAB308',
  },
  Low: {
    bg: 'var(--severity-low-bg)',
    text: 'var(--severity-low-text)',
    border: 'var(--severity-low-border)',
    glow: 'rgba(59, 130, 246, 0.15)',
    dot: '#3B82F6',
  },
  Informational: {
    bg: 'var(--severity-info-bg)',
    text: 'var(--severity-info-text)',
    border: 'var(--severity-info-border)',
    glow: 'transparent',
    dot: '#94A3B8',
  },
};

export default function SeverityBadge({ severity }) {
  const s = STYLES[severity] || STYLES.Medium;

  return (
    <span
      className="badge"
      style={{
        background: s.bg,
        color: s.text,
        borderColor: s.border,
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: `0 0 8px ${s.glow}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dot }}
      />
      {severity}
    </span>
  );
}
