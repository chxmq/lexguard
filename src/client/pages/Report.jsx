import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import WorkspaceLayout from '../layouts/WorkspaceLayout.jsx';
import DocumentViewer from '../components/DocumentViewer.jsx';
import ClauseListPanel from '../components/ClauseListPanel.jsx';
import ClauseInsightPanel from '../components/ClauseInsightPanel.jsx';
import ExportBar from '../components/ExportBar.jsx';
import ChatInterface from '../components/ChatInterface.jsx';
import AmbiguityPanel from '../components/AmbiguityPanel.jsx';
import RiskRadar from '../components/RiskRadar.jsx';
import { getClauseCategory, normalizeClauseItems } from '../../shared/clause-utils.js';

function ReportSidebar({ report, sessionId, showOverview, onToggleOverview }) {
  const score = report.overallRiskScore ?? 0;
  const scoreColor = score >= 75 ? '#EF4444' : score >= 50 ? '#F59E0B' : score >= 25 ? '#8eb8cc' : '#e58e8e';

  return (
    <div className="space-y-3 px-1">
      <div className="px-3 py-3 rounded-xl bg-white/5 border border-white/5">
        <p className="text-[10px] uppercase tracking-wide text-[#7a8a99] mb-1">Overall risk</p>
        <p className="text-2xl font-bold text-white" style={{ color: scoreColor }}>
          {score}
          <span className="text-xs font-normal text-[#7a8a99]"> / 100</span>
        </p>
        <p className="text-[11px] text-[#9aa8b5] mt-1">
          {report.clauses?.length || 0} clauses analyzed
        </p>
      </div>

      {report.signingParty && (
        <p className="px-3 text-[11px] text-[#9aa8b5]">
          Signing as <span className="text-[#c5d0db]">{report.signingParty}</span>
        </p>
      )}

      <button
        type="button"
        onClick={onToggleOverview}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-colors ${
          showOverview ? 'bg-white/10 text-white' : 'text-[#9aa8b5] hover:bg-white/5'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18M7 16l4-8 4 5 5-9" />
        </svg>
        Risk overview
      </button>

      <div className="px-2 pt-2">
        <ExportBar sessionId={sessionId} compact />
      </div>
    </div>
  );
}

function OverviewDrawer({ report, open, onClose }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex">
      <button type="button" className="flex-1 bg-black/30" aria-label="Close overview" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-xl overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1a2b3c]">Risk overview</h2>
          <button type="button" onClick={onClose} className="text-sm text-[#64748b] hover:text-[#1a2b3c]">
            Close
          </button>
        </div>
        <RiskRadar clauses={report.clauses || []} variant="light" />
        <div className="mt-6">
          <AmbiguityPanel analysis={report.ambiguityAnalysis} />
        </div>
        {report.missingClauses?.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-semibold text-[#1a2b3c] mb-3">Missing clauses</h3>
            <ul className="space-y-2 text-sm text-[#64748b]">
              {report.missingClauses.map((m) => (
                <li key={m.category} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="font-medium text-[#1e293b] capitalize">{m.category.replace(/_/g, ' ')}</span>
                  <p className="mt-1">{m.riskMessage}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/session/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Report not found');
        return r.json();
      })
      .then(setReport)
      .catch((e) => setError(e.message));
  }, [sessionId]);

  const clauseItems = useMemo(
    () => normalizeClauseItems(report?.clauses),
    [report?.clauses],
  );

  useEffect(() => {
    if (!clauseItems.length) return;
    setSelectedCategory((prev) => {
      if (prev && clauseItems.some((c) => getClauseCategory(c) === prev)) return prev;
      return getClauseCategory(clauseItems[0]);
    });
  }, [clauseItems]);

  const fullText = useMemo(() => {
    if (!report) return '';
    if (report.rawText) return report.rawText;
    return clauseItems
      .map((item) => item.clause?.text)
      .filter(Boolean)
      .join('\n\n');
  }, [report, clauseItems]);

  const selectedItem = useMemo(
    () => clauseItems.find((c) => getClauseCategory(c) === selectedCategory) ?? null,
    [clauseItems, selectedCategory],
  );

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#eef2f6] p-6">
        <div className="max-w-md w-full rounded-2xl bg-white border border-[#d0dae3] p-8 text-center shadow-sm">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <p className="mt-2 text-sm text-[#64748b]">The session may have expired. Upload the contract again.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#eef2f6]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-[#64748b]">Loading analysis…</p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout
      documentType={report.documentType}
      riskScore={report.overallRiskScore}
      sidebar={
        <ReportSidebar
          report={report}
          sessionId={sessionId}
          showOverview={showOverview}
          onToggleOverview={() => setShowOverview((v) => !v)}
        />
      }
      main={
        <div className="relative flex flex-col h-full min-h-0">
          <OverviewDrawer report={report} open={showOverview} onClose={() => setShowOverview(false)} />
          <DocumentViewer
            fullText={fullText}
            clauses={clauseItems}
            selectedCategory={selectedCategory}
            onSelectClause={setSelectedCategory}
          />
          <div className="shrink-0 border-t border-[#d0dae3] bg-[#f4f7fa]">
            <button
              type="button"
              onClick={() => setChatOpen((v) => !v)}
              className="w-full px-5 py-2.5 flex items-center justify-between text-left text-sm text-[#64748b] hover:bg-[#eef2f6] transition-colors"
            >
              <span className="font-medium text-[#1a2b3c]">Ask about this contract</span>
              <span className="text-xs">{chatOpen ? 'Hide' : 'Show'}</span>
            </button>
            {chatOpen && (
              <div className="max-h-[280px] overflow-hidden border-t border-[#e2e8f0] bg-white px-4 py-3">
                <ChatInterface
                  sessionId={sessionId}
                  selectedCategory={selectedCategory}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      }
      context={
        <div className="flex flex-col h-full min-h-0">
          <div className="shrink-0 max-h-[38%] min-h-[140px] flex flex-col border-b border-[#e2e8f0] overflow-hidden">
            <ClauseListPanel
              clauses={clauseItems}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              missingClauses={report.missingClauses || []}
            />
          </div>
          <ClauseInsightPanel item={selectedItem} />
        </div>
      }
    />
  );
}
