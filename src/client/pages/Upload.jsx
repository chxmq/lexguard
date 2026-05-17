import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone.jsx';

const FEATURES = [
  {
    title: 'Adversarial Analysis',
    desc: 'Multi-agent system argues both sides of every clause before reaching a verdict',
  },
  {
    title: 'Legal Reasoning',
    desc: 'Goes beyond keywords — understands contractual implications under Indian law',
  },
  {
    title: 'Risk DNA',
    desc: 'Visual risk fingerprint across 8 dimensions with severity scoring per clause',
  },
  {
    title: 'Benchmark Comparison',
    desc: 'RAG-powered comparison against standard industry clause templates',
  },
  {
    title: 'Redline Suggestions',
    desc: 'Actionable negotiation recommendations with suggested replacement language',
  },
  {
    title: 'Scenario Q&A',
    desc: '"What if I leave in 6 months?" — context-aware answers about your specific contract',
  },
];

const SUPPORTED_TYPES = [
  'Employment Contracts',
  'Freelance Agreements',
  'NDAs',
  'SaaS Terms of Service',
  'Privacy Policies',
  'Vendor Agreements',
  'Rental Agreements',
];

export default function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function startAnalysis(body, isFormData = false) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body,
        ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const { sessionId } = await res.json();
      navigate(`/analyzing/${sessionId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function onUpload(file) {
    const form = new FormData();
    form.append('file', file);
    startAnalysis(form, true);
  }

  function onUrlSubmit(url) {
    startAnalysis(JSON.stringify({ url }), false);
  }

  function onPasteSubmit(text) {
    startAnalysis(JSON.stringify({ text }), false);
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono text-accent bg-accent/5 border border-accent/15 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Powered by Gemini 2.5 Pro + Multi-Agent AI
          </div>
          <h2 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-ink leading-tight text-balance">
            Don't sign what you{' '}
            <span className="gradient-text">don't understand</span>
          </h2>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-ink-muted leading-relaxed">
            LexGuard runs adversarial multi-agent analysis on your contracts — identifying hidden risks,
            ambiguous language, and exploitative clauses before you agree to them.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="mt-14 mx-auto max-w-2xl">
          <UploadZone
            onUpload={onUpload}
            onUrlSubmit={onUrlSubmit}
            onPasteSubmit={onPasteSubmit}
            loading={loading}
          />
        </div>

        {error && (
          <div className="mt-6 mx-auto max-w-2xl">
            <p className="text-sm text-danger-bright bg-danger/10 border border-danger/20 rounded-xl px-4 py-3" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Supported Types */}
        <div className="mt-10 text-center">
          <p className="text-xs font-mono text-ink-faint mb-3 uppercase tracking-wider">Supported document types</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_TYPES.map((type) => (
              <span key={type} className="px-3 py-1 rounded-lg text-xs text-ink-muted bg-paper-card border border-surface-border">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-card p-6 transition-all duration-300 hover:border-accent/20 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Architecture */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="glass-card p-8 sm:p-10">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-faint mb-6">Analysis Pipeline</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {[
              { label: 'Ingest', desc: 'PDF / DOCX / OCR' },
              { label: 'Classify', desc: 'Document type + party' },
              { label: 'Extract', desc: 'Schema-driven clauses' },
              { label: 'Analyze', desc: 'Gemini per clause' },
              { label: 'Debate', desc: 'Adversarial orchestrator' },
              { label: 'Report', desc: 'Risk DNA + redlines' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <span className="w-8 h-8 mb-1 rounded-lg flex items-center justify-center text-xs font-mono font-semibold text-accent bg-accent/10 border border-accent/15">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-ink">{step.label}</span>
                  <span className="text-[10px] text-ink-faint">{step.desc}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-ink-faint text-lg hidden sm:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
