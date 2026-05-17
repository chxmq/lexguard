import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SeverityBadge from '../components/SeverityBadge.jsx';

const PIPELINE_STAGES = [
  { key: 'classifying', label: 'Classify', step: 1, desc: 'Identifying document type' },
  { key: 'extracting', label: 'Extract', step: 2, desc: 'Schema-driven extraction' },
  { key: 'analyzing', label: 'Analyze', step: 3, desc: 'Gemini clause analysis' },
  { key: 'complete', label: 'Complete', step: 4, desc: 'Report ready' },
];

function getStageIndex(stage) {
  if (stage === 'extracted') return 1;
  if (stage === 'clause_complete') return 2;
  const idx = PIPELINE_STAGES.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
}

export default function Analyzing() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState('Connecting...');
  const [currentStageKey, setCurrentStageKey] = useState('classifying');
  const [extracted, setExtracted] = useState([]);
  const [missing, setMissing] = useState([]);
  const [completedClauses, setCompletedClauses] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [currentClause, setCurrentClause] = useState(null);

  useEffect(() => {
    let closed = false;
    let es = null;

    const goToReport = () => {
      if (!closed) {
        closed = true;
        navigate(`/report/${sessionId}`, { replace: true });
      }
    };

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/analyze/${sessionId}/status`);
        if (res.status === 404) {
          const sessionRes = await fetch(`/api/session/${sessionId}`);
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            if (session.completedAt && session.clauses?.length) {
              goToReport();
              return;
            }
          }
          setStage('Session lost — API may have restarted. Upload again.');
          return;
        }
        const data = await res.json();
        if (data.message) setStage(data.message);
        if (data.progress) setProgress(data.progress);
        if (data.status === 'complete') goToReport();
        if (data.status === 'error') setStage(`Error: ${data.error || 'Analysis failed'}`);
      } catch {
        // ignore poll errors
      }
    };

    const connectStream = () => {
      es = new EventSource(`/api/analyze/${sessionId}/stream`, { withCredentials: false });

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);

        if (data.stage === 'classifying') {
          setStage('Identifying document type and signing party...');
          setCurrentStageKey('classifying');
        }
        if (data.stage === 'extracting') {
          setStage('Running schema-driven clause extraction...');
          setCurrentStageKey('extracting');
        }
        if (data.stage === 'extracted') {
          setStage(`Extracted ${data.extracted?.length || 0} clauses — starting analysis`);
          setCurrentStageKey('analyzing');
          setExtracted(data.extracted || []);
          setMissing(data.missing || []);
          setProgress({ completed: 0, total: data.extracted?.length || 0 });
        }
        if (data.stage === 'throttle') {
          const sec = data.retryInMs ? Math.ceil(data.retryInMs / 1000) : 5;
          setStage(`Vertex AI quota — retrying in ~${sec}s (analysis continues)`);
        }
        if (data.stage === 'analyzing') {
          setStage(`Analyzing: ${data.category?.replace(/_/g, ' ')}...`);
          setCurrentClause(data.category);
        }
        if (data.stage === 'clause_complete') {
          setCompletedClauses((prev) => [
            ...prev,
            {
              clause: { category: data.category },
              classifier: { severity: data.severity },
            },
          ]);
          if (data.progress) setProgress(data.progress);
          setStage(`Completed ${data.category?.replace(/_/g, ' ')}`);
          setCurrentClause(null);
        }
      });

      es.addEventListener('done', () => {
        es?.close();
        goToReport();
      });

      es.addEventListener('failed', (e) => {
        try {
          const data = JSON.parse(e.data);
          setStage(`Error: ${data.error}`);
        } catch {
          setStage('Analysis failed');
        }
        es?.close();
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) return;
        setStage('Reconnecting… (analysis continues in background)');
        es.close();
        pollStatus();
      };
    };

    const connectTimer = setTimeout(connectStream, 800);
    const pollInterval = setInterval(pollStatus, 4000);

    return () => {
      closed = true;
      clearTimeout(connectTimer);
      clearInterval(pollInterval);
      es?.close();
    };
  }, [sessionId, navigate]);

  const activeStageIdx = getStageIndex(currentStageKey);
  const pct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono text-accent bg-accent/5 border border-accent/15 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Live Analysis
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">Analyzing your contract</h2>
        <p className="mt-3 text-sm text-ink-muted font-mono">{stage}</p>
      </div>

      {/* Pipeline stages */}
      <div className="mt-12 glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-2">
          {PIPELINE_STAGES.map((s, i) => {
            const isActive = i === activeStageIdx;
            const isDone = i < activeStageIdx;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-mono font-semibold transition-all duration-500 ${
                    isDone ? 'bg-accent/15 text-accent scale-100' :
                    isActive ? 'bg-accent/10 text-ink animate-glow-pulse scale-110' :
                    'bg-paper-card text-ink-faint'
                  }`}>
                    {isDone ? 'Done' : s.step}
                  </div>
                  <span className={`mt-2 text-xs font-semibold transition-colors ${
                    isDone ? 'text-accent' : isActive ? 'text-ink' : 'text-ink-faint'
                  }`}>{s.label}</span>
                  <span className="text-[10px] text-ink-faint hidden sm:block">{s.desc}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`flex-shrink-0 w-8 h-0.5 mx-1 rounded transition-colors duration-500 ${
                    i < activeStageIdx ? 'bg-accent' : 'bg-surface-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="mt-6 glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-ink-muted">
              Clause Analysis Progress
            </span>
            <span className="text-xs font-mono text-accent">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-paper-card overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #c97a7a, #e58e8e)',
                boxShadow: '0 0 12px rgba(229, 142, 142, 0.35)',
              }}
            />
          </div>
          {currentClause && (
            <p className="mt-3 text-xs text-ink-faint animate-pulse">
              Running analysis on: <span className="text-ink-muted">{currentClause.replace(/_/g, ' ')}</span>
            </p>
          )}
        </div>
      )}

      {/* Extracted clauses list */}
      {extracted.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {extracted.map((c) => {
            const completed = completedClauses.find((cc) => cc.clause.category === c.category);
            const isAnalyzing = currentClause === c.category;
            return (
              <div
                key={c.category}
                className={`glass-card px-4 py-3 flex items-center justify-between transition-all duration-300 ${
                  isAnalyzing ? 'border-accent/30 glow-accent' :
                  completed ? 'border-accent/15' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    completed ? 'bg-accent' :
                    isAnalyzing ? 'bg-accent animate-pulse' :
                    'bg-ink-faint/30'
                  }`} />
                  <span className="text-sm text-ink">
                    {c.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-faint">
                    {Math.round(c.confidence * 100)}%
                  </span>
                  {completed && <SeverityBadge severity={completed.classifier?.severity} />}
                  {isAnalyzing && (
                    <span className="text-[10px] text-accent font-mono animate-pulse">analyzing</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Missing clauses */}
      {missing.length > 0 && (
        <div className="mt-6 glass-card p-5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-warning mb-3">
            Missing Clauses Detected
          </h3>
          <div className="space-y-2">
            {missing.map((m) => (
              <div key={m.category} className="flex items-center gap-3 text-sm">
                <SeverityBadge severity={m.severity} />
                <span className="text-ink-muted">{m.category.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-ink-faint">
        Vertex AI analysis in progress — do not refresh
      </p>
    </div>
  );
}
