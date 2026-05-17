import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Upload from './pages/Upload.jsx';
import Analyzing from './pages/Analyzing.jsx';
import Report from './pages/Report.jsx';
import OAuthCallback from './pages/OAuthCallback.jsx';

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" className="text-accent-bright" />
    </svg>
  );
}

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isWorkspace =
    location.pathname.startsWith('/report/') || location.pathname.startsWith('/oauth/');

  return (
    <div className={isWorkspace ? 'h-screen overflow-hidden' : 'min-h-screen bg-paper'}>
      {!isWorkspace && (
        <>
          <div className="fixed inset-0 dot-grid pointer-events-none opacity-60" />
          <div
            className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(229, 142, 142, 0.06) 0%, transparent 70%)' }}
          />
          <div
            className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(107, 158, 184, 0.05) 0%, transparent 70%)' }}
          />
          <header className="relative z-10 border-b border-surface-border bg-paper/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link to="/" className="flex items-center gap-3 group">
                <ShieldIcon />
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
                    LexGuard
                  </h1>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-faint">
                    Contract Intelligence
                  </p>
                </div>
              </Link>
              <nav className="flex items-center gap-4">
                <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-accent bg-accent/5 border border-accent/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  AI Contract Analysis
                </span>
                {!isHome && (
                  <Link to="/" className="btn-outline text-xs">
                    ← New Analysis
                  </Link>
                )}
              </nav>
            </div>
          </header>
        </>
      )}

      <main className={isWorkspace ? 'h-full' : 'relative z-10'}>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/analyzing/:sessionId" element={<Analyzing />} />
          <Route path="/report/:sessionId" element={<Report />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Routes>
      </main>
    </div>
  );
}
