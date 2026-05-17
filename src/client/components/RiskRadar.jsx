import { useMemo } from 'react';

const RISK_CATEGORIES = [
  { key: 'financial', label: 'Financial', angle: 0 },
  { key: 'employment', label: 'Employment', angle: 51.4 },
  { key: 'privacy', label: 'Privacy', angle: 102.8 },
  { key: 'ip', label: 'IP Rights', angle: 154.3 },
  { key: 'legal_process', label: 'Legal Process', angle: 205.7 },
  { key: 'termination', label: 'Termination', angle: 257.1 },
  { key: 'ambiguity', label: 'Ambiguity', angle: 308.6 },
];

const SEVERITY_SCORE = { Critical: 1.0, High: 0.8, Medium: 0.55, Low: 0.3, Informational: 0.1 };

const CENTER = 130;
const MAX_R = 100;
const RINGS = [0.25, 0.5, 0.75, 1.0];

function polarToCart(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function RiskRadar({ clauses = [], variant = 'dark' }) {
  const isLight = variant === 'light';
  const scores = useMemo(() => {
    const map = {};
    for (const cat of RISK_CATEGORIES) map[cat.key] = 0;
    for (const item of clauses) {
      const riskType = item.classifier?.riskType;
      const severity = item.classifier?.severity || 'Medium';
      if (riskType && map[riskType] !== undefined) {
        map[riskType] = Math.max(map[riskType], SEVERITY_SCORE[severity] || 0.5);
      }
    }
    return map;
  }, [clauses]);

  const points = RISK_CATEGORIES.map((cat) => {
    const score = scores[cat.key] || 0;
    return polarToCart(cat.angle, score * MAX_R);
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div
      className={
        isLight
          ? 'rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4'
          : 'glass-card p-6'
      }
    >
      <h3
        className={`text-xs font-mono uppercase tracking-wider mb-4 ${
          isLight ? 'text-[#94a3b8]' : 'text-ink-faint'
        }`}
      >
        Risk DNA
      </h3>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 260 260" className="w-full max-w-[280px]">
          {/* Grid rings */}
          {RINGS.map((r) => (
            <polygon
              key={r}
              points={RISK_CATEGORIES.map((cat) => {
                const p = polarToCart(cat.angle, r * MAX_R);
                return `${p.x},${p.y}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1"
            />
          ))}

          {/* Axes */}
          {RISK_CATEGORIES.map((cat) => {
            const p = polarToCart(cat.angle, MAX_R);
            return (
              <line
                key={cat.key}
                x1={CENTER}
                y1={CENTER}
                x2={p.x}
                y2={p.y}
                stroke="rgba(148, 163, 184, 0.06)"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled area */}
          <path
            d={pathData}
            fill="rgba(229, 142, 142, 0.12)"
            stroke="#e58e8e"
            strokeWidth="1.5"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(229, 142, 142, 0.3))',
            }}
          />

          {/* Data points */}
          {points.map((p, i) => {
            const cat = RISK_CATEGORIES[i];
            const score = scores[cat.key] || 0;
            const color = score >= 0.8 ? '#F87171' : score >= 0.55 ? '#FBBF24' : score >= 0.3 ? '#8eb8cc' : '#e58e8e';
            return (
              <circle
                key={cat.key}
                cx={p.x}
                cy={p.y}
                r={score > 0 ? 4 : 2}
                fill={score > 0 ? color : 'rgba(148, 163, 184, 0.2)'}
                stroke={score > 0 ? color : 'none'}
                strokeWidth="1"
                style={score > 0 ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}
              />
            );
          })}

          {/* Labels */}
          {RISK_CATEGORIES.map((cat) => {
            const p = polarToCart(cat.angle, MAX_R + 22);
            const score = scores[cat.key] || 0;
            return (
              <text
                key={cat.key}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9px] font-mono"
                fill={score >= 0.8 ? '#F87171' : score >= 0.55 ? '#FBBF24' : '#64748B'}
              >
                {cat.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
